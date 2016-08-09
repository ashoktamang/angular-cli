Component Promotion
===================

Abstract
-----------
One of the main features of the Angular CLI is to create a nested structure of components for the organization of an Angular application. Occasionally, components in one particular level of the application structure tree can be useful in other parts of the application, and hence components tend to be moved (by Developers) along the structure tree. Currently, when such cases arise, the developers have to manually look for the component’s relative imports and other component units’ dependencies on that moved component, and resolve those imports to reflect the change in the location.  

Why is it important to Angular?
----------------------------------------------
The goal of Angular CLI is to help facilitate the Angular developers to organize and develop Angular projects efficiently. The processes such as creating nested structure of components, services, pipes and routes are all automated via Angular CLI. With the implementation of ‘promote’ command in the CLI, the workflow will be more automated as the command will further aid the CLI to reduce the errors caused by typos generated from manual fixes of relative imports to reflect the promotion process of a given component unit. 


Promote Process (Detailed Design)
----------------------------------------------
The project constituents a new ‘ng’ command system. The command will look as follows:
* ng promote `oldPath` `newPath`
* The command only takes two arguments:
  * oldPath: the path to the file being promoted.
  * newPath: the path to the directory where the file is being promoted.
* The command has no other options available besides `--help`.
* The command should only execute inside an Angular project created by angular-cli.

Validation
---------------

Validation is required for the two arguments in the promote command. It is an important part of the process.
* Validation executes in three parts which are done in order:

  1. The two arguments of the command (`oldPath` and `newPath`) should always be passed.
  2. `oldPath`
      * The file should exist inside the project.
      * The file should be a TypeScript file.
      * The owner should have read/write permission of the file.
  3. `newPath`
      * The argument should be a directory.
      * The directory must exist. (the command doesn’t create a new directory)
      * The directory must not contain file with same name as <oldPath>
      * The owner should have read/write/execute permission of the directory.
* Validation is done in the `BeforeRun:` if any of the validation throws an error, whole promote process is stopped.

Process
------------
The command will execute following tasks in order.

1. Parse the provided arguments to get the absolute path.
2. Create a new instance of class ModuleResolver
	
               ModuleResolver Class

    ```	
    Class ModuleResolver {
      
    constructor(public oldFilePath: string, public newFilePath: string, public rootPath: string) {}
    
    /**
      * Changes are applied from the bottom of a file to the top.
      * An array of Change instances are sorted based upon the order, 
      * then apply() method is called sequentially.
      * 
      * @param changes {Change []} 
      * @return Promise after all apply() method of Change class is called 
      *         to all Change instances sequentially.
      */
      applySortedChangePromise(changes: Change[]): Promise<void> {}

      /** 
      * Assesses the import specifier and determines if it is a relative import.
      * 
      * @return {boolean} boolean value if the import specifier is a relative import.
      */
      isRelativeImport(importClause: dependentFilesUtils.ModuleImport): boolean {}
      
      /** 
      * Rewrites the import specifiers of all the dependent files (cases for no index file).
      * 
      * @todo Implement the logic for rewriting imports of the dependent files when the file
      *       being moved has index file in its old path and/or in its new path.
      * 
      * @return {Promise<Change[]>} 
      */
      resolveDependentFiles(): Promise<Change[]> {}

      /**
      * Rewrites the file's own relative imports after it has been moved to new path.
      * 
      * @return {Promise<Change[]>}
      */
      resolveOwnImports(): Promise<Change[]> {}
    }
    ```

3. Store all the changes for rewriting the imports of all dependent files in memory.
4. Store all the changes for rewriting the imports of the moved file itself in memory.
5. Apply all the changes.
6. Move the file and its associated files to new path.

