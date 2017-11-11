// ==UserScript==
// @version       1.8
// @include       *.fanfiction.net/s/*
// @namespace     ffnet
// @name          Fanfiction.net story export script. v2
// @author        Edwin Clement
// @description   Writes all chapters of the story on one page.
// @require       http://code.jquery.com/jquery-1.12.4.min.js
// @require		  http://code.interactjs.io/v1.2.9/interact.js
// @changes       Rewrote some code to use jquery, changed design to fit the new ff.net scheme
// @grant         GM_xmlhttpRequest
// @grant         GM_addStyle
// ==/UserScript==

// Adapted from Alssn's Script


GM_addStyle(".edwin_color_white {  color:#fff ;}");



var chapters = [];

var style = $("<style type='text/css'> .ffne_action{padding-right: 7px; cursor:pointer;} .ffne_action:hover{} #ffne_export{ } #ffne{float:right;margin-left: 0.9em;} #ffne_button{font-size:1.3em;cursor:pointer;line-height: 1em;padding-right: 7px;} .ffne_hidden{display:none;}</style>");
$('body').append(style);

var db = JSON.parse(localStorage.getItem("FFSaveLocation") || '{}');
var scrollPoint;


function addButtons() {
    // Adding buttons
    res = document.getElementById('f_size');
    // creating links
    var node = $('.lc').first();
    var exportMenu = $('<span id="ffne"><span id="ffne_button" class="xcontrast_txt">fE</span></span>');
    var exportContainer = $('<span id="ffne_export"></span>');
    //var addHeadersButton = $('<span href="javascript:" class="ffne_action" title="Add header to each chapter">Headers</span>');
    //var addIndexButton = $('<span href="javascript:" class="ffne_action" title="Create table of contents">Index</span>');
    //var addTitleButton = $('<span href="javascript:" class="ffne_action" title="Insert title and author">Title</span>');
    var expAllButton = $('<span href="javascript:" class="ffne_action" id="exportAllButton" title="Show the whole story on one page">Story</span>');
    //var expRestButton = $('<span href="javascript:" class="ffne_action" id="exportRestButton" title="Export chapters from the current to the last one">Rest</span>');
    //var expButton = $('<span href="javascript:" class="ffne_action" title="Show only text">Text</span>');
    exportMenu.append(exportContainer);
    // exportContainer.append(expAllButton, expRestButton, expButton, '|&nbsp;&nbsp;', addHeadersButton, addTitleButton, addIndexButton);
    exportContainer.append(expAllButton);
    node.append(exportMenu);
    expAllButton.click(exportChapters);
    //expRestButton.click(exportRest);
    //expButton.click(exportCh);
    //addHeadersButton.click(addHeaders);
    //addTitleButton.click(addTitle);
    //addIndexButton.click(addIndex);
    $('#ffne_button').click(function () {
        var cont = $('#ffne_export');
        if (cont.hasClass('ffne_hidden')) { cont.removeClass('ffne_hidden'); } else { cont.addClass('ffne_hidden') ;}
    });
}

function addCompletionBadge(){
    var profileTop = $("#profile_top");

    var metadata = $("span.metadata");
    console.log(metadata);
    
}





(function() {
    'use strict';



    $('body').css("background-color", "#000");
    $('#content_parent').css("background-color", "#000");
    $('#content_wrapper').css("background-color", "#000");
    $('#storytext').addClass('edwin_color_white');
    $(' #profile_top').addClass('edwin_color_white');

    $(' #profile_top .xgray.xcontrast_txt').addClass("metadata").removeClass('xgray');


    _fontastic_change_width(75);
    $("#storytext").css("fontSize",  "1.5em");

    addCompletionBadge();


    //Adding buttons to page;
    addButtons();

    exportRest();
    addIndex();


    if (jQuery.isEmptyObject(db)){
        console.log("Error in finding DB");
        db = {};
        db.version = '0.2';
        db.fics = {};
        localStorage.setItem("FFSaveLocation", JSON.stringify(db));
    } else {
        var url = window.location.href;
        var ficIdRegex= /\/s\/(\d*)/;
        var ficId = url.match(ficIdRegex)[1];

        var ficName = $('#profile_top > b').text();


        if(db.fics[ficId]){
            if("scrollPoint" in db.fics[ficId]){
                scrollPoint = db.fics[ficId].scrollPoint;

            } else {
                db.fics[ficId].scrollPoint = 0;
                localStorage.setItem("FFSaveLocation", JSON.stringify(db));
            }
            if(!db.fics[ficId].bookmarks){
                db.fics[ficId].bookmarks = {};
            }
            var found = false;
            var bookmarks = db.fics[ficId].bookmarks;
            for (let i = 0; i < bookmarks.length; i++) {
                if (bookmarks[i][0] == "last") {
                    db.fics[ficId].bookmarks[i][1] = scrollPoint;
                    found = true;
                    break;
                }
            }
            if(!found){
                db.fics[ficId].bookmarks.push(["last", scrollPoint]);
            }
            localStorage.setItem("FFSaveLocation", JSON.stringify(db));
        } else {
            db.fics[ficId] = {"Name": ficName, "scrollPoint": 0};
            localStorage.setItem("FFSaveLocation", JSON.stringify(db));
        }
    }


    createBookmarksBar();


    interact('.draggable')
        .draggable({
        // enable inertial throwing
        inertia: true,
        // keep the element within the area of it's parent
        restrict: {
            restriction: "parent",
            endOnly: true,
            elementRect: { top: 0, left: 0, bottom: 1, right: 1 }
        },
        // enable autoScroll
        autoScroll: true,

        // call this function on every dragmove event
        onmove: dragMoveListener,
        // call this function on every dragend event
        onend: function (event) {
            var textEl = event.target.querySelector('p');

            if(textEl) (textEl.textContent =        'moved a distance of '     + (Math.sqrt(event.dx * event.dx + event.dy * event.dy)|0) + 'px');
        }
    });

    function dragMoveListener (event) {
        var target = event.target,
            // keep the dragged position in the data-x/data-y attributes
            x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx,
            y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;

        // translate the element
        target.style.webkitTransform =
            target.style.transform =
            'translate(' + x + 'px, ' + y + 'px)';

        // update the posiion attributes
        target.setAttribute('data-x', x);
        target.setAttribute('data-y', y);
    }


})();


