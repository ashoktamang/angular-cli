'use strict';

import * as ts from 'typescript';
import * as fs from 'fs';
import { readWithPromise, writeWithPromise } from './fs-promise';

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


/**
 * Will add text to the source code.
 */
export class InsertChange implements Change {
  
  const order: number; //don't know what this does yet
  const description: string =  "";
  // content: string;
  
  constructor(public path: string, private pos: number, private toAdd: string){ }

  /**
   * This method does not insert spaces if there is none in the original string. 
   * @param file (path to file)
   * @param pos
   * @param toAdd (text to add)
   * @return Promise with a description on success or reject on error
   */
  apply(): Promise<any>{
    return readWithPromise(this.path).then(content => {
      content = content.substring(0, this.pos) + this.toAdd + content.substring(this.pos);
      return writeWithPromise(this.path, content);
    });
  }
}

/**
 * Will remove text from the source code.
 */ 
export class RemoveChange implements Change {
    const order: number;
    const description: string = "";

  constructor(public path: string, private pos: number, private toRemove: string){ }
  
  apply(): Promise<any>{

    return readWithPromise(this.path).then(content => {
      content = content.substring(0, this.pos) + content.substring(this.pos + this.toRemove.length);
      
      return writeWithPromise(this.path, content);
    });
  }
}

/**
 * Will replace text from the source code.
 */
export class ReplaceChange implements Change {

  const description: string = "";
  
  
  constructor(public path: string, private pos: number, private oldText: string, private newText: string){ }
  
  apply(): Promise<any>{
    return readWithPromise(this.path).then(content => {
       content = content.substring(0, this.pos) + this.newText + content.substring(this.pos + this.oldText.length);
       writeWithPromise(this.path, content);
       this.description = "Replaced '" + this.oldText + "' with '" + this.newText + "' in file";
    });
  }
}

/**
 * Will output a message for the user to fulfill.
 */
export class MessageChange implements Change {
  constructor(text: string){
      
  }

  apply(): Promise<void> {return new Promise();}
}