'use strict';

import * as dependentFilesUtils from './get-dependent-files';
import * as path from 'path';
import * as Promise from 'ember-cli/lib/ext/promise';
import * as fs from 'fs';
import {InsertChange, RemoveChange, ReplaceChange} from './change';

/** @const The root directory of Angular Project. */
const ROOT_PATH = 'src/app';

declare type ChangeMap {
  [key: string]: ChangeMap: string;
}

/** 
 * @class Resolves the module of dependent files when the file is moved. 
 */
export class ModuleResolve {

  /** @member Description of the module resolution. */
  const description: string;

  /** @constructs */
  constructor(public oldFilePath: string, public newFilePath: string) {
    let component = path.basename(oldFilePath);
    this.description = `Promoted ${component} from ${oldFilePath} to ${newFilePath}`;
  }

  /**
   * @return {MapType} a map of necessary changes to make for module resolution.
   * @example If a file is moved one level up the directory tree, then the map will contain:
   * {'text': changeText, 'direction': 'MoveUp', 'dirLevel': 1}
   */
   diffPaths(oldFilePath: string, newFilePath: string): ChangeMap {

    /** Check whether old andn new path have same parent directory. */
    let oldDir: string = path.dirname(this.oldFilePath);
    let newDir: string = path.dirname(this.newFilePath);

    if (oldDir === newDir) {
      return {
        'text': path.basename(this.newFilePath),
        'direction': 'NoMove',
        'dirLevel': 0
      };
    }

    /** Parsed into an array to check the length. */
    oldDir = oldDir.split(path.sep);
    newDir = newDir.split(path.sep);

    /** Check whether move up or down the directory tree. */
    if (newDir.length > oldDir.length) {
      let changeText: string[] = newDir.filter(i => {
        return oldDir.indexOf(i) === -1;
      });
      let temp = '';
      changeText.forEach(pathSegment => {
        temp = temp.concat('/', pathSegment);
      };
      return {
        'text': path.normalize(temp),
        'direction': 'MoveDown',
        'dirLevel': changeText.length
      };
    } else {
      let changeText: string[] = oldDir.filter(i => {
        return newDir.indexOf(i) === -1;
      });
      let temp = '';
      changeText.forEach(pathSegment => {
        temp = temp.concat('/', pathSegment);
      };
      return {
        'text': path.normalize(temp),
        'direction': 'MoveUp',
        'dirLevel': changeText.length
      };
    };
  };

  /**
   * Changes are applied from the bottom of a file to the top.
   * An array of Change instances are sorted based upon the order, 
   * then apply() method is called sequentially.
   * 
   * @param changes {Change []} 
   * @return Promise after all apply() method of Change class is called sequentially.
   */
  public sortedChangePromise(changes: Change[]): Promise {
    changes = changes.sort((a, b) => return b.order - a.order; );
    let changePromise = new Promise((resolve, reject) => {return resolve(); );
    changes.forEach(change => {
      changePromise = changePromise.then(() => change.apply());
    });
    return changePromise;
  }

  /**
   * @return {Promise} an array of Promise returned by Change instance
   */
  public parseModuleSpecifiers(filePath: string): Promise<any> {
    let fileName = '';

    fs.readdirSync(path.join(this.oldFilePath)).forEach(file => {
    if (path.extname(file) == '.ts') {
        if (path.extname(path.basename(file, '.ts')) === '.component') {
          fileName = file;
        }
      }
    });
    fileName = path.join(ROOT_PATH, this.oldFilePath, fileName);
    let files = dependentFilesUtils.getDependentFiles(fileName, ROOT_PATH);
    if (Object.getOwnPropertyNames(files).length > 0) {
      let change = this.diffPaths(this.oldFilePath, this.newFilePath);
      if (change.direction === 'MoveUp') {
         let changes = [];
         let oldDir = path.basename(this.oldFilePath);
        for (let file of Object.keys(files)) {
          // When change.text is not in the ModuleSpecifier
          if (files[file].specifier.indexOf(change.text) === -1) {
            // Checking if a file and its dependent file are under same parent directory.
            // For instance, bar/baz/ and bar/bar.component.ts has same parent 'bar'.
            if (path.dirname(file) === path.dirname(this.oldFilePath)) {
              let position = files[file].end - files[file].specifier.length;
              let a = new InsertChange(file, position, '.');
              changes.push(a);
            } else {
              let position = files[file].end - `/${oldDir}`.length;
              let addText = '../'.repeat(change.dirLevel);
              let a = new InsertChange(file, position, addText);
              changes.push(a);
            }
          } else {
            let position = files[file].end - `${change.text}/${oldDir}'`.length;
            let a = new RemoveChange(file, position, change.text);
            changes.push(a);
          }
        }
        changes = changes.map(change => change.apply());
        return Promise.all(changes);
      }

      if (change.direction === 'MoveDown') {
        let changes = [];
        let oldDir = path.basename(this.oldFilePath);
        for (let file of Object.keys(files)) {
          // Check whether newFilePath and the dependent file have the same parent directory
          if (path.basename(path.dirname(file)) === path.basename(path.dirname(this.newFilePath))) {
            let position = files[file].end - files[file].specifier.length;
            let a = new RemoveChange(file, position - 1, '.');
            changes.push(a);
          } else {
            let position = files[file].end - `/${oldDir}'`.length;
            let a = new InsertChange(file, position, change.text);
            changes.push(a);
          }
        }
        changes = changes.map(change => change.apply());
        return Promise.all(changes);
      }

      if (change.direction === 'NoMove') {
        let changes = [];
        let oldDir = path.basename(this.oldFilePath);
        for (let file of Object.keys(files)) {
          let position = files[file].end - `${oldDir}'`.length;
          let a = new ReplaceChange(file, position, oldDir, change.text);
          changes.push(a);
        }
        changes = changes.map(change => change.apply());
        return Promise.all(changes);
      }
    } else {
      return Promise.resolve('No dependent files to resolve.');
    }
  };

  public resolveFile(): Promise<void> {
    let fileName;
    let filePath;
    let oldPathArray;
    let newPathArray;
    if (path.extname(this.oldFilePath) === '.ts') {
      fileName = this.oldFilePath;
      filePath = path.join(fileName);
      oldPathArray = path.dirname(filePath).split(path.sep);
      newPathArray = path.dirname(this.newFilePath).split(path.sep);
    } else {
      fs.readdirSync(path.join(this.oldFilePath)).forEach(file => {
        if (path.extname(file) == '.ts') {
          if (path.extname(path.basename(file, '.ts')) === '.component') {
            fileName = file;
          }
        }
        filePath = path.join(this.oldFilePath, fileName);
      });
      oldPathArray = this.oldFilePath.split(path.sep);
      newPathArray = this.newFilePath.split(path.sep);
    }

    let tsFile = dependentFilesUtils.createtsSourceFile(filePath);

    let modules: string[] = [];
    dependentFilesUtils.getModuleSpecifier(tsFile, modules);

    // Instantiate an empty array for all Changes instance
    let changes = [];

    modules.forEach(specifier => {
      let specifierArray = specifier.specifier.split(path.sep);
      // Change involves replacing whole string of module specifier less the module name
      let replaceText = '';
      if (specifierArray.length > 2 || specifierArray[0] == '..') {
        let parentDirSyntaxCounter = 0;
        // Check the frequency of '..' in the array.
        // Later, the frequency is used to determine the absolute path of a given module.
        specifierArray.forEach(dirName => {
          if (dirName === '..') {
            parentDirSyntaxCounter++;
          }
        });
        let parsedPath = oldPathArray.slice(0, oldPathArray.length - parentDirSyntaxCounter);
        specifierArray.forEach(dirName => {
          if (dirName !== '..') {
            parsedPath.push(dirName);
          }
        });
        let rootDirLevel = (ROOT_PATH.split(path.sep)).length; // To omit 'src/app' in replaceText
        let  tempNewPathArray = newPathArray.slice(rootDirLevel, newPathArray.length);
        let sameDirCounter = 0;
        let replaceTextArray = [];
        let tempRootLevel = rootDirLevel;
        // Checks if the file is moved under the same directory 
        // from where it is importing its module.
        tempNewPathArray.forEach(dirName => {
          if (dirName === parsedPath[tempRootLevel]) {
            replaceTextArray = ['.'];
            sameDirCounter++;
          } else {
            replaceTextArray.push('..');
          }
        });
        let tempParsedArray = parsedPath.slice(rootDirLevel + sameDirCounter,
                                               parsedPath.length - 1);
        replaceTextArray = replaceTextArray.concat(tempParsedArray);
        replaceTextArray.forEach(dirName => replaceText = path.join(replaceText, dirName));
      }
      let moduleName = specifierArray[specifierArray.length - 1];

      // ReplaceChange is being applied here
      let position = specifier.end - specifier.specifier.length;
      // The text to be replaced will always be the 
      // whole string of module specifier less the module name
      let upToModuleRange = (specifier.specifier.length - 1) - moduleName.length;
      let toBeReplacedText = specifier.specifier.slice(0, upToModuleRange);

      let replace = new ReplaceChange(filePath, position - 1, toBeReplacedText, replaceText);
      changes.push(replace);
    });
    return this.sortedChangePromise(changes);
}
