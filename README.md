JSDoc3 Ant Task
=========

This is a simple wrapper around the JSDoc3 JavaScript documentation generation tool.
It allows users to use JSDoc3 in an ant build file.

Prerequisites
-------------

You should have JSDoc3 installed somewhere.  

https://github.com/jsdoc3/jsdoc

Installation
------------

Presumably, you've already got the code, but if not, go and get it:  
https://github.com/jannon/jsdoc3-ant-task

### Build ###

From the project directory just run ```ant dist```

That will build everything and in build/jar you will find a jsdoc3-ant-task-<version>.jar file.  That's the 
jar you'll use for the classpath in the taskdef in your ant build file (see below)

Usage
----- 

Assuming you have the following properties defined:

    jsdoc.home - the location of your jsdoc3 installation
    jsdoc3-task-jar - the location of the task jar that was build above
    rhino-jar - the location of the rhino jar (e.g. ${jsdoc.home}/lib/js.jar or the one found in lib/rhino of this project)
    
Then you would use the task like so:

    <taskdef name="jsdoc" classname="net.jannon.ant.tasks.JsDoc3" classpath="${jsdoc3-task-jar}:${rhino-jar}"/>
    <jsdoc jsdochome="${jsdoc.home}" to="${docs.dir}" dir="${src.dir}" />

### Attributes ###

 * jsdochome - (Required) - The home directory of JSDoc3
 * dir - (Optional*) - The directory containing source files to document
 * file - (Optional*) - The source file to document
 * template - (Optional) - The name of the template to use.  Default: default.
 * to - (Optional) - The directory in which to place the generated documentation. Default: out.
 * encoding - (Optional) - The encoding of the source files and documentation. Defaults: utf-8.
 * private - (Optional) - Whether or not to include private members/methods in the documentation.  Default: false
 * recurse - (Optional) - Whether or not to recurse into the subdirectories of the directory identified by the 'dir' attribute. Default: false
 * tutorials - (Optional)  - The location of the tutorials to use
 
* Either 'file' or 'dir' or nested filesets must be specified.

### Nested Elements ###

The jsdoc3 ant task supports a few nested elements

#### Filesets and Filelists ####

You can specify the source files using filesets or filelists 

#### Arguments ####

The jsdoc3 ant task supports all JSDoc3 command line options.  For those that aren't exposed by the attributes,
(e.g. --explain, --help, etc.), or if JSDoc3 gets adds new ones before this task is updated, you can add nested arg elements
and they will be passed through.

### Examples ###

    <jsdoc3 jsdochome="${jsdoc.home}" 
        to="${docs.dir}/testone" 
        file="${test.dir}/${test.file}" />

Basic file

    <jsdoc3 jsdochome="${jsdoc.home}" 
        to="${docs.dir}/testtwo" 
        dir="${test.dir}/"
        template="spartan" />

Basic directory using the template named "spartan"
    
    <jsdoc3 jsdochome="${jsdoc.home}" 
        to="${docs.dir}/testthree"
        private="true">
        <fileset dir="${test.dir}/" />
    </jsdoc3>

Nested fileset, documenting private members

    <jsdoc3 jsdochome="${jsdoc.home}" 
        to="${docs.dir}/testfive" 
        dir="${test.dir}">
        <arg line="-X" />
    </jsdoc3>

Nested argument

See Also
--------

- JSDoc3: https://github.com/jsdoc3/jsdoc

License
-------

JSDoc-JUI is copyright (c) 2012 Jannon Frank http://jannon.net

See file "LICENSE.md" in this distribution for more details about
terms of use.
