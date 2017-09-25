// ==UserScript==
// @copyright    Copyright IBM Corp. 2017
//
// @name         helloWorld
// @version      0.1
// @description  *** PROTOTYPE CODE *** demonstrates simple hello world script to customize the Home Page
//
// @namespace  http://ibm.com
//
// @author       Hello World (aka You!)
//
//
// @exclude
//
// @run-at       document-end
//
// ==/UserScript==

if(typeof(dojo) != "undefined") {
    dojo.place(
        "<link rel=\"stylesheet\" type=\"text/css\" href=\"/profilesCustomization.css\"></link>",
        dojo.doc.head,
        "last"
    );
}
