'use strict';

var expect = require('chai').expect;
var path = require('path');
var change = require('../../addon/ng2/utilities/change');
var mockFs = require('mock-fs');
var existsSync = require('exists-sync');
var EOL = require('os').EOL;

var Blueprint = require('ember-cli/lib/models/blueprint');

describe('change', () => {
  var blueprint;
  var installationDirectory;
  var sourcePath;

  beforeEach(() => {
    blueprint = new Blueprint('/');
    blueprint.project = {
      root: '/'
    }
  });

  describe('Change', () => {


    beforeEach(() => {
      var mockDrive = {
        '/src/app/my-component': {
          'component-file.txt': 'hello',
        },
        
      };
      mockFs(mockDrive);

      sourcePath = path.join('src', 'app', 'my-component', 'component-file.txt');
      console.log(process.cwd());
    });

    afterEach(() => {
      mockFs.restore();
    });

    it('should add text to the source code', () => {
      console.log(change);
      var changeInstance = new change.InsertChange(sourcePath, 7, 'world!');
      return changeInstance.apply().then(() => {
        var fs = require('fs');
        var contents = fs.readFileSync(sourcePath, 'utf8');
        var expectedContents = 'hello world!';
        expect(existsSync(content)).to.equal(expectedContents);
      });
    });
  });

  describe('no pre-existing barrel', () => {

    beforeEach(() => {
      var mockDrive = {
        '/src/app/shared/my-component': {}
      };
      mockFs(mockDrive);

      installationDirectory = path.join('/src/app/shared/my-component');
    });

    afterEach(() => {
      mockFs.restore();
    });

    it('create barrel from installation dir', () => {
      return addBarrelRegistration(blueprint, installationDirectory).then(() => {
        var fs = require('fs');
        var barrelPath = path.join(installationDirectory, '..', 'index.ts');
        expect(existsSync(barrelPath)).to.equal(true);
        var contents = fs.readFileSync(barrelPath, 'utf8');
        var expectedContents = `export * from './my-component';${EOL}`;
        expect(contents).to.equal(expectedContents);
      });
    });

    it('create barrel from installation dir with file name', () => {
      return addBarrelRegistration(blueprint, installationDirectory, 'my-smaller-component').then(() => {
        var fs = require('fs');
        var barrelPath = path.join(installationDirectory, '..', 'index.ts');
        expect(existsSync(barrelPath)).to.equal(true);
        var contents = fs.readFileSync(barrelPath, 'utf8');
        var expectedContents = `export * from './my-component/my-smaller-component';${EOL}`;
        expect(contents).to.equal(expectedContents);
      });
    });

  });

  describe('pre-existing barrel', () => {

    beforeEach(() => {
      var mockDrive = {
        '/src/app/shared': {
          'my-component': {},
          'index.ts': `export * from './another-component${EOL}export * from './other-component${EOL}`
        }
      };
      mockFs(mockDrive);

      installationDirectory = path.join('/src/app/shared/my-component');
    });

    afterEach(() => {
      mockFs.restore();
    });

    it('update barrel from installation dir', () => {
      return addBarrelRegistration(blueprint, installationDirectory).then(() => {
        var fs = require('fs');
        var barrelPath = path.join(installationDirectory, '..', 'index.ts');
        expect(existsSync(barrelPath)).to.equal(true);
        var contents = fs.readFileSync(barrelPath, 'utf8');
        var expectedContents = `export * from './another-component${EOL}export * from './my-component';${EOL}export * from './other-component${EOL}`;
        expect(contents).to.equal(expectedContents);
      });
    });

    it('updateA barrel from installation dir with file name', () => {
      return addBarrelRegistration(blueprint, installationDirectory, 'my-smaller-component').then(() => {
        var fs = require('fs');
        var barrelPath = path.join(installationDirectory, '..', 'index.ts');
        expect(existsSync(barrelPath)).to.equal(true);
        var contents = fs.readFileSync(barrelPath, 'utf8');
        var expectedContents = `export * from './another-component${EOL}export * from './my-component/my-smaller-component';${EOL}export * from './other-component${EOL}`;
        expect(contents).to.equal(expectedContents);
      });
    });

  });

  describe('pre-existing barrel with export already defined', () => {

    beforeEach(() => {
      var mockDrive = {
        '/src/app/shared': {
          'my-component': {},
          'index.ts': `export * from './other-component${EOL}export * from './my-component';${EOL}export * from './another-component${EOL}export * from './my-component/my-smaller-component';${EOL}`
        }
      };
      mockFs(mockDrive);

      installationDirectory = path.join('/src/app/shared/my-component');
    });

    afterEach(() => {
      mockFs.restore();
    });

    it('update barrel from installation dir should add nothing', () => {
      return addBarrelRegistration(blueprint, installationDirectory).then(() => {
        var fs = require('fs');
        var barrelPath = path.join(installationDirectory, '..', 'index.ts');
        expect(existsSync(barrelPath)).to.equal(true);
        var contents = fs.readFileSync(barrelPath, 'utf8');
        var expectedContents = `export * from './another-component${EOL}export * from './my-component';${EOL}export * from './my-component/my-smaller-component';${EOL}export * from './other-component${EOL}`;
        expect(contents).to.equal(expectedContents);
      });
    });

    it('update barrel from installation dir with file name should add nothing', () => {
      return addBarrelRegistration(blueprint, installationDirectory, 'my-smaller-component').then(() => {
        var fs = require('fs');
        var barrelPath = path.join(installationDirectory, '..', 'index.ts');
        expect(existsSync(barrelPath)).to.equal(true);
        var contents = fs.readFileSync(barrelPath, 'utf8');
        var expectedContents = `export * from './another-component${EOL}export * from './my-component';${EOL}export * from './my-component/my-smaller-component';${EOL}export * from './other-component${EOL}`;
        expect(contents).to.equal(expectedContents);
      });
    });

  });
});
