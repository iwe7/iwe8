import * as ts from 'typescript';

function bindingNameEquals(node: ts.BindingName, name: string): boolean {
    if (ts.isIdentifier(node)) {
        return node.text === name;
    }
    return false;
}

export function getDeclaration<T extends ts.Declaration>(
    program: ts.Program,
    fileName: string,
    name: string,
    assert: (value: any) => value is T
): T {
    const sf = program.getSourceFile(fileName);
    if (!sf) {
        throw new Error(`No such file: ${fileName}`);
    }
    let chosenDecl: ts.Declaration | null = null;
    sf.statements.forEach(stmt => {
        if (chosenDecl !== null) {
            return;
        } else if (ts.isVariableStatement(stmt)) {
            stmt.declarationList.declarations.forEach(decl => {
                if (bindingNameEquals(decl.name, name)) {
                    chosenDecl = decl;
                }
            });
        } else if (ts.isClassDeclaration(stmt) || ts.isFunctionDeclaration(stmt)) {
            if (stmt.name !== undefined && stmt.name.text === name) {
                chosenDecl = stmt;
            }
        }
    });
    chosenDecl = chosenDecl as ts.Declaration | null;
    if (chosenDecl === null) {
        throw new Error(`No such symbol: ${name} in ${fileName}`);
    }
    if (!assert(chosenDecl)) {
        throw new Error(`Symbol ${name} from ${fileName} is a ${ts.SyntaxKind[chosenDecl.kind]}`);
    }
    return chosenDecl;
}
