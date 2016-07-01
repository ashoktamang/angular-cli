'use strict';

import * as mockFs from 'mock-fs';
import { expect } from 'chai';

import * as path from 'path';
import { ModuleResolve } from '../../addon/ng2/utilities/module-resolve';
import * as dependentFilesUtils from '../../addon/ng2/utilities/get-dependent-files';

describe('ModuleResolve', () => {
  let rootPath = 'src/app';

  beforeEach(() => {
    let mockDrive = {
      'src/app': {
        'foo': {
          'foo.component.ts': `import * from "../bar/baz"`
        },
        'bar': {
          'baz': {
            'baz.component.ts': `import * from "../../bar"
                                 import * from '../../foo-baz/qux/quux/foobar'
                                 `
          },
          'bar.component.ts': `import * from './baz'
                               import * from '../foo'`
        },
        'foo-baz': {
          'qux': {
            'quux': {
              'foobar': {
                'foobar.component.ts': `import * from "../../../../foo"
                                        import * from '../fooqux'
                                        `
              },
              'fooqux': {
                'fooqux.component.ts': 'import * from                   "../foobar"'
              }
            }
          }
          'no-module.component.ts': '',
          'foo-baz.component.ts': 'import * from \n"../foo"\n'
        },
        'empty-dir': {}
      }
    };
    mockFs(mockDrive);
  });
  afterEach(() => {
    mockFs.restore();
  });

  it('moving one level up the directory tree', () => {
      let oldFilePath = path.join(rootPath, 'bar/baz');
      let newFilePath = path.join(rootPath, 'baz');
      let resolve = new ModuleResolve(oldFilePath, newFilePath);
      return resolve.parseModuleSpecifiers(rootPath)
      .then(() => {
          let contentsBar = [];
          let tsFileBar = dependentFilesUtils.createtsSourceFile('src/app/bar/bar.component.ts');
          dependentFilesUtils.getModuleSpecifier(tsFileBar, contentsBar);
          expect(contentsBar[0].specifier).to.equal('../baz');

          let contentsFoo = [];
          let tsFileFoo = dependentFilesUtils.createtsSourceFile('src/app/foo/foo.component.ts');
          dependentFilesUtils.getModuleSpecifier(tsFileFoo, contentsFoo);
          expect(contentsFoo[0].specifier).to.equal('../baz');
      });
  });
  it('moving one level down the directory tree', () => {
     let oldFilePath = path.join(rootPath, 'foo');
     let newFilePath = path.join(rootPath, 'bar/foo');
     let resolve = new ModuleResolve(oldFilePath, newFilePath);
     return resolve.parseModuleSpecifiers(rootPath)
     .then(() => {
        let contents = [];
        let tsFile = dependentFilesUtils.createtsSourceFile('src/app/bar/bar.component.ts');
        dependentFilesUtils.getModuleSpecifier(tsFile, contents);
        expect(contents[1].specifier).to.equal('./foo');

        let contentsFooBar = [];
        let sourcePath = 'src/app/foo-baz/qux/quux/foobar/foobar.component.ts';
        let tsFileFooBar = dependentFilesUtils.createtsSourceFile(sourcePath);
        dependentFilesUtils.getModuleSpecifier(tsFileFooBar, contentsFooBar);
        expect(contentsFooBar[0].specifier).to.equal('../../../../bar/foo');
     });
  });
  it('no dependent files', () => {
     let oldFilePath = path.join(rootPath, 'foo-baz');
     let newFilePath = path.join(rootPath, 'bar/foo-baz');
     let resolve = new ModuleResolve(oldFilePath, newFilePath);
     return resolve.parseModuleSpecifiers(rootPath).then(content => {
         expect(content).to.equal('No dependent files to resolve.');

     });
  });
  it('moving three levels down the directory tree', () => {
     let oldFilePath = path.join(rootPath, 'foo');
     let newFilePath = path.join(rootPath, '/foo-baz/qux/quux/foo');
     let resolve = new ModuleResolve(oldFilePath, newFilePath);
     return resolve.parseModuleSpecifiers(rootPath)
     .then(() => {
         let contents = [];
         let tsFile = dependentFilesUtils.createtsSourceFile('src/app/bar/bar.component.ts');
         dependentFilesUtils.getModuleSpecifier(tsFile, contents);
         expect(contents[0].specifier).to.equal('./baz');
         expect(contents[1].specifier).to.equal('../foo-baz/qux/quux/foo');
     });
  });
  it('moving in depeer level of directory tree', () => {
     let oldFilePath = path.join(rootPath, 'foo-baz/qux/quux/fooqux');
     let newFilePath = path.join(rootPath, 'foo-baz/qux/fooqux';
     let resolve = new ModuleResolve(oldFilePath, newFilePath);
     return resolve.parseModuleSpecifiers(rootPath)
     .then(() => {
         let contents = [];
         let path = 'src/app/foo-baz/qux/quux/foobar/foobar.component.ts';
         let tsFile = dependentFilesUtils.createtsSourceFile(path);
         dependentFilesUtils.getModuleSpecifier(tsFile, contents);
         expect(contents[1].specifier).to.equal('../../fooqux');
     });
  });
  it('multiple spaces before moduleSpecifier', () => {
     let oldFilePath = path.join(rootPath, 'foo-baz/qux/quux/foobar');
     let newFilePath = path.join(rootPath, 'foo-baz/qux/foobar';
     let resolve = new ModuleResolve(oldFilePath, newFilePath);
     return resolve.parseModuleSpecifiers(rootPath)
     .then(() => {
         let contents = [];
         let path = 'src/app/foo-baz/qux/quux/fooqux/fooqux.component.ts';
         let tsFile = dependentFilesUtils.createtsSourceFile(path);
         dependentFilesUtils.getModuleSpecifier(tsFile, contents);
         expect(contents[0].specifier).to.equal('../../foobar');
     });
  });
  it('new line in import statement', () => {
     let oldFilePath = path.join(rootPath, 'foo');
     let newFilePath = path.join(rootPath, 'bar/foo';
     let resolve = new ModuleResolve(oldFilePath, newFilePath);
     return resolve.parseModuleSpecifiers(rootPath)
     .then(() => {
         let contents = [];
         let path = 'src/app/foo-baz/foo-baz.component.ts';
         let tsFile = dependentFilesUtils.createtsSourceFile(path);
         dependentFilesUtils.getModuleSpecifier(tsFile, contents);
         expect(contents[0].specifier).to.equal('../bar/foo');
     });
  });
  it('renaming the component file', () => {
     let oldFilePath = path.join(rootPath, 'foo');
     let newFilePath = path.join(rootPath, 'newFoo';
     let resolve = new ModuleResolve(oldFilePath, newFilePath);
     return resolve.parseModuleSpecifiers(rootPath)
     .then(() => {
         let contentsBar = [];
         let pathBar = 'src/app/bar/bar.component.ts';
         let tsFileBar = dependentFilesUtils.createtsSourceFile(pathBar);
         dependentFilesUtils.getModuleSpecifier(tsFileBar, contentsBar);
         expect(contentsBar[1].specifier).to.equal('../newFoo');

         let contentsFooBar = [];
         let pathFooBar = 'src/app/foo-baz/qux/quux/foobar/foobar.component.ts';
         let tsFileFooBar = dependentFilesUtils.createtsSourceFile(pathFooBar);
         dependentFilesUtils.getModuleSpecifier(tsFileFooBar, contentsFooBar);
         expect(contentsFooBar[0].specifier).to.equal('../../../../newFoo');
     });
  });
  it('resolve oneself, moving down', () => {
     let oldFilePath = path.join(rootPath, 'foo');
     let newFilePath = path.join(rootPath, 'bar/foo';
     let resolve = new ModuleResolve(oldFilePath, newFilePath);
     return resolve.resolveFile(rootPath)
     .then(() => {
        let contents = [];
        let path = 'src/app/foo/foo.component.ts';
        let tsFile = dependentFilesUtils.createtsSourceFile(path);
        dependentFilesUtils.getModuleSpecifier(tsFile, contents);
        expect(contents[0].specifier).to.equal('../baz');
     });
  });
  it('resolve oneself, moving up', () => {
     let oldFilePath = path.join(rootPath, 'bar/baz');
     let newFilePath = path.join(rootPath, 'baz';
     let resolve = new ModuleResolve(oldFilePath, newFilePath);
     return resolve.resolveFile(rootPath)
     .then(() => {
        let contents = [];
        let path = 'src/app/bar/baz/baz.component.ts';
        let tsFile = dependentFilesUtils.createtsSourceFile(path);
        dependentFilesUtils.getModuleSpecifier(tsFile, contents);
        expect(contents[0].specifier).to.equal('../bar');
        expect(contents[1].specifier).to.equal('../foo-baz/qux/quux/foobar');
     });
  });
  it('resolve oneself, moving up [nested]', () => {
     let oldFilePath = path.join(rootPath, 'foo-baz/qux/quux/foobar');
     let newFilePath = path.join(rootPath, 'foobar';
     let resolve = new ModuleResolve(oldFilePath, newFilePath);
     return resolve.resolveFile(rootPath)
     .then(() => {
        let contents = [];
        let path = 'src/app/foo-baz/qux/quux/foobar/foobar.component.ts';
        let tsFile = dependentFilesUtils.createtsSourceFile(path);
        dependentFilesUtils.getModuleSpecifier(tsFile, contents);
        expect(contents[0].specifier).to.equal('../foo');
        expect(contents[1].specifier).to.equal('../foo-baz/qux/quux/fooqux');
     });
  });
  it('resolve oneself, when module is in the same directory', () => {
     let oldFilePath = path.join(rootPath, 'foo/foo.component.ts');
     let newFilePath = path.join(rootPath, 'bar/foo.component.ts';
     let resolve = new ModuleResolve(oldFilePath, newFilePath);
     return resolve.resolveFile(rootPath)
     .then(() => {
        let contents = [];
        let path = 'src/app/foo/foo.component.ts';
        let tsFile = dependentFilesUtils.createtsSourceFile(path);
        dependentFilesUtils.getModuleSpecifier(tsFile, contents);
        expect(contents[0].specifier).to.equal('./baz');
     });
  });
});
