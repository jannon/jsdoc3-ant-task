/**
 * JSDoc3 is ant Ant task for JSDoc3, a JavaScript documentation tool.
 * 
 * Usage:
 *  	<taskdef name="jsdoc3"
 *  		classname="net.jannon.ant.tasks.JsDoc3"
 *  		classpath="/path/to/jsdoc3-ant-task.jar;/path/to/js.jar"/>
 *
 *  	<jsdoc3 jsdochome="/path/to/jsdoc3/" template="default" outputdir="/output/dir/">
 *			<fileset dir="src" includes="*.js"/>
 *		</jsdoc3>
 *
 * @author Jannon Frank
 */

package net.jannon.ant.tasks;

import java.util.*;
import java.io.*;

import org.apache.tools.ant.*;
import org.apache.tools.ant.types.FileSet;
import org.apache.tools.ant.types.FileList;
import org.apache.tools.ant.types.Commandline.Argument;
import org.apache.tools.ant.DirectoryScanner;

import org.mozilla.javascript.tools.shell.Main;

public class JsDoc3 extends Task {

	private String jsDocHome, template;
	private Vector<Argument> args = new Vector<Argument>();
	private Vector<FileSet> fileSets = new Vector<FileSet>();
	private Vector<FileList> fileLists = new Vector<FileList>();
	private String encoding = null,
			config = null,
			inputDir = null, 
			inputFile = null, 
			toDir = null,
			tutorials = null;
	private boolean isIncludingPrivate = false, isRecursive = false;

	/**
	 * Method invoked by Ant to actually run the task
	 */
	public void execute() throws BuildException {
		// create the list of arguments for the rhino shell
		String[] arguments = createArguments();
		try {
			Main.main(arguments);
		} catch (Exception e) {
			e.printStackTrace();
		}
	}

	/**
	 * Receive a nested argument
	 * 
	 * @param arg 	An argument to pass to JSDoc3.  This can be used pass arguments 
	 * not exposed directly by the ant task (e.g --test, --explain, etc.) 
	 */
	public void addArg(Argument arg) {
		if (!args.contains(arg)) {
			args.add(arg);
		}
	}

	/**
	 * Receive a nested fileset
	 * 
	 * @param fileSet a fileset of source files
	 */
	public void addFileSet(FileSet fileSet) {
		if (!fileSets.contains(fileSet)) {
			fileSets.add(fileSet);
		}
	}

	/**
	 * Receive a nested FileList
	 * 
	 * @param fileList a list of sources
	 */
	public void addFileList(FileList fileList) {
		if (!fileLists.contains(fileList)) {
			fileLists.add(fileList);
		}
	}

	/**
	 * Sets the jsdochome attribute, the home directory of JSDoc3.
	 * 
	 * @param jsDocHome a string representing the the home directory of JSDoc3
	 */
	public void setJsdochome(String jsDocHome) {
		File f = new File(jsDocHome);
		this.jsDocHome = f.getAbsolutePath();
	}

	/**
	 * Sets the input source directory.  One of the following must be specified:
	 * 'dir', 'file', or nested filesets
	 * 
	 * @param dir a string representing the path to the source file directory.
	 */
	public void setDir(String dir) {
		this.inputDir = dir;
	}
	
	/**
	 * Sets the input source file.  One of the following must be specified:
	 * 'dir', 'file', or nested filesets
	 * 
	 * @param file a string representing the path to the source file
	 */
	public void setFile(String file) {
		this.inputFile = file;
	}
	
	/**
	 * Sets the optional template attribute, which is the name of the template 
	 * used to generate the documentation 
	 * 
	 * @param template the name of the template to use (default: "default")
	 */
	public void setTemplate(String template) {
		this.template = "templates/" + template;
	}
	
	/**
	 * Sets the optional to attribute which determines where the generated 
	 * documentation is placed.
	 * 
	 * @param toDir a string representing the path to the directory in which to 
	 * place the generated documentation
	 */
	public void setTo(String toDir) {
		this.toDir = toDir;
	}
	
	/**
	 * Sets the optional encoding attribute which sets the encoding of the input and output
	 * files.
	 * 
	 * @param encoding the encoding to use (default: "utf-8")
	 */
	public void setEncoding(String encoding) {
		this.encoding = encoding;
	}

	/**
	 * Sets the optional private attribute which determines whether or not JSDoc3
	 * should generate documentation for private members/methods
	 * 
	 * @param isPrivate whether or not to show private members/methods (default: false)
	 */
	public void setPrivate(Boolean isPrivate) {
		this.isIncludingPrivate = isPrivate;
	}

	/**
	 * Sets the optional recurse attribute which determines whether or not JSDoc3
	 * should recurse into source directories.  
	 * 
	 * @param recurse whether or not to recurse into source subdirectories (default: false)
	 */
	public void setRecurse(Boolean recurse) {
		this.isRecursive = recurse;
	}

