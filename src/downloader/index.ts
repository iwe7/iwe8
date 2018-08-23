import { Subject, Observable, Observer } from 'rxjs';
import { request, IncomingMessage, ClientRequest } from 'http';
import { parse, URLSearchParams } from 'url';
import { createGunzip } from 'zlib';
import { createWriteStream } from 'fs';
export interface Iwe7WgetOptions {
    [key: string]: string;
}
export class Iwe7Wget extends Subject<any> {
    constructor() {
        super();
    }
    download(src: string, output: string, options?: Iwe7WgetOptions) {
        const newUrl = parse(src);
        const searchParams = new URLSearchParams(options);
        newUrl.search = searchParams.toString();
        return Observable.create((obser: Observer<any>) => {
            const clientRequest: ClientRequest = request(newUrl, (res: IncomingMessage) => {
                if (res.statusCode === 200) {
                    const gunzip = createGunzip();
                    // 文件大小
                    const fileSize = Number(res.headers['content-length']);
                    let downloadedSize = 0;
                    // 下载
                    const writeStream = createWriteStream(output, {
                        flags: 'w+',
                        encoding: 'binary'
                    });
                    // 编码
                    let encoding = '';
                    if (typeof res.headers['content-encoding'] === 'string') {
                        encoding = res.headers['content-encoding'];
                    }
                    // 压缩gzip
                    if (encoding === 'gzip') {
                        res.pipe(gunzip);
                    } else {
                        res.pipe(writeStream);
                    }
                    // data
                    gunzip.on('data', (chunk) => {
                        downloadedSize += chunk.length;
                        obser.next(this.calculateProgress(
                            fileSize, downloadedSize
                        ));
                        writeStream.write(chunk);
                    });
                    res.on('data', (chunk: Buffer | string) => {
                        downloadedSize += chunk.length;
                        obser.next(this.calculateProgress(
                            fileSize, downloadedSize
                        ));
                    });
                    res.on('error', (err: Error) => {
                        writeStream.end();
                        obser.error(err);
                    });
                    writeStream.on('finish', () => {
                        obser.complete();
                    });
                } else {
                    obser.error({
                        type: 'error',
                        data: res.statusCode
                    });
                }
            });
            clientRequest.flushHeaders();
            clientRequest.on('close', () => {
                obser.complete();
            });
            clientRequest.on('error', (err: Error) => {
                obser.error(err);
            });
            clientRequest.on('finish', () => {
                obser.complete();
            });
        });
    }
    private calculateProgress(fileSize, totalDownloaded) {
        if (fileSize === null) {
            var length = String(totalDownloaded).length;
            fileSize = Math.pow(10, length) + 1;
        }
        return totalDownloaded / fileSize * 100;
    }
}

export const iwe7Downloader = new Iwe7Wget();
