// ==UserScript==
// @version       0.6
// @include       *.fanfiction.net/s/*
// @include       *.fanfiction.net/u/*
// @namespace     tag:edwinclement08@gmail.com,2017-10-08:FFnetHelper
// @name          FFnetHelper
// @author        Edwin Clement
// @description   Adds some helpful Features for browsing FF.net
// @changes       Rewrote some code to use jquery, changed design to fit the new ff.net scheme
// @grant         GM_xmlhttpRequest
// @grant         GM_addStyle
// @require       http://code.jquery.com/jquery-1.12.4.min.js
// ==/UserScript==

// Credit
// FanFictionNavigator (by Andy Scull)  https://greasyfork.org/en/scripts/25670-fanfictionnavigator
// Fanfiction.net story export script (by Alssn) https://greasyfork.org/en/scripts/6272-fanfiction-net-story-export-script

/*jslint es6:true*/
"use strict";


$("body").append($(`<style>
.night-mode {
    color:#fff ;
    background-color: #000;
}

/* Bookmarks Division */
#bookmarksDiv {
    position:fixed;
    background:lightgrey;
    border: grey thin solid;
    top:75%; left:80%;
    min-height: 10%; min-width: 10%;
    user-select:none !important;
    z-index:100;
}
.bookmark-tag {
    color: cornsilk;
    position: absolute;
    background-color: seagreen !important;
    padding: 5px;
    z-index: 0;
}

#bookmarksDiv > .title_edwin                        {padding:5px; border: grey thin solid; color: black; user-select:none !important;}
#bookmarksDiv .content_edwin                        {padding:2px;}
#bookmarksDiv .content_edwin .#content_wrapperbookmarkItem          {border: grey 2px solid; margin: 2px;}
#bookmarksDiv .content_edwin .bookmarkItem input    {width:85px; cursor:pointer}
#bookmarksDiv .content_edwin .bookmarkItem span     {padding:5px; cursor:pointer}
#bookmarksDiv .drag_right_edwin                     {float: right; padding: 0px 2px;}
.hvr-temp {  display: inline-block;  vertical-align: middle;  -webkit-transform: perspective(1px) translateZ(0);  transform: perspective(1px) translateZ(0);  box-shadow: 0 0 1px transparent;  overflow: hidden;  -webkit-transition-duration: 0.3s;  transition-duration: 0.3s;  -webkit-transition-property: color, background-color, box-shadow;    transition-property: color, background-color,  box-shadow;}
.hvr-temp:hover, .hvr-temp:focus, .hvr-temp:active {  background-color: #2098D1;  color: white;  box-shadow: 0 0 8px rgba(0, 0, 0, 0.6);}

/* Badges */
.badge-local {
margin: 2px;
border-radius: 5px;
}
.badge-local > *{
display:inline-block;
padding:2px;
}
.badge-local .status{
font-weight:bold;
}

.badge-local .noOfWords{
border-left: #63746B solid thin;
}

.badge-local-completed{
background-color: #B2C3B3 ;
color:#1E2520;
border: #63746B solid thin;
display:inline-block;
}

.badge-local-wip{
background-color: #F09090 ;
color:#621122;
border: #63746B solid thin;
display:inline-block;
}

/* ffnet */
.ffne_action {padding-right: 7px; cursor:pointer;}
.ffne_action:hover {}
#ffne_export {}
#ffne {float:right;margin-left: 0.9em;}
#ffne_button {font-size:1.3em;cursor:pointer;line-height: 1em;padding-right: 7px;}
.ffne_hidden {display:none;}
</style>`));

var logger = {};
function log(item) {        // to have more recognizable logs
    console.log("FFnetHelper v0.5 | ", item);
}
logger.log = log;

function toInt(n) { return Math.round(Number(n)); }


function saveDB() {
    localStorage.setItem("FFSaveLocation", JSON.stringify(db));
}

function loadDB() {
    db = JSON.parse(localStorage.getItem("FFSaveLocation") || '{}');
}


var chapters = [];
var db = JSON.parse(localStorage.getItem("FFSaveLocation") || '{}');
var scrollPoint;
var pageURL = window.location.href;
var pageType;
var pageId;
var x_pos = 0;
var y_pos = 0;

