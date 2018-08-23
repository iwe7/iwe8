import { of } from 'rxjs';
import { listDir } from 'list-dir-file';
import { compile } from 'handlebars';
import { extname, dirname } from 'path';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { map, switchMap, tap } from 'rxjs/operators';
import { relative, normalize, join, logging, terminal } from '@angular-devkit/core';
const logger = new logging.IndentLogger('create');

export function iwe7Template<T>(
    sourcePath: string,
    destPath: string,
    options: T
) {
    const templateRoot = normalize(sourcePath);
    const outputPath = normalize(destPath);
    logger.subscribe(res => {
        console.log(
            `${terminal.red(`${res.name}`)} ${terminal.green(res.message)}`
        )
    });
    return listDir(sourcePath).pipe(
        map(res => {
            const ext = extname(res);
            if (ext === '.imeepos') {
                return {
                    filename: relative(templateRoot, normalize(res.replace('.imeepos', ''))),
                    filepath: normalize(res)
                }
            } else {
                return {
                    filename: relative(templateRoot, normalize(res)),
                    filepath: normalize(res)
                }
            }
        }),
        switchMap(res => {
            return of(readFileSync(res.filepath).toString('utf-8')).pipe(
                map(fileContent => {
                    return {
                        filename: iwe7Compiler(res.filename, options),
                        content: iwe7Compiler(fileContent, options)
                    }
                }),
                tap(res => {
                    const file = join(outputPath, res.filename);
                    const filePath = dirname(file);
                    if (!existsSync(filePath)) {
                        mkdirSync(filePath);
                    }
                    writeFileSync(file, res.content);
                    logger.info(`${res.filename}`);
                })
            );
        })
    )
}

export function iwe7Compiler(source: string, options: any) {
    const template = compile(source);
    const tmpl = template(options);
    return tmpl;
}
