/**
 * Author: thegoldenmule
 * Date: 3/10/13
 */

(function (global) {
    "use strict";

    var Color = function(r, g, b) {
        var that = this;

        that.r = undefined === r ? 0 : r;
        that.g = undefined === g ? 0 : g;
        that.b = undefined === b ? 0 : b;

        return that;
    };

    Color.prototype = {
        constructor : Color,

        multiply : function(color) {
            return new Color(
                color.r * this.r,
                color.g * this.g,
                color.b * this.b);
        }
    };

    // export
    global.Color = Color;
})(this);