import { readFileSync } from 'fs';
import * as ts from 'typescript';
import * as Command from 'ember-cli/lib/models/command';
import * as path from 'path';
import * as child_process from 'child_process';
import * as fs from 'fs';
var chalk = require('chalk');
import * as addBarrelREgistration from '../utilites/barrel-management';


const PromoteCommand = Command.extend({
  name: 'promote',
  description: 'Updates component promotion if it is safe',
  // aliases: ['v', '--version', '-v'],
  works: 'everywhere',

  // availableOptions: [{
  //   name: 'verbose',
  //   type: Boolean, 'default': false
  // }],
  
  beforeRun: function(rawArgs: string) {
    // Checks empty arguments
    if (rawArgs.length < 2) {
      console.log('error');
      // return;
    };
    
    
    
    // Checks if arguments are path or specific file.
    // Error for specific files (for now!)
    rawArgs.forEach(argument => {
      console.log(path.extname(argument));
      if (!path.extname(argument) == '') {
        console.log('error');
        // return;
      };
    })
  },
  
  run: function (options, rawArgs) {
    
    console.log(options);
    console.log(rawArgs);
    
    //sourcePath and destinationPath
    let sourcePath = rawArgs[0];
    let destinationPath = rawArgs[1];
    
    // Case 0: Check whether destinationPath exists; if not, make one:
    // fs.open(destinationPath, 'a+', (err, d) => {
    //   if (err) fs.mkdir(destinationPath, (created) => {
    //     this.ui.writeLine(chalk.green(destinationPath + 'is created' + created))
    //   })
    // })
    
    // Case 1: If sourcePath and destinationPath has same parent directory.
    // [Todo: Update references in files]
    if (path.dirname(sourcePath) === path.dirname(destinationPath)) {
      let oldComponentName = path.basename(sourcePath);
      let newComponentName = path.basename(destinationPath);
      let relativePath: string = process.cwd();
      
      fs.rename(sourcePath, destinationPath);
      
      let files: string[] = fs.readdirSync(sourcePath);
      console.log(files);
      files.forEach(file => {
        console.log(file.indexOf(oldComponentName) > -1);
        if (file.indexOf(oldComponentName) > -1) {
          console.log(file);
          let newFileName = file.replace(oldComponentName, newComponentName);
          console.log(newFileName);
          fs.rename(path.join(relativePath, destinationPath, file), path.join(relativePath, destinationPath, newFileName));
          console.log(path.join(relativePath, destinationPath, file));
          console.log(path.join(relativePath, destinationPath, newFileName));
        }
      })
    }
    
    
    
    console.log('process', process.cwd());
    // console.log('project', this.project);
    
    
    // Returns the name of SyntaxKind from the enum
    function syntaxKindToName(kind: ts.SyntaxKind) {
        return (<any>ts).SyntaxKind[kind];
    }
    
    // Recursive magic¿
    function printAllChildren(node: ts.Node, depth = 0) {
        console.log(new Array(depth+1).join('----'), syntaxKindToName(node.kind), node.pos, node.end);
        depth++;
        node.getChildren().forEach(c=> printAllChildren(c, depth));
    } 
        
    // wrapper function that recursively traverses through nodes and calls visitNode for each Node
    function visit(node: ts.Node, depth = 0) {
      depth++;
      node.getChildren().forEach(nodeObj =>{
        visitNode(nodeObj);
        visit(nodeObj, depth);
      })
    }
    
    // [to:do] optimize the function
    function importDeclaration(node: ts.Node, depth = 0) {
      depth++;
      node.getChildren().forEach(nodeObj => {
        if (nodeObj.kind === ts.SyntaxKind.ImportDeclaration) {
          console.log('it goes here');
          console.log('nodeobj', nodeObj);
          // return nodeObj;
        };
        importDeclaration(nodeObj, depth);
      })
    }
    
    
    // assesses a node's kind and {{ logic }}
    function visitNode(node: ts.Node): boolean {
      // console.log(node.kind);
      switch (node.kind) {
        case ts.SyntaxKind.ImportSpecifier:
          console.log("ImportSpecifier");
          console.log(node.name.text);
          node.name.text = "ashok";
          console.log('changed', node.name.text);
          break;
        // case ts.SyntaxKind.ImportDeclaration:
        //   console.log('ImportDeclaration');
        //   console.log(node);
        //   break;
        // case ts.SyntaxKind.ImportKeyword:
        //   console.log('ImportKeyword');
        //   console.log(node.name);
        //   break;
        case ts.SyntaxKind.ImportClause:
          console.log('ImportClause');
          console.log(node.parent.moduleSpecifier.text);
          break;
        // case ts.SyntaxKind.StringLiteral:
        //   console.log('StringLiteral for Imports');
        //   console.log(node);
        //   break;
        default:

          return false;
      }
      return true;
    }
    
    const fileNames = process.argv.slice(3);
    console.log(fileNames);
  //   fileNames.forEach(fileName => {
  //     let sourceFile = ts.createSourceFile(fileName, readFileSync(fileName).toString(), ts.ScriptTarget.ES6, true);
  //     // console.log(sourceFile);
      
  //     // console.log(importDeclaration(sourceFile));
      
      
  //     // visit(sourceFile);
  //     // printAllChildren(sourceFile);
  //   });
    
  //   // console.log(ts.sys.getCurrentDirectory());
  // },

  
});


module.exports = PromoteCommand;
module.exports.overrideCore = true;
