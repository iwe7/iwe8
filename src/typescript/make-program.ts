
import * as ts from 'typescript';
import { InMemoryHost } from './in-memory-host';
export function makeProgram(
    files: { name: string, contents: string }[]
): { program: ts.Program, host: ts.CompilerHost } {
    const host = new InMemoryHost();
    files.forEach(file => host.writeFile(file.name, file.contents));
    const rootNames = files.map(file => host.getCanonicalFileName(file.name));
    const program = ts.createProgram(
        rootNames,
        {
            noLib: true,
            experimentalDecorators: true,
            moduleResolution: ts.ModuleResolutionKind.NodeJs
        },
        host
    );
    const diags = [
        ...program.getSyntacticDiagnostics(),
        ...program.getSemanticDiagnostics()
    ];
    if (diags.length > 0) {
        throw new Error(
            `Typescript diagnostics failed! ${diags.map(diag => diag.messageText).join(', ')}`);
    }
    return { program, host };
}
