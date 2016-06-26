'use strict';

import * as mockFs from 'mock-fs';
import { expect, assert } from 'chai';

import * as path from 'path';
import { ModuleResolve } from '../../addon/ng2/utilities/module-resolve';
import * as Promise from 'ember-cli/lib/ext/promise';
import * as dependentFilesUtils from '../../addon/ng2/utilities/get-dependent-files';
import * as fs from 'fs';


const readFile = Promise.denodeify(fs.readFile);

describe('ModuleResolve', () => {
  let rootPath = 'src/app';

  beforeEach(() => {
    let mockDrive = {
      'src/app': {
        'foo': {
          'foo.component.ts': 'import * from "../bar/baz"'
        },
        'bar': {
          'baz': {
            'baz.component.ts': 'import * from "../bar"'
          },
          'bar.component.ts': `import * from './baz'
                               import * from '../foo'`
        },
        'foo-baz': {
          'no-module.component.ts': ''
        },
        'empty-dir': {}
      }
    };
    mockFs(mockDrive);
  });
  afterEach(() => {
    mockFs.restore();
  });

  it.only('moving up the dir', () => {
      let oldFilePath = path.join(rootPath, 'bar/baz');
      let newFilePath = path.join(rootPath, 'baz');
      let resolve = new ModuleResolve(oldFilePath, newFilePath);
      return resolve.parseModuleSpecifiers(rootPath)
      .then(() => {
          let contents = [];
          let tsFile = dependentFilesUtils.createtsSourceFile('src/app/bar/bar.component.ts');
          dependentFilesUtils.getModuleSpecifier(tsFile, contents);
          console.log(fs.readFileSync('src/app/bar/bar.component.ts', 'utf8'));
          expect(contents[0].specifier).to.equal('../baz');
          expect(contents[1].specifier).to.equal('../foo');
      });
  });
  it('moving down the dir', () => {
     let oldFilePath = path.join(rootPath, 'foo');
     let newFilePath = path.join(rootPath, 'bar/foo');
     let resolve = new ModuleResolve(oldFilePath, newFilePath);
     return resolve.parseModuleSpecifiers(rootPath)
     .then(() => {
         let contents = [];
         let tsFile = dependentFilesUtils.createtsSourceFile('src/app/bar/bar.component.ts');
         dependentFilesUtils.getModuleSpecifier(tsFile, contents);
         expect(contents[0].specifier).to.equal('./baz');
         expect(contents[1].specifier).to.equal('./foo');
     });
  });
  it('no dependent files', () => {
     let oldFilePath = path.join(rootPath, 'foo-baz');
     let newFilePath = path.join(rootPath, 'bar/foo-baz');
     let resolve = new ModuleResolve(oldFilePath, newFilePath);
    //  console.log(resolve.parseModuleSpecifiers(rootPath));
  });
  it('moving down the dir', () => {
     let oldFilePath = path.join(rootPath, 'foo');
     let newFilePath = path.join(rootPath, 'bar/foo');
     let resolve = new ModuleResolve(oldFilePath, newFilePath);
     resolve.parseModuleSpecifiers(rootPath)
     .then(() => {
        //  console.log(fs.readFileSync(path.normalize('src/app/bar/bar.component.ts'), 'utf8'));
     });
  });
});
