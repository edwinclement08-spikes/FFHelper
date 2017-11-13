// ==UserScript==
// @name        FanFictionNavigator
// @name:ru     FanFictionNavigator
// @namespace   window
// @description:en  Mark and hide fanfics or authors
// @include     https://ficbook.net/*
// @include     https://www.fanfiction.net/*
// @include     https://archiveofourown.org/*
// @include     http://archiveofourown.org/*
// @include     https://tbooklist.org/*

// @require     https://code.jquery.com/jquery-1.7.2.min.js
// @require     https://greasyfork.org/scripts/17419-underscore-js-1-8-3/code/Underscorejs%20183.js?version=109803
// @version     18.1
// @grant       GM_addStyle
// @description Mark and hide fanfics or authors
// ==/UserScript==

// Based on https://chrome.google.com/webstore/detail/fanfiction-organizer/adlnghnicfngjnofbljedmclmdoepcbe
// by Stefan Hayden

// Modified by Edwin Clement

// Fics:
const FIC_LIKED = 0;
const FIC_DISLIKED = 1;
const FIC_MARKED = 2;
const FIC_CALIBRE = 3;

// Authors:
const AUTHOR_LIKED = 0;
const AUTHOR_DISLIKED = 1;

// colors. now used for like/dislike/etc links
const COLOR_LIKED = '#C4FFCA';
const COLOR_DISLIKED = '#FCB0B0';
const COLOR_MARKED = '#CCCCCC';
const COLOR_CALIBRE = '#F1D173';
const COLOR_CLEARED = '#FFF';
const COLOR_FB_CLEAR = '#FFF';


// styles for author/story links
GM_addStyle("a.ffn_dislike {text-decoration: line-through; font-weight: bold;}");
GM_addStyle("a.ffn_like {} ");
GM_addStyle("a.ffn_mark {}");
GM_addStyle("a.ffn_calibre {}");
GM_addStyle(".ffn_dislike {background-color:#FCB0B0 !important; color:black !important;}");
GM_addStyle(".ffn_like {background-color:#C4FFCA !important; color:black !important;}");
GM_addStyle(".ffn_mark {background-color:#CCCCCC !important; color:black !important;}");
GM_addStyle(".ffn_calibre {background-color:#F1D173 !important;  color:black !important;}");

GM_addStyle(".Edwin_Completed {background-color:grey !important; color:white !important}");


// styles for boxes, they differ between sites

/*
switch(window.location.hostname){
case "www.fanfiction.net":
case "tbooklist.org":
    GM_addStyle("div.ffn_dislike {background-color:#FCB0B0 !important;}");
    GM_addStyle("div.ffn_like {background-color:#C4FFCA !important;}");
    GM_addStyle("div.ffn_mark {background-color:#CCCCCC !important;}");
    GM_addStyle("div.ffn_calibre {background-color:#F1D173 !important;}");
break
case "archiveofourown.org":
    GM_addStyle(".ffn_dislike {background-color:#FCB0B0 !important;}");
    GM_addStyle(".ffn_like {background-color:#C4FFCA !important;}");
    GM_addStyle(".ffn_mark {background-color:#CCCCCC !important;}");
    GM_addStyle(".ffn_calibre {background-color:#F1D173 !important;}");
break
case "ficbook.net":
    GM_addStyle("div.ffn_dislike {background-color:#FCB0B0 !important;}");
    GM_addStyle("div.ffn_like {background-color:#C4FFCA !important;}");
    GM_addStyle("div.ffn_mark {background-color:#CCCCCC !important;}");
    GM_addStyle("div.ffn_calibre {background-color:#F1D173 !important;}");
    GM_addStyle("ul.ffn_dislike {background-color:#FCB0B0 !important;}");
    GM_addStyle("ul.ffn_like {background-color:#C4FFCA !important;}");
    GM_addStyle("ul.ffn_mark {background-color:#CCCCCC !important;}");
    GM_addStyle("ul.ffn_calibre {background-color:#F1D173 !important;}");
break
}
*/

// prevent conflicts with websites' jQuery version
this.ffn$ = this.jQuery = jQuery.noConflict(true);


