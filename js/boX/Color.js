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
         * @desc RGB -> (1, 1, 1)
         */
        white: function() {
            this.r = this.g = this.b = 1;
        }
    };
})(this);