(function (global) {
    "use strict";

    /**
     * @class Color
     * @desc Defines an RGB color.
     * @param {Number} r A normalized value for red.
     * @param {Number} g A normalized value for green.
     * @param {Number} b A normalized value for blue.
     * @returns {Color}
     * @constructor
     */
    global.Color = function(r, g, b) {
        var that = this;

        that.r = undefined === r ? 0 : r;
        that.g = undefined === g ? 0 : g;
        that.b = undefined === b ? 0 : b;

        return that;
    };

    global.Color.prototype = {
        constructor : global.Color,

        /**
         * @desc Multiplies and returns a color.
         * @param {Color} color
         *
         * @returns {Color}
         */
        multiply : function(color) {
            return new global.Color(
                color.r * this.r,
                color.g * this.g,
                color.b * this.b);
        }
    };
})(this);