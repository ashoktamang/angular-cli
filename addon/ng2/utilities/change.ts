'use strict';

import * as ts from 'typescript';
import * as fs from 'fs';

export interface Change {
/**
 *  True on success, false otherwise.
 */  
 apply(): Promise<void>;

  // The file this change should be applied to. Some changes might not apply to
  // a file (maybe the config).
  path: string | null;

  // The order this change should be applied. Normally the position inside the file.
  // Changes are applied from the bottom of a file to the top.
  order: number | null;

  // The description of this change. This will be outputted in a dry or verbose run.
  description: string;
}




// Will add text to the source code.
export class InsertChange implements Change {
  
  const order: number; //don't know what this does yet
  const description: string =  "";
  
  /**
   * @param file (path to file)
   * @param pos
   * @param toAdd (text to add)
   * @return Promise with a description on success or reject on error
   */
  constructor(public path: string, private pos: number, private toAdd: string){ }
  
  apply(): Promise<any>{
    return new Promise<any>((resolve, reject) => {
           var content: string;
           fs.readFile(this.path, (err, data) => {
                             if(err) reject(err);
                             content = data.toString();
           });
           content = content.substring(0, this.pos) + this.toAdd + content.substring(this.pos);
           
           fs.writeFile(this.path, content, (err: any) => {
              if (err) reject(err);
              this.description = "Inserted '" + this.toAdd + "' to file";
              resolve(this.description);
           });
      });
  }
}

// Will remove text from the source code.

class RemoveChange implements Change {
    const order: number;
    const description: string = "";

    
  constructor(public path: string, private pos: number, private toRemove: string){ }
  
  apply(): Promise<any>{
      return new Promise<any>((resolve, reject) => {
          var content: string;
          fs.readFile(this.path, (err, data) => {
                      if(err) reject(err);
                      content = data.toString();
          });
          content = content.substring(0, this.pos) + content.substring(this.pos + this.toRemove.length);

          fs.writeFile(this.path, content, (err: any) => {
          if (err) reject(err);
             this.description = "Removed '" + this.toRemove + "' from file";
             resolve(this.description);
          });
      });
  }
}

// Will replace text from the source code.

class ReplaceChange implements Change {

  const description: string = "";
  
  
  constructor(public path: string, private pos: number, private oldText: string, private newText: string){ }
  
  apply(): Promise<any>{

      return new Promise<any>((resolve, reject) => {
          var content: string;
          fs.readFile(this.path, (err, data) => {
                      if(err) reject(err);
                      content = data.toString();
          });
          content = content.substring(0, this.pos) + this.newText + content.substring(this.pos + this.oldText.length);

          fs.writeFile(this.path, content, (err: any) => {
          if (err) reject(err);
             this.description = "Replaced '" + this.oldText + "' with '" + this.newText + "' in file";
             resolve(this.description);
          });
      });
  }
}

// Will output a message for the user to fulfill.
export class MessageChange implements Change {
  constructor(text: string){
      
  }

  apply(): Promise<void> {return new Promise();}
}



//partitions
// file, pos, oldtext , new text;
// file: correct, incorrect path 
// pos: negative number, 0, intMax, 0<x<intMax 
// oldText: empty, non-empty
// newText: empty, non-empy