//Adding table of contents
function addIndex() {
    var chapters = $('div[name="ffnee_chapter"]');
    var index = $('<div id="ffnee_index"><h2>Table of contents</h2></div>');
    var toC = $('<ol></ol>');
    index.append(toC);
    for (var i = 0; i < chapters.length; i++) {
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
function exportCh() {
    document.body.innerHTML = '<div style=\'padding-left:2em;padding-right:2em;padding-top:1em;\'>' + document.getElementById('storytextp').innerHTML + '</div>';
    //Sadly, it is not possible to automatically copy text to clipboard in firefox without changing browser settings;
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
            return (select[i].innerHTML.split(/[. ]{2}/)[1]);
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
        console.log(e);
    }
}




function allChapterDoneEDWIN(){
    $(window).scrollTop(scrollPoint);
    
    $(document).on('scroll', function(){
        var url = window.location.href;
        var ficIdRegex= /\/s\/(\d*)/;
        var ficId = url.match(ficIdRegex)[1];

        if(db.fics){
            if(db.fics[ficId]){
                db = JSON.parse(localStorage.getItem("FFSaveLocation") || '{}');
                db.fics[ficId].scrollPoint = window.pageYOffset;
                localStorage.setItem("FFSaveLocation", JSON.stringify(db));
            } else {
                var ficName = $('#profile_top > b').text();
                db = JSON.parse(localStorage.getItem("FFSaveLocation") || '{}');
                db.fics[ficId] = {"Name": ficName, "scrollPoint": window.pageYOffset};
                localStorage.setItem("FFSaveLocation", JSON.stringify(db));
            }
        } else {
            console.log("DATABASE LOST, ERROR");
        }


    });
}

function createBookmarksBar (){
    var body = $('body');

    var style = $(`<style type='text/css'>
#bookmarksDiv {position:fixed; background:lightgrey; border: grey thin solid; top:20%; left:1%;  min-height: 10%; min-width: 10%; user-select:none !important ; z-index:100;}
#bookmarksDiv > .title_edwin {padding:5px;  border: grey thin solid; }
#bookmarksDiv .content_edwin  {padding:2px;}
#bookmarksDiv .content_edwin .bookmarkItem {    border: grey 2px solid; margin: 2px;}
#bookmarksDiv .content_edwin .bookmarkItem input {width:100px; cursor:pointer}
#bookmarksDiv .content_edwin .bookmarkItem span {padding:5px; cursor:pointer}
#bookmarksDiv .drag_right_edwin {float: right; padding: 0px 2px;}
.hvr-temp {  display: inline-block;  vertical-align: middle;  -webkit-transform: perspective(1px) translateZ(0);  transform: perspective(1px) translateZ(0);  box-shadow: 0 0 1px transparent;  overflow: hidden;  -webkit-transition-duration: 0.3s;  transition-duration: 0.3s;  -webkit-transition-property: color, background-color, box-shadow;    transition-property: color, background-color,  box-shadow;}
.hvr-temp:hover, .hvr-temp:focus, .hvr-temp:active {  background-color: #2098D1;  color: white;  box-shadow: 0 0 8px rgba(0, 0, 0, 0.6);}
.bookmark-tag {    color: cornsilk;    position: absolute;   background-color: seagreen;    padding: 5px;    z-index: 0;}
</style>`);

    body.append(style);

    var bookmarksDiv = $('<div id="bookmarksDiv" class="draggable"><div class="title_edwin">Bookmarks<span class="drag_right_edwin hvr-temp" onclick="bookmarkItemAdd(event);">+</span></div><div class="content_edwin"></div></div>');
    var contentArray = [];
    var url = window.location.href;
    var ficIdRegex= /\/s\/(\d*)/;
    var ficId = url.match(ficIdRegex)[1];



    if(db.fics){
        if(db.fics[ficId]){
            db = JSON.parse(localStorage.getItem("FFSaveLocation") || '{}');
            var bookmarks = db.fics[ficId].bookmarks;
            if(bookmarks){
                for(let i = 0; i < bookmarks.length;i++){
                    var bookmarkNo = i;

                    var node = `<div class="bookmarkItem" onclick="bookmarkItemClick(event)">
<input class="BookmarkName" type="text" value="${bookmarks[i][0]}" readonly="true" ondblclick="editBoxDblClick(event);" onkeydown="editBoxKey(event);" >
<input class="ScrollPoint" type="number" value="${bookmarks[i][1]}" readonly="true" ondblclick="editBoxDblClick(event);" onkeydown="editBoxKey(event);">
<span class="hvr-temp" onclick="bookmarkItemDelete(event);">x</span>
</div>`;
                    var tag = `<div class="bookmark-tag" style="top:${bookmarks[i][1] + 30}px"><b>${bookmarks[i][0]}</b></div>`;
                    body.prepend(tag);
                    contentArray.push(node);
                }
                //localStorage.setItem("FFSaveLocation", JSON.stdraggableringify(db));
            } else {
                db.fics[ficId].bookmarks = [["last", db.fics[ficId].scrollPoint]];
                localStorage.setItem("FFSaveLocation", JSON.stringify(db));
            }
        }
    }
    var allBookmarks = $(contentArray.join(""));
    body.prepend(bookmarksDiv);
    $("#bookmarksDiv .content_edwin").append(allBookmarks);


    script = $(`<script>

var timer;
function editBoxDblClick(event) {
    if (timer) clearTimeout(timer);
    event.target.readOnly = false;
}

function editBoxKey(event) {
    if (event.key == "Enter") {

        event.target.readOnly = true;
        ///////////
        var bookmarkItem = event.target.parentNode;

        var bookmarkItemName = bookmarkItem.children[0].value;
        var bookmarkItemValue = bookmarkItem.children[1].value;

        
        // delete it
        db = JSON.parse(localStorage.getItem("FFSaveLocation") || '{}');
        
        var ficId = ${ficId };
        var bookmarks = db.fics[ficId].bookmarks;
        for (let i = 0; i < bookmarks.length; i++) {
            if (bookmarks[i][0] == bookmarkItemName) {
                db.fics[ficId].bookmarks[i][1] = bookmarkItemValue;
                break;
            }
        }
        localStorage.setItem("FFSaveLocation", JSON.stringify(db));
        /////////////

        
        // update the value
    } else {
    }
}

function bookmarkItemClick(event) {
    if (timer) clearTimeout(timer);

    timer = setTimeout(function () {
        var target = event.target;
        if (event.target.tagName == "INPUT") {
            target = target.parentNode;
        }

        if (target.children.length == 3) {
            window.scroll(0, target.children[1].value);
        } else {
            console.log("BULLSHIT");
        }

    }, 250);

}


function bookmarkItemDelete(event) {
    var bookmarkItem = event.target.parentNode;

    var bookmarkItemName = bookmarkItem.children[0].value;
    
    // delete it
    db = JSON.parse(localStorage.getItem("FFSaveLocation") || '{}');
    
    var ficId = ${ficId };
    var bookmarks = db.fics[ficId].bookmarks;
    for (let i = 0; i < bookmarks.length; i++) {
        if (bookmarks[i][0] == bookmarkItemName) {
            bookmarkItem.parentNode.removeChild(bookmarkItem);
            db.fics[ficId].bookmarks.splice(i, 1);

            break;
        }
    }

    localStorage.setItem("FFSaveLocation", JSON.stringify(db));
    event.stopPropagation();

}


function bookmarkItemAdd(event) {
    db = JSON.parse(localStorage.getItem("FFSaveLocation") || '{}');
    
    var ficId = ${ficId };

    db.fics[ficId].bookmarks.push(["BM-" + window.pageYOffset, window.pageYOffset]);
    localStorage.setItem("FFSaveLocation", JSON.stringify(db));

    var node = \`<div class="bookmarkItem" onclick="bookmarkItemClick(event)">
<input class="BookmarkName" type="text" value="\`+"BM-"+window.pageYOffset +\`" readonly="true" ondblclick="editBoxDblClick(event);" onkeydown="editBoxKey(event);" >
<input class="ScrollPoint" type="number" value="\` +window.pageYOffset +\`" readonly="true" ondblclick="editBoxDblClick(event);" onkeydown="editBoxKey(event);">
<span class="hvr-temp" onclick="bookmarkItemDelete(event);">x</span>
</div>\`;


var content = document.querySelector("#bookmarksDiv .content_edwin");
content.innerHTML = content.innerHTML + node;
    event.stopPropagation();

}



</script>`);
    body.append(script);
}

