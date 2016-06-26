 'use strict';

import * as dependentFilesUtils from './get-dependent-files';
import * as path from 'path';
import * as Promise from 'ember-cli/lib/ext/promise';
import * as fs from 'fs';
import {InsertChange, RemoveChange, ReplaceChange} from './change';

const rootPath = 'src/app';
const readFile = Promise.denodeify(fs.readFile);
const writeFile = Promise.denodeify(fs.writeFile);

export class ModuleResolve {

  const description: string;

  constructor(public oldFilePath: string, public newFilePath: string) {}

  public diffPaths(): string {
    let oldDir = path.dirname(this.oldFilePath);
    let newDir = path.dirname(this.newFilePath);

    if (oldDir === newDir) {
      throw new Error('You are moving the component to the same place, Duh!');
    }

    let oldDir = oldDir.split(path.sep);
    let newDir = newDir.split(path.sep);
    let parsedRootPath = rootPath.split(path.sep);

    if (newDir.length > oldDir.length) {
      let toAdd: string[] = newDir.filter(i => {
        if (newDir.indexOf(i) > parsedRootPath.length - 1) {
          return i;
        };
      });
      console.log('toAdd', toAdd);
			let temp = '';
			toAdd.forEach(pathSegment => {
				temp = temp.concat('/', pathSegment);
			};
			return {
				'text': path.normalize(temp),
				'operation': 'toAdd'
			};
    } else {
      let toRemove: string[] = oldDir.filter(i => {
        return rootPath.indexOf(i) === -1;
      });
      console.log(toRemove);
        // i => {
        // if (oldDir.indexOf(i) > parsedRootPath.length - 1) {
        //   return i;
        // };
      //});
			let temp = '';
			toRemove.forEach(pathSegment => {
				temp = temp.concat('/', pathSegment);
			};
			return {
				'text': path.normalize(temp),
				'operation': 'toRemove'
      };
  
  };
  };

  public parseModuleSpecifiers(filePath: string): any {
    let fileName = '';
    fs.readdirSync(path.join(this.oldFilePath)).forEach(file => {
			if (path.extname(file) == '.ts') {
        if (path.extname(path.basename(file, '.ts')) === '.component') {
          fileName = file;
        }
      }
		});
		fileName = path.join(rootPath, this.oldFilePath, fileName);
		let files = dependentFilesUtils.getDependentFiles(fileName, rootPath);
    // return this.ashok(files);
    if (Object.getOwnPropertyNames(files).length > 0) {
      let change = this.diffPaths();
      console.log(change);
      
      if (change.operation === 'toRemove') {
         let changes = [];
        
        for (let file of Object.keys(files)) {
          if (files[file].specifier.indexOf(change.text) === -1) {
            console.log('please go here');
            changes.push[new InsertChange(file, files[file].pos + 2, '.')];
          } else {
            changes.push[new RemoveChange(file, files[file].pos + 4, change.text)];
          }
        }

        let pathb = 'src/app/bar/bar.component.ts';
        a = new InsertChange(pathb, files[pathb].pos + 2, '.');
        return a.apply();
      }
      if (change.operation === 'toAdd') {
        let a;
        console.log(files);
        let oldDir = path.basename(this.oldFilePath);
        for (let file of Object.keys(files)) {
          // if (path.basename(path.dirname(file)) === path.basename(path.dirname(this.newFilePath))) {
          //   let position = files[file].pos + 2;
          //   a = new RemoveChange(file, position, '.');
          // } else {
          //   let position = files[file].end - oldDir.length - 1 - 1;
          //   a = new InsertChange(file, position, change.text);
          // }
          let position = files[file].end - oldDir.length - 1 - 1;
          a = new InsertChange(file, position, change.text);
        }
        return a.apply();
      }
    } else {
      return 'No dependent files';
    }
  }
  // }

//   public ashok(files) : Promise<any>{
  
//   if (Object.getOwnPropertyNames(files).length > 0) {
//       let change = this.diffPaths();
      
//       if (change.operation === 'toRemove') {
//         let a;
        
//         for (let file of Object.keys(files)) {
//           if (files[file].specifier.indexOf(change.text) === -1) {
//             console.log('please go here');
//             a = new InsertChange(file, files[file].pos + 2, '.');
//           } else {
//             a = new RemoveChange(file, files[file].pos + 4, change.text);
//           }
//         }
//         return a.apply();
//       }
//       if (change.operation === 'toAdd') {
//         let a;
//         console.log(files);
//         let oldDir = path.basename(this.oldFilePath);
//         for (let file of Object.keys(files)) {
//           if (path.basename(path.dirname(file)) === path.basename(path.dirname(this.newFilePath))) {
//             let position = files[file].pos + 2;
//             a = new RemoveChange(file, position, '.');
//           } else {
//             let position = files[file].end - oldDir.length - 1 - 1;
//             a = new InsertChange(file, position, change.text);
//           }
//         }
//         return a.apply();
//       }
//     } else {
//       return Promise.reject('No dependent files');
//     }
//   }
// }
}
