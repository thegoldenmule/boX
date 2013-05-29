/**
 * Author: thegoldenmule
 * Date: 3/11/13
 */

(function (global) {
    "use strict";

    var StaticImage = function (parameters) {
        var scope = this;

        if (undefined === parameters) {
            parameters = {};
        }

        if (undefined !== parameters.mainTexture) {
            if (undefined === parameters.width) {
                parameters.width = parameters.mainTexture.getWidth();
            }

            if (undefined === parameters.height) {
                parameters.height = parameters.mainTexture.getHeight();
            }
        }

        DisplayObject.call(scope, parameters);

        // set texture shader
        scope.material.shader.setShaderProgramIds("texture-shader-vs", "texture-shader-fs");

        return scope;
    };

    StaticImage.prototype = new DisplayObject();
    StaticImage.prototype.constructor = StaticImage;

    // export
    global.StaticImage = StaticImage;
})(this);