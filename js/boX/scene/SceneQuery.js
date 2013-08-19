(function (global) {
    "use strict";

    var nameQueryRegex = /([\w]+)((\[(\d)?:(\d)?\])|$)/;
    var propertyQueryRegex = /\((@|(@@))([\w]+)(([<>]=?)|==)([\w]+)\)((\[(\d)?:(\d)?\])|$)/;

    /**
     * @class SceneQuery
     * @desc Tokenizes a single query string.
     * @param {String} The query string to tokenize.
     *
     * @constructor
     */
    global.SceneQuery = function(value) {
        var scope = this;

        scope.value = value;
        scope.propName = null;
        scope.operator = null;
        scope.propValue = null;
        scope.startIndex = null;
        scope.endIndex = null;

        scope.isValid = false;

        // Cases:
        // 1. name query
        // 2. property query

        var match = nameQueryRegex.exec(value);
        if (null !== match) {
            scope.propName = "name";
            scope.operator = "==";
            scope.propValue = match[1];
            scope.isCollection = "" !== match[2];
            scope.startIndex = match[4];
            scope.endIndex = match[5];

            scope.isValid = true;
        } else {
            match = propertyQueryRegex.exec(value);

            if (null !== match) {
                scope.propName = match[3];
                scope.operator = match[4];
                scope.propValue = match[6];
                scope.startIndex = match[9];
                scope.endIndex = match[10];

                scope.isValid = true;
            }
        }

        return scope;
    };

    global.SceneQuery.prototype = {
        constructor: global.SceneQuery,

        // TODO: make this real...
        execute: function(object) {
            switch (this.operator) {
                case "==":
                    return object[this.propName] === this.propValue;

                case "<=":
                    return object[this.propName] <= this.propValue;

                case ">=":
                    return object[this.propName] >= this.propValue;

                case "<":
                    return object[this.propName] < this.propValue;

                case ">":
                    return object[this.propName] > this.propValue;
            }

            return false;
        }
    };
})(this);