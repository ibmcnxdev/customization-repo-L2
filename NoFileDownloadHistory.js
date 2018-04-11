/*
 * © Copyright IBM Corp. 2017
 * 
 * Licensed under the Apache License, Version 2.0 (the "License"); 
 * you may not use this file except in compliance with the License. 
 * You may obtain a copy of the License at:
 * 
 * http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software 
 * distributed under the License is distributed on an "AS IS" BASIS, 
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or 
 * implied. See the License for the specific language governing 
 * permissions and limitations under the License.
 */

 // Last updated 2018-01-18 13:32 by RSC WebGate

 if (document.location.pathname === '/wikis/home/search') {
    myLog('NoFileDownloadHistory : Wiki search redirection page detected. Triggering fix for body.onload()');
    if (typeof load === "function") {
        load(); // this should redirect to the wiki search results page
        myLog('NoFileDownloadHistory : body.load triggered manually');
    }
}

function __sikaCheckPath() {
    //var filesExp = new RegExp('/files/(app|app#)/file/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}');
    var filesExp = new RegExp('/files/(app|app#)');
    //
    //  Regexp for a File-Preview page of a Community file
    //
    //var commExp = new RegExp('/communities/service/html/communitystart\\?communityUuid=[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}#fullpageWidgetId=[0-9a-zA-Z]{13}_[0-9a-f]{4}_[0-9a-f]{4}_[0-9a-f]{12}&file=[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}');
    var commExp = new RegExp('/communities/service/html/(communitystart|communityview|communityoverview)\\?communityUuid=[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}');
    //if (filesExp.test(document.location.pathname) || commExp.test(document.location.pathname + document.location.search + document.location.hash)) {
    if (filesExp.test(document.location.pathname) || commExp.test(document.location.pathname + document.location.search)) {
        if (filesExp.test(document.location.pathname)) {
            myLog('NoFileDownloadHistory.__sikaCheckPath : This is a FILE : ' + document.location.pathname);
            return 1;
        } else {
            myLog('NoFileDownloadHistory.__sikaCheckPath : This is a Community FILE : ' + document.location.pathname);
            return 2;
        }
    } else {
        myLog('NoFileDownloadHistory.__sikaCheckPath : NOT A VALID PATH : ' + document.location.pathname);
        return 0;
    }
}

function __sikaNoDownloadHistory() {
    // Attention! this is not the main entry point of the NoFileDownloadHistory module! Function name is slightly different!
    //
    //  Regexp for a File-Preview page of a standalone file
    //  Please note the "alternative" bewteen "app" and "app#" inside the regexp
    //
    myLog('NoFileDownloadHistory : kicking off...');
    //
    //  To bypass the current limitation of MUSE "match url", we are forced to make this test to validate
    //  if the current page is the one on which we actually want to apply the processing.
    //
    if (__sikaCheckPath() > 0) {
        var dojoNoFileDownloadHistory = new WaitForDojo('NoFileDownloadHistory');
        //
        //  There are some pages which load Dojo very lazily.
        //  So we need to wait until Dojo is fully loaded before testing and using it
        //
        dojoNoFileDownloadHistory.do(function () {
            myLog('NoFileDownloadHistory : Dojo is defined !');
            try {
                myLog('NoFileDownloadHistory: start');
                /*
                //
                //  We require the Dojo modules that help us to transform an XML feed into a JSON document
                //
                dojo.require("dojox.atom.io.model");
                //
                //  This is the real trick that makes the whole working
                //  The Dojo ON module allows us to declare eventHandlers associated to classes. 
                //  See https://dojotoolkit.org/reference-guide/1.10/dojo/on.html
                //
                require(['dojo/on', 'dojo/_base/window', 'dojo/query'],
                    //
                    //  We want to capture when the container of the user records (for Likes, Comments, Downloads...)
                    //  actually gets filled with the HTML elements that contain the information for the users
                    //  who are liking, commenting, downloading...
                    //
                    function (on, win) {
                        on(win.doc,
                            '.panelContent.streamContent.bidiAware:DOMNodeInserted', //'.ics-viewer-user-count-widget:DOMNodeInserted', 
                            function (evt) {
                                //
                                //  When an HTML element is inserted...
                                //
                                var thisElement = evt.target;
                                //
                                //  ...we search the <span class="x-lconn-userid"> children of that element
                                //
                                var myChild = dojo.query('span.x-lconn-userid', thisElement);
                                if (myChild.length > 0) {
                                    let downloadParent = myChild.closest('.ics-viewer-user-count-widget[data-dojo-attach-point="downloadsContainer"]');
                                    if (downloadParent.length > 0) {
                                        //
                                        //  If a child is found, then it contains the "userid" attribute of
                                        //  the record that is shown in the page
                                        //
                                        myLog('NoFileDownloadHistory: going to get infos for user ' + myChild[0].innerHTML);
                                        //
                                        //  We can delegate to the hideUser method of the blackList object (which has 
                                        //  been instatiated withing commonTools.js) the task of hiding that record
                                        //  (if required)
                                        //
                                        blackList.hideUser('NoFileDownloadHistory', myChild[0].innerHTML, thisElement);
                                    } else {
                                        myLog('NoFileDownloadHistory: user ' + myChild[0].innerHTML + ' is not in Download... forgetting it....');
                                    }
                                }
                            })
                    }
                );
                */


                //
                //  This statement was the original choice of completely hiding the list of users who downloaded
                //  a given file
                //
                dojo.place(
                    '<style>' +
                        '.ics-viewer-user-count-widget[data-dojo-attach-point="downloadsContainer"] .content.bidiAware { display: none } !important' +
                    '</style>', dojo.body(),"first"); 
                myLog('NoFileDownloadHistory: ics-viewer-user-count-widget class style change to noDisplay');
                myLog('NoFileDownloadHistory : finish');
            } catch (ex) {
                alert("NoFileDownloadHistory error: MAIN: " + ex);
            }
        });
    } else {
        myLog('NoFileDownloadHistory : NOTHING TO DO for ' + document.location + ' !');
    }
}

//
//  This code allows the script to be invoked when you access a File Preview from a reference to it which is posted in a different Connections Page
//  We observe the dynamic change of the BODY element and, in case a change in document.location is found, it invokes the script related to
//  the Files Preview page
//
var __sikaWikiExp = new RegExp('/wikis/home/wiki/');
if ((document.location.pathname === "/files/")  || (__sikaWikiExp.test(document.location.pathname))) {
    myLog('NoFileDownloadHistory : DANGER ZONE ...... /files/ .....');
} else {
    if (__sikaCheckPath() > 0) {
        //
        //  We execute this code in case we land on the page in the canonical way
        //
        __sikaNoDownloadHistory();
    } else {
        //
        //  We create an observer for being prepared for the target page
        //
        var __sikaOldHref = document.location.href;
        window.onload = function () {
            var bodyList = document.querySelector("body");
            var observer = new MutationObserver(function (mutations) {
                mutations.forEach(function (mutation) {
                    if (__sikaOldHref != document.location.href) {
                        myLog('NoFileDownloadHistory : change document.location from ' + __sikaOldHref + ' to ' + document.location.href);
                        //alert('MUTATION !!! : I am on ' + document.location.href + ' from ' + __sikaOldHref);
                        myLog(JSON.stringify(mutation, ' ', 2));
                        __sikaOldHref = document.location.href;
                        __sikaNoDownloadHistory();
                    }
                });
            });
            var config = {
                childList: true,
                subtree: true
            };
            observer.observe(bodyList, config);
        };
    }
}