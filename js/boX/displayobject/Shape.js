/**
 * Author: thegoldenmule
 * Date: 3/10/13
 */

(function (global) {
    /**
     * @desc Describes a simple Quad of a single color.
     * @extends global.DisplayObject
     * @class Shape
     * @param {Object} parameters Any initialization parameters as described by
     * the DisplayObject documentation.
     * @returns {Shape}
     * @constructor
     */
    global.Shape = function (parameters) {
        var scope = this;

        // extend DisplayObject
        global.DisplayObject.call(scope, parameters);

        scope.material.shader.setShaderProgramIds("color-shader-vs", "color-shader-fs");

        return scope;
    };

    global.Shape.prototype = new DisplayObject();
    global.Shape.prototype.constructor = Shape;
})(this);