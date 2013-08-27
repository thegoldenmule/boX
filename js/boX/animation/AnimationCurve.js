/**
 * Author: thegoldenmule
 * Date: 8/9/13
 */

(function (global) {
    "use strict";

    /**
     * @class AnimationCurveKey
     * @author thegoldenmule
     * @desc Defines a point (x, y) in ([0,1], [0,1]).
     * @param {number} time A normalized value that defines the time at which
     * the curve should be at value.
     * @param {number} value A normalized value that defines the value at which
     * the curve should be at time.
     * @returns {AnimationCurveKey}
     * @constructor
     */
    global.AnimationCurveKey = function(time, value) {
        var scope = this;

        scope.time = Math.clamp(undefined === time ? 0 : time, 0, 1);
        scope.value = Math.clamp(undefined === value ? 1 : value, 0, 1);

        return scope;
    };

    global.AnimationCurveKey.prototype = {
        constructor: global.AnimationCurveKey
    };

    /**
     * @class AnimationCurve
     * @desc Defines a continuous function through points in the unit interval
     * on R^2. These points are given as AnimationCurveKeys.
     * @param {Array} keys An optional array of Number to populate the
     * AnimationCurve. There should be an even number of floats, each pair
     * representing an (x, t) point.
     *
     * @example
     * var curve = new AnimationCurve([
     *  0, 0,
     *  0.5, 1,
     *  1, 0]);
     *
     * @returns {AnimationCurve}
     * @constructor
     */
    global.AnimationCurve = function (keys) {
        var scope = this;

        var _keys = [];

        if (undefined === keys) {
            _keys = [
                new global.AnimationCurveKey(0, 0),
                new global.AnimationCurveKey(1, 1)
            ];
        } else {
            for (var i = 0; i < keys.length - 1; i+=2) {
                _keys.push(new global.AnimationCurveKey(keys[i], keys[i + 1]));
            }
        }

        /**
         * @member global.AnimationCurve#easingFunction
         * @desc Defines the easing method to use. Predefined easing types are
         * given in the Easing object, but any function f:[0, 1] -> [0, 1] will do.
         * Defaults to Easing.Quadradic.InOut
         *
         * @type {Function}
         */
        scope.easingFunction = Easing.Quadratic.InOut;

        /**
         * @function global.AnimationCurve#getKeys
         * @desc Retrieves a copy of the keys array.
         *
         * @returns {Array}
         */
        scope.getKeys = function() {
            return _keys.slice(0);
        };

        /**
         * @function global.AnimationCurve#getFirstKey
         * @desc Retrieves the first AnimationCurveKey instance.
         *
         * @returns {AnimationCurveKey}
         */
        scope.getFirstKey = function() {
            return 0 !== _keys.length ? _keys[0] : null;
        };

        /**
         * @function global.AnimationCurve#getLastKey
         * @desc Retrieves the last AnimationCurveKey instance.
         *
         * @returns {AnimationCurveKey}
         */
        scope.getLastKey = function() {
            if (_keys.length > 0) {
                return _keys[_keys.length - 1];
            }

            return null;
        };

        /**
         * @function global.AnimationCurve#addKey
         * @desc Adds an AnimationCurveKey to the curve.
         * @param {AnimationCurveKey} key An AnimationCurveKey.
         *
         * @returns {AnimationCurveKey}
         */
        scope.addKey = function(key) {
            // simple sort on insert
            for (var i = 0, len = _keys.length - 1; i < len; i++) {
                if (_keys[i].time < key.time &&
                    _keys[i + 1].time > key.time) {
                    _keys.splice(i + 1, 0, key);

                    return;
                }
            }

            _keys.push(key);

            return key;
        };

        /**
         * @function global.AnimationCurve#removeKey
         * @desc Removes an AnimationCurveKey from this curve.
         * @param {AnimationCurveKey} key An AnimationCurveKey.
         *
         * @returns {AnimationCurveKey}
         */
        scope.removeKey = function(key) {
            // remove
            var index = _keys.indexOf(key);
            if (-1 !== index) {
                _keys.splice(index, 1);
            }
        };

        /**
         * @function global.AnimationCurve#evaluate
         * @desc Evaluates the animation curve at a normalized parameter t.
         * @param {Number} t A value in the unit interval.
         *
         * @returns {Number}
         */
        scope.evaluate = function(t) {
            // clamp input
            t = Math.clamp(t, 0, 1);

            // find the two keys to evaluate between
            var len = _keys.length;
            if (len < 2) {
                return 0;
            }

            // TODO: we may be able to speed this up by using the index we last
            // used instead of starting with 0.
            var a, b;
            for (var i = 0; i < len - 1; i++) {
                a = _keys[i];
                b = _keys[i + 1];

                if (a.time <= t &&
                    b.time >= t) {
                    return interpolate(a.value, b.value, (t - a.time) / (b.time - a.time));
                }
            }

            // in this case, there is no key defined after the t passed in,
            // so clamp to the last keys value
            return _keys[len - 1].value;
        };

        /**
         * @desc Linearly interpolates using the easing function (which is possibly
         * non-linear).
         *
         * @private
         *
         * @param a
         * @param b
         * @param t
         * SS
         * @returns {number}
         */
        function interpolate(a, b, t) {
            return a + scope.easingFunction(t) * (b - a);
        }

        return scope;
    };

    global.AnimationCurve.prototype = {
        constructor: global.AnimationCurve
    };
})(this);
