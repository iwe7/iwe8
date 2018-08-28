import { normalize, terminal } from '@angular-devkit/core';
import { Observable } from 'rxjs';
import { tap, map } from 'rxjs/operators';
import { Builder, BuilderContext, BuilderConfiguration, BuildEvent } from '@angular-devkit/architect';
import { join } from 'path';
import { iwe7TsCompiler } from '../../ts-compiler/index';

export interface GulpSchema {
    tsConfig: string;
}

export class GulpBuilder implements Builder<GulpSchema>{
    constructor(public context: BuilderContext) { }
    run(builderConfig: BuilderConfiguration<GulpSchema>): Observable<BuildEvent> {
        const options = builderConfig.options;
        const { tsConfig } = options;
        const root = this.context.workspace.root;
        const tsFile = join(root, normalize(tsConfig));
        return iwe7TsCompiler(tsFile).pipe(
            tap(res => {
                this.context.logger.info(`${terminal.red('info')}: ${terminal.green(res)}`)
            }),
            map(() => {
                // 上传到服务器
                return { success: true };
            })
        );
    }
}
export default GulpBuilder;