if (jQuery.isEmptyObject(db)) {
    logger.log("Empty DB. First time running?");
    db = {};
    db.version = '0.2';
    db.fics = {};
    localStorage.setItem("FFSaveLocation", JSON.stringify(db));
} else {
    $(function () {
        'use strict';
        var pageRE = /http[s]:\/\/www.fanfiction.net\/(s|u)\/(\d*)(.*)/;
        var pageInfo = pageURL.match(pageRE);
        if (pageInfo.length > 2) {
            pageType = pageInfo[1];
            pageId = pageInfo[2];
            if (pageInfo[1] === "s") {
                // Its a story
                logger.log("Story Detected.");
                enhanceStory();
            } else if (pageInfo[1] === "u") {
                // Its a user
                logger.log("User Detected.");
                enhanceUser();
            }
        }
    });
}

function enhanceUser() {
    $('body').addClass("night-mode");
    $("body")[0].style = "margin-top: 0px;";
    $("#content_wrapper").css('background-color', 'inherit');
    $("#content_wrapper_inner a").css('color', '#79a00f');

    // TODO s
}

function enhanceStory() {
    $('body').addClass("night-mode");
    $('#content_parent').addClass("night-mode");
    $('#content_wrapper').addClass("night-mode");
    $('#storytext').addClass('night-mode');
    $('#profile_top').addClass('night-mode');
    $('.lc').addClass('night-mode');

    $("#content_wrapper").css('background-color', 'inherit');
    $("body").css('background-color', 'inherit');

    // add another class so that we can quickly navigate to that afterwords
    $('#profile_top .xgray.xcontrast_txt').addClass("metadata").removeClass('xgray');

    // set default width and font size
    _fontastic_change_width(75);
    $("#storytext").css("fontSize", "1.5em");

    // add the badges
    addCompletionBadge();
    //Adding buttons to page;
    addButtons();
    exportRest();

    var ficName = $('#profile_top > b').text();
    if (!db.fics[pageId])  {
        db.fics[pageId] = { "Name": ficName, "scrollPoint": 0 };
        saveDB();
    }

    // if (db.fics[pageId]) {
    //     if ("scrollPoint" in db.fics[pageId]) {
    //         scrollPoint = db.fics[pageId].scrollPoint;
    //     } else {
    //         db.fics[pageId].scrollPoint = 0;
    //         localStorage.setItem("FFSaveLocation", JSON.stringify(db));
    //     }
    //     if (!db.fics[pageId].bookmarks) {
    //         db.fics[pageId].bookmarks = {};
    //     }
    //     var found = false;
    //     var bookmarks = db.fics[pageId].bookmarks;

    //     for(let i = 0; i < bookmarks.length; i++) {
    //         if (bookmarks[i][0] == "last") {
    //             db.fics[pageId].bookmarks[i][1] = scrollPoint;
    //             found = true;
    //             break;
    //         }
    //     }
    //     if (!found) {
    //         db.fics[pageId].bookmarks.push(["last", scrollPoint]);
    //     }
    //     localStorage.setItem("FFSaveLocation", JSON.stringify(db));
    // } else {
    //     db.fics[pageId] = { "Name": ficName, "scrollPoint": 0 };
    //     localStorage.setItem("FFSaveLocation", JSON.stringify(db));
    // }

    createBookmarksDiv();
}

function addButtons() {
    // Adding buttons
    var res = document.getElementById('f_size');
    // creating links
    var node = $('.lc').first();
    var exportMenu = $('<span id="ffne"><span id="ffne_button" class="xcontrast_txt">fE</span></span>');
    var exportContainer = $('<span id="ffne_export"></span>');
    var expAllButton = $('<span href="javascript:" class="ffne_action" id="exportAllButton" title="Show the whole story on one page">Story</span>');
    exportMenu.append(exportContainer);
    exportContainer.append(expAllButton);
    node.append(exportMenu);
    expAllButton.click(exportChapters);
    $('#ffne_button').click(function () {
        var cont = $('#ffne_export');
        if (cont.hasClass('ffne_hidden')) { cont.removeClass('ffne_hidden'); } else { cont.addClass('ffne_hidden'); }
    });
}

