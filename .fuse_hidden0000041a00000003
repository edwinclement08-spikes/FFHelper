script = $(`<script>
var timer;
function editBoxDblClick(event) {
    if (timer) clearTimeout(timer);
    event.target.readOnly = false;
    event.target.setAttribute("original", event.target.value);
}

function editBoxKey(event) {
    if (event.key == "Enter") {
        event.target.readOnly = true;

        inputName = event.target.className;

        var bookmarkItem = event.target.parentNode;
        var bookmarkItemName = bookmarkItem.children[0].value;
        var bookmarkItemValue = bookmarkItem.children[1].value;

        // delete it
        db = JSON.parse(localStorage.getItem("FFSaveLocation") || '{}');
        var ficId = ${ficId};
        var bookmarks = db.fics[ficId].bookmarks;

        if(inputName == "BookmarkName") {
            var bookmarkItemOldName = event.target.getAttribute("original");
            event.target.removeAttribute("original");

            for (let i = 0; i < bookmarks.length; i++) {
                if (bookmarks[i][0] == bookmarkItemOldName) {
                    console.log("GOTCHA");
                    db.fics[ficId].bookmarks[i][0] = bookmarkItemName;
                    break;
                }
            }
        } else if (inputName == "ScrollPoint"){
            event.target.removeAttribute("original");

            for (let i = 0; i < bookmarks.length; i++) {
                if (bookmarks[i][0] == bookmarkItemName) {
                    console.log("GOTCHA");
                    db.fics[ficId].bookmarks[i][1] = bookmarkItemValue;
                    break;
                }
            }
        }
        localStorage.setItem("FFSaveLocation", JSON.stringify(db));
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

    var ficId = ${ficId};
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

function toInt(n){ return Math.round(Number(n)); }

function bookmarkItemAdd(event) {
    db = JSON.parse(localStorage.getItem("FFSaveLocation") || '{}');

    var ficId = ${ficId};

    db.fics[ficId].bookmarks.push(["BM-" + toInt(window.pageYOffset), toInt(window.pageYOffset)]);
    localStorage.setItem("FFSaveLocation", JSON.stringify(db));

    var node = \`<div class="bookmarkItem" onclick="bookmarkItemClick(event)">
<input class="BookmarkName" type="text" value="\`+"BM-"+toInt(window.pageYOffset) +\`" readonly="true" ondblclick="editBoxDblClick(event);" onkeydown="editBoxKey(event);" >
<input class="ScrollPoint" type="number" value="\` +toInt(window.pageYOffset) +\`" readonly="true" ondblclick="editBoxDblClick(event);" onkeydown="editBoxKey(event);">
<span class="hvr-temp" onclick="bookmarkItemDelete(event)">x</span>
</div>\`;

var content = document.querySelector("#bookmarksDiv .content_edwin");
content.innerHTML = content.innerHTML + node;
    event.stopPropagation();
}

</script>`);

  // body.append(script);
  // 