var db = JSON.parse(localStorage.getItem("FFLikerAA") || '{}');
db.options = db.options || {};
db.version = db.version || '0.2';


//
// APP
//

// Main
var Application = function Application(optionsin) {
    var a = {};
    var options = optionsin || {};

    if (!options.namespace) { throw new Error("namespace is required"); }
    if (!options.db) { throw new Error("database object is required"); }

    a.namespace = options.namespace;
    var db = options.db;
    db[a.namespace] = db[a.namespace] || { fic: {}, author: {} };

    a.collection = [];

    a.color = {
        link_default: ffn$("ol.work.index.group > li:first a:first").css("color"),
        like_link: '',
        like_background: '',
        dislike_link: '',
        dislike_background: '',
    };

    a.save = function (type, id, value) {
        if (type == "fic" || type == "author") {
            a.saveNameSpaced(type, id, value);
        } else {
            if (value === "clear") {
                delete db[type][id];
            } else {
                db[type][id] = value;
            }
            localStorage.setItem("FFLikerAA", JSON.stringify(db));
        }
    };

    a.saveNameSpaced = function (type, id, value) {
        if (value === "clear") {
            delete db[a.namespace][type][id];
        } else {
            db[a.namespace][type][id] = value;
        }
        localStorage.setItem("FFLikerAA", JSON.stringify(db));
    };


    a.author = {};

    a.author.get = function (id) {
        return db[a.namespace].author[id];
    };

    a.author.like = function (id) {
        a.save("author", id, AUTHOR_LIKED);

        _.each(a.author.getFics(id), function (story) {
            story.author = AUTHOR_LIKED;
            story.like_author();
        });
    };

    a.author.dislike = function (id) {
        a.save("author", id, AUTHOR_DISLIKED);
        //ga('set', 'metric3', 1);

        _.each(a.author.getFics(id), function (story) {
            story.author = AUTHOR_DISLIKED;
            story.dislike_author();
        });
    };

    a.author.clear = function (id) {
        a.save("author", id, "clear");

        _.each(a.author.getFics(id), function (story) {
            story.author = '';
            story.clear_author();
        });
    };

    a.author.getFics = function (id) {
        return _.filter(a.collection, function (story) {
            return story.authorId() == id;
        });
    };

    a.fic = {};

    a.fic.get = function (id) {
        return db[a.namespace].fic[id];
    };

    a.fic.like = function (id) {
        a.save("fic", id, FIC_LIKED);

        var story = _.find(a.collection, function (story) {
            return story.ficId() == id;
        });

        story.fic = FIC_LIKED;
        story.like_story();
    };

    a.fic.dislike = function (id) {
        a.save("fic", id, FIC_DISLIKED);
        var story = _.find(a.collection, function (story) {
            return story.ficId() == id;
        });
        story.fic = FIC_DISLIKED;
        story.dislike_story();
    };

    a.fic.mark = function (id) {
        a.save("fic", id, FIC_MARKED);
        var story = _.find(a.collection, function (story) {
            return story.ficId() == id;
        });
        story.fic = FIC_MARKED;
        story.mark_story();
    };

    a.fic.calibre = function (id) {
        a.save("fic", id, FIC_CALIBRE);
        var story = _.find(a.collection, function (story) {
            return story.ficId() == id;
        });
        story.fic = FIC_CALIBRE;
        story.calibre_story();
    };


    a.fic.clear = function (id) {
        a.save("fic", id, "clear");
        var story = _.find(a.collection, function (story) {
            return story.ficId() == id;
        });
        story.fic = '';
        story.clear_story();
    };

    a.options = function (name, value) {

        if (!name) { throw new Error("name is required. what option are you looking for?"); }

        if (typeof value !== "undefined") {
            a.save("options", name, value);
            return false;
        } else {
            return db.options[name];
        }
    };

    return a;
};

