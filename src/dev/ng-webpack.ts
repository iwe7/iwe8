import {
    // common
    getCommonConfig,
    // browser
    getBrowserConfig,
    // server
    getServerConfig,
    // stats
    getStatsConfig,
    // style
    getStylesConfig,
    // test
    getTestConfig,
    // typescript
    getAotConfig,
    getNonAotConfig,
    getNonAotTestConfig
} from '@angular-devkit/build-angular/src/angular-cli-files/models/webpack-configs/index';
import { virtualFs } from '@angular-devkit/core';
import { Configuration } from 'webpack';
import { Stats } from 'fs';
const webpackMerge = require('webpack-merge');
import { WebpackConfigOptions } from '@angular-devkit/build-angular/src/angular-cli-files/models/build-options';

export function getNgAotBrowser(wco: WebpackConfigOptions, host: virtualFs.Host<Stats>): Configuration {
    return webpackMerge([
        getCommonConfig(wco),
        getBrowserConfig(wco),
        getStylesConfig(wco),
        getStatsConfig(wco),
        getAotConfig(wco, host)
    ])
}

export function getNgNonAotBrowser(wco: WebpackConfigOptions, host: virtualFs.Host<Stats>): Configuration {
    return webpackMerge([
        getCommonConfig(wco),
        getBrowserConfig(wco),
        getStylesConfig(wco),
        getStatsConfig(wco),
        getAotConfig(wco, host)
    ])
}

export function getNgAotServer(wco: WebpackConfigOptions, host: virtualFs.Host<Stats>): Configuration {
    return webpackMerge([
        getCommonConfig(wco),
        getServerConfig(wco),
        getStylesConfig(wco),
        getStatsConfig(wco),
        getNonAotConfig(wco, host)
    ])
}

export function getNgNonAotServer(wco: WebpackConfigOptions, host: virtualFs.Host<Stats>): Configuration {
    return webpackMerge([
        getCommonConfig(wco),
        getServerConfig(wco),
        getStylesConfig(wco),
        getStatsConfig(wco),
        getNonAotConfig(wco, host)
    ])
}

export function getNgTest(wco: WebpackConfigOptions, host: virtualFs.Host<Stats>): Configuration {
    return webpackMerge([
        getCommonConfig(wco),
        getStylesConfig(wco),
        getNonAotTestConfig(wco, host),
        getTestConfig(wco),
    ])
}
