import { createNgNestJsCompiler } from './ng-nestjs-compiler';
import * as  middleware from 'webpack-dev-middleware';
import { Options } from 'webpack-dev-middleware';
import { normalize, virtualFs } from '@angular-devkit/core';
import { INestApplication, INestExpressApplication } from '@nestjs/common';
import { renderModule } from '@angular/platform-server';
import { Configuration, Compiler, MultiCompiler, MultiWatching } from 'webpack';
import { Stats } from 'fs';
export interface CompilerOptions {
    ng: Configuration,
    nest: Configuration,
    host: virtualFs.Host<Stats>,
    app: INestApplication & INestExpressApplication;
    middleware: Options;
    ngServer: any;
}

export function createNestjsNgApp(options: CompilerOptions): {
    ng: Compiler,
    nest: Compiler,
    multi: MultiCompiler,
    app: INestApplication & INestExpressApplication;
} {
    try {
        const { app, host, ngServer } = options;
        const ngNestjsCompiler = createNgNestJsCompiler({
            ng: options.ng,
            nest: options.nest,
            host: options.host
        });
        if (app) {
            const server = middleware(ngNestjsCompiler.ng, options.middleware);
            app.use(server);
            app.engine('.html', (_, options, callback) => {
                const filePath = normalize('index.html');
                host.read(filePath).subscribe(res => {
                    const opts = { document: res.toString(), url: options.req.url };
                    renderModule(ngServer, opts).then(html => callback(null, html));
                })
            });
        }
        return { ...ngNestjsCompiler, app };
    } catch (err) {
        console.log(err);
    }
}
