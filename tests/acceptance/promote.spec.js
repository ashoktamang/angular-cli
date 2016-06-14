/*eslint-disable no-console */
'use strict';

var fs = require('fs-extra');
var ng = require('../helpers/ng');
var existsSync = require('exists-sync');
var expect = require('chai').expect;
var path = require('path');
var tmp = require('../helpers/tmp');
var root = process.cwd();
var conf = require('ember-cli/tests/helpers/conf');
var Promise = require('ember-cli/lib/ext/promise');
var SilentError = require('silent-error');

describe('Acceptance: ng promote', function () {
  before(conf.setup);

  after(conf.restore);

  beforeEach(function () {
    return tmp.setup('./tmp').then(function () {
      process.chdir('./tmp');
    }).then(function () {
      return ng(['new', 'foo', '--skip-npm', '--skip-bower']);
    });
  });

  afterEach(function () {
    this.timeout(10000);

    return tmp.teardown('./tmp');
  });

  it('ng promote component my-comp', function () {
    return ng(['promote', 'component', 'my-comp']).then(() => {
      var testPath = path.join(root, 'tmp', 'foo', 'src', 'app', 'my-comp', 'my-comp.component.ts');
      expect(existsSync(testPath)).to.equal(true);
    });
  });

  it('ng promote component test' + path.sep + 'my-comp', function () {
    fs.mkdirsSync(path.join(root, 'tmp', 'foo', 'src', 'app', 'test'));
    return ng(['promote', 'component', 'test' + path.sep + 'my-comp']).then(() => {
      var testPath = path.join(root, 'tmp', 'foo', 'src', 'app', 'test', 'my-comp', 'my-comp.component.ts');
      expect(existsSync(testPath)).to.equal(true);
    });
  });

  it('ng promote component test' + path.sep + '..' + path.sep + 'my-comp', function () {
    return ng(['promote', 'component', 'test' + path.sep + '..' + path.sep + 'my-comp'])
      .then(() => {
        var testPath = path.join(root, 'tmp', 'foo', 'src', 'app', 'my-comp', 'my-comp.component.ts');
        expect(existsSync(testPath)).to.equal(true);
      });
  });

  it('ng promote component my-comp from a child dir', () => {
    fs.mkdirsSync(path.join(root, 'tmp', 'foo', 'src', 'app', '1'));
    return new Promise(function (resolve) {
      process.chdir('./src');
      resolve();
    })
      .then(() => process.chdir('./app'))
      .then(() => process.chdir('./1'))
      .then(() => {
        return ng(['promote', 'component', 'my-comp'])
      })
      .then(() => {
        var testPath = path.join(root, 'tmp', 'foo', 'src', 'app', '1', 'my-comp', 'my-comp.component.ts');
        expect(existsSync(testPath)).to.equal(true);
      }, err => console.log('ERR: ', err));
  });

  it('ng promote component child-dir' + path.sep + 'my-comp from a child dir', () => {
    fs.mkdirsSync(path.join(root, 'tmp', 'foo', 'src', 'app', '1', 'child-dir'));
    return new Promise(function (resolve) {
      process.chdir('./src');
      resolve();
    })
      .then(() => process.chdir('./app'))
      .then(() => process.chdir('./1'))
      .then(() => {
        return ng(['promote', 'component', 'child-dir' + path.sep + 'my-comp'])
      })
      .then(() => {
        var testPath = path.join(
          root, 'tmp', 'foo', 'src', 'app', '1', 'child-dir', 'my-comp', 'my-comp.component.ts');
        expect(existsSync(testPath)).to.equal(true);
      }, err => console.log('ERR: ', err));
  });

  it('ng promote component child-dir' + path.sep + '..' + path.sep + 'my-comp from a child dir',
    () => {
      fs.mkdirsSync(path.join(root, 'tmp', 'foo', 'src', 'app', '1'));
      return new Promise(function (resolve) {
        process.chdir('./src');
        resolve();
      })
        .then(() => process.chdir('./app'))
        .then(() => process.chdir('./1'))
        .then(() => {
          return ng([
            'promote', 'component', 'child-dir' + path.sep + '..' + path.sep + 'my-comp'
          ])
        })
        .then(() => {
          var testPath =
            path.join(root, 'tmp', 'foo', 'src', 'app', '1', 'my-comp', 'my-comp.component.ts');
          expect(existsSync(testPath)).to.equal(true);
        }, err => console.log('ERR: ', err));
    });

  it('ng promote component ' + path.sep + 'my-comp from a child dir, gens under ' +
    path.join('src', 'app'),
    () => {
      fs.mkdirsSync(path.join(root, 'tmp', 'foo', 'src', 'app', '1'));
      return new Promise(function (resolve) {
        process.chdir('./src');
        resolve();
      })
        .then(() => process.chdir('./app'))
        .then(() => process.chdir('./1'))
        .then(() => {
          return ng(['promote', 'component', path.sep + 'my-comp'])
        })
        .then(() => {
          var testPath = path.join(root, 'tmp', 'foo', 'src', 'app', 'my-comp', 'my-comp.component.ts');
          expect(existsSync(testPath)).to.equal(true);
        }, err => console.log('ERR: ', err));
    });

  it('ng promote component ..' + path.sep + 'my-comp from root dir will fail', () => {
    return ng(['promote', 'component', '..' + path.sep + 'my-comp']).then(() => {
      throw new SilentError(`ng promote component ..${path.sep}my-comp from root dir should fail.`);
    }, (err) => {
      expect(err).to.equal(`Invalid path: "..${path.sep}my-comp" cannot be above the "src${path.sep}app" directory`);
    });
  });

  it('ng promote component mycomp will prefix selector', () => {
    return ng(['promote', 'component', 'mycomp'])
      .then(() => {
        var testPath = path.join(root, 'tmp', 'foo', 'src', 'app', 'mycomp', 'mycomp.component.ts');
        expect(existsSync(testPath)).to.equal(true);
        var contents = fs.readFileSync(testPath, 'utf8');
        expect(contents.indexOf('selector: \'app-mycomp\'') === -1).to.equal(false);
      });
  });

  it('ng promote component mycomp --no-prefix will not prefix selector', () => {
    return ng(['promote', 'component', 'mycomp', '--no-prefix'])
      .then(() => {
        var testPath = path.join(root, 'tmp', 'foo', 'src', 'app', 'mycomp', 'mycomp.component.ts');
        expect(existsSync(testPath)).to.equal(true);
        var contents = fs.readFileSync(testPath, 'utf8');
        expect(contents.indexOf('selector: \'mycomp\'') === -1).to.equal(false);
      });
  });

  it('ng promote component myComp will succeed', () => {
    return ng(['promote', 'component', 'myComp'])
      .then(() => {
        var testPath = path.join(root, 'tmp', 'foo', 'src', 'app', 'my-comp', 'my-comp.component.ts');
        expect(existsSync(testPath)).to.equal(true);
      });
  });

  it('ng promote component my-comp --inline-template', function () {
    return ng(['promote', 'component', 'my-comp', '--inline-template']).then(() => {
      var testPath = path.join(root, 'tmp', 'foo', 'src', 'app', 'my-comp', 'my-comp.component.html');
      expect(existsSync(testPath)).to.equal(false);
    });
  });

  it('ng promote component my-comp --inline-style', function () {
    return ng(['promote', 'component', 'my-comp', '--inline-style']).then(() => {
      var testPath = path.join(root, 'tmp', 'foo', 'src', 'app', 'my-comp', 'my-comp.component.css');
      expect(existsSync(testPath)).to.equal(false);
    });
  });

  it('ng promote component my-comp --dry-run does not register a barrel in system-config.ts', () => {
    var configPath = path.join(root, 'tmp', 'foo', 'src', 'system-config.ts');
    var unmodifiedFile = fs.readFileSync(configPath, 'utf8');

    return ng(['promote', 'component', 'my-comp', '--dry-run']).then(() => {
      var afterpromoteFile = fs.readFileSync(configPath, 'utf8');

      expect(afterpromoteFile).to.equal(unmodifiedFile);
    });
  });
});
