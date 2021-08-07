"use strict";
var $;
(function ($) {
    function $hello() {
        this.$log('Hello' + this.$user_name);
    }
    $.$hello = $hello;
})($ || ($ = {}));
var $;
(function ($) {
    function $log(...params) {
        console.log(...params);
    }
    $.$log = $log;
})($ || ($ = {}));
var $;
(function ($) {
    $.$user_name = 'Anonymous';
})($ || ($ = {}));
