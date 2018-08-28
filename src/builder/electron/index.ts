import { BuilderDescription } from '@angular-devkit/architect';
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
import { DevServerBuilder, DevServerBuilderOptions } from '../electron-dev-server';
import { WebpackDevServerBuilder } from '@angular-devkit/build-webpack';
const opn = require('opn');

export interface ElectronOptions {
    ngTarget: string;
}
export class ElectronBuilder implements Builder<ElectronOptions>{
    browser: BrowserBuilder;
    webpack: WebpackBuilder;
    host: virtualFs.AliasHost<fs.Stats>;
    dev: DevServerBuilder;
    constructor(public context: BuilderContext) {
        this.browser = new BrowserBuilder(context);
        this.webpack = new WebpackBuilder(context);
        this.host = new virtualFs.AliasHost(this.context.host as virtualFs.Host<fs.Stats>);
        this.dev = new DevServerBuilder(context, this.host);
    }
    run(builderConfig: BuilderConfiguration<ElectronOptions>): Observable<BuildEvent> {
        const options = builderConfig.options;
        const { ngTarget } = options;
        // ng 配置
        return this.buildTarget<DevServerBuilderOptions>(ngTarget).pipe(
            switchMap(res => {
                console.log('build target', ngTarget);
                return this.dev.getDevServerWebpackConfig(res).pipe(
                    concatMap(devServerWebpackConfig => {
                        const webpackDevServerBuilder = new WebpackDevServerBuilder({ ...this.context, host: this.host });
                        devServerWebpackConfig.target = 'electron-renderer';
                        return webpackDevServerBuilder.runWebpackDevServer(
                            devServerWebpackConfig,
                            undefined,
                            getBrowserLoggingCb(this.dev.browserOptions.verbose),
                        );
                    }),
                    map(buildEvent => {
                        if (this.dev.first && res.options.open) {
                            this.dev.first = false;
                            opn(this.dev.opnAddress);
                        }
                        return buildEvent;
                    }),
                )
            })
        );
    }

    private buildTarget<T = any>(path: string, overrides: any = {}): Observable<BuilderConfiguration<T>> {
        const architect = this.context.architect;
        const [project, target, configuration] = path.split(':');
        let builderConfig = architect.getBuilderConfiguration<T>({
            project,
            target,
            configuration,
            overrides,
        });
        let builderDescription: BuilderDescription;
        return architect.getBuilderDescription(builderConfig).pipe(
            tap(description => builderDescription = description),
            concatMap(() => architect.validateBuilderOptions(builderConfig, builderDescription)),
            tap(validatedBuilderConfig => builderConfig = validatedBuilderConfig),
            map(() => builderConfig)
        );
    }
}

export default ElectronBuilder;