	/**
	 * Sets the optional tutorials attribute. The tutorials attribute points
	 * to where JSDoc3 should look for tutorials
	 * 
	 * @param tutorials a string representing the path to the tutorials directory
	 */
	public void setTutorials(String tutorials) {
		this.tutorials = tutorials;
	}
	
	/**
	 * Create the array of arguments to pass to rhino engine.  It looks something
	 * like this:
	 * -modules <jsdoc.home>/node_modules -modules <jsdoc.home>/rhino_modules \
	 * -modules <jsdoc.home> <jsdoc.home>/jsdoc.js --dirname=<jsdoc.home> \
	 * <options> <sourcefiles|sourcedirs>
	 * 
	 * @return a string[] of commands to pass to the rhino engine
	 */
	private String[] createArguments() throws BuildException {
		Vector<String> arguments = new Vector<String>();
		
		// return if certain attributes are not present
		if ((jsDocHome == null)) {
			throw new BuildException("jsdochome must be specified");
		}
		
		// add the modules folders
		arguments.add("-modules");
		arguments.add(jsDocHome + "/node_modules");
		arguments.add("-modules");

		if (new File(jsDocHome + "/rhino").exists()) {
			arguments.add(jsDocHome + "/rhino");
		} else {
			arguments.add(jsDocHome + "/rhino_modules");
		}

		arguments.add("-modules");
		arguments.add(jsDocHome + "/lib");
		arguments.add("-modules");
		arguments.add(jsDocHome);
		
		// add the main jsodc js
		arguments.add(jsDocHome + "/jsdoc.js");
		
		// add the dirname
		arguments.add("--dirname=" + jsDocHome);
		
		addOptionalArgument(arguments, template, "-t"); // add the template
		addOptionalArgument(arguments, toDir, "-d"); // add the output dir
		addOptionalArgument(arguments, encoding, "-e"); // the encoding to use
		addOptionalArgument(arguments, config, "-c"); // the config file to use
		addOptionalArgument(arguments, tutorials, "-u"); // the tutorials dir
		addOptionalBooleanArgument(arguments, isIncludingPrivate, "-p");
		addOptionalBooleanArgument(arguments, isRecursive, "-r");
		
		if (inputFile != null) {
			arguments.add(inputFile);
		} else if (inputDir != null) {
			arguments.add(inputDir);
		} else if (fileSets.size() != 0 || fileLists.size() != 0) {
			// Loop through fileSets
			for (int i = 0, l = fileSets.size(); i < l; i++) {
				FileSet fs = fileSets.elementAt(i);
				// Ummm....?
				DirectoryScanner ds = fs.getDirectoryScanner(getProject());
				// Get base directory from fileset
				File dir = ds.getBasedir();
				// Get included files from fileset
				String[] srcs = ds.getIncludedFiles();
				// Loop through files
				for (int j = 0; j < srcs.length; j++) {
					// Make file object from base directory and filename
					File temp = new File(dir, srcs[j]);
					// Call the JSMin class with this file
					arguments.add(temp.getAbsolutePath());
				}
			}
			// Loop through fileLists
			for (int i = 0; i < fileLists.size(); i++) {
				FileList fs = fileLists.elementAt(i);
				// Get included files from filelist
				String[] srcs = fs.getFiles(getProject());
				// Get base directory from filelist
				File dir = fs.getDir(getProject());
				// Loop through files
				for (int j = 0; j < srcs.length; j++) {
					// Make file object from base directory and filename
					File temp = new File(dir, srcs[j]);
					// Call the JSMin class with this file
					arguments.add(temp.getAbsolutePath());
				}
			}
		} else {
			throw new BuildException("No inputs specified.  Task requires 'file' attribute OR 'dir' attribute OR nested filesets");
		}
		if (args.size() != 0) {
			for (int i = 0, l = args.size(); i < l; i++) {
				arguments.addAll(Arrays.asList(args.elementAt(i).getParts()));
			}
		}
		return arguments.toArray(new String[0]);

	}

	/**
	 * Sets the optional config attribute. The config attribute points to the 
	 * JSON config file used by JSDoc3
	 * 
	 * @param config a string representing the path to the config file (default: "${jsdoc.home}/conf.json")
	 */
	public void setConfig(String config) {
		this.config = config;
	}
	
	/**
	 * Helper method to add optional arguments.  Checks for null first, then adds
	 */
	private void addOptionalArgument(Vector<String> arguments, String value, String option) {
		if (value != null) {
			arguments.add(option);
			arguments.add(value);
		}
	}
	
	/**
	 * Helper method to add optional boolean arguments.  Checks for null first, then adds
	 */
	private void addOptionalBooleanArgument(Vector<String> arguments, Boolean value, String option) {
		if (value) {
			arguments.add(option);
		}
	}
}
