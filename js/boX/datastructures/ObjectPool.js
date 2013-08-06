/**
 * Quick and dirty object pool implementation. Does not grow.
 *
 * Author: thegoldenmule
 */
(function(global) {
    "use strict";

    var IDS = 0;

    /**
     * Creates a static pool of objects.
     *
     * @param size      The number of objects to allocate.
     * @param factory   A Function that returns a new object.
     * @param onGet     (optional) A Function to call when an instance is retrieved.
     * @param onPut     (optional) A Function to call ehwn an instance is released.
     * @returns {*}
     * @constructor
     */
    var ObjectPool = function(size, factory, onGet, onPut) {
        var scope = this,
            _id = "__pool" + (++IDS),
            _instances = [size],
            _availableIndices = [size];

        for (var i = 0; i < size; i++) {
            _availableIndices[i] = i;

            _instances[i] = factory();
            _instances[i][_id] = i;
        }

        /**
         * Retrieves an object, or null if none are left in the pool.
         *
         * @returns {*}
         */
        scope.get = function() {
            if (_availableIndices.length > 0) {
                var index = _availableIndices.pop();
                var instance = _instances[index];
                instance[_id] = index;

                if (undefined !== onGet) {
                    onGet(instance);
                }

                return instance;
            }

            return null;
        };

        /**
         * Puts an object back in the pool.
         *
         * @param instance
         */
        scope.put = function(instance) {
            if (undefined === instance[_id]) {
                return;
            }

            _availableIndices.push(instance[_id]);

            if (undefined !== onPut) {
                onPut(instance);
            }
        };

        return scope;
    };

    global.ObjectPool = ObjectPool;

})(this);