import { concatMap, tap, map, switchMap } from 'rxjs/operators';
import { Builder, BuilderContext, BuilderConfiguration, BuildEvent } from '@angular-devkit/architect';
import { createNestjsNgApp } from '../../dev/index';
import { Observable, of, throwError } from 'rxjs';
import { INestApplication, INestExpressApplication } from '@nestjs/common';
import { Options } from 'webpack-dev-middleware';
import { BrowserBuilderSchema } from '@angular-devkit/build-angular/src/browser/schema';
import { BrowserBuilder, NormalizedBrowserBuilderSchema, getBrowserLoggingCb } from '@angular-devkit/build-angular/src/browser/index';
import { normalizeAssetPatterns, normalizeFileReplacements } from '@angular-devkit/build-angular/src/utils';
import { normalize, resolve, virtualFs, terminal } from '@angular-devkit/core';
import { StartBuilder } from '../start/index';
import { LoggingCallback, WebpackBuilder } from '@angular-devkit/build-webpack';
import { Configuration, Compiler, MultiCompiler, WatchOptions } from 'webpack';
import * as webpack from 'webpack';
import * as fs from 'fs';
export interface DevOptions {
    ngTarget: string;
    nestjsTarget: string;
    ngServer: string;
    nestjsApp: string;
    watch: boolean;
    watchOptions?: WatchOptions;
}
export const defaultLoggingCb: LoggingCallback = (stats, config, logger) =>
    logger.info(
        `${stats.toString({ colors: true })}`
    );
export class DevBuilder implements Builder<DevOptions> {
    browser: BrowserBuilder;
    start: StartBuilder;
    webpack: WebpackBuilder;
    host: virtualFs.AliasHost<fs.Stats>;
    constructor(public context: BuilderContext) {
        this.browser = new BrowserBuilder(context);
        this.start = new StartBuilder(context);
        this.webpack = new WebpackBuilder(context);
        this.host = new virtualFs.AliasHost(this.context.host as virtualFs.Host<fs.Stats>);
    }
    run(builderConfig: BuilderConfiguration<DevOptions>): Observable<BuildEvent> {
        const options = builderConfig.options;
        const { ngTarget, nestjsTarget, watch } = options;
        // ng 配置
        const ngBuilderConfig = this.buildTarget<BrowserBuilderSchema>(ngTarget);
        const ngWebpackConfig = this.buildBrowserWebpackConfig(ngBuilderConfig);
        // nestjs 配置
        const nestjsBuilderConfig = this.buildTarget(nestjsTarget);
        const nestjsWebpackConfig = this.start.getWebpackConfig(nestjsBuilderConfig.options);
        // compiler
        const app: INestApplication & INestExpressApplication = null;
        const middleware: Options = {} as Options;
        const ngServer = null;
        return ngWebpackConfig.pipe(
            map(ng => {
                return createNestjsNgApp({
                    ng: ng,
                    nest: nestjsWebpackConfig,
                    host: this.host,
                    app: app,
                    middleware: middleware,
                    ngServer: ngServer
                })
            }),
            switchMap(cfg => this.runWebpack(
                { ...cfg, options },
                getBrowserLoggingCb(true)
            ))
        );
    }

    runWebpack(res: {
        ng: Compiler,
        nest: Compiler,
        multi: MultiCompiler,
        app: INestApplication & INestExpressApplication;
        options: DevOptions
    }, loggingCb = defaultLoggingCb): Observable<BuildEvent> {
        return new Observable(obs => {
            let { multi, options } = res;
            const callback: webpack.compiler.CompilerCallback = (err, stats) => {
                if (err) {
                    return obs.error(err);
                }
                // Log stats.
                loggingCb(stats, options, this.context.logger);
                obs.next({ success: !stats.hasErrors() });
                if (!options.watch) {
                    obs.complete();
                }
            };
            try {
                if (options.watch) {
                    const watchOptions = options.watchOptions || {};
                    const watching = multi.watch(watchOptions, callback);
                    return () => watching.close(() => { });
                } else {
                    multi.run(callback);
                }
            } catch (err) {
                if (err) {
                    this.context.logger.error('\nAn error occured during the build:\n' + ((err && err.stack) || err));
                }
                throw err;
            }
        });
    }

    private buildTarget<T = any>(path: string, overrides: any = {}): BuilderConfiguration<T> {
        const architect = this.context.architect;
        const [project, target, configuration] = path.split(':');
        const builderConfig = architect.getBuilderConfiguration<T>({
            project,
            target,
            configuration,
            overrides,
        });
        return builderConfig;
    }

    private buildBrowserWebpackConfig(builderConfig: BuilderConfiguration<BrowserBuilderSchema>): Observable<Configuration> {
        const options = builderConfig.options;
        options.fileReplacements = options.fileReplacements || [];
        const root = this.context.workspace.root;
        const projectRoot = resolve(root, builderConfig.root);
        return of(null).pipe(
            concatMap(() => options.deleteOutputPath
                ? (<any>this.browser)._deleteOutputDir(root, normalize(options.outputPath), this.context.host)
                : of(null)
            ),
            concatMap(() => normalizeFileReplacements(options.fileReplacements, this.host, root)),
            tap(fileReplacements => options.fileReplacements = fileReplacements),
            concatMap(() => normalizeAssetPatterns(
                options.assets, this.host, root, projectRoot, builderConfig.sourceRoot)),
            tap((assetPatternObjects => options.assets = assetPatternObjects)),
            map(() => {
                let webpackConfig;
                try {
                    webpackConfig = this.browser.buildWebpackConfig(
                        root,
                        projectRoot,
                        this.host,
                        options as NormalizedBrowserBuilderSchema
                    );
                } catch (e) {
                    return throwError(e);
                }
                webpackConfig.optimization.splitChunks = false;
                return webpackConfig;
            })
        );
    }

}

export default DevBuilder;
