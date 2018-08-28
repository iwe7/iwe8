import { Builder, BuilderConfiguration, BuildEvent } from '@angular-devkit/architect';
import { Observable, of, Observer } from 'rxjs';
import { map } from 'rxjs/operators';
import { start, Proc } from 'pm2';

export interface Pm2Schema {
    name?: string;
    script?: string;
    args?: string | string[];
    interpreter_args?: string | string[];
    cwd?: string;
    output?: string;
    error?: string;
    log_date_format?: string;
    pid?: string;
    min_uptime?: number;
    max_restarts?: number;
    max_memory_restart?: number;
    kill_timeout?: number;
    restart_delay?: number;
    interpreter?: string;
    exec_mode?: string;
    instances?: number;
    merge_logs?: boolean;
    watch?: boolean | string[];
    force?: boolean;
    cron?: any;
    execute_command?: any;
    write?: any;
    source_map_support?: any;
    disable_source_map_support?: any;
    env?: { [key: string]: string; };
}
export class Pm2Builder implements Builder<Pm2Schema>{
    run(builderConfig: BuilderConfiguration<Pm2Schema>): Observable<BuildEvent> {
        const options = builderConfig.options;
        return this.start(options).pipe(
            map(() => {
                return { success: true }
            })
        );
    }
    start(options: Pm2Schema) {
        return Observable.create((obser: Observer<Proc>) => {
            start(options, (err: Error, proc: Proc) => {
                if (err) obser.error(err);
                obser.next(proc);
                obser.complete();
            });
        });
    }
}

export default Pm2Builder;
