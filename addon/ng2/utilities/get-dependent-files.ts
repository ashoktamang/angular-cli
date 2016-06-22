'use strict';

import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';

/**
 * Declare a MapType where key is a string and value is an array of type string
 * Use for storing a file's path as key and its dependent module's relative path
 */
declare type ImportMap {
  [key: string]: ImportMap | string[];
}

/**
 * Create a SourceFile as defined by Typescript Compiler API.
 * Generate a AST structure from a source file.
 * 
 * @param fileName source file for which AST is to be extracted
 */
export function createtsSourceFile(fileName: string): ts.SourceFile {
  return ts.createSourceFile(fileName,
                             fs.readFileSync(fileName).toString(),
                             ts.ScriptTarget.ES6,
                             true);
}

/**
 *  Store all the files' path under the given path in a passed in array.
 *  All the files in the subdirectories of the given path are also included.
 * 
 * @param filePath path from where all the files' path are retrieved
 * @param allFiles array where the files are stored and then returned.
 * 
 */

export function getFiles(filePath: string, allFiles: string[]): any {
  let files = fs.readdirSync(filePath);
  files.forEach(file => {
    if (path.extname(file) === '') {
      getFiles(path.join(filePath, file), allFiles);
    } else {
      allFiles.push(path.join(filePath, file));
    }
  });
  return allFiles;
}

/**
 * Traverse through ts.Node recursively and stores moduleSpecifiers in an array
 * 
 * @param {ts.Node} node: Typescript Node of whose AST is being traversed
 * @param {string[]} moduleSpecifiers: array to store moduleSpecifiers if found.
 * 
 */
export function getModuleSpecifier(node: ts.Node, moduleSpecifiers: string[]): any {
  node.getChildren().forEach(nodeObj => {
    if (node.kind === ts.SyntaxKind.ImportClause) {
      let moduleSpecifier = node.parent.moduleSpecifier;
      let instance: MapType = {
        'specifier': moduleSpecifier.text,
        'pos': moduleSpecifier.pos,
        'end': moduleSpecifier.end
      };
      moduleSpecifiers.push(instance);
    }
    getModuleSpecifier(nodeObj, moduleSpecifiers);
  });
  return moduleSpecifiers;
}

/**
 * Return a map of all dependent file/s' path with their moduleSpecifier object
 * (text, pos, end)
 * 
 * @param fileName file upon which other files depend 
 * @param rootPath root of the project
 * 
 */
export function getDependentFiles(fileName: string, rootPath: string): MapType {
  let files: string[] = [];
  getFiles(rootPath, files);
  files = files.filter(function (file) {
    if (path.extname(file) == '.ts') {
      if (path.extname(path.basename(file, '.ts')) === '.component') {
        return file;
      }
    }
  });

  let allFiles: ImportMap = {};
  let relevantFiles: ImportMap = {};
  files.forEach(file => {
    let moduleSpecifiers: any[] = [];
    let tsFile = createtsSourceFile(file);
    if (moduleSpecifiers) {
      getModuleSpecifier(tsFile, moduleSpecifiers);
      allFiles[file] = moduleSpecifiers;
    }
  });
  for (let filePath in allFiles) {
    allFiles[filePath].forEach(file => {
      if (path.basename(file.specifier) === path.basename(path.dirname(fileName))) {
        relevantFiles[filePath] = file;
      };
    });
  }
  return relevantFiles;
}
