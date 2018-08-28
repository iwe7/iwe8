import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

import { Builder, BuilderConfiguration, BuildEvent, BuilderContext } from '@angular-devkit/architect';
import { main, NgcParsedConfiguration } from '../../ngc-compiler/ngc-compiler';
export interface NgcSchema {
    watch?: boolean;
    project: string;
}
export class NgcBuilder implements Builder<NgcSchema>{
    constructor(public context: BuilderContext) { }
    run(builderConfig: BuilderConfiguration<NgcSchema>): Observable<BuildEvent> {
        const options: NgcParsedConfiguration = builderConfig.options as NgcParsedConfiguration;
        return of(null).pipe(
            map(() => {
                main([], (s: string) => {
                    this.context.logger.error(s);
                }, options);
                return { success: true }
            })
        );
    }
}
