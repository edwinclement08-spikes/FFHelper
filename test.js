
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
        
        console.log(bookmarkItemValue);

        // delete it
        db = JSON.parse(localStorage.getItem("FFSaveLocation") || '{}');
        console.log(db);

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

        console.log(event.target);

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

    }, 150);

}


function bookmarkItemDelete(event) {
    var bookmarkItem = event.target.parentNode;

    var bookmarkItemName = bookmarkItem.children[0].value;
    console.log(bookmarkItemName);

    // delete it
    db = JSON.parse(localStorage.getItem("FFSaveLocation") || '{}');
    console.log(db);

    var ficId = ${ficId };
    var bookmarks = db.fics[ficId].bookmarks;
    for (let i = 0; i < bookmarks.length; i++) {
        if (bookmarks[i][0] == bookmarkItemName) {
            bookmarkItem.parentNode.removeChild(bookmarkItem);
            console.log("Deleted");
            db.fics[ficId].bookmarks.splice(i, 1);

            break;
        }
    }

    localStorage.setItem("FFSaveLocation", JSON.stringify(db));
    event.stopPropagation();

}


function bookmarkItemAdd(event) {
    db = JSON.parse(localStorage.getItem("FFSaveLocation") || '{}');
    console.log(db);

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

}