function addCompletionBadge() {
    var profileTop = $("#profile_top");
    var storyMetaData = profileTop.find("span.metadata").text();
    var completedRegEx = /Complete/;
    var isCompleted = completedRegEx.test(storyMetaData);

    var noOfWords;
    var wordRegex = /Words:\s([\d,]*)/;
    if (wordRegex.test(storyMetaData) && storyMetaData.match(wordRegex).length == 2) {
        noOfWords = storyMetaData.match(wordRegex)[1];
    }

    var badgeTemplate = `
    <span class="badge-local badge-local-${isCompleted ? "completed" : "wip"}">
        <span class="status">
            ${isCompleted ? "Completed" : "Work in Progress"}
        </span>
        <span class="noOfWords">
            ${noOfWords}
        </span>
    </span>
    `;
    var title = profileTop.find("b");
    title.after($(badgeTemplate));
}


//Adding table of contents
function addIndex() {
    var chapters = $('div[name="ffnee_chapter"]');
    var index = $('<div id="ffnee_index"><h2>Table of contents</h2></div>');
    var toC = $('<ol></ol>');
    index.append(toC);
    for (let i = 0; i < chapters.length; i++) {
        var item = $(chapters[i]); //chapter we are currently processing
        toC.append($('<li><a href="#' + item.attr('id') + '">' + item.attr('title') + '</a></li>'));
    }
    $('#storytext').prepend(index);
}
//adding headers, as entered by author
function addHeaders() {
    var chapters = document.getElementsByName('ffnee_chapter');
    for (var i = 0; i < chapters.length; i++) {
        var item = chapters.item(i); //chapter to which we are adding a header
        var header = document.createElement('p');
        header.innerHTML = '<h2>Chapter ' + (i + 1) + ': ' + item.getAttribute('title') + '</h2>';
        item.insertBefore(header, item.firstChild);
    }
}

function addTitle() {
    var titleText = $('b.xcontrast_txt', '#profile_top').first().html();
    var title = $('<h1>' + titleText + '</h1>');
    var authorText = $('a.xcontrast_txt[href^="/u/"]', '#profile_top').first().html();
    var author = $('<h2>' + authorText + '</h2>');
    var storytext = $('#storytext');
    storytext.prepend(author, title);
}

