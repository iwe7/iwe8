import { Observable, from, of, merge } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { join } from 'path';
import { lstatSync, readdirSync, existsSync } from 'fs';
export function listDir(root: string): Observable<string> {
    if (!existsSync(root)) {
        return from([]);
    }
    if (lstatSync(root).isDirectory()) {
        return from(readdirSync(root)).pipe(
            map(res => {
                return join(root, res);
            }),
            switchMap((res: string) => {
                if (lstatSync(res).isDirectory()) {
                    return merge(
                        of(res),
                        listDir(res)
                    );
                } else {
                    return of(res);
                }
            })
        );
    } else {
        return of(root);
    }
}
