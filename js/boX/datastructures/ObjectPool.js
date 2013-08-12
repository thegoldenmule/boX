(function(global) {
    "use strict";

    var IDS = 0;

    /**
     * @class ObjectPool
     * @author thegoldenmule
     * @desc Creates a preallocated, static pool of objects.
     * @param {Number} size The number of objects to preallocate.
     * @param {Number} factory A Function that returns a new object.
     * @param {Function} onGet (optional) A Function to call when an instance
     * is retrieved from the pool.
     * @param {Function} onPut (optional) A Function to call when an instance
     * is put back in the pool.
     * @returns {ObjectPool}
     * @constructor
     */
    global.ObjectPool = function(size, factory, onGet, onPut) {
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
         * @function global.ObjectPool#get
         * @desc Retrieves an object or null if none are left in the pool.
         *
         * @returns {Object}
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
         * @function global.ObjectPool#put
         * @desc Puts an object back in the pool.
         * @param {Object} instance The instance to return to the pool. If the
         * object was not originally retrieved from the pool, nothing will
         * happen...
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

})(this);