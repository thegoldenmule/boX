/**
 * Author: thegoldenmule
 * Date: 3/10/13
 */

(function (global) {
    var Shape = function (parameters) {
        var scope = this;

        // extend DisplayObject
        DisplayObject.call(scope, parameters);

        scope.material.shader.setShaderProgramIds("color-shader-vs", "color-shader-fs");

        return scope;
    };

    Shape.prototype = new DisplayObject();
    Shape.prototype.constructor = Shape;

    // export
    global.Shape = Shape;
})(this);