var Story = function (optionsin) {
    var a = {};
    var options = optionsin || {};

    if (!options.instance) { throw new Error("instance of this is required"); }
    if (!options.namespace) { throw new Error("namespace is required"); }

    var _this = ffn$(options.instance);

    a["default"] = {
        template: function () {
            var template = '<div class="new_like_actions" style="margin:0px 0px 0px 20px; font-size:11px;">' +

                'Story: <a href="" class="like_story"><font color="' + COLOR_LIKED + '">Like</font></a> | ' +
                '<a href="" class="dislike_story"><font color="' + COLOR_DISLIKED + '">Dislike</font></a> | ' +
                '<a href="" class="mark_story"><font color="' + COLOR_MARKED + '">Mark</font></a> | ' +
                '<a href="" class="calibre_story"><font color="' + COLOR_CALIBRE + '">Calibre</font></a> | ' +
                '<a href="" class="clear_story" style="color:blue;">Clear</a>' +

                '   Author: <a href="" class="like_author" style="color:blue;">Like</a> | ' +
                '<a href="" class="dislike_author" style="color:blue;">Dislike</a> | ' +
                '<a href="" class="clear_author" style="color:blue;">Clear</a>' +

                '</div>';
            return template;
        },
        addActions: function () {
            var instance = this;
            _this.append(this.template());

            _this.find('.new_like_actions .like_author').click(function () { app.author.like(instance.authorId()); return false; });
            _this.find('.new_like_actions .dislike_author').click(function () { app.author.dislike(instance.authorId()); return false; });
            _this.find('.new_like_actions .clear_author').click(function () { app.author.clear(instance.authorId()); return false; });

            _this.find('.new_like_actions .like_story').click(function () { app.fic.like(instance.ficId()); return false; });
            _this.find('.new_like_actions .dislike_story').click(function () { app.fic.dislike(instance.ficId()); return false; });
            _this.find('.new_like_actions .mark_story').click(function () { app.fic.mark(instance.ficId()); return false; });
            _this.find('.new_like_actions .calibre_story').click(function () { app.fic.calibre(instance.ficId()); return false; });
            _this.find('.new_like_actions .clear_story').click(function () { app.fic.clear(instance.ficId()); return false; });
        },
        hide: function () {
            _this.hide();
        },
        set_story: function () {
            switch (this.fic) {
                case FIC_LIKED:
                    _this.addClass("ffn_like");
                    this.$fic.addClass("ffn_like");
                    break;
                case FIC_DISLIKED:
                    _this.addClass("ffn_dislike");
                    this.$fic.addClass("ffn_dislike");
                    break;
                case FIC_MARKED:
                    _this.addClass("ffn_mark");
                    this.$fic.addClass("ffn_mark");
                    break;
                case FIC_CALIBRE:
                    _this.addClass("ffn_calibre");
                    this.$fic.addClass("ffn_calibre");
                    break;
            }
            switch (this.completedX) {
                case true:
                    this.$fic.addClass("Edwin_Completed");
                    break;
                case false:
                    break;
            }

            //noOfWords
            this.$fic.append("<b style='color:black;'> (" + this.noOfWords + ") </b>");
        },
        set_author: function () {
            if (this.author === AUTHOR_LIKED) {
                this.$author.addClass("ffn_like");
                if (typeof this.fic === "undefined") {
                    _this.addClass("ffn_like");
                }
            }
            if (this.author === AUTHOR_DISLIKED) {
                this.$author.addClass("ffn_dislike");
                if (typeof this.fic === "undefined") {
                    _this.addClass("ffn_dislike");
                }
            }
        },
        like_story: function () {
            this.clear_story();
            _this.addClass("ffn_like");
            this.$fic.addClass("ffn_like");
        },
        dislike_story: function () {
            this.clear_story();
            _this.addClass("ffn_dislike");
            this.$fic.addClass("ffn_dislike");
        },
        mark_story: function () {
            this.clear_story();
            _this.addClass("ffn_mark");
            this.$fic.addClass("ffn_mark");
        },
        calibre_story: function () {
            this.clear_story();
            _this.addClass("ffn_calibre");
            this.$fic.addClass("ffn_calibre");
        },
        clear_story: function () {
            _this.removeClass("ffn_like ffn_dislike ffn_mark ffn_calibre");
            this.$fic.removeClass("ffn_like ffn_dislike ffn_mark ffn_calibre");
            if (this.author === 0) {
                _this.addClass("ffn_like");
                this.$author.addClass("ffn_like");
            } else if (this.author === 1) {
                _this.addClass("ffn_dislike");
                this.$author.addClass("ffn_dislike");
            }

        },
        like_author: function () {
            this.clear_author();
            this.$author.addClass("ffn_like");
            if (this.fic === FIC_DISLIKED) {
                _this.addClass("ffn_dislike");
            } else {
                _this.addClass("ffn_like");
            }
        },
        dislike_author: function () {
            this.clear_author();
            this.$author.addClass("ffn_dislike");
            if (this.fic === FIC_LIKED) {
                _this.addClass("ffn_like");
            } else {
                _this.addClass("ffn_dislike");
            }
        },
        clear_author: function () {
            switch (this.fic) {
                case FIC_LIKED:
                    _this.removeClass("ffn_dislike ffn_mark ffn_calibre");
                    _this.addClass("ffn_like");
                    this.$author.removeClass("ffn_like ffn_dislike");
                    break;
                case FIC_DISLIKED:
                    _this.removeClass("ffn_like ffn_mark ffn_calibre");
                    _this.addClass("ffn_dislike");
                    this.$author.removeClass("ffn_like ffn_dislike");
                    break;
                case FIC_MARKED:
                    _this.removeClass("ffn_like ffn_dislike ffn_calibre");
                    _this.addClass("ffn_mark");
                    this.$author.removeClass("ffn_like ffn_dislike");
                    break;
                case FIC_CALIBRE:
                    _this.removeClass("ffn_like ffn_dislike ffn_mark");
                    _this.addClass("ffn_calibre");
                    this.$author.removeClass("ffn_like ffn_dislike");
                    break;
                default:
                    _this.removeClass("ffn_like ffn_dislike ffn_mark ffn_calibre");
                    this.$author.removeClass("ffn_like ffn_dislike");
            }
        }
    };

    // Specific sites overrides

    a["www.fanfiction.net"] = {
        $author: _this.find('a[href^="/u"]:first'),
        $fic: _this.find('a[href^="/s"]:first'),
        completedX: function () {
            var c = _this.find("a.stitle").text();
            var completedRegEx = /Complete/;
            var storyMetaData = _this.find(".z-indent.z-padtop .z-padtop2.xgray").text();
            //  console.log(storyMetaData);
            var isCompleted = completedRegEx.test(storyMetaData);
            // console.log(c + " " + (isCompleted ));
            return isCompleted;
        }(),
        noOfWords: function () {
            var storyMetaData = _this.find(".z-indent.z-padtop .z-padtop2.xgray").text();
            var wordRegex = /Words: ([\d,]*)/;
            if (wordRegex.test(storyMetaData) && storyMetaData.match(wordRegex).length == 2) {
                var words = storyMetaData.match(wordRegex)[1];
                return words;
            }
        }(),
        authorId: function () {
            if (typeof this.$author.attr('href') === "undefined") {
                return window.location.pathname.split("/")[2];
            } else {
                return this.$author.attr('href').split('/')[2];
            }
        },
        ficId: function () {
            if (this.$fic.length === 0) {
                return window.location.pathname.split("/")[2];
            } else {
                return this.$fic.attr('href').split('/')[2];
            }
        },
        hide: function () {
            // do not hide story header on reading page and story block on author page
            if (!window.location.pathname.split("/")[1].match("^s$|^u$")) _this.hide();
        }
    };

    //

    a["archiveofourown.org"] = {
        $author: _this.find('a[href^="/users/"]:first'),
        $fic: _this.find('a[href^="/works/"]:first'),
        authorId: function () {
            return this.$author.attr('href').split('/')[2];
        },
        ficId: function () {
            if (this.$fic.length === 0) {
                return window.location.pathname.split("/")[2];
            } else {
                return this.$fic.attr('href').split('/')[2];
            }
        },
        hide: function () {
            if (window.location.pathname.split("/")[3] !== "chapters") {
                _this.hide();
            }
        }
    };

    //

    a["ficbook.net"] = {
        $author: _this.find('a[href^="/authors"]:first'),
        $fic: _this.find('a[href^="/readfic"]:first'),
        authorId: function () {
            console.log(this.$author);
            return this.$author.attr('href').split('/')[2];
        },
        ficId: function () {
            if (this.$fic.length === 0) {
                return window.location.pathname.split("/")[2];
            } else {
                return this.$fic.attr('href').split('/')[2];
            }
        },
        hide: function () {

            if (window.location.pathname.split("/")[1] !== "readfic") {
                _this.parent().hide();
            }
        }
    };

    a["tbooklist.org"] = {
        $author: _this.find('a[href^="https://tbooklist.org/authors"]:first'),
        $fic: _this.find('a[href^="https://tbooklist.org/books"]:first'),
        authorId: function () {
            if (this.$author.length === 0) {
                return 0;
            } else {
                return this.$author.attr('href').split('/')[4];
            }
        },
        ficId: function () {
            if (window.location.pathname.split("/")[1] === "books") {
                return window.location.pathname.split("/")[2];
            }
            if (this.$fic.length === 0) {
                return 0;
            } else {
                return this.$fic.attr('href').split('/')[4];
            }
        },
        hide: function () {
            // do not hide when viewing fanfic details
            if (window.location.pathname.split("/")[1] !== "books") {
                _this.hide();
            }
        }
    };

    var b = ffn$.extend({}, a["default"], a[options.namespace]);
    b.fic = app.fic.get(b.ficId());

    b.author = app.author.get(b.authorId());
    // do not show liker links if ficid or authorid are undefined (tweak for tbooklist.org)
    if (b.ficId() !== 0 && b.authorId() !== 0) {
        b.addActions();
    }
    b.set_story();
    b.set_author();

    //hide
    if ((app.options("hide_dislikes") === true && (b.fic === FIC_DISLIKED || b.author === AUTHOR_DISLIKED)) ||
        (app.options("hide_likes") === true && (b.fic === FIC_LIKED || b.author === AUTHOR_LIKED)) ||
        (app.options("hide_marked") === true && b.fic === FIC_MARKED) ||
        (app.options("hide_calibre") === true && b.fic === FIC_CALIBRE)) {
        //		if(b.fic !== true && b.author) { // for liked fics of disliked authors
        b.hide();
        //		}
    }
    return b;
};


