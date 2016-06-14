'use strict';

import * as fs from 'fs';

/**
 * Read a file and return a promise
 * @param path (path to file)
 * @return Promise with file content
 */
export function readWithPromise(path: string): Promise<any> {
    var content: string;
    return new Promise<any>((resolve, reject) => {
      fs.readFile(path, (err, data) => {
        if(err) reject(err);
        content = data.toString();
        resolve(content);
      });
    })
  }

/**
 * Write to file and return a promise
 * @param path (path to file)
 * @return an empty Promise
 */
  export function writeWithPromise(path: string, content: string): Promise<any> {
      return new Promise<any>((resolve, reject) => {
        fs.writeFile(path, content, (err: any) => {
          if (err) reject(err);
          resolve();
        });
      })
      
  }