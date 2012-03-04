/**
    @overview This plugin implements the jsdoc hooks necessary to produce
    documentation for jquery ui widgets when used in conjunction with the jui
    template
    @module plugins/jquery-ui-widget
    @author Jannon Frank (jannon.net)
 */

var Token = Packages.org.mozilla.javascript.Token,
    tkn = require("jsdoc/src/parser").Parser.tkn,
    widgetName = null,
    events = {};

exports.defineTags = function(dictionary) {
    dictionary.defineTag("widget", {
        onTagged: function(doclet, tag) {
            doclet.kind = "widget";
            doclet.preserveName = true;
        }
    });
};

exports.handlers = {
    newDoclet: function(e) {
        // console.log("----------");
        // console.log("New Doclet");
        // console.log("----------");
        //printFields(e.doclet);
        if (e.doclet.tags) {
            for(var i = 0, l = e.doclet.tags.length; i < l; i++) {
                var tag = e.doclet.tags[i];
                    
                switch(tag.title) {
                    case "require":
                        // Add requires...need to use this tag since the "requires" tag
                        // assumes too much (specifically, assumes commmonJS module requires)
                        if (!e.doclet.requires) { e.doclet.requires = []; }
                        e.doclet.requires.push(tag.value);
                        break;
                    case "demo":
                        e.doclet.kind = tag.title;
                        if (!e.doclet.demo) { e.doclet.demo = {}; }
                        if (tag.value) { e.doclet.demo.name = tag.value; }
                        break;
                    case "demoscript":
                    case "demomarkup":
                        if (!e.doclet.demo) { e.doclet.demo = {}; }
                        e.doclet.demo[tag.title.replace("demo", "")] = tag.value;
                        break;
                }
            }
        }
        if ((e.doclet.kind == "function" || e.doclet.kind == "method") && e.doclet.memberof && e.doclet.memberof.indexOf("ui.") != -1) {
            //Set all the widget methods scope to instance
            e.doclet.scope = "instance";
            //Set all the methods that start with '_' to private
            if (e.doclet.name.indexOf("_") === 0) {
                e.doclet.access = "private";
            }
        } else if (e.doclet.kind == "event") {
            events[e.doclet.longname] = e.doclet;
        }
        //bump line number up to top level for use with sorting
        e.doclet.lineno = e.doclet.meta.lineno;
    },
    fileBegin: function(e) {
        widgetName = null;
        events = {};
    },
    beforeParse: function(e) {
        //Retrieve the name of the widget to set the memberof attribute of the
        // common method doclets
        var match = e.source.match(/\$\.widget\("(ui\.\w+)"/);
        if (match) {
            widgetName = match[1];
        }
        
        //Create the common method doclets
        addMethod(e, "disable");
        addMethod(e, "enable");
        addMethod(e, "widget");
        //this might conflict with previously defined destroy methods until 
        //jQuery UI 1.9 when they switch to using _destroy like _setOption
        //addMethod(e, "destroy");
        
        //The option methods have parameters defined
        addMethod(e, "option", [
            {
                name:       "optionName",
                description:"The option to set or retrieve.",
                type:       "String" 
            },
            {
                name:       "value",
                description:"The value to set.",
                optional:   true
            }
        ]);
       
       addMethod(e, "option-2", [
            {
                name:       "options",
                description:"The map of options to set",
                type:       "Object"
            }
        ]);
    }
    /*
    jsdocCommentFound: function(e) {
        console.log("--------------------");
        console.log("JS Doc Comment Found");
        console.log("--------------------");
        printFields(e);
    },
    symbolFound: function(e) {
        console.log("------------");
        console.log("Symbol Found");
        console.log("------------");
        printFields(e);
    },
    fileComplete: function(e) {
    },
    sourceFileFound: function(e) {
        console.log("-----------------");
        console.log("Source File Found");
        console.log("-----------------");
        printFields(e);
    }
    */
};

exports.nodeVisitor = {
    visitNode: function(node, e, parser, currentSourceName) {
        /*
         * We look for object literal nodes whose parent is a "$.widget" call
         */
        if (node.type === Token.OBJECTLIT && node.parent && node.parent.type === Token.CALL && isInWidgetFactory(node, 1)) {
            var widgetName = String(node.parent.arguments.get(0).value);
            e.id = 'astnode' + node.hashCode(); // the id of the object literal node
            e.comment = String(node.parent.jsDoc||'');
            e.lineno = node.parent.getLineno();
            e.filename = currentSourceName;
            e.astnode = node;
            e.code = {
                name: widgetName,
                type: "class",
                node: node
            };
            e.event = "symbolFound";
            e.finishers = [parser.addDocletRef];

            addCommentTag(e, "widget", widgetName);
            addCommentTag(e, "param", "{Object=} options A set of configuration options");
        }
        /*
         * Get the default types and values from the options
         */
        else if (node.type == Token.OBJECTLIT && isInWidgetFactory(node)) {
            for(var i = 0, l = node.elements.size(); i < l; i++) {
                var n = node.elements.get(i),
                    left = n.left,
                    right = n.right;
                addJSDocTag(left, "default", right.toSource());
                addJSDocTag(left, "type", nodeToType(right.type));
            }
        }
        /*
         * Find the events
         */
        else if(isTriggerCall(node)) {
            var nameNode = node.arguments.get(0);
                eventName = String((nameNode.type == Token.STRING) ? nameNode.value : nameNode.toSource()),
                func = {},
                comment = "@event\n",
                eventKey = "";

            if (node.enclosingFunction) {
                func.id = 'astnode'+node.enclosingFunction.hashCode();
                func.doclet = parser.refs[func.id];
            }
            if(func.doclet) {
                func.doclet.addTag("fires", eventName);
                if (func.doclet.memberof) {
                    eventKey = func.doclet.memberof + "#event:" + eventName;
                    comment += "@name " + func.doclet.memberof + "#" + eventName;
                }
            }
            //make sure we're not adding duplicates
            if (!events[eventKey]) {
                e.comment = comment;
                e.lineno = node.getLineno();
                e.filename = currentSourceName;
                e.event = "jsdocCommentFound";
            }                
        }
    }
};

    

/** @private */
function isTriggerCall(node) {
    if(node.type != Token.CALL) { return false; }
    var target = node.getTarget(),
        left = target && target.left && String(target.left.toSource()),
        right = target && target.right && String(target.right.toSource());
    return (left === "this" && right === "_trigger");
}

function isInWidgetFactory(node, depth) {
    var parent = node.parent,
        d = 0;
    while(parent && (!depth || d < depth)) {
        if (parent.type === Token.CALL) {
            var target = parent.getTarget(),
                left = target && target.left && String(target.left.toSource()),
                right = target && target.right && String(target.right.toSource());
            return ((left === "$" || left === "jQuery") && right === "widget");
        } else {
            parent = parent.parent;
            d++;
        }
    }
    return false;
}

function addCommentTag(e, title, text, allowMultiple) {
    e.comment = addTag(e.comment, title, text, allowMultiple);
}

function addJSDocTag(node, title, text, allowMultiple) {
    var comment = String(node.getJsDoc() || "");
    node.setJsDoc(addTag(comment, title, text, allowMultiple));
}

function addTag(comment, title, text, allowMultiple) {
    var tag = "@" + title,
        fullTag = tag, idx;
    if (text) { fullTag += " " + text; }
    fullTag += "\n";
    comment = comment || "";
    comment.replace(/@undocumented/, "");
    
    if (allowMultiple || comment.indexOf(tag) == -1) {
        idx = comment.indexOf("*/");
        comment = comment.substring(0, idx) + fullTag + comment.substring(idx);
    }
    return comment;
}

function nodeToType(type) {
    switch(type) {
        case Token.TRUE:
        case Token.FALSE:
            return "Boolean";
        case Token.STRING:
            return "String";
        case Token.ARRAYLIT:
            return "Array";
        case Token.NUMBER:
            return "Number";
        default:
            return "Object";
    }
}

function makeParamType(param) {
    var type = param.type || "Object",
        isOptional = param.optional,
        result = ["{", type, (isOptional?"=":""), "}"].join("");
    return result;
}

var commonDescriptions = {
        "disable":  "Disable the ${widget}.",
        "enable":   "Enable the ${widget}.",
        "widget":   "Returns the ${widget} element.",
        "destroy":  "Remove the ${widget} functionality completely. This will return the element back to its pre-init state.",
        "option":   "Get or set any ${widget} option. If no value is specified, will act as a getter.",
        "option-2": "Set multiple ${widget} options at once by providing an options object."
    };

function addMethod(e, name, params) {
    // The basics
    var source = ["",
        "/**",
        commonDescriptions[name].replace("${widget}", widgetName.substring(widgetName.indexOf('.') + 1)),
        "@name " + name.replace(/-\d+/, ""),
        "@memberof " + widgetName,
        "@function" 
    ],
    param, paramStr;
    
    //Add any parameters
    if (params) {
        for(var i = 0, l = params.length; i < l; i++) {
            param = params[i];
            paramStr = ["@param", makeParamType(param), param.name, param.description].join(" ");
            source.push(paramStr);
        }
    }
    
    //And close it out
    source.push("*/");

    //Add it to the source
    e.source += source.join("\n");
}

/* Debug Utilities */
function printFields(e, depth) {
    depth = depth || 0;
    var prefix = "";
    for(var i = 0; i < depth; i++) {
        prefix += "\t";
    }
    
    for (var f in e) {
        if (e['hasOwnProperty'] && e.hasOwnProperty(f)) {
            if (typeof e[f] != 'object' || f == "astnode" || f == "node") {
                if (f == "astnode") {
                    console.log(prefix, f, ":");
                    debugPrintNode(e.astnode);
                } else if (f == "node") {
                    console.log(prefix, f, ":");
                    debugPrintNode(e.node);
                } else {
                    console.log(prefix, f, ":", e[f], "(", (typeof e[f]), "),");
                }
            } else {
                console.log(prefix + f + ": {");
                printFields(e[f], ++depth);
                console.log(prefix + "}");
            }
        }
    }
}

function getNodeType(node) {
    if (!node) return "";
    if (node.type == tkn.NAMEDFUNCTIONSTATEMENT) {
        return "NAMEDFUNCTIONSTATEMENT";
    }
    return String(Token.typeToName(node.type));
}

function debugPrintNode(node, printSource) {
    console.log("=================");
    console.log("NODE:", getNodeType(node));
    console.log("=================");
    if (printSource) {
        console.log("" + node.toSource());
    }
}

function debugPrintNodeEnclosure(node) {
    console.log("=================");
    console.log("NODE ENCLOSURE:", getNodeType(node));
    console.log("=================");
    console.log("Parent:", getNodeType(node.parent));
    console.log("Left:", getNodeType(node.left));
    console.log("Right:", getNodeType(node.right));
    if (node.enclosingFunction) {
        console.log("Function:", String(node.enclosingFunction.name));
    }
    if (node.enclosingScope) {
        console.log("Scope:", node.enclosingScope);
    }
}
