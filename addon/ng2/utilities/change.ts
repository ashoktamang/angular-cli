'use strict';

import * as ts from 'typescript';
import * as fs from 'fs';

interface Change {
/**
 *  True on success, false otherwise.
 */  
 apply(): boolean;

  // The file this change should be applied to. Some changes might not apply to
  // a file (maybe the config).
  readonly path: string | null;

  // The order this change should be applied. Normally the position inside the file.
  // Changes are applied from the bottom of a file to the top.
  readonly order: number | null;

  // The description of this change. This will be outputted in a dry or verbose run.
  readonly description: string;
}




// Will add text to the source code.
class InsertChange implements Change {
  
  const path: string;
  contentString: string;
  const order: number; //don't know what this does yet
  const toAdd: string;
  const description: string =  "";
  const pos: number;
  
  /**
   * @param file (path to file)
   * @param pos
   * @param toAdd (text to add)
   */
  constructor(file: string, pos: number, toAdd: string){
      this.path = file;
      this.contentString = fs.readFileSync(this.path).toString();
      this.toAdd = toAdd;
      this.pos = pos;
  }
  
  apply(): boolean{
      this.contentString = this.contentString.substring(0, this.pos)
                           + this.toAdd + this.contentString.substring(this.pos);
      fs.writeFileSync(this.path, this.contentString, (err: any) => {
          if (err) return false;
          this.description = "Inserted '" + this.toAdd + "' to file";
      });
      return true;
  }
  
}
// Will remove text from the source code.
class RemoveChange implements Change {
    const path: string;
    const pos: number;
    const toRemove: string;
    const order: number;
    contentString: string;
    const description: string = "";

    
  constructor(file: string, pos: number, toRemove: string){
      this.path = file;
      this.pos = pos;
      this.toRemove = toRemove;
      this.contentString = fs.readFileSync(this.path).toString();
  }
  
  apply(): boolean{
      this.contentString = this.contentString.substring(0, this.pos)
                           + this.contentString.substring(this.pos + this.toRemove.length);
      fs.writeFileSync(this.path, this.contentString, (err: any) => {
          if (err) return false;
          this.description = "Removed '" + this.toRemove + "' from file";
      });
      return true;
  }
}
// Will replace text from the source code.
class ReplaceChange implements Change {
  const path: string;
  contentString: string;
  const pos: number;
  const oldText: string;
  const newText: string;
  const description: string = "";
  
  
  constructor(file: string, pos: number, oldText: string, newText: string){
      this.path = file;
      this.pos = pos;
      this.oldText = oldText;
      this.newText = newText;
      this.contentString = fs.readFileSync(this.path).toString();
  }
  
  apply(): boolean{
      this.contentString = this.contentString.substring(0, this.pos) + this.newText
                           + this.contentString.substring(this.pos + this.oldText.length);
      fs.writeFileSync(this.path, this.contentString, (err: any) => {
          if (err) return false;
          this.description = "Replaced '" + this.oldText + "' with '" + this.newText + "' in file";
      });
      return true;
  }
}
// Will output a message for the user to fulfill.
class MessageChange implements Change {
  constructor(text: string){
      
  }
  apply(): Promise{}
}