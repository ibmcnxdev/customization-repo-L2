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

 // Last updated 2018-01-10 06:48 by RSC WebGate

// This is the commonTools.js for TEST tenant
var _sikaCustomizerIsProduction = true;

var _sikaCustomizerUUID = _sikaCustomizerIsProduction?'aaca32ea-d50f-48da-a963-0f3ed3dfc0da':'63096479-1093-42cb-a797-ca8ba6acd794';

if (_sikaDebug !== undefined) {
    myLog('******** commonTools.js already done. SKIPPING *****************');
} else {
    //  _sikaDebug needs to be declared NOW otherwise the following "myLog" statement will no work properly
    var _sikaDebug = false;
    //  HideNoDestroy is a configuration that determines if the DOM elements needs to be hidden or destroyed fro the UI
    //  It is used to show the possibilities and to provide a late decision point
    var hideNoDestroy = false;
    myLog('******** commonTools.js executed *****************');
    //  These are global functions and classes
    function getConnectionsUser() {
            let theCookiesStr = myGetCookie('ids');
            let theCookies = theCookiesStr.split(":");
            return theCookies[0];
    }
    //  Utiity to validate if the current user is a member of a given community
    function UserAllowed(uuid) {
        var thisUser = getConnectionsUser();
        var cookieName    = "Muse-" + thisUser + "-" + uuid;
        this.retrieving   = false;
        this.communityArgs= {
            url          : "https://apps.ce.collabserv.com/communities/service/json/v1/community/activepersonmembers",
            handleAs     : "json",
            preventCache : false,
            sync         : false,
            //user:      NO Need since same Domain,
            //password:  NO Need since same Domain,
            content      :  {communityUuid: uuid, limit: '500'},
        }
        if (myGetCookie(cookieName) !== "") {
            //
            //  a cookie is present. Initialize values with infos coming from that cookie
            //
            this.isAllowed    = myGetCookie(cookieName) == 0 ? false : true;
            this.retrieved    = true;
            myLog('UserAllowed.init for (' + uuid + ') : cookie exists and has value ' + this.isAllowed);
        } else {
            //
            //  Cookie is not defined 
            //  this means we need to go and check the current user
            //
            this.isAllowed    = false;
            this.retrieved    = false;
            myLog('UserAllowed.init for (' + uuid + ') : cookie does not exist...');
        }
        
        this.setCommunityId = function(uuid) {
            this.communityArgs.content.communityUuid = uuid;
        }

        this.checkUser = function (label, callback) {
            var n = this;
            var communityId = this.communityArgs.content.communityUuid;
            if (!this.retrieved) {
                //
                //  Not yet retrieved. Is some script currently retrieving it ?
                //
                if (!this.retrieving) {
                    //
                    //  No other script is retrieving.
                    //  So this script can start retrieving it
                    //  We signal we are going to retrieve it
                    //
                    this.retrieving = true;
                    //
                    // Now, we issue the SYNCHRONOUS XHR and we retrieve the results
                    //
                    myLog(label + ': going to validate authorization against user ' + thisUser + ' !');
                    var deferred = dojo.xhrGet(this.communityArgs);

                    deferred.then(
                        function (data) {
                            if (data && data.items && (data.items.length > 0)) {
                                for (var i=0; i < data.items.length; i++) {
                                    if (data.items[i].directory_uuid === thisUser) {
                                        n.isAllowed = true;
                                        myLog(label + ': Setting user access for user ' + thisUser + ' to : ' + n.isAllowed);
                                        break;
                                    }
                                }
                            }
                            if (n.isAllowed) {
                                myLog(label + ': user ' + thisUser + 'is member of community ' + communityId);
                            } else {
                                myLog(label + ': user ' + thisUser + 'is NOT member of community ' + communityId);
                            }
                            //
                            //  set the cookie
                            //
                            dojo.cookie(cookieName, n.isAllowed ? 1 : 0);
                            //
                            //  free the others waiting
                            //
                            n.retrieved = true;
                            n.retrieving = false;
                            //
                            //  do the processing
                            //
                            callback(n.isAllowed);
                        },
                        function (error) {
                            n.isAllowed = false;
                            //
                            //  set the cookie
                            //
                            dojo.cookie(cookieName, n.isAllowed ? 1 : 0);
                            myLog(label + ': cookie ' + cookieName + ' set to value ' + n.isAllowed);
                            if (error.status === 403) {
                                myLog(label + ': user ' + thisUser + 'is NOT member of community ' + communityId);
                                //
                                //  free the others waiting
                                //
                                n.retrieved = true;
                                n.retrieving = false;
                                //
                                //  do the processing
                                //
                                callback(n.isAllowed);
                            } else {
                                alert(label + ".UserAllowed : An unexpected error occurred in xhr(" + communityId + "): " + error);
                                //
                                //  free the others waiting
                                //
                                n.retrieved = false;
                                n.retrieving = false;
                            }
                        }
                    );
                } else {
                    //
                    //  Some other script is retrieving but has not yet finished.
                    //  We need to wait until that script has finished
                    //
                    myLog(label + '.UserAllowed : waiting until retrieving becomes FALSE for community ' + communityId + ' ...');
                    var waitTime = 100;  // 1000=1 second
                    var maxInter = 50;  // number of intervals before expiring
                    var waitInter = 0;  // current interval
                    var intId = setInterval( function(){
                        myLog(label + '.UserAllowed : waiting RETRIEVING for the ' + waitInter + 'th time...');
                        if (++waitInter < maxInter && n.retrieving) return;
                        clearInterval(intId);
                        if (waitInter >= maxInter) {
                            myLog(label + '.UserAllowed : TIMEOUT EXPIRED waiting for retrieving to become FALSE for community ' + communityId + ' ...');
                        } else {
                            myLog(label + '.UserAllowed : now we can proceed setting user ' + thisUser + ' access to ' + n.isAllowed);
                            callback(n.isAllowed);
                        }
                    }, waitTime);
                }
            } else {
                //
                // Some oher script already validated the membership
                // We reuse the result
                //
                myLog(label + '.UserAllowed : User ' + thisUser + ' access Already set to : ' + this.isAllowed);
                callback(this.isAllowed);
            }
        }
    }   
    //
    //  Utility to validate if a given user can be shown as the author of a comment/like/download
    //
    function UserDetails() {
        this.cache        = [];        
        this.profilesArgs = {
            url          : "https://apps.ce.collabserv.com/profiles/atom/profile.do",
            handleAs     : "xml",
            preventCache : false,
            sync         : false,
            //user:      NO Need since same Domain,
            //password:  NO Need since same Domain,
            content      :  {userid: null}
        }
        
        var n = this;
        
        this.userIsInCache = function(uuid) {
            for (var i=0; i < this.cache.length; i++) {
                if (this.cache[i].uuid === uuid) return i;
            }
            return -1; 
        }
        
        this.userCanShow = function(uuid) {
            var j = this.userIsInCache(uuid);
            if (j >= 0) return this.cache[j].canShow;
            return false;
        }
        
        this.userHasEmail = function(uuid) {
            var j = this.userIsInCache(uuid);
            if (j >= 0) return this.cache[j].email;
            return null;
        }
        
        this.addUserToCache = function(uuid, email, canShow) {
            var tmp = {};
            tmp.uuid = uuid;
            tmp.email = email;
            tmp.canShow = canShow;
            this.cache.push(tmp);
        }
        
        this.hideUser = function (label, uuid, element) {
            function checkEmailAddress(email) {
                //
                //  SIKA - Modification asked on October 3rd, 2017
                //      NO USERS can be shown
                //
                return true;
                /*
                if ((email === 'ray.weber@poglianis.net') || (email === 'gabi.watters@poglianis.net')){
                    return true;
                } else {
                    return false;
                }
                */
            }
            function hideTheUser(label, email, element) {
                dojo.setStyle(element, 'display', 'none');
                myLog(label + ': Element corresponding to user ' + email + ' has been hidden');
            }
            
            if (this.userIsInCache(uuid) >= 0) {
                myLog(label + ': user ' + this.userHasEmail(uuid) + ' has already been cached !');
                if (this.userCanShow(uuid)) {
                    //
                    //  User can be seen... Nothing to do
                    //
                    myLog(label + ': user ' + this.userHasEmail(uuid) + ' can be shown ! Nothing more to do.');
                } else {
                    //
                    //  User has been already checked and cannot be shown.
                    //  So we hide it
                    //
                    hideTheUser(label, this.userHasEmail(uuid), element);
                }
            } else {
                myLog(label + ': user ' + uuid + ' has NOT been found in the cache. Going to fetch its profile !');
                //
                //  User is NOT in cache. Needs to be retrieved
                //
                this.profilesArgs.content.userid = uuid;
                var deferred = dojo.xhrGet(this.profilesArgs);            
                deferred.then(
                    function (data) {
                        myLog(label + ': Profile for user ' + uuid + ' has been fetched... processing it...');
                        try {
                            var feed = new dojox.atom.io.model.Feed();
                            feed.buildFromDom(data.documentElement);
                            if (feed.entries && feed.entries[0] && feed.entries[0].contributors && feed.entries[0].contributors[0]) {
                                let email = feed.entries[0].contributors[0].email;
                                if (checkEmailAddress(email)) {
                                    //
                                    //  User cannot be shown.
                                    //  Hiding the element corresponding to the user
                                    //
                                    hideTheUser(label, email, element);
                                    //
                                    //  Add the user to the cache
                                    //
                                    n.addUserToCache(uuid, email, false);
                                } else {
                                    //
                                    //  Add the user to the cache
                                    //
                                    n.addUserToCache(uuid, email, true);
                                    myLog(label + ': User ' + email + ' can be shown ! Nothing more to do.');
                                }
                            } else {
                                alert(label + " error in deferred.then : User " + uuid + ' not found !!');
                            }
                        } catch(ex) {
                            alert(label + " error in deferred.then : " + ex);
                        }
                    },
                    function (error) {
                        alert(label + " An unexpected error occurred in xhr(" + uuid + "): " + error);
                    }
                );
            }
        }
    }   
    //
    //  
    //
    function WaitForById(label) {
        this.label = '***UNKNOWN***';
        if (label) this.label = label;
        myLog(this.label + '.commonTools.WaitForById : initialising !');
        this.do = function(callback, elXpath, maxInter, waitTime) {
            var n = this;
            myLog(this.label + '.commonTools.WaitForById : executing !');
            if(!maxInter) maxInter = 50;  // number of intervals before expiring
            if(!waitTime) waitTime = 100;  // 1000=1 second
            if(!elXpath) return;

            var waitInter = 0;  // current interval
            var intId = setInterval( function(){
                myLog(n.label + '.commonTools.WaitForById.do : waiting ' + elXpath + ' for the ' + waitInter + 'th time...');
                var theWidget = dojo.byId(elXpath);
                if (++waitInter < maxInter && !theWidget) return;
                clearInterval(intId);
                if (waitInter >= maxInter) {
                    console.log(n.label + '.commonTools.WaitForById : TIMEOUT EXPIRED for ' + elXpath + ' !');
                } else {
                    myLog(n.label + '.commonTools.WaitForById : element ' + elXpath + ' retrieved !');
                    myLog(theWidget);
                    callback(theWidget);
                }
            }, waitTime);
        };
        
    }
    function WaitForByQuery(label) {
        this.label = '***UNKNOWN***';
        this.onlyWhenVisible = false;
        this.onlyWhenParentVisible = false;
        this.parentToBeVisible = "";
        if (label) this.label = label;
        myLog(this.label + '.commonTools.WaitForByQuery : initialising !');
        this.do = function(callback, elXpath, maxInter, waitTime) {
            var n = this;
            myLog(this.label + '.commonTools.WaitForByQuery : executing !');
            if(!maxInter) maxInter = 50;  // number of intervals before expiring
            if(!waitTime) waitTime = 100;  // 1000=1 second
            if(!elXpath) return;

            var waitInter = 0;  // current interval
            var intId = setInterval( function(){
                myLog(n.label + '.commonTools.WaitForByQuery.do : waiting ' + elXpath + ' for the ' + waitInter + 'th time...');
                //
                //  Perform the query
                //
                var theQuery = dojo.query(elXpath);
                //
                //  If results have NOT been found within the allowed range of trials we wait for another timeout to retry
                //
                if (++waitInter < maxInter && !theQuery.length) return;
                //
                //  If we arrive here, either we had a timeout or we found something....
                //
                if (waitInter >= maxInter) {
                    //
                    //  Timeout..
                    //  Stopping the Interval, logging and finishing....
                    //
                    clearInterval(intId);
                    console.log(n.label + '.commonTools.WaitForByQuery : TIMEOUT EXPIRED for ' + elXpath + ' !');
                } else {
                    //
                    //  Apparently we found something
                    //  Let's check if there are visible elements and, in that case, return them
                    //
                    if (n.onlyWhenVisible || n.onlyWhenParentVisible) {
                        //
                        //  Now we have to filter ONLY the elemets that are visible
                        //
                        myLog(n.label + '.commonTools.WaitForByQuery : checking for visibility of ' + theQuery.length + ' candidates....');
                        let theResult = [];
                        theQuery.forEach(function(elem) {
                            let newElem = elem;
                            if (n.onlyWhenParentVisible) {
                                //
                                //  Convolution for InternetExplorer !!!
                                //
                                if ((navigator.appVersion.indexOf("Trident")!= -1) || (navigator.appVersion.indexOf("Edge")!= -1)) {
                                    myLog(n.label + '.commonTools.WaitForByQuery : in InternetExplorer');
                                    newElem = dojo.query(elem).closest(n.parentToBeVisible);
                                    newElem = newElem[0];
                                } else {
                                    myLog(n.label + '.commonTools.WaitForByQuery : NOT in InternetExplorer');
                                    newElem = elem.closest(n.parentToBeVisible);
                                }                                    
                            }
                            if (newElem) {
                                myLog(n.label + '.commonTools.WaitForByQuery : checking for visibility of ' + newElem);
                                myLog(n.label + '.commonTools.WaitForByQuery : visibility is  ' + newElem.offsetHeight);
                                if (newElem.offsetHeight > 0) theResult.push(elem);
                            } else {
                                myLog(n.label + '.commonTools.WaitForByQuery : skipping visibility of a NULL element');
                            }
                        });
                        if (theResult.length > 0){
                            //
                            //  We have found the candidates..
                            //  Stopping the Interval, logging and issuing the callback....
                            //
                            clearInterval(intId);
                            myLog(n.label + '.commonTools.WaitForByQuery : candidates ' + elXpath + ' retrieved !');
                            myLog(theResult);
                            callback(theResult);
                        } else {
                            //
                            //  Maybe we need to continue searching, right ? 
                            //
                            myLog(n.label + '.commonTools.WaitForByQuery : NO VISIBLE element ' + elXpath + ' retrieved ! Continuing');
                            return;
                        }
                    } else {
                        //
                        //  We have found the candidates..
                        //  Stopping the Interval, logging and issuing the callback....
                        //
                        clearInterval(intId);
                        myLog(n.label + '.commonTools.WaitForByQuery : element ' + elXpath + ' retrieved !');
                        myLog(theQuery);
                        callback(theQuery);
                    }
                }
            }, waitTime);
        };
    }
    function WaitForDojo(label) {
        this.label = '***UNKNOWN***';
        if (label) this.label = label;
        myLog(this.label + '.WaitForDojo : initialising !');
        this.do = function(callback, maxInter, waitTime) {
            var n = this;
            myLog(this.label + '.WaitForDojo.do : executing !');
            if(!maxInter) maxInter = 50;  // number of intervals before expiring
            if(!waitTime) waitTime = 100;  // 1000=1 second

            var waitInter = 0;  // current interval
            var intId = setInterval(function() {
                myLog(n.label + '.commonTools.WaitForDojo.do : waiting for the ' + waitInter + 'th time...');
                if ((++waitInter < maxInter) && (typeof dojo === "undefined")) return;
                clearInterval(intId);
                if (waitInter >= maxInter) {
                    if (document.body.classList.contains('lotusError')) {
                        //  If we are on an error page, do not display the alert but simply log the information
                        myLog(n.label + '.commonTools.WaitForDojo.do : TIMEOUT Expired on Error page !');
                    } else {
                        myLog(n.label + '.commonTools.WaitForDojo.do : TIMEOUT EXPIRED !');
                    }
                    return;
                } else {
                    myLog(n.label + '.commonTools.WaitForDojo.do : DOJO is defined !');
                    myLog(n.label + '.commonTools.WaitForDojo.do : Issuing Dojo/DomReady!... ');
                    dojo.require("dojo.cookie");
                    require(["dojo/domReady!"], callback());
                }
            }, waitTime);
        };
    }
    function unCheckBox(theWidget) {
        //
        //  Makes sure the checkBox is really UNCHECKED by dispatching all the related events
        //
        if (dojo.getAttr(theWidget, "checked")) {
            myLog('commonTools.unCheckBox : changing checkbox to UNCHECKED...');
            let ownerDoc = theWidget.ownerDocument;
            let myEvent = ownerDoc.createEvent('MouseEvents');
            myEvent.initEvent('click', true, true);
            myEvent.synthetic = true;
            theWidget.dispatchEvent(myEvent, true);
            myLog('commonTools.unCheckBox : event dispatched to uncheck...');
            //
            //  The following statements are UNUSEFUL and even create side-effects.
            //  DO NOT USE THEM
            //
            //dojo.setAttr(theWidget, "value", false);
            //dojo.setAttr(theWidget, "checked", false);
            //dojo.removeAttr(theWidget, "disabled");
        } else {
            myLog('commonTools.unCheckBox : checkbox already UNCHECKED. Nothing to do...');
        }
    }
    function unCheckBox2(theWidget) {
        //
        //  Makes sure the checkBox is really UNCHECKED by dispatching all the related events
        //  I think that CHROME and IE11 behave differently when trying to change the checkbox of an
        //  element that is not visible
        //
        if (dojo.getAttr(theWidget, "checked")) {
            myLog('commonTools.unCheckBox2 : changing checkbox to UNCHECKED...');
            let ownerDoc = theWidget.ownerDocument;
            let myEvent = ownerDoc.createEvent('MouseEvents');
            myEvent.initEvent('click', true, true);
            myEvent.synthetic = true;
            theWidget.dispatchEvent(myEvent, true);
            myLog('commonTools.unCheckBox2 : event dispatched to uncheck...');
            if (dojo.isChrome || (navigator.appVersion.indexOf("Trident")!= -1)) {
                dojo.setAttr(theWidget, "value", false);
                dojo.setAttr(theWidget, "checked", false);
                dojo.removeAttr(theWidget, "disabled");
                myLog('commonTools.unCheckBox2 : supplemental code for IE or Chrome executed...');
            }
        } else {
            myLog('commonTools.unCheckBox2 : checkbox already UNCHECKED. Nothing to do...');
        }
    }
    //
    //
    //
    function myAlert(theString) {
        if (_sikaDebug) alert(theString);
    }
    function myLog(theString) {
        if (_sikaDebug) console.log(theString);
    }
    function myGetCookie(cname) {
        var name = cname + "=";
        var ca = document.cookie.split(';');
        for(var i = 0; i < ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0) == ' ') {
                c = c.substring(1);
            }
            if (c.indexOf(name) == 0) {
                return c.substring(name.length, c.length);
            }
        }
        return "";
    }

    function mySametime() {
        if (myGetCookie(__sikaSametimeCookie) === "") {
            //
            //  The special Sametime cookie is not set. 
            //  We force the user NOT TO AUTOLOGIN in Sametime
            //
            document.cookie = __stdSametimeCookie + "=no-auto-connect";
        } else {
            //
            //  The special Sametime cookie is set
            //  this means that the user wants to login automatically
            //  So we FORCE REMOVE the cookie
            //
            document.cookie = __stdSametimeCookie + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC;';
        }
    }
    //
    //  These are global variables reused throughout the scripts
    //
    var firstACL = new UserAllowed(_sikaCustomizerUUID);
    //var secondACL = new UserAllowed('adb2df5d-6041-435a-85f6-820a71dbf471');
    //var blackList = new UserDetails();
    var __sikaSametimeCookie = "SikaSametimeCookie";
    var __stdSametimeCookie = "stproxy.dock.notremembered";
    mySametime();
}