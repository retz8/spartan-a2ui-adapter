import * as fs from 'fs';

export function getSchemaProperties(catalogJsonPath: string, componentName: string): string[] {
  const raw = fs.readFileSync(catalogJsonPath, 'utf-8');
  const catalog = JSON.parse(raw);
  if (!catalog.components) throw new Error(`catalog.json at "${catalogJsonPath}" has no "components" key`);
  const component = catalog.components[componentName];
  if (!component) throw new Error(`Component "${componentName}" not found in catalog.json`);
  if (!component.properties) throw new Error(`Component "${componentName}" has no "properties" key in catalog.json`);
  return Object.keys(component.properties);
}

export function getInputBindingNames(_catalogTsPath: string, _componentName: string): string[] {
  throw new Error('not implemented');
}

export function getInputDeclarationNames(_wrapperPath: string): string[] {
  throw new Error('not implemented');
}
