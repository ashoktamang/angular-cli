import { readFileSync } from 'fs';
import * as ts from 'typescript';
import * as Command from 'ember-cli/lib/models/command';
import * as path from 'path';
import * as child_process from 'child_process';

const PromoteCommand = Command.extend({
  name: 'promote',
  description: 'outputs angular-cli version',
  // aliases: ['v', '--version', '-v'],
  works: 'everywhere',

  // availableOptions: [{
  //   name: 'verbose',
  //   type: Boolean, 'default': false
  // }],

  run: function (options) {
    
    
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
    fileNames.forEach(fileName => {
      let sourceFile = ts.createSourceFile(fileName, readFileSync(fileName).toString(), ts.ScriptTarget.ES6, true);
      console.log(sourceFile);
      sourceFile.SymbolWriter.writeKeyword('hello');
      
      // console.log(importDeclaration(sourceFile));
      
      
      // visit(sourceFile);
      // printAllChildren(sourceFile);
    });
    
    // console.log(ts.sys.getCurrentDirectory());
  },

  
});


module.exports = PromoteCommand;
module.exports.overrideCore = true;
