'use strict';

import * as path from 'path';
import * as ts from 'typescript';
import * as dependentFilesUtils from './get-dependent-files';

import { Promise } from 'es6-promise';
import { Change, InsertChange, RemoveChange, ReplaceChange } from './change';

/**
 * Interface that represents a module specifier and its position in the source file.
 * Use for storing a string literal, start position and end posittion of ExportClause node kinds.
 */
export interface ModuleExport {
  symbols: string[];
  blockText: string;
  specifierText: string;
  pos: number;
  end: number;
};

/** 
 * Rewrites import module of dependent files when the file is moved. 
 * Also, rewrites export module of related index file of the given file.
 */
export class ModuleResolver {

  constructor(public oldFilePath: string, public newFilePath: string, public rootPath: string) {}

  /**
   * Changes are applied from the bottom of a file to the top.
   * An array of Change instances are sorted based upon the order, 
   * then apply() method is called sequentially.
   * 
   * @param changes {Change []} 
   * @return Promise after all apply() method of Change class is called 
   *         to all Change instances sequentially.
   */
  applySortedChangePromise(changes: Change[]): Promise<void> {
    return changes
      .sort((currentChange, nextChange) => nextChange.order - currentChange.order)
      .reduce((newChange, change) => newChange.then(() => change.apply()), Promise.resolve());
  }

  /** 
   * Assesses the import specifier and determines if it is a relative import.
   * 
   * @return {boolean} boolean value if the import specifier is a relative import.
   */
  isRelativeImport(importClause: dependentFilesUtils.ModuleImport): boolean {
    let singleSlash = importClause.specifierText.charAt(0) === '/';
    let currentDirSyntax = importClause.specifierText.slice(0, 2) === './';
    let parentDirSyntax = importClause.specifierText.slice(0, 3) === '../';
    return singleSlash || currentDirSyntax || parentDirSyntax;
  }

  /** 
   * Logic for resolving specifier imports when there are index files (as default).
   * In case of no index files, the newSpecifierText (return value) can be concated with 
   * the component name. For example: newSpecifierText/x.component
  */
  private getNewSpecifierText(file: string, specifier: dependentFilesUtils.ModuleImport) {
    let fileDir = path.dirname(file);
    let newSpecifierText = path.relative(fileDir, this.newFilePath);
    if (newSpecifierText.length > 0 && newSpecifierText.charAt(0) !== '.') {
      newSpecifierText = `.${path.sep}${newSpecifierText}`;
    }
    return newSpecifierText;
  }

  getExportedSymbols(node: ts.SourceFile): string[] {
    return node.statements
      .filter((node) => node.kind !== ts.SyntaxKind.ImportDeclaration)
      .filter((node) => node.kind !== ts.SyntaxKind.EmptyStatement)
      .reduce((allSymbolsArray, node) => {
        let tempSymbolsArray = [];
        if (node.kind !== ts.SyntaxKind.VariableStatement) {
          // return (typeof node.name !== 'undefined') ? node.name.getText()
          tempSymbolsArray.push(node.name.getText());
        } else {
          tempSymbolsArray = node.getChildren()
            .filter((node) => node.kind === ts.SyntaxKind.VariableDeclarationList)
            .reduce((initialArray, node) => {
              let varDeclarationsArray = node.declarations.map((node) => node.name.getText());
              return initialArray.concat(varDeclarationsArray);
            }, []);
        }
        return allSymbolsArray.concat(tempSymbolsArray);
      }, []);
  }

  /** 
   * Rewrites the import specifiers of all the dependent files (cases for no index file).
   * 
   * @todo Implement the logic for rewriting imports of the dependent files when the file
   *       being moved has index file in its old path and/or in its new path.
   * 
   * @return {Promise<Change[]>} 
   */
  resolveDependentFiles(): Promise<Change[]> {
    return Promise.all([
          dependentFilesUtils.hasIndexFile(path.dirname(this.oldFilePath)),
          dependentFilesUtils.hasIndexFile(this.newFilePath),
          dependentFilesUtils.getDependentFiles(this.oldFilePath, this.rootPath)
      ])
      .then(([hasOldIndex, hasNewIndex, dependentFiles]) => {
        let changes: Change[] = [];
        let fileBaseName = path.basename(this.oldFilePath, '.ts');
        // Filter out the spec file associated with to-be-promoted component unit.
        let relavantFiles = Object.keys(dependentFiles).filter((file) => {
          if (path.extname(path.basename(file, '.ts')) === '.spec') {
            return path.basename(path.basename(file, '.ts'), '.spec') !== fileBaseName;
          } else {
            return true;
          }
        });
        relavantFiles.forEach(file => {
          let tempChanges: ReplaceChange[] = dependentFiles[file]
            .map(specifier => {
              let changeText = this.getNewSpecifierText(file, specifier);
              if (!hasNewIndex) {
                let componentName = path.basename(this.oldFilePath, '.ts');
                // Whether old Index exists or not, if new Index does not exists
                // then the module specifiers' pattern becomes 'path/to/newpath/x.component'.
                changeText = (changeText === '') ? `.${path.sep}${changeText}` : changeText;
                changeText = `${changeText}${path.sep}${componentName}`;
              } else {
                if (changeText === '') {
                  changeText = `..${path.sep}${path.basename(path.dirname(this.newFilePath))}`;
                };
              }
              let position = specifier.end - specifier.specifierText.length - 1;
              return new ReplaceChange(file, position, specifier.specifierText, changeText);
            });
          changes = changes.concat(tempChanges);
        });
        return changes;
      });
 }

