import * as Command from 'ember-cli/lib/models/command';
import * as fs from 'fs';
import * as path from 'path';
import * as glob from 'glob';
import * as chalk from 'chalk';
import * as SilentError from 'silent-error';
import * as denodeify from 'denodeify';
import { Promise } from 'es6-promise';
import { ModuleResolver } from '../utilities/module-resolver';
import * as dependentFilesUtils from '../utilities/get-dependent-files';

// denodeify asynchronous methods
// const stat = denodeify(fs.stat);
const move = denodeify(fs.rename);
// const access = denodeify(fs.access);
const globSearch = denodeify(glob);

const PromoteCommand = Command.extend({
  name: 'promote',
  description: 'rewrite imports and exports when the file is moved',
  aliases: ['p'],
  works: 'insideProject',
  anonymousOptions: ['<oldFilePath> <newDir>'],

  beforeRun: function(rawArgs: string[]) {
      // All operations should be sync in beforeRun.

      if (rawArgs.length === 0) {
        throw new SilentError(chalk.red('Please pass the arguments: ') +
                              chalk.cyan('ng promote <oldPath> <newPath>'));
      }
      // Current Directory in the project.
      const CWD = process.env.PWD;

      let filePaths: string[] = rawArgs
        .map((argument: string) => path.resolve(CWD, argument));

      // Validate first argument <oldPath>
      let oldPath = filePaths[0];

      const oldPathStats = fs.statSync(oldPath);
      // Check if it is a file.
      if (!oldPathStats.isFile()) {
        throw new SilentError(chalk.red('Give the full path of file.'));
      };
      // Throw error if a file is not a typescript file.
      if (path.extname(oldPath) !== '.ts') {
        throw new SilentError(`The file is not a typescript file: ${oldPath}`);
      };
      // Throw error if a file is an index file.
      if (path.basename(oldPath) === 'index.ts') {
        throw new SilentError(`Cannot promote index file: ${oldPath}`);
      };
      // Throw error if a file is a spec file.
      if (path.extname(path.basename(oldPath, '.ts')) === '.spec') {
        throw new SilentError(`Cannot promote a spec file: ${oldPath}`);
      };
      // Check the permission to read and/or write in the file.
      fs.accessSync(oldPath, fs.R_OK || fs.W_OK);

      // Validate second argument <newPath>
      const newPath = filePaths[1];
      const newPathStats = fs.statSync(newPath);

      // Check if it is a directory
      if (!newPathStats.isDirectory) {
        throw new SilentError(`newPath must be a directory: ${newPath}`);
      };
      // Check the permission to read/write/execute(move) in the directory.
      fs.accessSync(newPath, fs.R_OK || fs.X_OK || fs.W_OK);
      // Check for any files with the same name as oldPath.
      let sameNameFiles = glob.sync(path.join(newPath, '*.*.ts'), { nodir: true })
        .filter((file) => path.basename(file) === path.basename(oldPath));
      if (sameNameFiles.length > 0) {
        throw new SilentError(`newPath has a file with same name as oldPath: ${sameNameFiles}`);
      };


      // <Async>

      // Checking whether file exists
      // console.log(chalk.grey('Checking the existence of the file.........'));
      // fs.stat(oldPath, (err, stats) => {
      //   if (err) {
      //     throw new SilentError('No such file exists in the project. Try a valid file name');
      //   } else {
      //     console.log(chalk.green('Path exists!'));
      //     if (!stats.isFile()) {
      //       throw new SilentError(chalk.red('Give the full path of file.'));
      //     }
      //     console.log(chalk.grey('Checking the extension of the file: \'ts\'...........'));
      //     if (path.extname(oldPath) !== '.ts') {
      //       throw new SilentError('The file is not a typescript file');
      //     } else {
      //       console.log(chalk.green('Extension of the file is correct'));
      //       console.log(chalk.grey('Finally, checking the permission of the file'));
      //       fs.access(oldPath, fs.R_OK || fs.W_OK, (accessError) => {
      //         if (accessError) {
      //           console.log(accessError);
      //           throw new SilentError(chalk.red('No permission to read and/or write.'));
      //         } else {
      //           console.log(chalk.green('All permission to read and/or write.'));
      //         }
      //       });
      //     }
      //   }
      // });

      // Validating second argument <newPath>
      // let newPath = filePaths[1];
      // fs.stat(newPath, (err, stats) => {
      //   if (err) {
      //     throw new SilentError('newPath is an invalid path.');
      //   };
      //   if (!stats.isDirectory()) {
      //     throw new SilentError('newPath must be a directory.');
      //   };
      // });
      // fs.access(newPath, fs.R_OK || fs.X_OK || fs.W_OK, (err) => {
      //   if (err) {
      //     throw new SilentError(chalk.red('No permission'));
      //   };
      //   globSearch(path.join(newPath, '*.*.ts'), { nodir: true })
      //     .then((filesInPath: string[]) => {
      //       filesInPath.forEach(file => {
      //         if (path.basename(file) === path.basename(oldPath)) {
      //           throw new SilentError('newPath has a file with same name as oldPath');
      //         };
      //       });
      //     });
      // });
  },

  run: function (commandOptions, rawArgs: string[]) {

    console.log('running');
    // Get absolute paths of old path and new path
    let filePaths: string[] = rawArgs
      .map((argument: string) => path.resolve(process.env.PWD, argument));
    const oldPath = filePaths[0];
    const newPath = filePaths[1];
    const ROOT_PATH = path.resolve('src/app');

    /**
     * Function to get all the templates, stylesheets, and spec files of a given component unit
     * 
     * @param fileName 
     * 
     * @return absolute paths of '.html/.css/.sass/.spec.ts' associated with the given file.
     *
     */
    function getAllCorrespondingFiles(fileName: string): Promise<string[]> {
      // make a utility function in a different file?`
      let fileDirName = path.dirname(fileName);
      let componentName = path.basename(fileName).split('.')[0];

      return globSearch(path.join(fileDirName, `${componentName}.*`), { nodir: true })
        .then((files: string[]) => {
          return files.filter((file) => {
            return (path.basename(file) !== 'index.ts');
          });
        });
    }

    console.log(path.resolve('src/app'));
    // let resolver = new ModuleResolver(oldPath, newPath);
    // return resolver.resolveDependentFiles();
    // //   .then(() => console.log(chalk.green('Resolved the imports of Dependent Files')))
    //   .then(() => resolver.resolveOwnImports())
    // //   .then(() => console.log(chalk.green('Resolved own Imports')))
    //   .then(() => resolver.resolveExport())
    // //   .then(() => console.log(chalk.green('Resolved exports in index files')))
    //   // .then(() => resolver.mergeImports())
    //   .then(() => getAllCorrespondingFiles(oldPath))
    //   .then((files: string[]) => {
    //     files.forEach((file) => {
    //       move(file, path.join(newPath, path.basename(file)))
    //         .then(() => console.log(chalk.green(`${file} is moved to ${newPath}.`)));
    //     });
    //   });


    let resolver = new ModuleResolver(oldPath, newPath, ROOT_PATH);
    console.log('Promoting...');
    return Promise.all([
        resolver.resolveDependentFiles(),
        resolver.resolveOwnImports()
      ])
      // .then(([changesForDependentFiles, changesForOwnImports]) => {
      //   let allChanges = changesForDependentFiles.concat(changesForOwnImports);
      //   return resolver.applySortedChangePromise(allChanges);
      // })
      // Move the related files to new path.
      .then(() => getAllCorrespondingFiles(oldPath))
      .then((files: string[]) => {
        return files.map((file) => move(file, path.join(newPath, path.basename(file))));
      })
      .then(() => console.log(`${chalk.green(oldPath)} is promoted to ${chalk.green(newPath)}.`));

    // Experiment
    // let fileName = path.resolve(process.env.PWD, 'bar/bar.component.ts');
    // return resolver.getMergeableImports(fileName, '../multiple')
    //   .then((value) => console.log('bhalu', value));
  },
});

module.exports = PromoteCommand;
