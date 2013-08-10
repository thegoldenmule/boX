/**
 * Author: thegoldenmule
 * Date: 8/9/13
 */

(function (global) {
    "use strict";

    var AnimationCurveKey = function(time, value) {
        var scope = this;

        scope.time = time;
        scope.value = value;

        return scope;
    };

    var AnimationCurve = function () {
        var scope = this;

        var _keys = [];

        /**
         * Defines the ease method to use.
         *
         * @type {*}
         */
        scope.easingFunction = Easing.Quadratic.In;

        /**
         * Retrieves a copy of the keys array.
         *
         * @returns {Array}
         */
        scope.getKeys = function() {
            return _keys.slice(0);
        };

        /**
         * Adds a key time.
         *
         * @param key An AnimationCurveKey.
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
        };

        /**
         * Removes a key time.
         *
         * @param key An AnimationCurveKey.
         */
        scope.removeKey = function(key) {
            // remove
            var index = _keys.indexOf(key);
            if (-1 !== index) {
                _keys.splice(index, 1);
            }
        };

        /**
         * Evaluates the animation curve at a normalized parameter t.
         *
         * @param t
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
         * Linearly interpolates using the easing function (which is possibly
         * non-linear).
         *
         * @param a
         * @param b
         * @param t
         * @returns {number}
         */
        function interpolate(a, b, t) {
            return a + scope.easingFunction(t) * (b - a);
        }

        return scope;
    };

    AnimationCurve.prototype = {
        constructor: AnimationCurve
    };

    // export
    global.AnimationCurveKey = AnimationCurveKey;
    global.AnimationCurve = AnimationCurve;

})(this);