  /**
   * Rewrites the file's own relative imports after it has been moved to new path.
   * 
   * @return {Promise<Change[]>}
   */
  resolveOwnImports(): Promise<Change[]> {
    return dependentFilesUtils.createTsSourceFile(this.oldFilePath)
      .then((tsFile: ts.SourceFile) => dependentFilesUtils.getImportClauses(tsFile))
      .then(moduleSpecifiers => {
        let changes: Change[] = moduleSpecifiers
        .filter(importClause => this.isRelativeImport(importClause))
        .map(specifier => {
          let specifierText = specifier.specifierText;
          let moduleAbsolutePath = path.resolve(path.dirname(this.oldFilePath), specifierText);
          let changeText = path.relative(this.newFilePath, moduleAbsolutePath);
          if (changeText.length > 0 && changeText.charAt(0) !== '.') {
            changeText = `.${path.sep}${changeText}`;
          }
          let position = specifier.end - specifier.specifierText.length;
          return new ReplaceChange(this.oldFilePath, position - 1, specifierText, changeText);
        });
        return changes;
      });
  }

  /**
   * Traverses through AST of a given file of kind 'ts.SourceFile', filters out child
   * nodes of the kind 'ts.SyntaxKind.ExportDeclaration' and returns export clauses as 
   * ModuleExport[]
   * 
   * @param {ts.SourceFile} node: Typescript Node of whose AST is being traversed
   * 
   * @return {ModuleExport[]} traverses through ts.Node and returns an array of moduleSpecifiers.
   */
  getExportDeclaration(node: ts.SourceFile): ModuleExport[] {
    return node.statements
      .filter(node => node.kind === ts.SyntaxKind.ExportDeclaration)
      .map((node: ts.ExportDeclaration) => {
        let symbols = node.getChildren()
          .filter((node) => {
            let isAsteriskToken = node.kind === ts.SyntaxKind.AsteriskToken;
            let isNamedExports = node.kind === ts.SyntaxKind.NamedExports;
            return  isAsteriskToken || isNamedExports;
          })
          .reduce((exportSymbolsArray, node) => {
            let tempSymbolsArray = [];
            if (node.kind === ts.SyntaxKind.NamedExports) {
              tempSymbolsArray = node.elements.map((node) => node.name.getText());
            } else {
              tempSymbolsArray.push(node.getText());
            };
            return exportSymbolsArray.concat(tempSymbolsArray);
          }, []);
        let moduleSpecifier = node.moduleSpecifier;
        return {
          symbols: symbols,
          blockText: node.getText(),
          specifierText: moduleSpecifier.getText().slice(1, -1),
          pos: moduleSpecifier.pos,
          end: moduleSpecifier.end
        };
      });
  }

  private exportedSymbolsAccumulator(filePath: string, exportDeclarations: ModuleExport[]) {
    return Promise.all(exportDeclarations.map((moduleSpecifier) => {
      if (moduleSpecifier.symbols.some((exportedSymbol) => exportedSymbol === '*')) {
        let fileName = path.resolve(path.dirname(filePath), moduleSpecifier.specifierText);
        console.log('file ko real path', fileName);
        fileName = (path.extname(fileName) !== '.ts') ? `${fileName}.ts` : fileName;
        return dependentFilesUtils.createTsSourceFile(fileName)
          .then((tsFile) => this.getExportedSymbols(tsFile));
      } else {
        return moduleSpecifier.symbols;
      }
    }));
  }

