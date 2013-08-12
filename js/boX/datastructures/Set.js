(function (global) {
    "use strict";

    /**
     * @desc Keeps track of number of Set instances, so each can have a unique
     * id.
     * @type {number}
     * @private
     * @static
     */
    var __indices = 0;

    /**
     * @class Set
     * @desc Creates an unordered Set. Sets have very fast add and remove, and
     * will only hold distinct instances.
     * @author thegoldenmule
     * @returns {Set}
     * @constructor
     */
    global.Set = function () {
        var scope = this;

        var _guidKey = "__set" + (++__indices),
            _elements = [];

        /**
         * @function global.Set#add
         * @desc Adds an element to the set. If this element is already a
         * member of this set, it discard its previous reference so that there
         * is only a single reference to the object.
         * @param {Object} element The element to add to the Set.
         *
         * @return {Object}
         */
        scope.add = function(element) {
            scope.remove(element);

            element[_guidKey] = _elements.length;
            _elements.push(element);

            return element;
        };

        /**
         * @function global.Set#remove
         * @desc Removes an element from the set.
         * @param {Object} element The element to remove.
         *
         * @return {Object}
         */
        scope.remove = function(element) {
            if (undefined === element[_guidKey]) {
                return;
            }

            if (_elements.length > 1) {
                var index = element[_guidKey];

                if (index === _elements.length - 1) {
                    _elements.pop();
                }
                else {
                    _elements[index] = _elements.pop();
                    _elements[index][_guidKey] = index;
                }

                delete element[_guidKey];
            } else {
                _elements.pop();
            }

            return element;
        };

        /**
         * Retrieves all elements of the set.
         *
         * @returns {Array}
         */
        scope.getElements = function() {
            return [].concat(_elements);
        };

        return scope;
    };

    global.Set.prototype = {
        constructor: global.Set
    };
})(this);