const nodeExternals = require('webpack-node-externals');
import { HotModuleReplacementPlugin, Configuration } from 'webpack';
import { join } from 'path';
export interface NestjsOptions {
    input: string;
    output: string;
}
export function getNestJsWebpack(
    options: NestjsOptions
): Configuration {
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
            new HotModuleReplacementPlugin(),
        ],
        output: {
            path: join(process.cwd(), options.output),
            filename: '[name].js',
        }
    }
}
