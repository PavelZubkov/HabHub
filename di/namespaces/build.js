"use strict";
var $;
(function ($) {
    function $ambient(over = {}) {
        const context = Object.create(this);
        for (const field of Object.getOwnPropertyNames(over)) {
            const descr = Object.getOwnPropertyDescriptor(over, field);
            Object.defineProperty(context, field, descr);
        }
        return context;
    }
    $.$ambient = $ambient;
})($ || ($ = {}));
var $;
(function ($) {
    function $app() {
        this.$hello();
        this.$ambient({ $user_name: 'Admin' }).$hello();
    }
    $.$app = $app;
    $.$app();
})($ || ($ = {}));
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
