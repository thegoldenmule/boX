/**
 * User: ti83
 * Date: 3/10/13
 */

(function(global) {
    "use strict";

    var __tempVec3 = vec3.create();

    var Rectangle = function(x, y, w, h) {
        var scope = this;

        scope.x = undefined === x ? 0 : x;
        scope.y = undefined === y ? 0 : y;
        scope.w = undefined === w ? 0 : w;
        scope.h = undefined === h ? 0 : h;

        return scope;
    };

    Rectangle.prototype = {
        constructor: Rectangle,

        zero: function() {
            this.x = this.y = this.w = this.h = 0;
        },

        set: function(x, y, w, h) {
            this.x = x;
            this.y = y;
            this.w = w;
            this.h = h;
        },

        copy: function(rect) {
            this.x = rect.x;
            this.y = rect.y;
            this.w = rect.w;
            this.h = rect.h;
        }
    };

    global.Rectangle = Rectangle;

})(this);

// Math extensions
(function() {
    "use strict";

    Math.clamp = function(value, min, max) {
        return value < min ? min : value > max ? max : value;
    };
})();