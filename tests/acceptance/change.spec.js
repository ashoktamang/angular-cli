'use strict';

var expect = require('chai').expect;
var path = require('path');
var change = require('../../addon/ng2/utilities/change');
var mockFs = require('mock-fs');
var existsSync = require('exists-sync');
var EOL = require('os').EOL;
var fs = require('fs');
var fsPromise = require('../../addon/ng2/utilities/fs-promise');

var Blueprint = require('ember-cli/lib/models/blueprint');

describe('Change', () => {
  var sourcePath;

  describe('Invalid Path', () => {

    beforeEach(() => {
      var mockDrive = {
        'src/app/my-component': {
          'component-file.txt': 'hello',
        },
        
      };
      mockFs(mockDrive);

      sourcePath = path.join('src/app/my-component');

    });

    afterEach(() => {
      mockFs.restore();
    });

    it('the file/directory should not exist', () => {
      var sourceFile = path.join(sourcePath, '/some_path/component-file.txt');
      expect(existsSync(sourceFile)).to.equal(false);
    })

  });
  
  // Test on InsertChange
  describe('InsertChange with valid path and valid string(s)/position to add', () => {

    beforeEach(() => {
      var mockDrive = {
        'src/app/my-component': {
          'component-file.txt': 'hello',
        },
        
      };
      mockFs(mockDrive);

      sourcePath = path.join('src/app/my-component');

    });

    afterEach(() => {
      mockFs.restore();
    });

    it('should add text to the source code and remove text from it', () => {
      var sourceFile = path.join(sourcePath, 'component-file.txt');
      expect(existsSync(sourceFile)).to.equal(true);
      var changeInstance = new change.InsertChange(sourceFile, 6, ' world!');
      return changeInstance
        .apply()
        .then(() => {
          return fsPromise.readWithPromise(sourceFile);
        }).then(contents => {
          var expectedContents = 'hello world!';
          expect(contents).to.equal(expectedContents);
        }).then(()=> {
          var anotherChangeInstance = new change.RemoveChange(sourceFile, 6, 'world!');
          return anotherChangeInstance
          .apply()
          .then(() => {
            return fsPromise.readWithPromise(sourceFile);
          }).then(contents => {
            var anotherExpectedContents = 'hello ';
            expect(contents).to.equal(anotherExpectedContents);
          })
        })
    })

  });

  describe('InsertChange with incorrect position', () => {

    beforeEach(() => {
      var mockDrive = {
        'src/app/my-component': {
          'component-file.txt': 'hello',
        },
        
      };
      mockFs(mockDrive);

      sourcePath = path.join('src/app/my-component');

    });

    afterEach(() => {
      mockFs.restore();
    });

    it('should add text to the source code but unexpected output', () => {
      var sourceFile = path.join(sourcePath, 'component-file.txt');
      expect(existsSync(sourceFile)).to.equal(true);
      var changeInstance = new change.InsertChange(sourceFile, -6, ' world!');
      return changeInstance
        .apply()
        .then(() => {
          return fsPromise.readWithPromise(sourceFile);
        }).then(contents => {
          var expectedContents = 'hello world!';
          expect(contents).to.not.equal(expectedContents);
        });
    })

  });

  describe('InsertChange with empty string to add', () => {

    beforeEach(() => {
      var mockDrive = {
        'src/app/my-component': {
          'component-file.txt': 'hello',
        },
        
      };
      mockFs(mockDrive);

      sourcePath = path.join('src/app/my-component');

    });

    afterEach(() => {
      mockFs.restore();
    });

    it('should not have any changes to the source code', () => {
      var sourceFile = path.join(sourcePath, 'component-file.txt');
      expect(existsSync(sourceFile)).to.equal(true);
      var changeInstance = new change.InsertChange(sourceFile, 6, '');
      return changeInstance
        .apply()
        .then(() => {
          return fsPromise.readWithPromise(sourceFile);
        }).then(contents => {
          var expectedContents = 'hello';
          expect(contents).to.equal(expectedContents);
        });
    })

  });
  
  
  
  // Tests on RemoveChange

  describe('RemoveChange with valid path and valid string(s)/position to remove', () => {


    beforeEach(() => {
      var mockDrive = {
        'src/app/my-component': {
          'component-file.txt': 'import * as foo from "./bar"',
        },
        
      };
      mockFs(mockDrive);
      sourcePath = path.join('src/app/my-component');
    });

    afterEach(() => {
      mockFs.restore();
    });

    it('should remove text from the source code', () => {
      var sourceFile = path.join(sourcePath, 'component-file.txt');
      expect(existsSync(sourceFile)).to.equal(true);
      var changeInstance = new change.RemoveChange(sourceFile, 9, 'as foo');
      return changeInstance
        .apply()
        .then(() => {
          return fsPromise.readWithPromise(sourceFile);
        }).then(contents => {
          var expectedContents = 'import *  from "./bar"';
          expect(contents).to.equal(expectedContents);
        });
    });
  });

  describe('RemoveChange with empty string to remove', () => {


    beforeEach(() => { 
      var mockDrive = {
        'src/app/my-component': {
          'component-file.txt': 'import * as foo from "./bar"',
        },
        
      };
      mockFs(mockDrive);
      sourcePath = path.join('src/app/my-component');
    });

    afterEach(() => {
      mockFs.restore();
    });

    it('should remove text from the source code', () => {
      var sourceFile = path.join(sourcePath, 'component-file.txt');
      expect(existsSync(sourceFile)).to.equal(true);
      var changeInstance = new change.RemoveChange(sourceFile, 9, '');
      return changeInstance
        .apply()
        .then(() => {
          return fsPromise.readWithPromise(sourceFile);
        }).then(contents => {
          var expectedContents = 'import * as foo from "./bar"';
          expect(contents).to.equal(expectedContents);
        });
    });
  });

  describe('ReplaceChange with valid path and valid string(s)/position to replace', () => {

    beforeEach(() => {
      var mockDrive = {
        'src/app/my-component': {
          'component-file.txt': 'import * as foo from "./bar"',
        },
        
      };
      mockFs(mockDrive);
      sourcePath = path.join('src/app/my-component');
    });

    afterEach(() => {
      mockFs.restore();
    });

    it('should replace text in the source code', () => {
      var sourceFile = path.join(sourcePath, 'component-file.txt');
      expect(existsSync(sourceFile)).to.equal(true);
      var changeInstance = new change.ReplaceChange(sourceFile, 7, '* as foo', '{ fooComponent }');
      return changeInstance
        .apply()
        .then(() => {
          return fsPromise.readWithPromise(sourceFile);
        }).then(contents => {
          var expectedContents = 'import { fooComponent } from "./bar"';
          expect(contents).to.equal(expectedContents);
        });
    });
  });

  describe('ReplaceChange with empty oldText and non-empty newText', () => {

    beforeEach(() => {
      var mockDrive = {
        'src/app/my-component': {
          'component-file.txt': 'import * as foo from "./bar"',
        },
        
      };
      mockFs(mockDrive);
      sourcePath = path.join('src/app/my-component');
    });

    afterEach(() => {
      mockFs.restore();
    });

    it('should replace text in the source code', () => {
      var sourceFile = path.join(sourcePath, 'component-file.txt');
      expect(existsSync(sourceFile)).to.equal(true);
      var changeInstance = new change.ReplaceChange(sourceFile, 7, '', '{ fooComponent }');
      return changeInstance
        .apply()
        .then(() => {
          return fsPromise.readWithPromise(sourceFile);
        }).then(contents => {
          var expectedContents = 'import { fooComponent }* as foo from "./bar"';
          expect(contents).to.equal(expectedContents);
        });
    });
  });

  describe('ReplaceChange with non-empty oldText and empty newText', () => {

    beforeEach(() => {
      var mockDrive = {
        'src/app/my-component': {
          'component-file.txt': 'import * as foo from "./bar"',
        },
        
      };
      mockFs(mockDrive);
      sourcePath = path.join('src/app/my-component');
    });

    afterEach(() => {
      mockFs.restore();
    });

    it('should replace text in the source code', () => {
      var sourceFile = path.join(sourcePath, 'component-file.txt');
      expect(existsSync(sourceFile)).to.equal(true);
      var changeInstance = new change.ReplaceChange(sourceFile, 7, '* as foo', '');
      return changeInstance
        .apply()
        .then(() => {
          return fsPromise.readWithPromise(sourceFile);
        }).then(contents => {
          var expectedContents = 'import  from "./bar"';
          expect(contents).to.equal(expectedContents);
        });
    });
  });
});