function exportRest(e) {
    var chap_select = document.getElementById('chap_select');

    exportChapters(e, chap_select.value - 1);
}
function exportChapters(e, start, end) {
    // Main actions
    // Progress indicator
    var expDiv = document.getElementById('exportAllButton');
    var expText = expDiv.childNodes[0];
    var hr = location.href;
    var chapterNumIndex = hr.search(/\/\d{1,3}\//);
    //Getting number of chapters
    var storyLength = getLength();
    if (storyLength == 1) {
        expText.nodeValue = 'Oneshot';
        return;
    }
    if (start == undefined) {
        start = 0;
    }
    if (end == undefined) {
        end = storyLength;
    }
    storyLength = end - start;
    var totalStoryLength = storyLength;//reference
    //launching retrieving of all chapters simultaneously
    for (var i = start; i < end; i++) {
        loadChapter(i + 1, function (response, num) {
            chapters[num] = parseChapter(response, num + 1);
            expText.nodeValue = 'Export: Chapter ' + String(totalStoryLength - storyLength + 1) + ' out of ' + totalStoryLength;
            storyLength--;
            if (storyLength == 0) {
                parseStory(chapters);
                expText.nodeValue = 'Story (again)';
                addIndex();
                allChapterDoneEDWIN();
            }
        });
    }
}
// Converting chapters' array into a whole;
function parseStory(chapters) {
    var numCh = chapters.length;
    //document.body.innerHTML=chapters[0];
    var appendNode = document.getElementById('storytext');
    appendNode.innerHTML = '';
    var firstChapter = true;
    for (var i = 0; i < numCh; i++) {
        if (chapters[i] != undefined) {
            //findHeader(chapters[i]);  //smart header search
            var st = chapters[i];
            st.setAttribute('name', 'ffnee_chapter');
            st.setAttribute('id', 'ffnee_ch' + i);
            if (firstChapter) {
                firstChapter = false;
            } else {
                st.style.marginTop = '10em';
            }
            appendNode.appendChild(st);
        }
    }
    addHeaders();
    addTitle();
}
function parseChapter(chapterHtml, chapterNumber) {

    var t = document.createElement('div');
    t.innerHTML = chapterHtml;
    //extracting text only
    var ev = './/div[@id=\'storytext\']';
    var xpathResult = document.evaluate(ev, t, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    var chapterContent = document.createElement('div');
    chapterContent.setAttribute('title', chapterNumber + ". " + getChapterName(t));
    chapterContent.innerHTML = xpathResult.snapshotItem(0).innerHTML;
    return chapterContent;
}

function getChapterName(obj) {
    var select = obj.getElementsByTagName('select')[1].getElementsByTagName('option');
    for (var i = 0; i < select.length; i++) {
        if (select[i].getAttribute('selected') != null) {
            return (select[i].innerHTML.split(/[.\ ]{2}/)[1]);
        }
    }
}
//  Getting number of chapters;
function getLength() {
    var chNum = document.getElementById('chap_select');
    if (chNum == null) {
        numChapters = 1;
    } else {
        var numChapters = chNum.getElementsByTagName('option').length;
    }
    return (numChapters);
}

// This function loads chapters and extracts chapter's number and title
function loadChapter(num, callback) {
    var replStr = '\/' + String(num) + '\/';
    var hr = location.href;
    var currentURL = hr.replace(/\/\d{1,3}\//, replStr);
    try {
        var req = new XMLHttpRequest();
        req.open('get', currentURL, true);
        req.onload = function () {
            callback(req.responseText, num - 1);
        };
        req.send();
    } catch (e) {
        logger.log(e);
    }
}

function allChapterDoneEDWIN() {
    $(window).scrollTop(scrollPoint);
    $(document).on('scroll', function () {

        if (db.fics) {
            if (db.fics[pageId]) {
                db = JSON.parse(localStorage.getItem("FFSaveLocation") || '{}');
                db.fics[pageId].scrollPoint = window.pageYOffset;
                localStorage.setItem("FFSaveLocation", JSON.stringify(db));
            } else {
                var ficName = $('#profile_top > b').text();
                db = JSON.parse(localStorage.getItem("FFSaveLocation") || '{}');
                db.fics[pageId] = { "Name": ficName, "scrollPoint": window.pageYOffset };
                localStorage.setItem("FFSaveLocation", JSON.stringify(db));
            }
        }
    });
}
function createBookmarksDiv() {
    new BookmarksDivHandler();

    // Add Drag system
    document.getElementsByClassName('draggable')[0].addEventListener('mousedown', mouseDown, false);
    window.addEventListener('mouseup', mouseUp, false);
    function mouseUp() {
        window.removeEventListener('mousemove', divMove, true);
    }
    function mouseDown(e) {
        var div = document.getElementsByClassName('draggable')[0];
        x_pos = e.clientX - div.offsetLeft;
        y_pos = e.clientY - div.offsetTop;
        window.addEventListener('mousemove', divMove, true);
    }
    function divMove(e) {
        var div = document.getElementsByClassName('draggable')[0];
        //   div.style.position = 'absolute';
        div.style.top = (e.clientY - y_pos) + 'px';
        div.style.left = (e.clientX - x_pos) + 'px';
    }
}


class BookmarksDivHandler {
    constructor() {
        var bookmarksDivNode = $(
            `<div id="bookmarksDiv" class="draggable">
                <div class="title_edwin">Bookmarks
                <span class="drag_right_edwin hvr-temp">+</span>
            </div>
            <div class="content_edwin">
            </div>
        </div>`);

        $("body").prepend(bookmarksDivNode);

        this._elem = bookmarksDivNode[0];

        this.timer = null;

        if (db.fics[pageId] && !db.fics[pageId].bookmarks) {
            db.fics[pageId].bookmarks = [["last", db.fics[pageId].scrollPoint]];
            saveDB();
        }

        this.showBookmarkItems();

        this._elem.onclick = this.onClick.bind(this); // (*)
        this._elem.ondblclick = this.onDblClick.bind(this); // (*)
        this._elem.onkeydown = this.onKeyDown.bind(this); // (*)

    }

    showTags() {
        var tag = `<div class="bookmark-tag" style="top:${bookmarks[i][1] + 30}px"><b>${bookmarks[i][0]}</b></div>`;
        body.prepend(tag);

        // TODO d
    }

    showBookmarkItems() {
        var contentArray = [];
        if (db.fics && db.fics[pageId]) {
            var bookmarks = db.fics[pageId].bookmarks;
            if (bookmarks) {
                for (let i = 0; i < bookmarks.length; i++) {
                    var bookmarkNo = i;
                    var node = `<div class='bookmarkItem' >
                        <input class='BookmarkName' type='text' value='`+ bookmarks[i][0] + `' readonly='true' >
                        <input class='ScrollPoint' type='number' value='` + toInt(bookmarks[i][1]) + `' readonly='true' >
                        <span class='hvr-temp'>x</span>
                    </div>`;
                    contentArray.push(node);
                }
            }
        }
        var allBookmarks = $(contentArray.join(""));
        var content = $(this._elem).find(".content_edwin");
        content.empty();
        content.append(allBookmarks)
    }

    onClick(event) {
        if (this.timer) clearTimeout(this.timer);
        this.timer = setTimeout(function () {
            var target = event.target;
            if (target.tagName == "INPUT") {
                var parent = target.parentNode;

                if (parent.children.length == 3) {
                    window.scroll(0, parent.children[1].value);
                } else {
                    logger.log("Error on jumping: " + parent + " " + target);
                }
            } else if (target.tagName == "SPAN") {
                var parent = target.parentNode;
                if (parent.children.length == 3 && target.className == "hvr-temp") {    // do something better here
                    // delete
                    var bookmarkItem = parent;
                    var bookmarkItemName = bookmarkItem.children[0].value;

                    // reload DB so that we get any changes done before (in other tabs)
                    loadDB();
                    var bookmarks = db.fics[pageId].bookmarks;

                    // delete it
                    for (let i = 0; i < bookmarks.length; i++) {
                        if (bookmarks[i][0] == bookmarkItemName) {
                            db.fics[pageId].bookmarks.splice(i, 1);
                            break;
                        }
                    }

                    saveDB();               // Save changes
                    this.showBookmarkItems();              // display new list
                } else if (target.className == "drag_right_edwin hvr-temp") {
                    // create
                    loadDB();
                    var bookmarks = db.fics[pageId].bookmarks;

                    var newName = "BM-" + toInt(window.pageYOffset);

                    var found = false;
                    // delete it
                    for (let i = 0; i < bookmarks.length; i++) {
                        if (bookmarks[i][0] == newName && bookmarks[i][1] == toInt(window.pageYOffset)) {
                            found = true;
                            break;
                        }
                    }

                    if(!found)  {
                        db.fics[pageId].bookmarks.push(["BM-" + toInt(window.pageYOffset), toInt(window.pageYOffset)]);
                    }

                    saveDB();               // Save changes
                    this.showBookmarkItems();              // display new list
                } else {
                    logger.log("Unknown button clicked" + parent + " " + target);
                }
            }

        }.bind(this), 250);             // THIS WAS SOOOO ANNOYING ....
    };

    onDblClick(event) {
        if (this.timer) clearTimeout(this.timer);

        var target = event.target;
        if (target.tagName == "INPUT") {
            event.target.readOnly = false;
            event.target.setAttribute("original", event.target.value);
        }
    };

    onKeyDown(event) {

        var target = event.target;
        if (target.tagName == "INPUT") {

            if (event.key == "Enter") {
                target.readOnly = true;

                var inputName = target.className;

                var bookmarkItem = target.parentNode;
                var bookmarkItemName = bookmarkItem.children[0].value;
                var bookmarkItemValue = bookmarkItem.children[1].value;


                // delete it
                loadDB();
                var bookmarks = db.fics[pageId].bookmarks;

                if (inputName == "BookmarkName") {
                    var bookmarkItemOldName = target.getAttribute("original");
                    target.removeAttribute("original");

                    for (let i = 0; i < bookmarks.length; i++) {
                        if (bookmarks[i][0] == bookmarkItemOldName) {
                            db.fics[pageId].bookmarks[i][0] = bookmarkItemName;
                            break;
                        }
                    }
                } else if (inputName == "ScrollPoint") {
                    target.removeAttribute("original");

                    for (let i = 0; i < bookmarks.length; i++) {
                        if (bookmarks[i][0] == bookmarkItemName) {
                            db.fics[pageId].bookmarks[i][1] = bookmarkItemValue;
                            break;
                        }
                    }
                }
                saveDB();               // Save changes
                this.showBookmarkItems();              // display new list
            }
        }
    }
}

