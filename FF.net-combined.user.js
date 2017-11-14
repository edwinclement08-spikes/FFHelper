// ==UserScript==
// @version       0.7
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
// @require     https://greasyfork.org/scripts/17419-underscore-js-1-8-3/code/Underscorejs%20183.js?version=109803
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
.z-list .badge-local *{
padding:1px;
font-size:13px;
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

.badge-local-read-status{
background-color: #A9A7FF ;
color:#1E2520;
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
}

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
        enhanceBoth();
    }
});

function generateFic(ficId, ficName) {
    loadDB();
    var ficInfo = {
        "Name": ficName,
        "scrollPoint": 0,
        "bookmarks": [["last", 0]],
        "opinion": FIC_BLANK
    };

    db.fics[ficId] = ficInfo;
    saveDB();
    logger.log(["NEW FIC GEN", db.fics[ficId]]);
}


function enhanceStory() {
    $('body').addClass("night-mode");
    $('#content_parent').addClass("night-mode");
    $('#content_wrapper').addClass("night-mode");
    $('#storytext').addClass('night-mode');
    $('#profile_top').addClass('night-mode');
    $('.lc').addClass('night-mode');

    $("#content_wrapper").css('background-color', 'inherit');
    $("body").css('background-color', '');

    // add another class so that we can quickly navigate to that afterwords
    $('#profile_top .xgray.xcontrast_txt').addClass("metadata").removeClass('xgray');

    // set default width and font size
    _fontastic_change_width(75);
    $("#storytext").css("fontSize", "1.5em");

    

    //Adding buttons to page;
    addButtons();
    exportRest();

    var ficName = $('#profile_top > b').text();
    if (!db.fics[pageId]) {
        generateFic(pageId, ficName);
    }

    scrollPoint = db.fics[pageId].scrollPoint;


    var found = false;
    var bookmarks = db.fics[pageId].bookmarks;

    for(let i = 0; i < bookmarks.length; i++) {
        if (bookmarks[i][0] == "last") {
            db.fics[pageId].bookmarks[i][1] = scrollPoint;
            found = true;
            break;
        }
    }
    if (!found) {
        db.fics[pageId].bookmarks.push(["last", scrollPoint]);
    }
    saveDB();

    createBookmarksDiv();

    // $("#storytextp").css("-webkit-user-select", "text"); /* Chrome, Opera, Safari */
    // $("#storytextp").css("-moz-user-select", "text"); /* Firefox 2+ */
    // $("#storytextp").css("-ms-user-select", "text"); /* IE 10+ */
    $("#storytextp").css("user-select", "text"); /*Standard syntax */
    logger.log(["After", $("#storytextp")]);
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


//Adding table of contents
function addIndex() {
    var _chapters = $('div[name="ffnee_chapter"]');
    var index = $('<div id="ffnee_index"><h2>Table of contents</h2></div>');
    var toC = $('<ol></ol>');
    index.append(toC);
    for (let i = 0; i < _chapters.length; i++) {
        var item = $(_chapters[i]); //chapter we are currently processing
        toC.append($('<li><a href="#' + item.attr('id') + '">' + item.attr('title') + '</a></li>'));
    }
    $('#storytext').prepend(index);
}
//adding headers, as entered by author
function addHeaders() {
    var _chapters = document.getElementsByName('ffnee_chapter');
    for (let i = 0; i < _chapters.length; i++) {
        var item = _chapters.item(i); //chapter to which we are adding a header
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

    if (chap_select)
        exportChapters(e, chap_select.value - 1);
    else    {
        allChapterDoneEDWIN();
        logger.log("It's a single Chapter fic ");
    }
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
                loadDB();
                db.fics[pageId].scrollPoint = window.pageYOffset;
                saveDB();
            }
        }
    });

    // get maximum scrollable position and set it
    // if not set, the "read" badge won't appear
    var limit = Math.max( document.body.scrollHeight, document.body.offsetHeight,
        document.documentElement.clientHeight, document.documentElement.scrollHeight, document.documentElement.offsetHeight );
    db.fics[pageId].maxScroll = limit;
    saveDB();


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
            logger.log("BookmarksDivHandler :: no save area found on init")
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

                    if (!found) {
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


function enhanceUser() {
    $('body').addClass("night-mode");
    $("body")[0].style = "margin-top: 0px;";
    $("#content_wrapper").css('background-color', 'inherit');

    $("#content_wrapper_inner a").addClass("link_colored");

    $("div.mystories").find(".z-indent.z-padtop .z-padtop2 ").removeClass("xgray").addClass("metadata");


}

// Fics:
const FIC_LIKED = 0;
const FIC_DISLIKED = 1;
const FIC_MARKED = 2;
const FIC_CALIBRE = 3;
const FIC_BLANK = -1;

// Read Complete:
const FIC_READ = 1;
const FIC_UNREAD = 0;

// Colors. now used for like/dislike/etc links
const COLOR_LIKED = '#C4FFCA';
const COLOR_DISLIKED = '#FCB0B0';
const COLOR_MARKED = '#8F8F8F';
const COLOR_CALIBRE = '#F1D173';
const COLOR_CLEARED = '#FFF';


$("body").append($(`<style>

#content_wrapper_inner .link_colored {color: #79a00f;}
#content_wrapper_inner  .ffn_like  .link_colored    {color: rgb(96, 0, 255);    }
#content_wrapper_inner .ffn_dislike .link_colored  {color: rgb(114, 6, 6);}
#content_wrapper_inner  .ffn_mark .link_colored {color: rgb(95, 0, 0);}
#content_wrapper_inner  .ffn_calibre .link_colored  {color: rgb(95, 0, 0);}


span.ffn_like     {}
span.ffn_mark     {}
span.ffn_calibre  {}
span.ffn_dislike  { text-decoration: line-through; font-weight: bold; }
.ffn_like      { background-color:${COLOR_LIKED}    !important; color:black !important; }
.ffn_dislike   { background-color:${COLOR_DISLIKED} !important; color:black !important; }
.ffn_mark      { background-color:${COLOR_MARKED}   !important; color:black !important; }
.ffn_calibre   { background-color:${COLOR_CALIBRE}  !important; color:black !important; }

.ffh_buttons    {
    padding         : 1px;
    border-radius   : 2px;
    margin-right    : 4px;
    cursor          : pointer;
    border          : thin black solid;
}
.ffh_buttons  span{
    color           : black;
}

.like_story  {
    background-color: ${COLOR_LIKED};
}
.dislike_story   {
    background-color: ${COLOR_DISLIKED};
}
.mark_story  {
    background-color: ${COLOR_MARKED};
}
.calibre_story   {
    background-color: ${COLOR_CALIBRE};
}
.clear_story {
    background-color: ${COLOR_CLEARED};
}
.new_like_actions {
    margin:0px 0px 0px 20px;
    font-size:11px;
    padding: 5px;
}

#profile_top, .z-list   {
    padding: 4px;
    border: thin solid black;
    border-radius: 5px;
}
</style>`));

function enhanceBoth() {
    $(".z-list").each(function () {
        var story = new Story({ instance: this });
        // app.collection.push(story);
    });

    // links on reading page
    $("div#profile_top").each(function () {
        var story = new Story({ instance: this });
        // app.collection.push(story);
    });

    // hide/show options
    $('div#content_wrapper_inner').after(
        '<div class="liker_script_options" style="padding:5px; border:1px solid #333399; margin-bottom:5px; background:#D8D8FF;">' +
        '<b>Liker Options:</b> ' +
        '</div>'
    );
}

class Story {
    constructor(options) {
        this.storyElem = $(options.instance);
        var titleLink_UserPage = this.storyElem.find(".stitle").attr("href");
        this.template = $(`
        <div class="new_like_actions">
            Story:
            <span href="" class="ffh_buttons like_story">      <span>Like     </span></span>
            <span href="" class="ffh_buttons dislike_story">   <span>Dislike  </span></span>
            <span href="" class="ffh_buttons mark_story">      <span>Mark     </span></span>
            <span href="" class="ffh_buttons calibre_story">   <span>Calibre  </span></span>
            <span href="" class="ffh_buttons clear_story">     <span>Clear    </span></span>
        </div>`);
        this.storyElem.append(this.template);

        this.addActions();

        try {
            if (titleLink_UserPage) {
                // its a UserPage
                this.pageId = this.storyElem.find(".stitle").attr("href").match(/\/s\/(\d*)/)[1];
                this.ficName = this.storyElem.find(".stitle").text();
            } else {
                // its a storyPage
                this.pageId = this.storyElem.find("span.xcontrast_txt > a").get(1).href.match(/.*\/r\/(\d*)/)[1];
                this.ficName = this.storyElem.find("b.xcontrast_txt").text();
            }
        }
        catch (e) {
            // statements to handle any exceptions
            alert("Can't find the ficId"); ``
            logger.log("Error: Can't find the ficId");
        }

        if (!db.fics[this.pageId] || jQuery.isEmptyObject(db.fics[this.pageId])) {
            generateFic(this.pageId, this.ficName);
        }

        if (!jQuery.isEmptyObject(db.fics[this.pageId]) && "opinion" in db.fics[this.pageId]) {
            // Show those info
            switch (db.fics[this.pageId].opinion) {
                case FIC_LIKED:
                    this.like();
                    break;
                case FIC_DISLIKED:
                    this.dislike();
                    break;
                case FIC_MARKED:
                    this.mark();
                    break;
                case FIC_CALIBRE:
                    this.calibre();
                    break;
                case FIC_BLANK:
                default:
                    this.removeOtherClasses();
            }


        } else {
            // Initialize it
            db.fics[this.pageId].opinion = FIC_BLANK;
            saveDB();
        }

        // add the badges
        this.addCompletionBadge();
        this.addReadBadge();
    }
    addActions() {
        var buttonBar = this.storyElem.find('.new_like_actions');

        buttonBar.find('.like_story').click(this.like.bind(this));
        buttonBar.find('.dislike_story').click(this.dislike.bind(this));
        buttonBar.find('.mark_story').click(this.mark.bind(this));
        buttonBar.find('.calibre_story').click(this.calibre.bind(this));
        buttonBar.find('.clear_story').click(this.clear.bind(this));
    }

    saveFic() {
        saveDB();
    }

    loadFic() {
        loadDB();
    }

    like() {
        this.loadFic();
        this.removeOtherClasses();
        this.storyElem.addClass("ffn_like");

        db.fics[this.pageId].opinion = FIC_LIKED;
        this.saveFic();
    }

    dislike() {
        this.loadFic();
        this.removeOtherClasses();
        this.storyElem.addClass("ffn_dislike");

        db.fics[this.pageId].opinion = FIC_DISLIKED ;
        this.saveFic();
    }
    mark() {
        this.loadFic();
        this.removeOtherClasses();
        this.storyElem.addClass("ffn_mark");
        db.fics[this.pageId].opinion = FIC_MARKED ;
        this.saveFic();
    }
    calibre() {
        this.loadFic();
        this.removeOtherClasses();
        this.storyElem.addClass("ffn_calibre");
        db.fics[this.pageId].opinion = FIC_CALIBRE ;
        this.saveFic();
    }
    clear() {
        this.loadFic();
        this.removeOtherClasses();
        db.fics[this.pageId].opinion = FIC_BLANK ;
        this.saveFic();
    }
    removeOtherClasses(){
        this.storyElem.removeClass("ffn_like ffn_dislike ffn_mark ffn_calibre");
    }

    getBadge(type, primary, secondary) {
        return `
        <span class="badge-local badge-local-${type}">
            <span class="status">
                ${primary}
            </span>
            <span class="noOfWords">
                ${secondary}
            </span>
        </span>
        `;
    }

    getTitle()  {
        var title = this.storyElem.find("b");

        if (title.length == 0) {
            title = this.storyElem.find("a.stitle");
        }
        return title
    }

    addCompletionBadge() {
        var storyMetaData = this.storyElem.find(".metadata").text();
        var completedRegEx = /Complete/;
        var isCompleted = completedRegEx.test(storyMetaData);

        var noOfWords;
        var wordRegex = /Words:\s([\d,]*)/;
        if (wordRegex.test(storyMetaData) && storyMetaData.match(wordRegex).length == 2) {
            noOfWords = storyMetaData.match(wordRegex)[1];
        }

        var completionBadge = this.getBadge((isCompleted ? "completed" : "wip"), (isCompleted ? "Completed" : "Work in Progress"), noOfWords);

        var title = this.getTitle();
        title.after($(completionBadge));
    }

    addReadBadge() {
        if(db.fics[this.pageId]){
            if(db.fics[this.pageId].maxScroll)   {
                var readVal = toInt(db.fics[this.pageId].scrollPoint / db.fics[this.pageId].maxScroll * 100);
                var ReadBadge = this.getBadge("read-status",
                (readVal > 95) ? "Read" : "Unread",
                readVal);

                var title = this.getTitle();
                title.after($(ReadBadge));
            }
        }        
    }
}