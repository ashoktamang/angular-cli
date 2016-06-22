'use strict';

// This needs to be first so fs module can be mocked correctly. 
let mockFs = require('mock-fs');

import {expect, assert} from 'chai';
import * as path from 'path';
import * as dependentFilesUtils from '../../addon/ng2/utilities/get-dependent-files';

describe('Get Dependent Files: ', () => {
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
          'bar.component.ts': `import * from './baz
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

  describe('getFiles', () => {
    it('returns an array of all files under the given path', () => {
      let sourceFile = path.join(rootPath, 'bar');
      let parsedPath = path.normalize(sourceFile);
      let contents = [];
      dependentFilesUtils.getFiles(parsedPath, contents);
      let expectedContents = [
        path.normalize('src/app/bar/bar.component.ts'),
        path.normalize('src/app/bar/baz/baz.component.ts')
      ];
      assert.deepEqual(contents, expectedContents);
    });
    it('returns an empty string if an empty directory is passed', () => {
      let sourceFile = path.join(rootPath, 'empty-dir');
      let parsedPath = path.normalize(sourceFile);
      let contents = [];
      dependentFilesUtils.getFiles(parsedPath, contents);
      assert.deepEqual(contents, []]);
    });
  });

  describe('getModuleSpecifier', () => {
    it('stores all ModuleSpecifiers (text, pos, end) in the passed-in array', () => {
      let sourceFile = path.join(rootPath, 'bar/bar.component.ts');
      let tsFile = dependentFilesUtils.createtsSourceFile(sourceFile);
      expect(tsFile.kind).to.equal(251); // Enum SyntaxKind.SourceFile = 251
      let contents = [];
      dependentFilesUtils.getModuleSpecifier(tsFile, contents);
      let expectedContents = [
        {
          'specifier': './baz',
          'pos': 13,
          'end': 20
        },
        {
          'specifier': '../foo',
          'pos': 65,
          'end': 74
        }
      ];
      assert.deepEqual(contents, expectedContents);
    });
  });

  describe('getDependentFiles', () => {
    it('returns a map of all files which depend on a given file [nested directory]', () => {
      let sourceFile = path.join(rootPath, 'bar/bar.component.ts');
      let contents = dependentFilesUtils.getDependentFiles(sourceFile, rootPath);
      let expectedContents = {};
      expectedContents[path.normalize('src/app/bar/baz/baz.component.ts')] = {
        specifier: '../bar',
        pos: 13,
        end: 22
      };
      assert.deepEqual(contents, expectedContents);
    });
    it('returns a map of all files which depend on a given file [multiple directories]', () => {
      let sourceFile = path.join(rootPath, 'bar/baz/baz.component.ts');
      let contents = dependentFilesUtils.getDependentFiles(sourceFile, rootPath);
      let expectedContents = {};
      expectedContents[path.normalize('src/app/bar/bar.component.ts')] = {
        specifier: './baz',
        pos: 13,
        end: 20
      };
      expectedContents[path.normalize('src/app/foo/foo.component.ts')] = {
        specifier: '../bar/baz',
        pos: 13,
        end: 26
      };
      assert.deepEqual(contents, expectedContents);
    });
    it('returns an empty map if there are no dependent files', () => {
      let sourceFile = path.join(rootPath, 'foo-baz/no-module.component.ts');
      let contents = dependentFilesUtils.getDependentFiles(sourceFile, rootPath);
      assert.deepEqual(contents, {});
    });
  });
});