var app = new Application({ namespace: document.location.host, db: db });

// Adding action links and navigation shortcuts to pages
switch (window.location.hostname) {
    case "www.fanfiction.net":
        // adding hotkeys

        document.addEventListener('keydown', function (e) {
            switch (e.keyCode) {
                case 37:
                    var Prev = ffn$("a:contains('« Prev')");
                    if (typeof (Prev[0]) !== 'undefined') { window.location.href = Prev[0]; }
                    break;
                case 39:
                    var Next = ffn$("a:contains('Next »')");
                    if (typeof (Next[0]) !== 'undefined') { window.location.href = Next[0]; }
                    break;
            }
        }, false);
        // links in list
        ffn$(".z-list").each(function () {
            var story = new Story({ namespace: app.namespace, instance: this });
            app.collection.push(story);
        });

        // links on reading page
        ffn$("div#profile_top").each(function () {
            var story = new Story({ namespace: app.namespace, instance: this });
            app.collection.push(story);
        });

        // hide/show options
        ffn$('div#content_wrapper_inner').after(
            '<div class="liker_script_options" style="padding:5px; border:1px solid #333399; margin-bottom:5px; background:#D8D8FF;">' +
            '<b>Liker Options:</b> ' +
            '</div>'
        );
        break;
    case "archiveofourown.org":
        // adding hotkeys
        document.addEventListener('keydown', function (e) {
            switch (e.keyCode) {
                case 37:
                    var Prev = ffn$("a:contains('← Previous')");
                    if (typeof (Prev[0]) !== 'undefined') { window.location.href = Prev[0]; }
                    break;
                case 39:
                    var Next = ffn$("a:contains('Next →')");
                    if (typeof (Next[0]) !== 'undefined') { window.location.href = Next[0]; }
                    break;
            }
        }, false);
        // in list
        ffn$("ol.work.index.group > li").each(function () {
            var story = new Story({ namespace: app.namespace, instance: this });
            app.collection.push(story);
        });
        // on reading page
        ffn$("div.preface.group").each(function () {
            //        console.log(this);
            var story = new Story({ namespace: app.namespace, instance: this });
            app.collection.push(story);
        });
        // hide/show options
        ffn$('div.navigation.actions.module').after(
            '<div class="liker_script_options" style="padding:5px; border:1px solid #333399; margin-bottom:5px; background:#D8D8FF;">' +
            '<b>Liker Options:</b> ' +
            '</div>'
        );
        break;
    case "ficbook.net":
        // on reading page
        patharr = window.location.pathname.split("/");
        if (patharr[1] === "readfic") {
            ffn$("div.row.hat-row > ul.list-unstyled").each(function () {
                var story = new Story({
                    namespace: app.namespace,
                    instance: this
                });
                app.collection.push(story);
            });
        }
        // in lists
        if (patharr[1] === "find" ||
            (patharr[1] === "collections") ||
            (patharr[3] === "profile" && patharr[4] === "works") ||            // in author profile / works
            (patharr[1] === "home" && ["favourites", "collections"].indexOf(patharr[2]) != -1)) { // indexOf => checks if patharr[2] is in [] array
            //ffn$(".description").each(function() {
            ffn$("article.block > div.description").each(function () {
                //    console.log(this)
                var story = new Story({
                    namespace: app.namespace,
                    instance: this
                });

                app.collection.push(story);
                ffn$(this).append('<button type="button" class="btn btn-primary js-mark-readed" data-fanfic-id="' + story.ficId() + '"><i class="icon-checkbox-unchecked2"></i>Пометить как прочитаное</button>');
            });
            // add hotkeys
            document.addEventListener('keydown', function (e) {
                switch (e.keyCode) {
                    case 37:
                        var Prev = ffn$("a[aria-label='Предыдущая']");
                        window.location.href = Prev[0];
                        break;
                    case 39:
                        var Next = ffn$("a[aria-label='Следующая']");
                        window.location.href = Next[0];
                        break;
                }
            }, false);
        }
        // hide/show options
        ffn$('section.content-section').after(
            '<div class="liker_script_options" style="padding:5px; border:1px solid #333399; margin-bottom:5px; background:#D8D8FF;">' +
            '<b>Liker Options:</b> ' +
            '</div>'
        );
        break;
    case "tbooklist.org":
        patharr = window.location.pathname.split("/");
        // in feed
        if (patharr[1] === "feed") {
            ffn$("div.content-block > div.regular").each(function () {
                var story = new Story({
                    namespace: app.namespace,
                    instance: this
                });
                app.collection.push(story);
            });
        }
        // book page
        if (patharr[1] === "books") {
            ffn$("div.cmedia-divided__child__top").each(function () {
                var story = new Story({
                    namespace: app.namespace,
                    instance: this
                });
                app.collection.push(story);
            });
        }

        // hide/show options
        ffn$('div.content-block').after(
            '<div class="liker_script_options" style="padding:5px; border:1px solid #333399; margin-bottom:5px; background:#D8D8FF;">' +
            '<b>Liker Options:</b> ' +
            '</div>'
        );
        break;
}

