import * as fs from 'fs';
import { Project, SyntaxKind } from 'ts-morph';

export function getSchemaProperties(catalogJsonPath: string, componentName: string): string[] {
  const raw = fs.readFileSync(catalogJsonPath, 'utf-8');
  const catalog = JSON.parse(raw);
  if (!catalog.components) throw new Error(`catalog.json at "${catalogJsonPath}" has no "components" key`);
  const component = catalog.components[componentName];
  if (!component) throw new Error(`Component "${componentName}" not found in catalog.json`);
  if (!component.properties) throw new Error(`Component "${componentName}" has no "properties" key in catalog.json`);
  return Object.keys(component.properties);
}

export function getInputBindingNames(catalogTsPath: string, componentName: string): string[] {
  const project = new Project({ addFilesFromTsConfig: false });
  const sourceFile = project.addSourceFileAtPath(catalogTsPath);

  // Find the PropertyAssignment named componentName (e.g. HlmButton: { ... })
  // Deep search is safe: component names (PascalCase e.g. HlmButton) cannot
  // collide with any nested property keys (camelCase) in catalog.ts.
  const componentProp = sourceFile
    .getDescendantsOfKind(SyntaxKind.PropertyAssignment)
    .find((p) => p.getName() === componentName);

  if (!componentProp) {
    throw new Error(`Component "${componentName}" not found in catalog.ts`);
  }

  // Within that subtree, collect inputBinding('name', ...) first string args
  return componentProp
    .getDescendantsOfKind(SyntaxKind.CallExpression)
    .filter((call) => call.getExpression().getText() === 'inputBinding')
    .map((call) => {
      const firstArg = call.getArguments()[0];
      if (!firstArg || firstArg.getKind() !== SyntaxKind.StringLiteral) {
        throw new Error(
          `inputBinding first argument must be a string literal in "${componentName}" (${catalogTsPath}), got: ${firstArg?.getText()}`,
        );
      }
      return firstArg.asKindOrThrow(SyntaxKind.StringLiteral).getLiteralValue();
    });
}

export function getInputDeclarationNames(_wrapperPath: string): string[] {
  throw new Error('not implemented');
}