  hasPromotedSymbols(newIndexFile: string, oldIndexFile: string) {
    /**
     * get symbols from oldindex
     * if * return promise.all(oldIndexsymbols, newIndexsymbols)
     * else return promise.all(filesymbols, newIndexsymbols)
     * compare, return true if its there.
     */
    return dependentFilesUtils.createTsSourceFile(oldIndexFile)
      .then((tsFile) => this.getExportDeclaration(tsFile))
      .then((exportModules: ModuleExport[]) => {
        let promotedExportModules = exportModules
          .filter((moduleSpecifier) => {
            // index file's specifier pattern is always './x.component' or './x.component.ts'
            let fileWithExt = `.${path.sep}${path.basename(this.oldFilePath)}`;
            let fileWithNoExt = `.${path.sep}${path.basename(this.oldFilePath, '.ts')}`;
            let specifier = moduleSpecifier.specifierText;
            return  specifier === fileWithExt || specifier === fileWithNoExt;
          })
          .reduce((allExportedSymbols, moduleSpecifier) => {
            return allExportedSymbols.concat(moduleSpecifier.symbols);
          }, []);
        if (promotedExportModules.some((exportSymbol) => exportSymbol === '*')) {
          return Promise.all([
            dependentFilesUtils.createTsSourceFile(this.oldFilePath)
              .then((tsFile) => this.getExportedSymbols(tsFile)),
            dependentFilesUtils.createTsSourceFile(newIndexFile)
              .then((tsFile) => this.getExportDeclaration(tsFile))
              .then((exportDeclarations) => {
                return this.exportedSymbolsAccumulator(newIndexFile, exportDeclarations);
              })
          ]);
        } else {
          return Promise.all([
            promotedExportModules,
            dependentFilesUtils.createTsSourceFile(newIndexFile)
              .then((tsFile) => this.getExportDeclaration(tsFile))
              .then((exportDeclarations) => {
                return this.exportedSymbolsAccumulator(newIndexFile, exportDeclarations);
              })
          ]);
        };
      })
      .then(([promotedSymbols, newIndexSymbols]) => {
        console.log(promotedSymbols);
        console.log('new', newIndexSymbols);
        // Flatten array of newIndexSymbols
        let flatNewIndexSymbolsArray = newIndexSymbols.reduce((tempArray, exportedSymbol) => {
          return tempArray.concat(exportedSymbol);
        }, []);
        console.log('flat', newIndexSymbols);
      })
      // .then(() => {return true;});
  }
/** 
   * Removes the export clause in oldFilePath's index file (if there is one) and 
   * adds new export statements in newFilePath's index file (if there is one)
   * 
   * @return {Promise<Change[]>}
   */
  resolveExport(): Promise<Change[]> {
    const globSearch = denodeify(glob);
    let oldFileDirPath = path.dirname(this.oldFilePath);

    return globSearch(path.join(oldFileDirPath, 'index.ts'), { nodir: true })
      .then((oldIndex: string[]) => {
        if (oldIndex.length > 0) {
          let indexFile = oldIndex[0];
          return dependentFilesUtils.createTsSourceFile(indexFile)
            .then((tsFile: ts.SourceFile) => {
              let exportModules = this.getExportDeclaration(tsFile);
              let removeChanges: RemoveChange[] = exportModules
                .filter(moduleBlock => {
                  let specifierText = moduleBlock.specifierText;
                  return `.${path.sep}${path.basename(this.oldFilePath, '.ts')}` === specifierText;
                })
                .map(moduleBlock => {
                  let toRemove = `${moduleBlock.blockText}\n`;
                  // Position is then added by 2 for '\n' at the end of export statement.
                  let position = (moduleBlock.end + 2) - toRemove.length;
                  return new RemoveChange(indexFile, position, toRemove);
                });
              return this.sortedChangePromise(removeChanges);
            });
        };
      })
      .then(() => globSearch(path.join(this.newFilePath, 'index.ts'), { nodir: true }))
      .then((newIndex: string[]) => {
        if (newIndex.length > 0) {
          let indexFile = newIndex[0];
          return dependentFilesUtils.createTsSourceFile(indexFile)
            .then((tsFile: ts.SourceFile) => {
              let exportModules = this.getExportDeclaration(tsFile);
              // Add export statement after last export staments
              let toAdd: string;
              let position: number;
              if (exportModules.length === 0) {
                position = 0;
                toAdd = `export * from '.${path.sep}${path.basename(this.oldFilePath, '.ts')}';\n`;
              } else {
                // Position then is added by 1 to account for ';' at the end of export statment.
                position = exportModules[exportModules.length - 1].end + 1;
                toAdd = `\nexport * from '.${path.sep}${path.basename(this.oldFilePath, '.ts')}';`;
              };
              let addChange = new InsertChange(indexFile, position, toAdd);
              return addChange.apply();
            });
        }
      });
  }
}
