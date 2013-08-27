(function(global) {
    "use strict";

    /**
     * @class Rectangle
     * @desc Describes a rectangle.
     * @param {Number} x The x position of the rectangle.
     * @param {Number} y The y position of the rectangle.
     * @param {Number} w The width of the rectangle.
     * @param {Number} h The height of the rectangle.
     * @returns {Rectangle}
     * @author thegoldenmule
     * @constructor
     */
    global.Rectangle = function(x, y, w, h) {
        var scope = this;

        scope.x = undefined === x ? 0 : x;
        scope.y = undefined === y ? 0 : y;
        scope.w = undefined === w ? 0 : w;
        scope.h = undefined === h ? 0 : h;

        return scope;
    };

    global.Rectangle.prototype = {
        constructor: global.Rectangle,

        /**
         * @function global.Rectangle#set
         * @desc Sets a Rectangle's properties.
         * @param {Number} x The x position of the rectangle.
         * @param {Number} y The y position of the rectangle.
         * @param {Number} w The width of the rectangle.
         * @param {Number} h The height of the rectangle.
         */
        set: function(x, y, w, h) {
            this.x = x;
            this.y = y;
            this.w = w;
            this.h = h;
        },

        /**
         * @function global.Rectangle#copy
         * @desc Copies the data from a Rectangle.
         * @param {Rectangle} rect The Rectangle to copy data from.
         */
        copy: function(rect) {
            this.x = rect.x;
            this.y = rect.y;
            this.w = rect.w;
            this.h = rect.h;
        }
    };

})(this);