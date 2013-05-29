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

        var _guidKey = "__setindex" + (++__indices),
            _elements = [];

        scope.add = function(element) {
            element[_guidKey] = _elements.length;
            _elements.push(element);
        };

        scope.remove = function(element) {
            if (!element[_guidKey]) {
                return;
            }

            if (_elements.length > 1) {
                var index = element[_guidKey];
                element[index] = _elements.pop();
                element[index][_guidKey] = index;
                delete element[_guidKey];
            } else {
                _elements.pop();
            }
        };

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