// ==UserScript==
// @name         Fanfiction-self edit
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       Edwin Clement
// @match        https://www.fanfiction.net/s/*
// @grant       GM_addStyle
// ==/UserScript==
// @require http://code.jquery.com/jquery-1.12.4.min.js

GM_addStyle(".edwin_color_white {  color:#fff ;}");


(function() {
    'use strict';
    // Your code here...
    $('body').css("background-color", "#000");
    $('#content_parent').css("background-color", "#000");
    $('#content_wrapper').css("background-color", "#000");
    $('#storytext').addClass('edwin_color_white');
    $(' #profile_top').addClass('edwin_color_white');

    $(' #profile_top .xgray.xcontrast_txt').removeClass('xgray');


    _fontastic_change_width(75);
    $("#storytext").css("fontSize",  "1.5em");

})();