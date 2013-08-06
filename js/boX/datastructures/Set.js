/**
 * Author: thegoldenmule
 * Date: 5/26/13
 *
 * Very basic unordered data structure with fast add + remove.
 */
(function (global) {
    "use strict";

    var __indices = 0;

    var Set = function () {
        var scope = this;

        var _guidKey = "__set" + (++__indices),
            _elements = [];

        /**
         * Adds an element to the set.
         *
         * @param element
         */
        scope.add = function(element) {
            scope.remove(element);

            element[_guidKey] = _elements.length;
            _elements.push(element);

            return element;
        };

        /**
         * Removes an element from the set.
         *
         * @param element
         */
        scope.remove = function(element) {
            if (undefined === element[_guidKey]) {
                return;
            }

            if (_elements.length > 1) {
                var index = element[_guidKey];

                if (index === _elements.length) {
                    _elements.pop();
                }
                else {
                    element[index] = _elements.pop();
                    element[index][_guidKey] = index;
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

    Set.prototype = {
        constructor: Set
    };

    // export
    global.Set = Set;
})(this);