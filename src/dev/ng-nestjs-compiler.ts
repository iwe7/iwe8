import { WebpackConfigOptions } from '@angular-devkit/build-angular/src/angular-cli-files/models/build-options';
import { NestjsOptions, getNestJsWebpack } from './nestjs-webpack';
import { Observable, Observer } from 'rxjs';
import * as webpack from 'webpack';
import {
    Stats, Configuration, Compiler, Watching,
    MultiWatching, MultiCompiler
} from 'webpack';
import { terminal, virtualFs } from '@angular-devkit/core';
import { Stats as FsStats } from 'fs';
import { getNgNonAotBrowser } from './ng-webpack';

export function createWebpack(
    options: Configuration,
): Watching | Compiler {
    const compiler: Watching | Compiler = webpack(options, (err: Error, stats: Stats) => {
        if (err) {
            console.log(err);
        } else if (stats.hasErrors()) {
            const error = stats.toJson('verbose');
            const errors: string[] = error.errors;
            const warnings: string[] = error.warnings;
            errors.map(err => console.log(`${terminal.red(err)}`));
            warnings.map(err => console.log(`${terminal.yellow(err)}`));
        }
    });
    return compiler;
}

export interface NestNgOption {
    nest: Configuration;
    ng: Configuration;
    host: virtualFs.Host<FsStats>;
}
export function createNgNestJsCompiler(options: NestNgOption): {
    ng: Compiler;
    nest: Compiler;
    multi: MultiCompiler;
} {
    options.nest.name = 'nestjs';
    options.ng.name = 'ng';
    const wp: MultiCompiler | MultiWatching = webpack([
        options.nest,
        options.ng
    ]);
    return {
        ng: wp.compilers[1],
        nest: wp.compilers[0],
        multi: wp
    }
}