//	OPTIONS
//	-  show/hide global options
//

if (app.options("hide_likes")) {
    ffn$('.liker_script_options').append('<a href="" class="show_likes" style="color:blue">Show Likes</a>');
    ffn$('.liker_script_options .show_likes').click(function () { show_likes(); });
} else {
    ffn$('.liker_script_options').append('<a href="" class="hide_likes" style="color:blue">Hide Likes</a>');
    ffn$('.liker_script_options .hide_likes').click(function () { hide_likes(); });
}
ffn$('.liker_script_options').append('| ');

if (app.options("hide_dislikes")) {
    ffn$('.liker_script_options').append('<a href="" class="show_dislikes" style="color:blue">Show Dislikes</a>');
    ffn$('.liker_script_options .show_dislikes').click(function () { show_dislikes(); });
} else {
    ffn$('.liker_script_options').append('<a href="" class="hide_dislikes" style="color:blue">Hide Dislikes</a>');
    ffn$('.liker_script_options .hide_dislikes').click(function () { hide_dislikes(); });
}
ffn$('.liker_script_options').append('| ');

if (app.options("hide_marked")) {
    ffn$('.liker_script_options').append('<a href="" class="show_marked" style="color:blue">Show Marked</a>');
    ffn$('.liker_script_options .show_marked').click(function () { show_marked(); });
} else {
    ffn$('.liker_script_options').append('<a href="" class="hide_marked" style="color:blue">Hide Marked</a>');
    ffn$('.liker_script_options .hide_marked').click(function () { hide_marked(); });
}
ffn$('.liker_script_options').append('| ');

