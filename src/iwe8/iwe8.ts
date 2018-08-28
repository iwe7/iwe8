import * as Config from 'webpack-chain';
import { cloneDeep } from 'lodash';

export interface Iwe8Options { }

export class Iwe8 {
    config: Config = new Config();
    outputHandlers: Map<string, any> = new Map();
    constructor(options: Iwe8Options) { }
    getOptions(options: Iwe8Options) {

    }
    register(name: string, handler) {
        this.outputHandlers.set(name, handler);
    }
}
