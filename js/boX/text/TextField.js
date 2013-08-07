/**
 * Author: thegoldenmule
 * Date: 8/7/13
 */

(function (global) {
    "use strict";

    var TextField = function (parameters) {
        var scope = this;

        if (undefined === parameters) {
            parameters = {};
        }

        scope.font = (undefined === parameters.font) ? new Font() : parameters.font;

        return scope;
    };

    TextField.prototype = {
        constructor: TextField,

        setText: function(text) {

        },

        appendText: function(text) {

        }
    };

    global.TextField = TextField;

})(this);