if (app.options("hide_calibre")) {
    ffn$('.liker_script_options').append('<a href="" class="show_calibre" style="color:blue">Show Calibre</a>');
    ffn$('.liker_script_options .show_calibre').click(function () { show_calibre(); });
} else {
    ffn$('.liker_script_options').append('<a href="" class="hide_calibre" style="color:blue">Hide Calibre</a>');
    ffn$('.liker_script_options .hide_calibre').click(function () { hide_calibre(); });
}

// test dislike all
if (window.location.hostname === "www.fanfiction.net") {
    ffn$('.liker_script_options').append('| ');
    ffn$('.liker_script_options').append('<a href="" class="dislike_all" style="color:blue">Dislike All Authors</a>');
    ffn$('.liker_script_options .dislike_all').click(function () { dislike_all(); return (false); });
}
//


ffn$('.liker_script_options').append('| ');


ffn$('.liker_script_options').append('<a href="" class="backupToggle" style="color:blue">Manage Site Data</a>');
ffn$('.liker_script_options').after("<div class='backup_text' style='display:none'>\
		<table><tr>\
		<td class='backup_data' valign='top'>\
			<b>Backup data</b><br />\
			Copy this text some where safe<br />\
			<textarea class=''></textarea>\
		</td>\
		<td>&nbsp;&nbsp;</td>\
		<td class='save_new_data' valign='top'>\
			<b>Upload new Data</b><br>\
			Upload data you had previously saved<br />\
			<textarea></textarea><br >\
			<button class='new_data_save'>save</button>\
		</td></tr></table>\
		</div>");
