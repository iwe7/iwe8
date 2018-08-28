import * as ts from 'typescript';
import * as path from 'path';

export class InMemoryHost implements ts.CompilerHost {
    private fileSystem = new Map<string, string>();
    getSourceFile(
        fileName: string,
        languageVersion: ts.ScriptTarget,
        onError?: ((message: string) => void) | undefined,
        shouldCreateNewSourceFile?: boolean | undefined
    ): ts.SourceFile | undefined {
        const contents = this.fileSystem.get(this.getCanonicalFileName(fileName));
        if (contents === undefined) {
            onError && onError(`File does not exist: ${this.getCanonicalFileName(fileName)})`);
            return undefined;
        }
        return ts.createSourceFile(fileName, contents, languageVersion, undefined, ts.ScriptKind.TS);
    }

    getDefaultLibFileName(options: ts.CompilerOptions): string {
        return '/lib.d.ts';
    }

    writeFile(
        fileName: string,
        data: string,
        writeByteOrderMark?: boolean,
        onError?: ((message: string) => void) | undefined,
        sourceFiles?: ReadonlyArray<ts.SourceFile>
    ): void {
        this.fileSystem.set(this.getCanonicalFileName(fileName), data);
    }

    getCurrentDirectory(): string {
        return '/';
    }

    getDirectories(dir: string): string[] {
        const fullDir = this.getCanonicalFileName(dir) + '/';
        const dirSet = new Set(Array
            // Look at all paths known to the host.
            .from(this.fileSystem.keys())
            // Filter out those that aren't under the requested directory.
            .filter(candidate => candidate.startsWith(fullDir))
            // Relativize the rest by the requested directory.
            .map(candidate => candidate.substr(fullDir.length))
            // What's left are dir/.../file.txt entries, and file.txt entries.
            // Get the dirname, which
            // yields '.' for the latter and dir/... for the former.
            .map(candidate => path.dirname(candidate))
            // Filter out the '.' entries, which were files.
            .filter(candidate => candidate !== '.')
            // Finally, split on / and grab the first entry.
            .map(candidate => candidate.split('/', 1)[0]));

        // Get the resulting values out of the Set.
        return Array.from(dirSet);
    }

    getCanonicalFileName(fileName: string): string {
        return path.posix.normalize(`${this.getCurrentDirectory()}/${fileName}`);
    }

    useCaseSensitiveFileNames(): boolean {
        return true;
    }

    getNewLine(): string {
        return '\n';
    }

    fileExists(fileName: string): boolean {
        return this.fileSystem.has(fileName);
    }

    readFile(fileName: string): string | undefined {
        return this.fileSystem.get(fileName);
    }
}
