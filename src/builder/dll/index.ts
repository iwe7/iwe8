import { map, switchMap } from 'rxjs/operators';
import { virtualFs, normalize, join } from '@angular-devkit/core';
import { WebpackBuilder } from '@angular-devkit/build-webpack';
import { Observable, from, forkJoin } from 'rxjs';
import { Builder, BuilderConfiguration, BuildEvent, BuilderContext } from '@angular-devkit/architect';
import * as webpack from 'webpack';
import * as fs from 'fs';
import { Configuration, Entry } from 'webpack';
import { move, remove, mkdirsSync, pathExistsSync } from 'fs-extra';
export interface DllOptions {
    entry: Entry,
    output: string;
}

export class DllBuilder implements Builder<DllOptions>{
    webpack: WebpackBuilder;
    host: virtualFs.AliasHost<fs.Stats>;
    constructor(public context: BuilderContext) {
        this.webpack = new WebpackBuilder(context);
        this.host = new virtualFs.AliasHost(this.context.host as virtualFs.Host<fs.Stats>);
    }
    run(builderConfig: BuilderConfiguration<DllOptions>): Observable<BuildEvent> {
        const options = builderConfig.options;
        return this.getWebpackConfig(options).pipe(
            switchMap(webpackConfig => {
                return this.webpack.runWebpack(webpackConfig);
            })
        );
    }
    getWebpackConfig(options: DllOptions): Observable<Configuration> {
        const output = join(normalize(process.cwd()), normalize(options.output));
        const back = join(normalize(process.cwd()), normalize('_/back/' + options.output))
        // 备份
        return from(remove(back)).pipe(
            switchMap(res => {
                if (!pathExistsSync(output)) {
                    mkdirsSync(output);
                }
                return from(move(output, back))
            }),
            map(() => {
                return {
                    entry: options.entry,
                    mode: "production",
                    output: {
                        path: output,
                        filename: '[name].[chunkhash].js',
                        library: '[name]_[chunkhash]',
                    },
                    plugins: [
                        new webpack.DllPlugin({
                            path: join(output, 'manifest.json'),
                            name: '[name].dll',
                            context: '[name]',
                        }),
                        new webpack.ContextReplacementPlugin(
                            /moment[\/\\]locale$/,
                            /(en-gb|zh-cn).js/
                        )
                    ]
                } as Configuration;
            })
        );
    }
}

export default DllBuilder;
