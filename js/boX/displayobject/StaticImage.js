(function (global) {
    "use strict";

    /**
     * @class StaticImage
     * @extends global.DisplayObject
     * @param {Object} parameters A parameters object that will be passed to
     * the DisplayObject constructor.
     * @returns {StaticImage}
     * @author thegoldenmule
     * @constructor
     */
    global.StaticImage = function (parameters) {
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

    global.StaticImage.prototype = new DisplayObject();
    global.StaticImage.prototype.constructor = global.StaticImage;
})(this);