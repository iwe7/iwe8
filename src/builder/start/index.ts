import { Observable, Observer } from 'rxjs';
import { Builder, BuilderContext, BuilderConfiguration, BuildEvent } from '@angular-devkit/architect';
import { of } from 'rxjs';
import * as webpack from 'webpack';
import { Configuration, Compiler, Stats } from 'webpack';
import * as  path from 'path';
const nodeExternals = require('webpack-node-externals');

export interface StartSchema {
    input: string;
    output: string;
}
export class StartBuilder implements Builder<StartSchema>{
    constructor(public context: BuilderContext) { }
    run(builderConfig: BuilderConfiguration<StartSchema>): Observable<BuildEvent> {
        return Observable.create((obser: Observer<BuildEvent>) => {
            const options = builderConfig.options;
            const webpackConfig = this.getWebpackConfig(options);
            const compiler: Compiler = webpack(webpackConfig);
            compiler.watch({
                poll: true
            }, (err: Error, stats: Stats) => {
                if (err) {
                    obser.error(stats);
                }
                console.log(`开始时间:${stats.startTime}`);
                console.log(`结束时间:${stats.endTime}`);
                if (stats.hasErrors()) {
                    obser.error(stats.toJson());
                } else {
                    // console.log(`${JSON.stringify(stats.toJson(), null, 2)}`);
                    obser.next({
                        success: true
                    });
                }
            });
        });
    }
    // get web packagejson
    getWebpackConfig(options: StartSchema): Configuration {
        return {
            entry: [
                'webpack/hot/poll?1000',
                options.input
            ],
            watch: true,
            target: 'node',
            externals: [
                nodeExternals({
                    whitelist: ['webpack/hot/poll?1000'],
                }),
            ],
            module: {
                rules: [
                    {
                        test: /\.tsx?$/,
                        use: 'ts-loader',
                        exclude: /node_modules/,
                    },
                ],
            },
            mode: "development",
            resolve: {
                extensions: ['.tsx', '.ts', '.js'],
            },
            plugins: [
                new webpack.HotModuleReplacementPlugin(),
            ],
            output: {
                path: path.join(process.cwd(), options.output),
                filename: '[name].js',
            },
        }
    }
}

export default StartBuilder;
