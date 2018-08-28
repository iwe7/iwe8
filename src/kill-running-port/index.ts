import { switchMap, map, filter, takeUntil, tap } from 'rxjs/operators';
import { of, fromEvent, from } from 'rxjs';
import { spawn, ChildProcess } from 'child_process';

export function killRunningPort(port: number) {
    return spawnLsofRun(port).pipe(
        switchMap(res => {
            return spawnKillRun(res.pid);
        })
    )
}

export function spawnKillRun(pid: string) {
    return of(spawn('kill', ['-9', `${pid}`])).pipe(
        switchMap((child: ChildProcess) => {
            return fromEvent<Buffer | string>(child.stdout, 'data').pipe(
                takeUntil(
                    fromEvent(child.stderr, 'data').pipe(
                        tap(res => console.log(res.toString()))
                    )
                )
            );
        }),
        map(res => res.toString())
    )
}

export function spawnLsofRun(port: number) {
    return of(spawn('lsof', ['-i', `tcp:${port}`])).pipe(
        switchMap((child: ChildProcess) => {
            return fromEvent<Buffer | string>(child.stdout, 'data').pipe(
                takeUntil(
                    fromEvent(child.stderr, 'data').pipe(
                        tap(res => console.log(res.toString()))
                    )
                )
            );
        }),
        map(res => res.toString()),
        map(res => res.split('\n')),
        map(res => res.filter(r => r ? true : false)),
        // 去掉第一个
        map(res => res.splice(0, 1)),
        filter(res => !!res),
        switchMap(res => from(res)),
        map(res => res.split(' ').filter(r => r ? true : false)),
        map(res => {
            return {
                command: res[0],
                pid: res[1],
                user: res[2],
                fd: res[3],
                type: res[4],
                device: res[5],
                size: res[6],
                node: res[7],
                name: res[8]
            };
        })
    )
}
