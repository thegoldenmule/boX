// Math extensions
(function() {
    "use strict";

    /**
     * @static
     * @function Math#clamp
     * @desc Clamps a value between min and max.
     * @param {Number} value The value to clamp.
     * @param {Number} min The minimum allowed.
     * @param {Number} max The maximum allowed.
     * @returns {Number}
     */
    Math.clamp = function(value, min, max) {
        return value < min ? min : value > max ? max : value;
    };

    /**
     * @static
     * @function Math#randomInt
     * @desc Returns a random int in an interval.
     * @param {Number} min The minimum value of the random number.
     * @param {Number} max The maximum value of the random number.
     * @returns {number}
     */
    Math.randomInt = function(min, max) {
        return ~~(min + Math.random() * (max - min));
    };
})();