ffn$('.backup_text .backup_data textarea').on("click", function () {
    ffn$(this).select();
});
ffn$('.backup_text .save_new_data button').on("click", function () {
    var v = ffn$('.backup_text .save_new_data textarea').val();
    try {
        var new_db = JSON.parse(v);
    } catch (err) {
        alert("that data is not valid");
        return;
    }
    localStorage.setItem("FFLikerAA", JSON.stringify(new_db));
    document.location = document.location;
});
ffn$('.liker_script_options .backupToggle').click(function () {
    ffn$(".backup_text").toggle();
    ffn$(".backup_text .backup_data textarea").html(JSON.stringify(db));
    return false;
});


function show_dislikes() {
    app.options("hide_dislikes", false);
    return false;
}

function hide_dislikes() {
    app.options("hide_dislikes", true);
    return false;
}

function show_likes() {
    app.options("hide_likes", false);
    return false;
}

function hide_likes() {
    app.options("hide_likes", true);
    return false;
}

function show_marked() {
    app.options("hide_marked", false);
    return false;
}

function hide_marked() {
    app.options("hide_marked", true);
    return false;
}

function show_calibre() {
    app.options("hide_calibre", false);
    return false;
}

function hide_calibre() {
    app.options("hide_calibre", true);
    return false;
}

function dislike_all() {
    ffn$("div.z-list:visible").each(function () {
        var story = new Story({
            namespace: app.namespace,
            instance: this
        });

        app.collection.push(story);
        app.author.dislike(story.authorId());
    });
}
