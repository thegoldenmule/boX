/**
 * Author: thegoldenmule
 * Date: 8/10/13
 */

(function (global) {
    "use strict";

    /**
     * Curry function.
     *
     * @returns {Function}
     */
    global.Function.prototype.curry = function () {
        var array = Array.prototype.slice.call(arguments);

        if (array.length < 1) {
            return this;
        }

        var _method = this;
        return function() {
            return _method.apply(this, array.concat(Array.prototype.slice.call(arguments)));
        };
    };

})(this);
