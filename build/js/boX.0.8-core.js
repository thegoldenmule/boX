(function (global) {
    "use strict";

    /**
     * @class Color
     * @desc Defines an RGB color.
     * @param {Number} r A normalized value for red.
     * @param {Number} g A normalized value for green.
     * @param {Number} b A normalized value for blue.
     * @returns {Color}
     * @constructor
     */
    global.Color = function(r, g, b) {
        var that = this;

        that.r = undefined === r ? 0 : r;
        that.g = undefined === g ? 0 : g;
        that.b = undefined === b ? 0 : b;

        return that;
    };

    global.Color.prototype = {
        constructor : global.Color,

        /**
         * @desc RGB -> (1, 1, 1)
         */
        white: function() {
            this.r = this.g = this.b = 1;
        }
    };
})(this);
/**
 * Author: thegoldenmule
 * Date: 3/17/13
 */

(function (global) {
    "use strict";

    var colorShaderVS = {
        name: "color-shader-vs",
        type: "x-shader/x-vertex",
        body:
            "precision highp float;" +

            "uniform mat4 uProjectionMatrix;" +
            "uniform mat4 uModelViewMatrix;" +

            "uniform vec4 uColor;" +

            "uniform float uDepth;" +

            "attribute vec2 aPosition;" +
            "attribute vec4 aColor;" +

            "varying vec4 vColor;" +

            "void main(void) {" +
                // vertex transform
                "gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aPosition, uDepth, 1.0);" +

                // calculate color
                "vColor = uColor * aColor;" +
            "}"
    };

    var colorShaderFS = {
        name: "color-shader-fs",
        type: "x-shader/x-fragment",
        body:
            "precision highp float;" +

            "varying vec4 vColor;" +

            "void main(void) {" +
                "gl_FragColor = vColor;" +
            "}"
    };

    var textureShaderVS = {
        name: "texture-shader-vs",
        type: "x-shader/x-vertex",
        body:
            "precision highp float;" +

            "uniform mat4 uProjectionMatrix;" +
            "uniform mat4 uModelViewMatrix;" +

            "uniform vec4 uColor;" +

            "uniform float uDepth;" +

            "attribute vec2 aPosition;" +
            "attribute vec2 aUV;" +
            "attribute vec4 aColor;" +

            "varying vec4 vColor;" +
            "varying vec2 vUV;" +

            "void main(void) {" +
                // vertex transform
                "gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aPosition, uDepth, 1.0);" +

                // pass color + uv through
                "vColor = aColor * uColor;" +
                "vUV = aUV;" +
            "}"
    };

    var textureShaderFS = {
        name: "texture-shader-fs",
        type: "x-shader/x-fragment",
        body:
            "precision highp float;" +

            "varying vec4 vColor;" +
            "varying vec2 vUV;" +

            "uniform sampler2D uMainTextureSampler;" +

            "void main(void) {" +
                "gl_FragColor = texture2D(uMainTextureSampler, vUV) * vColor;" +
            "}"
    };

    var spriteSheetShaderVS = {
            name: "ss-shader-vs",
            type: "x-shader/x-vertex",
            body:
                "precision highp float;" +

                "uniform mat4 uProjectionMatrix;" +
                "uniform mat4 uModelViewMatrix;" +

                "uniform vec4 uColor;" +

                "uniform float uDepth;" +

                "attribute vec2 aPosition;" +
                "attribute vec2 aUV;" +
                "attribute vec4 aColor;" +

                "varying vec4 vColor;" +
                "varying vec4 vVertexColor;" +
                "varying vec2 vUV;" +

                "void main(void) {" +
                    // vertex transform
                    "gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aPosition, uDepth, 1.0);" +

                    // pass color + uv through
                    "vColor = uColor;" +

                    // note that in this shader, color.xy is the previous frame's uvs!
                    "vUV = aUV;" +
                    "vVertexColor = aColor;" +
                "}"
        };

        var spriteSheetShaderFS = {
            name: "ss-shader-fs",
            type: "x-shader/x-fragment",
            body:
                "precision highp float;" +

                "varying vec4 vColor;" +
                "varying vec4 vVertexColor;" +
                "varying vec2 vUV;" +

                "uniform sampler2D uMainTextureSampler;" +
                "uniform float uFutureBlendScalar;" +

                "void main(void) {" +
                    "vec4 currentFrame = texture2D(uMainTextureSampler, vUV);" +
                    "vec4 futureFrame = texture2D(uMainTextureSampler, vec2(vVertexColor.xy));" +

                    "gl_FragColor = futureFrame * uFutureBlendScalar + currentFrame * (1.0 - uFutureBlendScalar);" +
                "}"
        };

    var boundingBoxShaderVS = {
        name: "bb-shader-vs",
        type: "x-shader/x-vertex",
        body:
            "precision highp float;" +

            "uniform mat4 uProjectionMatrix;" +
            "uniform mat4 uModelViewMatrix;" +

            "attribute vec2 aPosition;" +
            "attribute vec2 aUV;" +

            "varying vec2 vUV;" +

            "void main(void) {" +
                // vertex transform
                "gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aPosition, 0.0, 1.0);" +

                "vUV = aUV;" +
            "}"
    };

    var boundingBoxShaderFS = {
        name: "bb-shader-fs",
        type: "x-shader/x-fragment",
        body:
            "varying vec2 vUV;" +

            "void main(void) {" +
                "gl_FragColor = vec4(1.0, 0.0, 0.0, 0.2);" +
            "}"
    };

    var particleShaderVS = {
        name: "particle-shader-vs",
        type: "x-shader/x-vertex",
        body:
            "precision highp float;" +

            "uniform mat4 uProjectionMatrix;" +
            "uniform mat4 uModelViewMatrix;" +

            "uniform vec4 uColor;" +

            "uniform float uDepth;" +

            "attribute vec2 aPosition;" +
            "attribute vec2 aUV;" +
            "attribute vec4 aColor;" +

            "varying vec4 vColor;" +
            "varying vec2 vUV;" +

            "void main(void) {" +
                // vertex transform
                "gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aPosition, uDepth, 1.0);" +

                // pass color + uv through
                "vColor = aColor * uColor;" +
                "vUV = aUV;" +
            "}"
    };

    var particleShaderFS = {
        name: "particle-shader-fs",
        type: "x-shader/x-fragment",
        body:
            "precision highp float;" +

            "varying vec4 vColor;" +
            "varying vec2 vUV;" +

            "uniform sampler2D uMainTextureSampler;" +

            "void main(void) {" +
                "gl_FragColor = texture2D(uMainTextureSampler, vUV) * vColor;" +
            "}"
    };

    global.__DEFAULT_SHADERS = [
        colorShaderVS,
        colorShaderFS,

        textureShaderVS,
        textureShaderFS,

        spriteSheetShaderFS,
        spriteSheetShaderVS,

        boundingBoxShaderVS,
        boundingBoxShaderFS,

        particleShaderVS,
        particleShaderFS
    ];

})(this);
/**
 * Author: thegoldenmule
 * Date: 1/30/13
 * Time: 4:35 PM
 */

/// requestAnimationFrame
window.requestAnimationFrame = window.requestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.msRequestAnimationFrame;

// logging
var Log = (function() {
    function log(msg) {
        if (console && console.log) {
            console.log(msg);
        }
    }

    function replaceTokens(msg, tokens) {
        var message = [];
        var messagePieces = msg.split(/\{\}/);
        for (var i = 0, len = Math.min(tokens.length, messagePieces.length); i < len; i++) {
            message.push(messagePieces[i]);
            message.push(tokens[i]);
        }

        if (i < messagePieces.length) {
            message.push(messagePieces.slice(i).join(""));
        }

        return message.join("");
    }

    function loggingFunction(level) {
        return function() {
            var args =  Array.prototype.slice.call(arguments);
            if (0 === args.length) {
                return;
            } else if (1 === args.length) {
                log("[" + level + "] : " + args[0]);
            } else {
                log("[" + level + "] : " + replaceTokens(args[0], args.slice(1)));
            }
        };
    }

    return {
        debug : loggingFunction("Debug"),
        info : loggingFunction("Info"),
        warn : loggingFunction("Warn"),
        error : loggingFunction("Error")
    };
})();

var Signal = signals.Signal;

/**
 * Engine
 *
 * @type {*}
 */
var Engine = (function() {
    "use strict";

    /// Static Variables

    /// Static Methods

    return function() {
        var that = this;

        var _scene = new Scene();

        // Public Vars
        that.paused = false;
        that.onPreUpdate = new Signal();
        that.onPostUpdate = new Signal();

        /// Private Variables
        var _initialized = false,
            _renderer = null,
            _lastUpdate = 0,
            _totalTime = 0;

        // Public Methods
        that.getSimulationTime = function() {
            return _totalTime;
        };

        that.getRenderer = function() {
            return _renderer;
        };

        that.getScene = function() {
            return _scene;
        };

        that.initialize = function(renderer) {
            if (true === _initialized) {
                throw new Error("Cannot initialize Engine twice!");
            }
            _initialized = true;

            _renderer = renderer;

            _lastUpdate = Date.now();

            // start the game loop
            window.requestAnimationFrame(
                function Step() {
                    var now = Date.now();
                    var dt = now - _lastUpdate;
                    _lastUpdate = now;

                    update(dt);

                    window.requestAnimationFrame(Step);
                });
        };

        /// Private Methods
        function update(dt) {
            if (that.paused) {
                return;
            }

            _totalTime += dt;

            _renderer.preUpdate();
            that.onPreUpdate.dispatch(dt);

            _scene.update(dt, _renderer);

            that.onPostUpdate.dispatch(dt);
        }

        return that;
    };
})();

Engine.prototype = {
    constructor : Engine
};
/**
 * Author: thegoldenmule
 * Date: 8/10/13
 */

(function (global) {
    "use strict";

    /**
     * Curry function.
     *
     * @returns {Function}
     */
    global.Function.prototype.curry = function () {
        var array = Array.prototype.slice.call(arguments);

        if (array.length < 1) {
            return this;
        }

        var _method = this;
        return function() {
            return _method.apply(this, array.concat(Array.prototype.slice.call(arguments)));
        };
    };

})(this);

/**
 * Author: thegoldenmule
 * Date: 3/11/13
 */

(function (global) {
    "use strict";

    var GUIDS = 0;

    var Material = function () {
        var scope = this;

        // get unique id
        var _id = GUIDS++;

        scope.getId = function() {
            return _id;
        };

        scope.shader = new Shader();
        scope.mainTexture = new Texture();
        scope.secTexture = new Texture();

        return scope;
    };

    Material.prototype = {
        constructor:Material,

        prepareTextures: function(ctx) {
            if (null !== this.mainTexture) {
                this.mainTexture.prepareTexture(ctx);
            }

            if (null !== this.secTexture) {
                this.secTexture.prepareTexture(ctx);
            }
        },

        pushTextures: function(ctx, shader) {
            if (null !== this.mainTexture) {
                this.mainTexture.pushTexture(ctx, shader, ctx.TEXTURE0);
            }

            if (null !== this.secTexture) {
                this.secTexture.pushTexture(ctx, shader, ctx.TEXTURE1);
            }
        }
    };

    // export
    global.Material = Material;
})(this);
/**
 * User: ti83
 * Date: 3/10/13
 */

(function(global) {
    "use strict";

    var __tempVec3 = vec3.create();

    var Rectangle = function(x, y, w, h) {
        var scope = this;

        scope.x = undefined === x ? 0 : x;
        scope.y = undefined === y ? 0 : y;
        scope.w = undefined === w ? 0 : w;
        scope.h = undefined === h ? 0 : h;

        return scope;
    };

    Rectangle.prototype = {
        constructor: Rectangle,

        zero: function() {
            this.x = this.y = this.w = this.h = 0;
        },

        set: function(x, y, w, h) {
            this.x = x;
            this.y = y;
            this.w = w;
            this.h = h;
        },

        copy: function(rect) {
            this.x = rect.x;
            this.y = rect.y;
            this.w = rect.w;
            this.h = rect.h;
        }
    };

    global.Rectangle = Rectangle;

})(this);

// Math extensions
(function() {
    "use strict";

    Math.clamp = function(value, min, max) {
        return value < min ? min : value > max ? max : value;
    };

    Math.randomInt = function(min, max) {
        return ~~(min + Math.random() * (max - min));
    };
})();
/**
 * User: ti83
 * Date: 3/9/13
 */
(function(global) {
    "use strict";

    var Quad = function () {
        var that = this;

        that.width = 1;
        that.height = 1;

        that.vertices = new Float32Array([
            0, 0,
            0, 1,
            1, 0,
            1, 1]);

        that.uvs = new Float32Array([
            0, 0,
            0, 1,
            1, 0,
            1, 1]);

        that.colors = new Float32Array([
            1, 1, 1, 1,
            1, 1, 1, 1,
            1, 1, 1, 1,
            1, 1, 1, 1]);

        that.vertexBuffer = null;
        that.uvBuffer = null;
        that.colorBuffer = null;

        that.__apply = true;

        return that;
    };

    Quad.prototype = {
        constructor: Quad,

        apply: function() {
            // update from width/height
            this.vertices[4] = this.vertices[6] = this.width;
            this.vertices[3] = this.vertices[7] = this.height;

            this.__apply = true;
        },

        clearBuffers: function() {
            this.vertexBuffer = this.uvBuffer = this.colorBuffer = null;
        },

        prepareBuffers: function(ctx) {
            if (null === this.vertexBuffer) {
                this.vertexBuffer = ctx.createBuffer();
            }

            if (null === this.uvBuffer) {
                this.uvBuffer = ctx.createBuffer();
            }

            if (null === this.colorBuffer) {
                this.colorBuffer = ctx.createBuffer();
            }

            if (this.__apply) {
                ctx.bindBuffer(ctx.ARRAY_BUFFER, this.vertexBuffer);
                ctx.bufferData(ctx.ARRAY_BUFFER, this.vertices, ctx.STATIC_DRAW);

                ctx.bindBuffer(ctx.ARRAY_BUFFER, this.uvBuffer);
                ctx.bufferData(ctx.ARRAY_BUFFER, this.uvs, ctx.STATIC_DRAW);

                ctx.bindBuffer(ctx.ARRAY_BUFFER, this.colorBuffer);
                ctx.bufferData(ctx.ARRAY_BUFFER, this.colors, ctx.STATIC_DRAW);
            }

            this.__apply = false;
        },

        pushBuffers: function(ctx, shader) {
            if (-1 < shader.vertexBufferAttributePointer) {
                ctx.bindBuffer(ctx.ARRAY_BUFFER, this.vertexBuffer);
                ctx.vertexAttribPointer(shader.vertexBufferAttributePointer, 2, ctx.FLOAT, false, 0, 0);
            }

            if (-1 < shader.uvBufferAttributePointer) {
                ctx.bindBuffer(ctx.ARRAY_BUFFER, this.uvBuffer);
                ctx.vertexAttribPointer(shader.uvBufferAttributePointer, 2, ctx.FLOAT, false, 0, 0);
            }

            if (-1 < shader.vertexColorBufferAttributePointer) {
                ctx.bindBuffer(ctx.ARRAY_BUFFER, this.colorBuffer);
                ctx.vertexAttribPointer(shader.vertexColorBufferAttributePointer, 4, ctx.FLOAT, false, 0, 0);
            }
        },

        draw: function(ctx) {
            ctx.drawArrays(
                ctx.TRIANGLE_STRIP,
                0,
                4);
        }
    };

    // export
    global.Quad = Quad;
})(this);
/**
 * Author: thegoldenmule
 * Date: 3/20/13
 */

(function (global) {
    "use strict";

    var EPSILON = 0.0001;

    var RenderBatch = function (material) {
        var scope = this;

        var _material = material;
        var _displayObjects = [];

        scope.getMaterial = function() {
            return _material;
        };

        scope.getDisplayObjects = function() {
            // returning a copy will definitely affect performance...
            return _displayObjects;
        };

        scope.addDisplayObject = function(displayObject) {
            if (displayObject.material !== _material) {
                return false;
            }

            if (!RenderBatch.canBatch(displayObject)) {
                return false;
            }

            // for good measure...
            displayObject.alpha = 1;

            _displayObjects.push(displayObject);
        };

        scope.removeDisplayObject = function(displayObject) {
            var index = _displayObjects.indexOf(displayObject);
            if (-1 !== index) {
                _displayObjects.splice(index, 1);
            }
        };

        return scope;
    };

    RenderBatch.canBatch = function(displayObject) {
        // cannot batch when alpha is involved
        if (Math.abs(1 - displayObject.alpha) > EPSILON) {
            return false;
        }

        return true;
    };

    RenderBatch.prototype = {
        constructor: RenderBatch
    };

    // export
    global.RenderBatch = RenderBatch;
})(this);
/**
 * Author: thegoldenmule
 * Date: 3/10/13
 */

(function (global) {
    "use strict";

    var Signal = signals.Signal;

    var __totalBatches = 0,
        __total;

    var Scene = function () {
        var scope = this;

        scope.root = new DisplayObject();
        scope.root._parent = scope.root;

        // initialize the SceneManager
        SceneManager.__initialize(scope.root);

        scope.showBoundingBoxes = false;

        scope.update = function(dt, renderer) {
            // traverse scene and render

            // TODO: More analysis needs to be done here!
            //
            // TODO: More than likely, there are better ways to do this so we
            // TODO: don't have to figure all this stuff out every tick.
            var children = [];
            getChildrenRecursively(this.root, children, 0, 100);

            // we now have a set of batches and a list of DisplayObjects
            var context = renderer.getContext();

            // render the non-batched elements on top
            context.disable(context.DEPTH_TEST);
            for (var i = 0, len = children.length; i < len; i++) {
                var child = children[i];

                var localMatrix = child.transform.recalculateMatrix();

                // prepend the parent
                mat4.multiply(child._worldMatrix, child.getParent()._worldMatrix, localMatrix);

                // multiply parent tint with local tint
                // TODO: this method is difficult to understand
                child._composedTint.r = child.tint.r * child.getParent()._composedTint.r;
                child._composedTint.g = child.tint.g * child.getParent()._composedTint.g;
                child._composedTint.b = child.tint.b * child.getParent()._composedTint.b;

                // multiply parent alpha with local
                child._composedAlpha = child.alpha * child.getParent()._composedAlpha;

                renderer.drawDisplayObject(children[i]);
            }

            // render bounding boxes
            if (scope.showBoundingBoxes) {
                for (i = 0; i < len; i++) {
                    renderer.drawBoundingBox(children[i]);
                }
            }
        };

        function getChildrenRecursively(node, list, depthMin, depthMax) {
            var children = node._children;
            var len = children.length;
            if (0 === len) {
                return;
            }

            var diff = (depthMax - depthMin) / len;
            var diffMin = diff / 10;
            var diffMax = 9 * diff / 10;
            for (var i = 0; i < len; i++) {
                var child = children[i];

                // worldmatrix -> identity
                mat4.identity(child._worldMatrix);

                // reset tint
                child._composedTint.white();

                // reset alpha
                child._composedAlpha = 1;

                // invisible!
                if (!child.visible) {
                    continue;
                }

                // set depth
                child.__depth = depthMin + diff * i;

                list.push(child);

                getChildrenRecursively(child, list, child.__depth + diffMin, child.__depth + diffMax);
            }
        }

        return scope;
    };

    Scene.prototype = {
        constructor : Scene
    };

    // export
    global.Scene = Scene;
})(this);
/**
 * Author: thegoldenmule
 * Date: 2/2/13
 * Time: 8:26 PM
 */

var Shader = (function() {
    "use strict";

    var ShaderUniformTypes = {
        FLOAT   : 0,

        VEC2    : 1,
        VEC3    : 2,
        VEC4    : 3,

        MAT2    : 4,
        MAT3    : 5,
        MAT4    : 6
    };

    return function() {
        var that = this;

        that.vertexBufferAttributePointer = null;
        that.vertexColorBufferAttributePointer = null;
        that.uvBufferAttributePointer = null;

        that.projectionMatrixUniformPointer = null;
        that.modelMatrixUniformPointer = null;
        that.colorUniformPointer = null;
        that.depthUniformPointer = null;
        that.mainTextureUniformPointer = null;
        that.secTextureUniformPointer = null;

        var _compiled = false,
            _dirtyPointers = true,
            _shaderProgram = null,
            _vertexProgramId = "texture-shader-vs",
            _fragmentProgramId = "texture-shader-fs",

            _customUniforms = {};

        that.setShaderProgramIds = function(vertex, fragment) {
            if (vertex === _vertexProgramId && fragment === _fragmentProgramId) {
                return;
            }

            _vertexProgramId = vertex;
            _fragmentProgramId = fragment;

            _compiled = false;
        };

        that.getShaderProgram = function() {
            return _shaderProgram;
        };

        function setUniformValue(type) {
            return function (name, value) {
                if (undefined === _customUniforms[name]) {
                    _customUniforms[name] = {
                        type: type,
                        pointer: -1,
                        value: value
                    };

                    _dirtyPointers = true;
                } else {
                    _customUniforms[name].value = value;
                }
            };
        }

        that.setUniformFloat = setUniformValue(ShaderUniformTypes.FLOAT);

        that.setUniformVec2 = setUniformValue(ShaderUniformTypes.VEC2);

        that.setUniformVec3 = setUniformValue(ShaderUniformTypes.VEC3);

        that.setUniformVec4 = setUniformValue(ShaderUniformTypes.VEC4);

        that.setUniformMat2 = setUniformValue(ShaderUniformTypes.MAT2);

        that.setUniformMat3 = setUniformValue(ShaderUniformTypes.MAT3);

        that.setUniformMat4 = setUniformValue(ShaderUniformTypes.MAT4);

        that.compile = function(ctx) {
            if (!_compiled) {
                if (null === _vertexProgramId || null === _fragmentProgramId) {
                    return false;
                }

                if (window.isTwoDeeDebug) {
                    Log.debug("Compiling program {" + _vertexProgramId + " :: " + _fragmentProgramId + "}");
                }

                var fragmentShader = compileShader(ctx, _fragmentProgramId);
                var vertexShader = compileShader(ctx, _vertexProgramId);

                _shaderProgram = ctx.createProgram();

                if (null === vertexShader || null === fragmentShader) {
                    return false;
                }

                try {
                    ctx.attachShader(_shaderProgram, vertexShader);
                    ctx.attachShader(_shaderProgram, fragmentShader);
                } catch (error) {
                    return false;
                }

                ctx.linkProgram(_shaderProgram);

                if (!ctx.getProgramParameter(_shaderProgram, ctx.LINK_STATUS)) {
                    return false;
                }

                _compiled = true;
            }

            if (_dirtyPointers) {
                setupPointers(ctx);

                _dirtyPointers = true;
            }

            return true;
        };

        // TODO: This is obviously not optimal!
        that.pushCustomUniforms = function(ctx) {
            Object.keys(_customUniforms).forEach(
                function(name) {
                    var definition = _customUniforms[name];
                    if (-1 === definition.pointer) {
                        return;
                    }

                    switch (definition.type) {
                        case ShaderUniformTypes.FLOAT:
                            ctx.uniform1f(definition.pointer, definition.value);
                            break;

                        case ShaderUniformTypes.VEC2:
                            ctx.uniform2fv(definition.pointer, definition.value);
                            break;

                        case ShaderUniformTypes.VEC3:
                            ctx.uniform3fv(definition.pointer, definition.value);
                            break;

                        case ShaderUniformTypes.VEC4:
                            ctx.uniform4fv(definition.pointer, definition.value);
                            break;

                        case ShaderUniformTypes.MAT2:
                            ctx.uniformMatrix2fv(definition.pointer, false, definition.value);
                            break;

                        case ShaderUniformTypes.MAT3:
                            ctx.uniformMatrix3fv(definition.pointer, false, definition.value);
                            break;

                        case ShaderUniformTypes.MAT4:
                            ctx.uniformMatrix4fv(definition.pointer, false, definition.value);
                            break;
                    }
                });
        };

        // This function is based on
        // https://developer.mozilla.org/en-US/docs/WebGL/Adding_2D_content_to_a_WebGL_context.
        function compileShader(ctx, id) {
            var script = document.getElementById(id);

            if (null === script) {
                Log.error("Could not find shader " + id + ".");
                return null;
            }

            var source = "";
            var currentChild = script.firstChild;

            while (currentChild) {
                if (currentChild.nodeType === currentChild.TEXT_NODE) {
                    source += currentChild.textContent;
                }

                currentChild = currentChild.nextSibling;
            }

            var shader = null;

            if ("x-shader/x-fragment" === script.type) {
                shader = ctx.createShader(ctx.FRAGMENT_SHADER);
            } else if ("x-shader/x-vertex" === script.type) {
                shader = ctx.createShader(ctx.VERTEX_SHADER);
            } else {
                // Unknown shader type
                Log.error("Unknown shader type : " + script.type);
                return null;
            }

            ctx.shaderSource(shader, source);

            // Compile the shader program
            ctx.compileShader(shader);

            // See if it compiled successfully
            if (!ctx.getShaderParameter(shader, ctx.COMPILE_STATUS)) {
                if (window.isTwoDeeDebug) {
                    Log.error("Could not compile shader :\n{}", ctx.getShaderInfoLog(shader));
                }
                return null;
            }

            return shader;
        }

        function setupPointers(ctx) {
            setupAttributePointers(ctx);
            setupUniformPointers(ctx);
            setupCustomUniformPointers(ctx);
        }

        function setupAttributePointers(ctx) {
            that.vertexBufferAttributePointer = ctx.getAttribLocation(_shaderProgram, "aPosition");
            if (-1 !== that.vertexBufferAttributePointer) {
                ctx.enableVertexAttribArray(that.vertexBufferAttributePointer);
            }

            that.vertexColorBufferAttributePointer = ctx.getAttribLocation(_shaderProgram, "aColor");
            if (-1 !== that.vertexColorBufferAttributePointer) {
                ctx.enableVertexAttribArray(that.vertexColorBufferAttributePointer);
            }

            that.uvBufferAttributePointer = ctx.getAttribLocation(_shaderProgram, "aUV");
            if (-1 !== that.uvBufferAttributePointer) {
                ctx.enableVertexAttribArray(that.uvBufferAttributePointer);
            }
        }

        function setupUniformPointers(ctx) {
            that.projectionMatrixUniformPointer = ctx.getUniformLocation(_shaderProgram, "uProjectionMatrix");
            that.modelMatrixUniformPointer = ctx.getUniformLocation(_shaderProgram, "uModelViewMatrix");
            that.colorUniformPointer = ctx.getUniformLocation(_shaderProgram, "uColor");
            that.depthUniformPointer = ctx.getUniformLocation(_shaderProgram, "uDepth");
            that.mainTextureUniformPointer = ctx.getUniformLocation(_shaderProgram, "uMainTextureSampler");
            that.secTextureUniformPointer = ctx.getUniformLocation(_shaderProgram, "uSecTextureSampler");
        }

        // TODO: This method is obviously not optimal!
        function setupCustomUniformPointers(ctx) {
            Object.keys(_customUniforms).forEach(
                function(name) {
                    var definition = _customUniforms[name];
                    definition.pointer = ctx.getUniformLocation(_shaderProgram, name);
                });
        }

        return that;
    };
})();
/**
 * Author: thegoldenmule
 * Date: 5/26/13
 */

(function (global) {
    "use strict";

    var SpriteSheetScheduler = function () {
        var scope = this;

        var _spriteSheets = new Set();

        scope.addSpriteSheet = function(spriteSheet) {
            _spriteSheets.add(spriteSheet);
        };

        scope.removeSpriteSheet = function(spriteSheet) {
            _spriteSheets.remove(spriteSheet);
        };

        scope.onPreUpdate = function(dt) {
            var elements = _spriteSheets.getElements();
            for (var i = 0, len = elements.length; i < len; i++) {
                elements[i].update(dt);
            }
        };

        return scope;
    };

    SpriteSheetScheduler.prototype = {
        constructor: SpriteSheetScheduler
    };

    // export
    global.SpriteSheetScheduler = SpriteSheetScheduler;
})(this);
/**
 * Author: thegoldenmule
 * Date: 3/10/13
 */

(function (global) {
    "use strict";

    var Texture = function (image) {
        var scope = this;

        scope.image = undefined === image ? null : image;
        scope.glTexture = null;
        scope.flipY = false;
        scope.filterLinear = true;
        scope.mipmapLinear = true;

        return scope;
    };

    Texture.prototype = {
        constructor:Texture,

        getWidth: function() {
            return this.image ? parseInt(this.image.width, 10) : 0;
        },

        getHeight: function() {
            return this.image ? parseInt(this.image.height, 10) : 0;
        },

        prepareTexture: function(ctx) {
            if (null === this.image) {
                return;
            }

            if (null === this.glTexture) {
                this.glTexture = ctx.createTexture();

                ctx.bindTexture(ctx.TEXTURE_2D, this.glTexture);
                ctx.pixelStorei(ctx.UNPACK_FLIP_Y_WEBGL, this.flipY);
                ctx.pixelStorei(ctx.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
                ctx.texImage2D(ctx.TEXTURE_2D, 0, ctx.RGBA, ctx.RGBA, ctx.UNSIGNED_BYTE, this.image);
                ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MAG_FILTER, this.filterLinear ? ctx.LINEAR : ctx.NEAREST);
                ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MIN_FILTER, this.filterLinear ? ctx.LINEAR : ctx.NEAREST);
                ctx.bindTexture(ctx.TEXTURE_2D, null);
            }
        },

        pushTexture: function(ctx, shader, textureNum) {
            if (-1 === shader.mainTextureUniformPointer) {
                return;
            }

            ctx.activeTexture(textureNum);
            ctx.bindTexture(ctx.TEXTURE_2D, this.glTexture);
            ctx.uniform1i(shader.mainTextureUniformPointer, 0);
        }
    };

    // export
    global.Texture = Texture;
})(this);
/**
 * Author: thegoldenmule
 * Date: 3/10/13
 */

(function (global) {
    "use strict";

    var __tempVec3 = vec3.create();

    var Transform = function () {
        var scope = this;

        var _matrix = mat4.create();

        scope.anchorPoint = {
            x:0,
            y:0
        };

        scope.position = {
            x:0,
            y:0
        };

        scope.rotationInRadians = 0;

        scope.scale = {
            x: 1,
            y: 1
        };

        scope.getMatrix = function() {
            return _matrix;
        };

        scope.recalculateMatrix = function() {
            // this takes the anchor point into consideration
            mat4.identity(_matrix);
            mat4.translate(_matrix, _matrix,
                vec3.set(
                    __tempVec3,
                    scope.position.x,
                    scope.position.y,
                    0.0));
            mat4.rotateZ(_matrix, _matrix, scope.rotationInRadians);
            mat4.translate(_matrix, _matrix,
                vec3.set(
                    __tempVec3,
                    -scope.anchorPoint.x,
                    -scope.anchorPoint.y,
                    0.0));

            mat4.scale(_matrix, _matrix,
                vec3.set(
                    __tempVec3,
                    scope.scale.x,
                    scope.scale.y,
                    1.0));

            return _matrix;
        };

        return scope;
    };

    Transform.prototype = {
        constructor:Transform,

        clone: function() {
            var newTransform = new Transform();
            newTransform.copy(this);
            return newTransform;
        },

        copy: function(transform) {
            this.position.x = transform.position.x;
            this.position.y = transform.position.y;
            this.scale.x = transform.scale.x;
            this.scale.y = transform.scale.y;
            this.rotationInRadians = transform.rotationInRadians;
        }
    };

    // export
    global.Transform = Transform;
})(this);
/**
 * Author: thegoldenmule
 * Date: 3/10/13
 */

(function (global) {
    "use strict";

    var __tempModelMatrix = mat4.create(),
        __tempColor = new Float32Array([1, 1, 1, 1]);

    var WebGLRenderer = function(canvas) {
        var scope = this;

        var _canvas = canvas,
            _ctx,
            _debugInformation = {};

        /**
         * Returns the CanvasDomElement being used.
         *
         * @returns {*}
         */
        scope.getCanvas = function() {
            return _canvas;
        };

        /**
         * Returns the WebGL context eing used.
         *
         * @returns {*}
         */
        scope.getContext = function() {
            return _ctx;
        };

        /**
         * Resizes the viewport based on a resize to the CanvasDomElement.
         */
        scope.resize = (function() {

            var oldWidth = 0;
            var oldHeight = 0;

            return function() {
                var width = canvas.clientWidth;
                var height = canvas.clientHeight;

                if (width === oldWidth &&
                    height === oldHeight) {
                    return;
                }

                canvas.width = width;
                canvas.height = height;

                _ctx.viewport(0, 0, _ctx.drawingBufferWidth, _ctx.drawingBufferHeight);

                scope.projectionMatrix = mat4.ortho(
                    mat4.create(),
                    0, width,
                    height,
                    -1, 1);
            };
        })();

        // init context
        try {
            var params = {
                premultipliedAlpha: false,
                alpha: false
            };
            _ctx = canvas.getContext("webgl", params) || canvas.getContext("experimental-webgl", params);

            // size
            scope.resize();

            // use the debug context if we want to see verbose logs
            if (window.isTwoDeeDebug) {
                _ctx = WebGLDebugUtils.makeDebugContext(_ctx);

                _debugInformation.isDebugCanvas = true;
            }

            _ctx.clearColor(1, 1, 1, 1);

            // alpha blending
            _ctx.enable(_ctx.BLEND);
            _ctx.blendFunc(_ctx.SRC_ALPHA, _ctx.ONE_MINUS_SRC_ALPHA);
        } catch (error) {
            Log.error(error);
        }

        // inject shaders here
        if (global.__DEFAULT_SHADERS) {
            global.__DEFAULT_SHADERS.forEach(this.appendShader);
        }

        return scope;
    };

    WebGLRenderer.prototype = {
        constructor:WebGLRenderer,

        /**
         * Returns the width of the viewport.
         *
         * @returns {number}
         */
        getWidth: function() {
            return this.getCanvas().clientWidth;
        },

        /**
         * Returns the height of the viewport.
         *
         * @returns {number}
         */
        getHeight: function() {
            return this.getCanvas().clientHeight;
        },

        /**
         * Appends a shader to the DOM. Definitions are objects in the form:
         *
         * {
         *  name,   (a unique name for the shader tag)
         *  type,   (x-shader/x-vertex or x-shader/x-fragment)
         *  body    (the glsl body of the shader)
         * }
         * @param definition
         */
        appendShader: function(definition) {
            var shader = document.createElement('script');
            shader.type = definition.type;
            shader.id = definition.name;

            try {
                shader.appendChild(document.createTextNode(definition.body));
            } catch (error) {
                shader.text = definition.body;
            } finally {
                document.body.appendChild(shader);
            }
        },

        /**
         * Called as part of the boX cycle, before any drawing is done.
         */
        preUpdate: function() {
            this.resize();

            var context = this.getContext();
            context.clear(context.COLOR_BUFFER_BIT | context.DEPTH_BUFFER_BIT);
        },

        /**
         * Draws a single DisplayObject.
         *
         * @param displayObject
         */
        drawDisplayObject: function(displayObject) {
            var context = this.getContext();

            // set the program to use
            var shader = displayObject.material.shader;
            shader.compile(context);
            context.useProgram(shader.getShaderProgram());

            // upload custom shader attributes + uniforms
            shader.pushCustomUniforms(context);

            // set projection
            if (-1 !== shader.projectionMatrixUniformPointer) {
                context.uniformMatrix4fv(shader.projectionMatrixUniformPointer, false, this.projectionMatrix);
            }

            // depth
            // NO DEPTH for DisplayObjects drawn singly as the CPU sorts them before drawing
            if (-1 !== shader.depthUniformPointer) {
                context.uniform1f(shader.depthUniformPointer, displayObject.__depth);
            }

            // update + set transform
            if (-1 !== shader.modelMatrixUniformPointer) {
                context.uniformMatrix4fv(shader.modelMatrixUniformPointer, false, displayObject._worldMatrix);
            }

            // color
            if (-1 !== shader.colorUniformPointer) {
                __tempColor[0] = displayObject._composedTint.r;
                __tempColor[1] = displayObject._composedTint.g;
                __tempColor[2] = displayObject._composedTint.b;
                __tempColor[3] = displayObject._composedAlpha;

                context.uniform4fv(shader.colorUniformPointer, __tempColor);
            }

            // prepare + push buffers

            // TODO: evaluate where this belongs
            displayObject.material.prepareTextures(context);
            displayObject.material.pushTextures(context, shader);

            displayObject.geometry.prepareBuffers(context);
            displayObject.geometry.pushBuffers(context, shader);

            // draw
            displayObject.geometry.draw(context);
        },

        /**
         * Draws a bounding box for a DisplayObject.
         */
        drawBoundingBox: (function() {
            var bbShader = null;

            return function(displayObject) {
                var context = this.getContext();

                if (null === bbShader) {
                    bbShader = new Shader();
                    bbShader.setShaderProgramIds("bb-shader-vs", "bb-shader-fs");
                    bbShader.compile(context);
                }

                context.useProgram(bbShader.getShaderProgram());

                // set projection
                if (-1 !== bbShader.projectionMatrixUniformPointer) {
                    context.uniformMatrix4fv(shader.projectionMatrixUniformPointer, false, this.projectionMatrix);
                }

                // update + set transform
                if (-1 !== bbShader.modelMatrixUniformPointer) {
                    context.uniformMatrix4fv(shader.modelMatrixUniformPointer, false, displayObject.recalculateWorldMatrix());
                }

                // prepare + push buffers
                displayObject.quad.prepareBuffers(context);
                displayObject.quad.pushBuffers(context, shader);

                // TODO: Finish!
            };
        })()
    };

    // export
    global.WebGLRenderer = WebGLRenderer;
})(this);
/**
 * Author: thegoldenmule
 * Date: 8/9/13
 */

(function (global) {
    "use strict";

    /**
     * @class AnimationCurveKey
     * @author thegoldenmule
     * @desc Defines a point (x, y) in ([0,1], [0,1]).
     * @param {number} time A normalized value that defines the time at which
     * the curve should be at value.
     * @param {number} value A normalized value that defines the value at which
     * the curve should be at time.
     * @returns {AnimationCurveKey}
     * @constructor
     */
    global.AnimationCurveKey = function(time, value) {
        var scope = this;

        scope.time = Math.clamp(undefined === time ? 0 : time, 0, 1);
        scope.value = Math.clamp(undefined === value ? 1 : value, 0, 1);

        return scope;
    };

    global.AnimationCurveKey.prototype = {
        constructor: global.AnimationCurveKey
    };

    /**
     * @class AnimationCurve
     * @desc Defines a continuous function through points in the unit interval
     * on R^2. These points are given as AnimationCurveKeys.
     * @param {Array} keys An optional array of AnimationCurveKeys to populate
     * the curve with.
     * @returns {AnimationCurve}
     * @constructor
     */
    global.AnimationCurve = function (keys) {
        var scope = this;

        var _keys = [
            new global.AnimationCurveKey(0, 0),
            new global.AnimationCurveKey(1, 1)
        ];

        /**
         * @member global.AnimationCurve#easingFunction
         * @desc Defines the easing method to use. Predefined easing types are
         * given in the Easing object, but any function f:[0, 1] -> [0, 1] will do.
         * Defaults to Easing.Quadradic.InOut
         *
         * @type {Function}
         */
        scope.easingFunction = Easing.Quadratic.InOut;

        /**
         * @function global.AnimationCurve#getKeys
         * @desc Retrieves a copy of the keys array.
         *
         * @returns {Array}
         */
        scope.getKeys = function() {
            return _keys.slice(0);
        };

        /**
         * @function global.AnimationCurve#getFirstKey
         * @desc Retrieves the first AnimationCurveKey instance.
         *
         * @returns {AnimationCurveKey}
         */
        scope.getFirstKey = function() {
            return 0 !== _keys.length ? _keys[0] : null;
        };

        /**
         * @function global.AnimationCurve#getLastKey
         * @desc Retrieves the last AnimationCurveKey instance.
         *
         * @returns {AnimationCurveKey}
         */
        scope.getLastKey = function() {
            if (_keys.length > 0) {
                return _keys[_keys.length - 1];
            }

            return null;
        };

        /**
         * @function global.AnimationCurve#addKey
         * @desc Adds an AnimationCurveKey to the curve.
         * @param {AnimationCurveKey} key An AnimationCurveKey.
         *
         * @returns {AnimationCurveKey}
         */
        scope.addKey = function(key) {
            // simple sort on insert
            for (var i = 0, len = _keys.length - 1; i < len; i++) {
                if (_keys[i].time < key.time &&
                    _keys[i + 1].time > key.time) {
                    _keys.splice(i + 1, 0, key);

                    return;
                }
            }

            _keys.push(key);

            return key;
        };

        /**
         * @function global.AnimationCurve#removeKey
         * @desc Removes an AnimationCurveKey from this curve.
         * @param {AnimationCurveKey} key An AnimationCurveKey.
         *
         * @returns {AnimationCurveKey}
         */
        scope.removeKey = function(key) {
            // remove
            var index = _keys.indexOf(key);
            if (-1 !== index) {
                _keys.splice(index, 1);
            }
        };

        /**
         * @function global.AnimationCurve#evaluate
         * @desc Evaluates the animation curve at a normalized parameter t.
         * @param {Number} t A value in the unit interval.
         *
         * @returns {Number}
         */
        scope.evaluate = function(t) {
            // clamp input
            t = Math.clamp(t, 0, 1);

            // find the two keys to evaluate between
            var len = _keys.length;
            if (len < 2) {
                return 0;
            }

            // TODO: we may be able to speed this up by using the index we last
            // used instead of starting with 0.
            var a, b;
            for (var i = 0; i < len - 1; i++) {
                a = _keys[i];
                b = _keys[i + 1];

                if (a.time <= t &&
                    b.time >= t) {
                    return interpolate(a.value, b.value, (t - a.time) / (b.time - a.time));
                }
            }

            // in this case, there is no key defined after the t passed in,
            // so clamp to the last keys value
            return _keys[len - 1].value;
        };

        /**
         * @desc Linearly interpolates using the easing function (which is possibly
         * non-linear).
         *
         * @private
         *
         * @param a
         * @param b
         * @param t
         * SS
         * @returns {number}
         */
        function interpolate(a, b, t) {
            return a + scope.easingFunction(t) * (b - a);
        }

        return scope;
    };

    global.AnimationCurve.prototype = {
        constructor: global.AnimationCurve
    };
})(this);

/**
 * Author: thegoldenmule
 * Date: 8/9/13
 */

(function (global) {
    "use strict";

    /**
     @class Easing

     @desc
     The MIT License

     Copyright (c) 2010-2012 Tween.js authors.

     Easing equations Copyright (c) 2001 Robert Penner http://robertpenner.com/easing/

     Permission is hereby granted, free of charge, to any person obtaining a copy
     of this software and associated documentation files (the "Software"), to deal
     in the Software without restriction, including without limitation the rights
     to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     copies of the Software, and to permit persons to whom the Software is
     furnished to do so, subject to the following conditions:

     The above copyright notice and this permission notice shall be included in
     all copies or substantial portions of the Software.

     THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
     THE SOFTWARE.

     */
    global.Easing = {

        Linear: {

            None: function ( k ) {

                return k;

            }

        },

        Quadratic: {

            In: function ( k ) {

                return k * k;

            },

            Out: function ( k ) {

                return k * ( 2 - k );

            },

            InOut: function ( k ) {

                if ( ( k *= 2 ) < 1 ) {
                    return 0.5 * k * k;
                }

                return - 0.5 * ( --k * ( k - 2 ) - 1 );

            }

        },

        Cubic: {

            In: function ( k ) {

                return k * k * k;

            },

            Out: function ( k ) {

                return --k * k * k + 1;

            },

            InOut: function ( k ) {

                if ( ( k *= 2 ) < 1 ) {
                    return 0.5 * k * k * k;
                }

                return 0.5 * ( ( k -= 2 ) * k * k + 2 );

            }

        },

        Quartic: {

            In: function ( k ) {

                return k * k * k * k;

            },

            Out: function ( k ) {

                return 1 - ( --k * k * k * k );

            },

            InOut: function ( k ) {

                if ( ( k *= 2 ) < 1) {
                    return 0.5 * k * k * k * k;
                }

                return - 0.5 * ( ( k -= 2 ) * k * k * k - 2 );

            }

        },

        Quintic: {

            In: function ( k ) {

                return k * k * k * k * k;

            },

            Out: function ( k ) {

                return --k * k * k * k * k + 1;

            },

            InOut: function ( k ) {

                if ( ( k *= 2 ) < 1 ) {
                    return 0.5 * k * k * k * k * k;
                }

                return 0.5 * ( ( k -= 2 ) * k * k * k * k + 2 );

            }

        },

        Sinusoidal: {

            In: function ( k ) {

                return 1 - Math.cos( k * Math.PI / 2 );

            },

            Out: function ( k ) {

                return Math.sin( k * Math.PI / 2 );

            },

            InOut: function ( k ) {

                return 0.5 * ( 1 - Math.cos( Math.PI * k ) );

            }

        },

        Exponential: {

            In: function ( k ) {

                return k === 0 ? 0 : Math.pow( 1024, k - 1 );

            },

            Out: function ( k ) {

                return k === 1 ? 1 : 1 - Math.pow( 2, - 10 * k );

            },

            InOut: function ( k ) {

                if ( k === 0 ) {
                    return 0;
                }

                if ( k === 1 ) {
                    return 1;
                }

                if ( ( k *= 2 ) < 1 ) {
                    return 0.5 * Math.pow( 1024, k - 1 );
                }

                return 0.5 * ( - Math.pow( 2, - 10 * ( k - 1 ) ) + 2 );

            }

        },

        Circular: {

            In: function ( k ) {

                return 1 - Math.sqrt( 1 - k * k );

            },

            Out: function ( k ) {

                return Math.sqrt( 1 - ( --k * k ) );

            },

            InOut: function ( k ) {

                if ( ( k *= 2 ) < 1) {
                    return - 0.5 * ( Math.sqrt( 1 - k * k) - 1);
                }

                return 0.5 * ( Math.sqrt( 1 - ( k -= 2) * k) + 1);

            }

        },

        Elastic: {

            In: function ( k ) {

                var s, a = 0.1, p = 0.4;
                if ( k === 0 ) {
                    return 0;
                }

                if ( k === 1 ) {
                    return 1;
                }

                if ( !a || a < 1 )
                {
                    a = 1; s = p / 4;
                }
                else {
                    s = p * Math.asin( 1 / a ) / ( 2 * Math.PI );
                }

                return - ( a * Math.pow( 2, 10 * ( k -= 1 ) ) * Math.sin( ( k - s ) * ( 2 * Math.PI ) / p ) );

            },

            Out: function ( k ) {

                var s, a = 0.1, p = 0.4;
                if ( k === 0 ) {
                    return 0;
                }

                if ( k === 1 ) {
                    return 1;
                }

                if ( !a || a < 1 )
                {
                    a = 1; s = p / 4;
                }
                else {
                    s = p * Math.asin( 1 / a ) / ( 2 * Math.PI );
                }

                return ( a * Math.pow( 2, - 10 * k) * Math.sin( ( k - s ) * ( 2 * Math.PI ) / p ) + 1 );

            },

            InOut: function ( k ) {

                var s, a = 0.1, p = 0.4;
                if ( k === 0 ) {
                    return 0;
                }

                if ( k === 1 ) {
                    return 1;
                }

                if ( !a || a < 1 )
                {
                    a = 1; s = p / 4;
                }
                else {
                    s = p * Math.asin( 1 / a ) / ( 2 * Math.PI );
                }

                if ( ( k *= 2 ) < 1 ) {
                    return - 0.5 * ( a * Math.pow( 2, 10 * ( k -= 1 ) ) * Math.sin( ( k - s ) * ( 2 * Math.PI ) / p ) );
                }

                return a * Math.pow( 2, -10 * ( k -= 1 ) ) * Math.sin( ( k - s ) * ( 2 * Math.PI ) / p ) * 0.5 + 1;

            }

        },

        Back: {

            In: function ( k ) {

                var s = 1.70158;
                return k * k * ( ( s + 1 ) * k - s );

            },

            Out: function ( k ) {

                var s = 1.70158;
                return --k * k * ( ( s + 1 ) * k + s ) + 1;

            },

            InOut: function ( k ) {

                var s = 1.70158 * 1.525;
                if ( ( k *= 2 ) < 1 ) {
                    return 0.5 * ( k * k * ( ( s + 1 ) * k - s ) );
                }

                return 0.5 * ( ( k -= 2 ) * k * ( ( s + 1 ) * k + s ) + 2 );

            }

        },

        Bounce: {

            In: function ( k ) {

                return 1 - TWEEN.Easing.Bounce.Out( 1 - k );

            },

            Out: function ( k ) {

                if ( k < ( 1 / 2.75 ) ) {

                    return 7.5625 * k * k;

                } else if ( k < ( 2 / 2.75 ) ) {

                    return 7.5625 * ( k -= ( 1.5 / 2.75 ) ) * k + 0.75;

                } else if ( k < ( 2.5 / 2.75 ) ) {

                    return 7.5625 * ( k -= ( 2.25 / 2.75 ) ) * k + 0.9375;

                } else {

                    return 7.5625 * ( k -= ( 2.625 / 2.75 ) ) * k + 0.984375;

                }

            },

            InOut: function ( k ) {

                if ( k < 0.5 ) {
                    return TWEEN.Easing.Bounce.In( k * 2 ) * 0.5;
                }

                return TWEEN.Easing.Bounce.Out( k * 2 - 1 ) * 0.5 + 0.5;

            }

        }

    };
})(this);

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
            if (!element) {
                return;
            }

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
            if (!element) {
                return;
            }

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
(function (global) {
    "use strict";

    // imports
    var Signal = signals.Signal;

    var __GUIDS = 0,
        __tempVec3 = vec3.create();

    /**
     * The base object for all items in the scene.
     *
     * @class DisplayObject
     *
     * @param {Object} parameters An object for initializing the DisplayObject.
     * This object may contain the following properties: visible, alpha, tint,
     * x, y, material, mainTexture, secTexture, width, height, and name.
     *
     * @returns {DisplayObject}
     *
     * @example
     * var sprite = new Sprite({
     *      x: 10,
     *      y: 100,
     *      tint: new Color(0, 1, 0)
     * });
     *
     * @constructor
     *
     * @author thegoldenmule
     */
    global.DisplayObject = function (parameters) {
        var scope = this;

        var _id = __GUIDS++,
            _boundingBox = new Rectangle(0, 0, 0, 0),
            _worldBoundingBox = new Rectangle(0, 0, 0, 0);

        /**
         * @member global.DisplayObject#_worldMatrix
         * @desc Holds the world transform of this object.
         * @private
         * @type {mat4}
         */
        scope._worldMatrix = mat4.create();

        /**
         * @member global.DisplayObject#_composedTint
         * @desc Holds the tint composed through all parent tints
         * @type {Color}
         * @private
         */
        scope._composedTint = new Color(1, 1, 1);

        /**
         * @member global.DisplayObject#_composedAlpha
         * @desc Holds the alpha composed through all parent tints
         * @type {Color}
         * @private
         */
        scope._composedAlpha = 1;

        if (undefined === parameters) {
            parameters = {};
        }

        /**
         * @member global.DisplayObject#name
         * @desc A non-unique name.
         * @type {string}
         */
        scope.name = undefined === parameters.name ? "displayObject"  + _id.toString() : parameters.name;

        /**
         * @member global.DisplayObject#visible
         * @desc Toggles the visibility of this DisplayObject and all children.
         *
         * @type {boolean}
         */
        scope.visible = false === parameters.visible ? false : true;

        /**
         * @member global.DisplayObject#alpha
         * @desc A value between 0 and 1 that determines the alpha of this
         * DisplayObject.
         *
         * @type {number}
         */
        scope.alpha = undefined === parameters.alpha ? 1 : parameters.alpha;

        /**
         * @member global.DisplayObject#tint
         * @desc A Color to tint this DisplayObject.
         *
         * @type {Color}
         */
        scope.tint = undefined === parameters.tint ? new Color(1, 1, 1) : parameters.tint;

        /**
         * @member global.DisplayObject#transform
         * @desc The transform component to apply to this DisplayObject.
         *
         * @type {Transform}
         */
        scope.transform = new Transform();
        scope.transform.position.x = undefined === parameters.x ? 0 : parameters.x;
        scope.transform.position.y = undefined === parameters.y ? 0 : parameters.y;

        /**
         * @member global.DisplayObject#material
         * @desc The Material instance with chich to render this DisplayObject.
         *
         * @type {Material}
         */
        scope.material = undefined === parameters.material ? new Material() : parameters.material;
        if (undefined !== parameters.mainTexture) {
            scope.material.mainTexture = parameters.mainTexture;
        }
        if (undefined !== parameters.secTexture) {
            scope.material.secTexture = parameters.secTexture;
        }

        /**
         * @member global.DisplayObject#geometry
         * @desc The IGeometry implementation for this DisplayObject. Defaults
         * to Quad.
         *
         * @type {Quad}
         */
        scope.geometry = new Quad();
        scope.geometry.width = undefined === parameters.width ? 1 : parameters.width;
        scope.geometry.height = undefined === parameters.height ? 1 : parameters.height;
        scope.geometry.apply();

        /**
         * @member global.DisplayObject#children
         * @desc An array of child DisplayObjects.
         * @private
         *
         * @type {Array}
         */
        scope._children = [];

        /**
         * @member global.DisplayObject#parent
         * @desc The DisplayObject instance to which this instance has been
         * added as a child.
         * @private
         *
         * @type {DisplayObject}
         */
        scope._parent = null;

        /**
         * @function global.DisplayObject#getWidth
         * @desc Returns the local width of the underlying geometry.
         *
         * @returns {number}
         */
        scope.getWidth = function() {
            return scope.geometry.width;
        };

        /**
         * @function global.DisplayObject#getHeight
         * @desc Returns the local height of the underlying geometry.
         *
         * @returns {number}
         */
        scope.getHeight = function() {
            return scope.geometry.height;
        };

        /**
         * @function global.DisplayObject#recalculateWorldMatrix
         * @desc Calculates the world matrix of this DisplayObject and returns
         * it.
         *
         * @returns {mat4}
         */
        scope.recalculateWorldMatrix = (function() {

            function appendTransform(displayObject, out) {
                if (null !== displayObject._parent && displayObject._parent !== displayObject) {
                    appendTransform(displayObject._parent, out);
                }

                // recalc
                mat4.multiply(out, out, displayObject.transform.recalculateMatrix());
            }

            function composeTransforms(displayObject, out) {
                mat4.identity(out);

                if (null !== displayObject._parent && displayObject._parent !== displayObject) {
                    appendTransform(displayObject._parent, out);
                }

                mat4.multiply(out, out, displayObject.transform.recalculateMatrix());

                return out;
            }

            return function() {
                return composeTransforms(scope, scope._worldMatrix);
            };
        })();

        /**
         * @function global.DisplayObject#getUniqueId
         * @desc All DisplayObject instances are assigned an id at
         * instantiation that is unique across all DisplayObject
         * instances. This function returns that value.
         *
         * @returns {number}
         */
        scope.getUniqueId = function() {
            return _id;
        };

        scope.getLocalBB = function() {
            // locally, this is always axis aligned
            var x = scope.transform.position.x;
            var y = scope.transform.position.y;
            var width = scope.geometry.width;
            var height = scope.geometry.height;

            _boundingBox.set(
                x, y,
                x + width,
                y + height);

            return _boundingBox;
        };

        scope.getWorldBB = function() {
            var scope = this;

            // get local AABB
            var local = scope.getLocalAABB();

            // get world transformation matrix
            var mat = scope.recalculateWorldMatrix();

            // transform origin
            vec3.transformMat4(__tempVec3, vec3.set(__tempVec3, local.x, local.y, 0), mat);

            var tempX = __tempVec3[0];
            var tempY = __tempVec3[1];

            // transform far corner
            vec3.transformMat4(__tempVec3, vec3.set(__tempVec3, this.x + this.w, this.y + this.h, 0), mat);

            // set
            _worldBoundingBox.set(
                tempX,
                tempY,
                __tempVec3[0] - tempX,
                __tempVec3[1] - tempY);

            return _worldBoundingBox;
        };

        return scope;
    };

    global.DisplayObject.prototype = {
        constructor:global.DisplayObject,

        /**
         * Retrieves the parent DisplayObject.
         *
         * @returns {DisplayObject}
         */
        getParent: function() {
            return this._parent;
        },

        /**
         * Retrieves a copy of the array of children for this DisplayObject.
         *
         * @returns {Array}
         */
        getChildren: function() {
            return this._children.slice(0);
        },

        /**
         * Returns a child by name, or null if no child by that name exists.
         * @param {String} name The name of the child to return.
         *
         * @return {DisplayObject}
         */
        getChildByName: function(name) {
            for (var i = 0, len = this._children.length; i < len; i++) {
                if (this._children[i].name === name) {
                    return this._children[i];
                }
            }

            return null;
        },

        /**
         * Adds a DisplayObject as a child of this one.
         *
         * @param {DisplayObject} child A DisplayObject instance to add as a
         * child.
         *
         * @returns {DisplayObject}
         */
        addChild: function(child) {
            if (this === child) {
                throw new Error("Cannot add self to self.");
            }

            // root
            if (child._parent === child) {
                throw new Error("Cannot add root to another DisplayObject.");
            }

            // already added
            if (child._parent === this) {
                return;
            }

            // remove from old parent
            if (child._parent) {
                child._parent.removeChild(child);
            }

            // we are the new parent
            child._parent = this;
            this._children.push(child);

            if (null !== this.getParent()) {
                global.SceneManager.__addDisplayObject(child);
            }

            return child;
        },

        /**
         * Adds a list of DisplayObjects as children.
         *
         * @param {Array} children an array of DisplayObjects to add as
         * children.
         */
        addChildren: function(children) {
            children.forEach(this.addChild);
        },

        /**
         * Removes a DisplayObject from the list of children.
         *
         * @param {DisplayObject} child A DisplayObject instance to remove
         * @returns {DisplayObject}
         */
        removeChild: function(child) {
            // TODO: Save indices on child, replace hole with last
            var index = this._children.indexOf(child);
            if (-1 !== index) {
                this._children.splice(index, 1);

                child._parent = null;

                global.SceneManager.__removeDisplayObject(child);
            }

            return child;
        },

        /**
         * Removes a list of DisplayObjects as children.
         *
         * @param children
         */
        removeChildren: function(children) {
            children.forEach(this.removeChild);
        },

        /**
         * Safely removes this DisplayObject from its parent.
         */
        removeFromParent: function() {
            if (this._parent) {
                this._parent.removeChild(this);
            }
        },

        /**
         * Removes all children from this DisplayObject.
         */
        removeAllChildren: function() {
            var children = this._children.slice(0);
            for (var i = 0, len = children; i <len; i++) {
                this.removeChild(children[i]);
            }
        }
    };
})(this);
/**
 * Author: thegoldenmule
 * Date: 8/11/13
 */

(function (global) {
    "use strict";

    var _root = null,
        _objectsById = {};

    /**
     * @class SceneManager
     * @desc Manages all objects in the scene and provides an interface for
     * querying.
     * @returns {SceneManager}
     * @constructor
     */
    global.SceneManager = {
        /**
         * @desc Initializes the SceneManager with the root DisplayObject.
         * @param {DisplayObject} displayObject The root DisplayObject.
         *
         * @private
         */
        __initialize: function(displayObject) {
            _root = displayObject;
        },

        /**
         * @desc Adds a DisplayObject to the SceneManager for management.
         * @param {DisplayObject} displayObject The DisplayObject instance to
         * add.
         *
         * @private
         */
        __addDisplayObject: function(displayObject) {
            _objectsById[displayObject.getUniqueId()] = displayObject;
        },

        /**
         * @desc Removes a DisplayObject from the SceneManager.
         * @param {DisplayObject} displayObject The DisplayObject instance to
         * remove.
         *
         * @private
         */
        __removeDisplayObject: function(displayObject) {
            delete _objectsById[displayObject.getUniqueId()];
        },

        /**
         * @desc Retrieves a DisplayObject from the scene by id.
         * @param {number} id The integral id of the DisplayObject to retrieve.
         * @return {DisplayObject}
         */
        getById: function(id) {
            return id in _objectsById ? _objectsById[id] : null;
        },

        /**
         * @desc Basic query method to find collections of objects.
         * @param {Array} query A query is made up of DisplayObject names and
         * searches over either immediate children or descendants at arbitrary
         * depth. A search over immediate children is given by "." while a
         * recursive search is given by "..". An example follows.
         * @param {DisplayObject} context The DisplayObject to start the search from.
         * If no context is provided, the search starts at the top of the graph,
         * i.e. the scene root.
         *
         * @example
         * // for root -> a -> b -> c -> ... -> z
         * var a = SceneManager.find("a");
         * var z = SceneManager.find("..z");
         * var f = SceneManager.find("a.b.c.d.e.f");
         * var f = SceneManager.find("a..f");
         * var g = SceneManager.find("a..f.g");
         * var g = SceneManager.find("..f.g", c);
         * var g = SceneManager.find("..f..g");
         * var z = SceneManager.find(".f..z", e);
         */
        find: function(query, context) {
            if (!_root) {
                throw new Error("Must initialize SceneManager before calling find.");
            }

            if (!query){
                return null;
            }

            var current = !context ? _root : context;

            // split at recursive searches
            var recurse = false;
            var recursiveQueries = query.split("..");
            for (var i = 0, ilen = recursiveQueries.length; i < ilen; i++) {
                var recursiveQuery = recursiveQueries[i];

                // split into shallow searches
                var shallowQueries = recursiveQuery.split(".");

                // ? I don't understand why split works this way.
                if ("" === shallowQueries[0]) {
                    shallowQueries.shift();
                }

                // recursive find
                if (recurse) {
                    var recursiveChildName = shallowQueries.shift();

                    // retrieve the query
                    //var queryObject = generateQuery(recursiveChildName);

                    var recursiveChild = recursiveFindChildByName(current, recursiveChildName);
                    if (null !== recursiveChild) {
                        current = recursiveChild;
                    } else {
                        return null;
                    }
                }

                // perform shallow searches
                for (var j = 0, jlen = shallowQueries.length; j < jlen; j++) {
                    var shallowQuery = shallowQueries[j];

                    // get immediate child by name
                    var child = current.getChildByName(shallowQuery);
                    if (null !== child) {
                        current = child;
                    } else {
                        return null;
                    }
                }

                recurse = 0 === recursiveQuery.length || 0 === i % 2;
            }

            return current;
        }
    };

    var nameQueryRegex = /([\w]+)((\[(\d)?:(\d)?\])|$)/;
    var propertyQueryRegex = /\((@|(@@))([\w]+)(([<>]=?)|==)([\w]+)\)((\[(\d)?:(\d)?\])|$)/;

    function generateQuery(value) {
        var query = new Query(value);

        // Cases:
        // 1. name query
        // 2. property query

        var match = nameQueryRegex.exec(value);
        if (null !== match) {
            query.propName = "name";
            query.operator = "==";
            query.propValue = match[1];
            query.isCollection = "" !== match[2];
            query.startIndex = match[4];
            query.endIndex = match[5];
        } else {
            match = propertyQueryRegex.exec(value);

            if (null !== match) {
                query.propName = match[3];
                query.operator = match[4];
                query.propValue = match[6];
                query.isCollection = "" !== match[7];
                query.startIndex = match[9];
                query.endIndex = match[10];
            } else {
                return null;
            }
        }

        return query;
    }

    function Query(value) {
        this.value = value;

    }

    function recursiveFindChildByName(child, name) {
        var newChild = child.getChildByName(name);
        if (null === newChild) {
            var children = child.getChildren();
            for (var i = 0, len = children.length; i < len; i++) {
                newChild = recursiveFindChildByName(children[i], name);

                if (null !== newChild) {
                    return newChild;
                }
            }
        }

        return newChild;
    }

})(this);

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
/**
 * Author: thegoldenmule
 * Date: 5/18/13
 * Time: 7:13 AM
 */

(function (global) {
    "use strict";

    var Animation = function(parameters) {
        var that = this;

        if (!parameters) {
            parameters = {};
        }

        this.name = undefined === parameters.name ? "" : parameters.name;

        this.startFrame = undefined === parameters.startFrame ? 0 : parameters.startFrame;
        this.animationLength = undefined === parameters.animationLength ? 0 : parameters.animationLength;

        this.frameRate = undefined === parameters.frameRate ? 60 : parameters.frameRate;

        return that;
    };

    var SpriteSheet = function (parameters) {
        var that = this;

        if (undefined === parameters) {
            parameters = {};
        }

        if (undefined === parameters.width) {
            throw new Error("Must define width and height!");
        }

        if (undefined === parameters.height) {
            throw new Error("Must define width and height!");
        }

        if (undefined === parameters.mainTexture) {
            throw new Error("Must define mainTexture!");
        }

        DisplayObject.call(that, parameters);

        that.material.shader.setShaderProgramIds("ss-shader-vs", "ss-shader-fs");

        var _animations = [],

            _currentAnimation = null,
            _currentTimeMS = 0,
            _currentFrame = 0,

            _totalFrameWidth = that.material.mainTexture.getWidth() / that.getWidth(),
            _totalFrameHeight = that.material.mainTexture.getHeight() / that.getWidth(),

            _normalizedFrameWidth = 1 / _totalFrameWidth,
            _normalizedFrameHeight = 1 / _totalFrameHeight,

            _blendCurve = new AnimationCurve();

        _blendCurve.easingFunction = Easing.Quadratic.In;

        that.getBlendCurve = function() {
            return _blendCurve;
        };

        that.addAnimation = function(animationData) {
            _animations.push(animationData);
        };

        that.removeAnimationByName = function(animationName) {
            for (var i = 0, len = _animations.length; i < len; i++) {
                if (_animations[i].name === animationName) {
                    _animations = _animations.splice(i, 0);
                    return;
                }
            }
        };

        that.setCurrentAnimationByName = function(animationName) {
            if (null !== _currentAnimation && _currentAnimation.name === animationName) {
                return;
            }

            for (var i = 0, len = _animations.length; i < len; i++) {
                if (_animations[i].name === animationName) {
                    _currentAnimation = _animations[i];

                    return;
                }
            }
        };

        that.getCurrentAnimation = function() {
            return _currentAnimation;
        };

        that.setCurrentFrame = function(value) {
            // get the animation
            var animation = _currentAnimation;
            if (null === animation) {
                return;
            }

            // no change!
            if (value === _currentFrame) {
                return;
            }

            _currentFrame = value % animation.animationLength;

            // update the time from the frame value
            _currentTimeMS = _currentFrame * 1000;

            // update the UVs!
            updateUVs();
        };

        that.getCurrentFrame = function() {
            return _currentFrame;
        };

        that.setCurrentTime = function(value) {
            // get the animation
            var animation = _currentAnimation;
            if (null === animation) {
                return;
            }

            _currentTimeMS = value;

            // set current frame from the current time
            var msPerFrame = Math.floor(1000 / animation.frameRate);
            var newFrame = Math.floor(_currentTimeMS / msPerFrame) % animation.animationLength;

            // set the blend uniform
            that.material.shader.setUniformFloat(
                "uFutureBlendScalar",
                _blendCurve.evaluate((_currentTimeMS % msPerFrame) / msPerFrame));

            // did we switch frames?
            if (_currentFrame === newFrame) {
                return;
            }

            _currentFrame = newFrame;

            updateUVs();
        };

        that.update = function(dt) {
            that.setCurrentTime(_currentTimeMS + dt);
        };

        function updateUVs() {
            // get the animation
            var animation = _currentAnimation;
            if (null === animation) {
                return;
            }

            // find location of frame
            var actualFrame = animation.startFrame + _currentFrame;

            var frameX = actualFrame % _totalFrameWidth;
            var frameY = Math.floor(actualFrame / _totalFrameWidth);

            // normalize them
            var normalizedFrameX = frameX / _totalFrameWidth;
            var normalizedFrameY = frameY / _totalFrameHeight;

            // set the uvs
            var uvs = that.geometry.uvs;
            uvs[0] = normalizedFrameX;
            uvs[1] = normalizedFrameY;

            uvs[2] = normalizedFrameX;
            uvs[3] = normalizedFrameY + _normalizedFrameHeight;

            uvs[4] = normalizedFrameX + _normalizedFrameWidth;
            uvs[5] = normalizedFrameY;

            uvs[6] = normalizedFrameX + _normalizedFrameWidth;
            uvs[7] = normalizedFrameY + _normalizedFrameHeight;

            // now set uvs for the future frame
            actualFrame = animation.startFrame +
                (animation.animationLength - 1 === _currentFrame ?
                    0 :
                    _currentFrame + 1);
            frameX = actualFrame % _totalFrameWidth;
            frameY = Math.floor(actualFrame / _totalFrameWidth);

            // normalize them
            normalizedFrameX = frameX / _totalFrameWidth;
            normalizedFrameY = frameY / _totalFrameHeight;

            // set the uvs
            var colors = that.geometry.colors;
            colors[0] = normalizedFrameX;
            colors[1] = normalizedFrameY;

            colors[4] = normalizedFrameX;
            colors[5] = normalizedFrameY + _normalizedFrameHeight;

            colors[8] = normalizedFrameX + _normalizedFrameWidth;
            colors[9] = normalizedFrameY;

            colors[12] = normalizedFrameX + _normalizedFrameWidth;
            colors[13] = normalizedFrameY + _normalizedFrameHeight;

            that.geometry.apply();
        }

        return that;
    };

    SpriteSheet.prototype = new DisplayObject();
    SpriteSheet.prototype.constructor = SpriteSheet;

    global.Animation = Animation;
    global.SpriteSheet = SpriteSheet;
})(this);
(function (global) {
    "use strict";

    /**
     * @class StaticImage
     * @extends global.DisplayObject
     * @param {Object} parameters A parameters object that will be passed to
     * the DisplayObject constructor.
     * @returns {StaticImage}
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
/**
 * Author: thegoldenmule
 * Date: 3/24/13
 */

(function (global) {
    "use strict";

    var Signal = signals.Signal;

    var FontLoader = function () {
        var scope = this;

        scope.onLoaded = new Signal();
        scope.font = null;

        return scope;
    };

    FontLoader.prototype = {
        constructor: FontLoader,

        load: function(baseUrl, name) {
            var scope = this;

            if (baseUrl[baseUrl.length - 1] !== "/") {
                baseUrl += "/";
            }

            function callback() {
                if (null !== imageLoader.image &&
                    null !== xmlLoader.data) {
                    scope.font = new Font();
                    scope.font.initialize(new FontDefinition(xmlLoader.data, imageLoader.image));

                    scope.onLoaded.dispatch();
                }
            }

            var imageLoader = new ImageLoader();
            imageLoader.onLoaded.addOnce(callback);
            imageLoader.load(baseUrl + name + ".png");

            var xmlLoader = new XMLLoader();
            xmlLoader.onLoaded.addOnce(callback);
            xmlLoader.load(baseUrl + name + ".fnt");
        }
    };

    // export
    global.FontLoader = FontLoader;
})(this);
/**
 * User: ti83
 * Date: 3/10/13
 */

var Signal = signals.Signal;

var ImageLoader = (function () {
    "use strict";

    return function () {
        var that = this;

        that.image = null;
        that.onLoaded = new Signal();

        return that;
    };
})();

ImageLoader.prototype = {
    constructor: ImageLoader,
    load: function(url, imageElement) {
        var that = this;

        // TODO: consider pooling
        if (undefined === imageElement) {
            imageElement = new Image();
        }

        imageElement.onload = function() {
            that.image = imageElement;
            that.onLoaded.dispatch();
        };
        imageElement.crossOrigin = "localhost";
        imageElement.src = url;
    }
};

ImageLoader.loadResources = function(urls, callback) {
    "use strict";

    var loaded = 0;
    function onLoaded(loader) {
        if (++loaded === urls.length) {
            callback(loaders);
        }
    }

    var loaders = urls.map(function(url) {
        var loader = new ImageLoader();
        loader.onLoaded.add(onLoaded);
        loader.load(url);
        return loader;
    });
};
/**
 * Author: thegoldenmule
 * Date: 3/23/13
 */

(function (global) {
    "use strict";

    var Signal = signals.Signal;

    var XMLLoader = function () {
        var scope = this;

        scope.onLoaded = new Signal();
        scope.data = null;

        return scope;
    };

    XMLLoader.prototype = {
        constructor: XMLLoader,

        load: function(url) {
            var scope = this;
            var request = HTTPHelper.newRequest(url);
            request.onreadystatechange = function() {
                if (4 === request.readyState) {
                    scope.data = request.responseText;

                    scope.onLoaded.dispatch(scope);
                }
            };
            request.send(null);
        }
    };

    // export
    global.XMLLoader = XMLLoader;
})(this);
/**
 * Default particle plugins:
 *
 * Position
 * Velocity
 * Acceleration
 * Lifetime
 * Attractor
 * ParticlePropertyAnimator
 * ScaleAnimator
 * AlphaAnimator
 * RotationAnimator
 *
 * @author thegoldenmule
 */
(function(global) {
    "use strict";

    if (!global.particle) {
        global.particle = {};
    }

    /**
     * Position plugin.
     *
     * Give it x, y, and a radius, and it will provide a random
     * position within the bounding circle. An option innerRadius parameter may be
     * used that will omit creating particles within the innerRadius.
     */
    global.particle.Position = function(xval, yval, radius, innerRadius) {
        this.x = undefined === xval ? 0 : xval;
        this.y = undefined === yval ? 0 : yval;
        this.innerRadius = undefined === innerRadius ? 0 : innerRadius;

        if (undefined === radius) {
            radius = 10;
        }

        if (radius <= this.innerRadius) {
            radius = this.innerRadius + 1;
        }

        this.radius = radius;
    };

    global.particle.Position.prototype = {
        constructor: global.particle.Position,

        initialize: function(emitter, particle) {
            particle.transform.position.x = this.x + (Math.random() - 0.5) * Math.random() * (this.radius - this.innerRadius);
            particle.transform.position.y = this.y + (Math.random() - 0.5) * Math.random() * (this.radius - this.innerRadius);

            if (0 !== this.innerRadius) {
                var randomAngle = Math.random() * 2 * Math.PI;
                particle.transform.position.x += this.innerRadius * Math.sin(randomAngle);
                particle.transform.position.y += this.innerRadius * Math.cos(randomAngle);
            }
        }
    };

    /**
     * Rotation plugin. Chooses a random rotation for each particle between min and max.
     *
     * @param min
     * @param max
     *
     * @constructor
     */
    global.particle.Rotation = function(min, max) {
        this.min = undefined === min ? 0 : min;
        this.max = undefined === max ? Math.PI * 2 : max;
    };

    global.particle.Rotation.prototype = {
        constructor: global.particle.Rotation,

        initialize: function(emitter, particle) {
            particle.transform.rotationInRadians = this.min + Math.random() * (this.max - this.min);
        }
    };

    /**
     * Velocity plugin.
     *
     * Give it an angle range and a magnitude range and it will
     * generate velocities within the ranges.
     */
    global.particle.Velocity = function(minAngle, maxAngle, minMagnitude, maxMagnitude) {
        this.minAngle = minAngle;
        this.maxAngle = maxAngle;
        this.minMagnitude = minMagnitude;
        this.maxMagnitude = maxMagnitude;
    };

    global.particle.Velocity.prototype = {
        constructor: global.particle.Velocity,

        initialize: function(emitter, particle) {
            // pick a random angle
            var angle = (this.minAngle + Math.random() * (this.maxAngle - this.minAngle));
            var magnitude = (this.minMagnitude + Math.random() * (this.maxMagnitude - this.minMagnitude));

            particle.vx = -Math.cos(angle) * magnitude;
            particle.vy = -Math.sin(angle) * magnitude;
        }
    };

    /**
     * Acceleration plugin.
     *
     * Generates constant acceleration within the range
     * provided.
     */
    global.particle.Acceleration = function(xval, yval) {
        this.x = xval;
        this.y = yval;
    };

    global.particle.Acceleration.prototype = {
        constructor: global.particle.Acceleration,

        initialize: function(emitter, particle) {
            particle.ax = this.x;
            particle.ay = this.y;
        }
    };

    /**
     * Lifetime plugin.
     *
     * Generates a particle lifetime within a range.
     */
    global.particle.Lifetime = function(min, max) {
        this.min = min;
        this.max = max;
    };

    global.particle.Lifetime.prototype = {
        constructor: global.particle.Lifetime,

        initialize: function(emitter, particle) {
            particle.lifetime = (this.min + Math.random() * (this.max - this.min));
        }
    };

    /**
     * Attractor plugin.
     *
     * This attracts (or repels) particles. This only approximates gravitation.
     *
     */
    global.particle.Attractor = function(x, y, amount) {
        this.x = x;
        this.y = y;
        this.amount = amount;
    };

    global.particle.Attractor.prototype = {
        constructor: global.particle.Attractor,

        update: function(emitter, particle) {
            particle.ax = this.x - particle.transform.position.x / this.amount;
            particle.ay = this.y - particle.transform.position.y / this.amount;
        }
    };

    /**
     * Animates a property on Particle.
     *
     * @param propName
     * @param curve
     * @param scale
     * @constructor
     */
    global.particle.ParticlePropertyAnimator = function(propName, curve, scale) {
        this.propName = propName;
        this.curve = curve;
        this.scale = scale;
    };

    global.particle.ParticlePropertyAnimator.prototype = {
        constructor: global.particle.ParticlePropertyAnimator,

        update: function(emitter, particle) {
            particle[this.propName] = this.scale = this.curve.evaluate(particle.elapsedTime / particle.lifetime);
        }
    };

    /**
     * Animates a Particle's scale.
     *
     * @param curve The AnimationCurve instance.
     * @param scale A scalar to multiply the AnimationCurve by.
     *
     * @constructor
     */
    global.particle.ScaleAnimator = function(curve, scale) {
        this.curve = curve;
        this.scale = scale;
    };

    global.particle.ScaleAnimator.prototype = {
        constructor: global.particle.ScaleAnimator,

        update: function(emitter, particle) {
            var scale = this.scale * this.curve.evaluate(particle.elapsedTime / particle.lifetime);

            particle.transform.scale.x = particle.transform.scale.y = scale;
        }
    };

    /**
     * Animates a particle's alpha.
     *
     * @param curve
     * @param scale
     *
     * @constructor
     */
    global.particle.AlphaAnimator = function(curve, scale) {
        return new global.particle.ParticlePropertyAnimator("alpha", curve, scale);
    };

    /**
     * Animates a particle's rotation.
     *
     * @param curve
     * @param scale
     */
    global.particle.RotationAnimator = (function() {
        var id = 0;

        return function(curve, scale) {
            this.__guid = "__rotationRate" + id++;

            this.curve = curve;
            this.scale = scale;
        };
    })();

    global.particle.RotationAnimator.prototype = {
        constructor: global.particle.RotationAnimator,

        initialize: function(emitter, particle) {
            particle[this.__guid] = particle.transform.rotationInRadians;
        },

        update: function(emitter, particle, dt) {
            particle.transform.rotationInRadians =
                particle[this.__guid] + this.scale * this.curve.evaluate(particle.elapsedTime / particle.lifetime);
        }
    };

})(this);
/**
 * Author: thegoldenmule
 * Date: 5/27/13
 */

(function (global) {
    "use strict";

    /**
     * A Particle class. This extends DisplayObject and holds a simple physical
     * model.
     *
     * @param material The material to use.
     * @returns {*}
     * @constructor
     */
    var Particle = function (material) {
        var scope = this;

        // extend DisplayObject
        DisplayObject.call(scope, {color:new Color(1, 0, 0, 1)});

        // set the anchor point to the center
        scope.transform.anchorPoint.x = scope.transform.anchorPoint.y = 1;

        scope.material = material;
        scope.material.shader.setShaderProgramIds("texture-shader-vs", "texture-shader-fs");

        // basic physics model
        scope.vx = 0;
        scope.vy = 0;
        scope.ax = 0;
        scope.ay = 0;
        scope.elapsedTime = 0;
        scope.isAlive = false;

        return scope;
    };

    Particle.prototype = new DisplayObject();
    Particle.prototype.constructor = Particle;

    /**
     * The ParticleEmitter class emits Particle objects, which are children.
     *
     * @param plugins
     * @param x
     * @param y
     * @param maxParticles
     * @constructor
     */
    var ParticleEmitter = function (plugins, x, y, maxParticles) {
        var scope = this;

        // extend DisplayObject
        DisplayObject.call(scope);

        var _plugins = plugins ? [].concat(plugins) : [],
            _helper = 0,
            _bufferIndex = 0,
            _maxParticles = (undefined === maxParticles) ? 1000 : maxParticles,
            _particleBuffer = new Set(),    // particles do not need to be ordered

            // create a pool of particles
            _particlePool = new ObjectPool(
                _maxParticles,
                function allocate() {
                    return new Particle(scope.material);
                },
                function get(instance) {
                    scope.addChild(instance);

                    instance.elapsedTime = 0;
                    instance.isAlive = true;
                    instance.lifetime = scope.lifetime;
                },
                function put(instance) {
                    scope.removeChild(instance);

                    instance.isAlive = false;
                });

        scope.material.shader.setShaderProgramIds("particle-shader-vs", "particle-shader-fs");

        scope.emissionRate = 5;
        scope.lifetime = 1000;

        /**
         * Adds a plugin dynamically.
         *
         * @param plugin
         * @returns {*}
         */
        scope.addPlugin = function(plugin) {
            _plugins.push(plugin);

            return scope;
        };

        /**
         * Removes a plugin dynamically.
         *
         * @param plugin
         * @returns {*}
         */
        scope.removePlugin = function(plugin) {
            var index = _plugins.indexOf(plugin);
            if (-1 !== index) {
                _plugins = _plugins.splice(index, 1);
            }

            return scope;
        };

        /**
         * Called as part of boX's update loop.
         *
         * @param dt
         */
        scope.update = function(dt) {
            applyPlugins(null, _plugins, "updateGlobal", dt);

            // add new particles
            var particle;
            var rate = scope.emissionRate;
            for (var i = _bufferIndex, len = _bufferIndex + rate; i < len; i++) {
                particle = _particlePool.get();

                if (null === particle) {
                    break;
                }

                // initialize phase
                applyPlugins(particle, _plugins, "initialize", dt);

                // add to buffer
                _particleBuffer.add(particle);
            }

            // update particles + remove dead ones
            var particles = _particleBuffer.getElements();
            for (i = 0, len = particles.length; i < len; i++) {
                particle = particles[i];

                // update age + prune
                particle.elapsedTime += dt;

                // dead?
                if (particle.elapsedTime >= particle.lifetime) {
                    _particleBuffer.remove(particle);
                    _particlePool.put(particle);

                    continue;
                }

                // TODO: at least use Euler...

                // apply acceleration
                particle.vx += particle.ax;
                particle.vy += particle.ay;

                // apply velocity
                particle.transform.position.x += particle.vx;
                particle.transform.position.y += particle.vy;

                // apply plugins
                applyPlugins(particle, _plugins, "update", dt);
            }

            // tell plugins they are done!
            applyPlugins(null, _plugins, "updateEndGlobal", dt);
        };

        function applyPlugins(particle, plugins, method, dt) {
            for (var j = 0, len = plugins.length; j < len; j++) {
                var plugin = plugins[j];
                if ("function" === typeof plugin[method]) {
                    plugin[method](scope, particle, dt);
                }
            }
        }
    };

    ParticleEmitter.prototype = new DisplayObject();
    ParticleEmitter.prototype.constructor = ParticleEmitter;

    // export
    global.Particle = Particle;
    global.ParticleEmitter = ParticleEmitter;
})(this);
/**
 * Author: thegoldenmule
 */

(function(global) {
    "use strict";

    var ParticleEmitterGeometry = function (emitter) {
        var scope = this;

        scope.width = 1;
        scope.height = 1;

        scope.vertices = null;
        scope.uvs = null;
        scope.colors = null;

        scope.vertexBuffer = null;
        scope.uvBuffer = null;
        scope.colorBuffer = null;

        scope.__apply = true;

        return scope;
    };

    ParticleEmitterGeometry.prototype = {
        constructor: ParticleEmitterGeometry,

        rebuild: function(particles) {
            this.vertices = new Float32Array(particles * 8);    // 4 verts, 2 coords
            this.uvs = new Float32Array(particles * 8);         // 4 verts, 2 coords
            this.colors = new Float32Array(particles * 16);     // 4 verts, 4 coords
        },

        apply: function() {
            this.__apply = true;
        },

        clearBuffers: function() {
            this.vertexBuffer = this.uvBuffer = this.colorBuffer = null;
        },

        prepareBuffers: function() {
            if (null === this.vertexBuffer) {
                this.vertexBuffer = ctx.createBuffer();
            }

            if (null === this.uvBuffer) {
                this.uvBuffer = ctx.createBuffer();
            }

            if (null === this.colorBuffer) {
                this.colorBuffer = ctx.createBuffer();
            }

            if (this.__apply) {
                ctx.bindBuffer(ctx.ARRAY_BUFFER, this.vertexBuffer);
                ctx.bufferData(ctx.ARRAY_BUFFER, this.vertices, ctx.STATIC_DRAW);

                ctx.bindBuffer(ctx.ARRAY_BUFFER, this.uvBuffer);
                ctx.bufferData(ctx.ARRAY_BUFFER, this.uvs, ctx.STATIC_DRAW);

                ctx.bindBuffer(ctx.ARRAY_BUFFER, this.colorBuffer);
                ctx.bufferData(ctx.ARRAY_BUFFER, this.colors, ctx.STATIC_DRAW);
            }

            this.__apply = false;
        },

        pushBuffers: function(ctx, shader) {
            if (-1 < shader.vertexBufferAttributePointer) {
                ctx.bindBuffer(ctx.ARRAY_BUFFER, this.vertexBuffer);
                ctx.vertexAttribPointer(shader.vertexBufferAttributePointer, 2, ctx.FLOAT, false, 0, 0);
            }

            if (-1 < shader.uvBufferAttributePointer) {
                ctx.bindBuffer(ctx.ARRAY_BUFFER, this.uvBuffer);
                ctx.vertexAttribPointer(shader.uvBufferAttributePointer, 2, ctx.FLOAT, false, 0, 0);
            }

            if (-1 < shader.vertexColorBufferAttributePointer) {
                ctx.bindBuffer(ctx.ARRAY_BUFFER, this.colorBuffer);
                ctx.vertexAttribPointer(shader.vertexColorBufferAttributePointer, 4, ctx.FLOAT, false, 0, 0);
            }
        },

        draw: function(ctx) {

        }
    };

    global.ParticleEmitterGeometry = ParticleEmitterGeometry;
})(this);
/**
 * Author: thegoldenmule
 * Date: 3/22/13
 */

(function (global) {
    "use strict";

    var FontDefinition = function(xmlDefinition, image) {
        this.xmlDefinition = xmlDefinition;
        this.image = image;
    };

    var CharDefinition = function() {

    };

    CharDefinition.prototype = {
        constructor: CharDefinition,

        toString: function() {
            return "[CharDefinition" +
                " id: " + this.id +
                " x: " + this.x +
                " y: " + this.y +
                " width: " + this.width +
                " height: " + this.height +
                " xoffset: " + this.xoffset +
                " yoffset: " + this.yoffset +
                " xadvance: " + this.xadvance +
                " yadvance: " + this.yadvance +
                " page: " + this.page +
                " chnl: " + this.chnl + "]";
        }
    };

    CharDefinition.FromXML = function(element) {
        var def = new CharDefinition();
        def.id = parseInt(element.getAttribute("id"), 10);
        def.x = parseInt(element.getAttribute("x"), 10);
        def.y = parseInt(element.getAttribute("y"), 10);
        def.width = parseInt(element.getAttribute("width"), 10);
        def.height = parseInt(element.getAttribute("height"), 10);
        def.xoffset = parseInt(element.getAttribute("xoffset"), 10);
        def.yoffset = parseInt(element.getAttribute("yoffset"), 10);
        def.xadvance = parseInt(element.getAttribute("xadvance"), 10);
        def.yadvance = parseInt(element.getAttribute("yadvance"), 10);
        def.page = parseInt(element.getAttribute("page"), 10);
        def.chnl = parseInt(element.getAttribute("chnl"), 10);

        return def;
    };

    var Font = function () {
        var scope = this;

        scope.glyphIndex = [];

        return scope;
    };

    Font.prototype = {
        constructor: Font,

        initialize: function(definition) {
            // parse it!
            var doc = XMLHelper.parse(definition.xmlDefinition);
            var chars = doc.getElementsByTagName("char");
            for (var i = 0, len = chars.length; i < len; i++) {
                var def = CharDefinition.FromXML(chars[i]);
                this.glyphIndex[def.id] = def;
            }
        }
    };

    // export
    global.FontDefinition = FontDefinition;
    global.Font = Font;
})(this);
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

function extend(subClass, superClass) {
    var F = function() {};
    F.prototype = superClass.prototype;
    subClass.prototype = new F();
    subClass.prototype.constructor = subClass;

    subClass.superclass = superClass.prototype;
    if(superClass.prototype.constructor == Object.prototype.constructor) {
        superClass.prototype.constructor = superClass;
    }
}

if (!Object.keys) {
  Object.keys = (function () {
    var hasOwnProperty = Object.prototype.hasOwnProperty,
        hasDontEnumBug = !({toString: null}).propertyIsEnumerable('toString'),
        dontEnums = [
          'toString',
          'toLocaleString',
          'valueOf',
          'hasOwnProperty',
          'isPrototypeOf',
          'propertyIsEnumerable',
          'constructor'
        ],
        dontEnumsLength = dontEnums.length;

    return function (obj) {
      if (typeof obj !== 'object' && typeof obj !== 'function' || obj === null) throw new TypeError('Object.keys called on non-object');

      var result = [];

      for (var prop in obj) {
        if (hasOwnProperty.call(obj, prop)) result.push(prop);
      }

      if (hasDontEnumBug) {
        for (var i=0; i < dontEnumsLength; i++) {
          if (hasOwnProperty.call(obj, dontEnums[i])) result.push(dontEnums[i]);
        }
      }
      return result;
    };
  })();
}
/**
 * Author: thegoldenmule
 * Date: 3/23/13
 */

(function (global) {
    "use strict";

    var __factories = [
        function() {
            return new XMLHttpRequest();
        },
        function() {
            return new ActiveXObject("Microsoft.XMLHTTP");
        },
        function() {
            return new ActiveXObject("MSXML2.XMLHTTP.3.0");
        },
        function() {
            return new ActiveXObject("MSXML2.XMLHTTP");
        }
    ];

    var HTTPHelper = {

        newRequest: (function(method) {
            if (undefined === method) {
                method = "GET";
            }

            var workingFactory = null;

            return function(url) {
                if (null === workingFactory) {
                    for (var i = 0, len = __factories.length; i < len; i++) {
                        try {
                            var factoryMethod = __factories[i];
                            var request = factoryMethod();

                            if (null !== request) {
                                workingFactory = factoryMethod;

                                break;
                            }
                        } catch (error) {
                            continue;
                        }
                    }

                    if (null === workingFactory) {
                        workingFactory = function() {
                            throw new Error("XMLHTTPRequest not supported.");
                        };
                    }
                }

                var httpRequest = workingFactory();
                httpRequest.open(method, url);
                httpRequest.setRequestHeader("User-Agent", "XMLHttpRequest");
                httpRequest.setRequestHeader("Accept-Language", "en");

                return httpRequest;
            };
        })()
    };

    // export
    global.HTTPHelper = HTTPHelper;
})(this);
/**
 * Author: thegoldenmule
 * Date: 3/22/13
 */

(function (global) {
    "use strict";

    var XMLHelper = {

        newDocument: function(rootTagName, namespaceUrl) {
            if (!rootTagName) {
                rootTagName = "";
            }

            if (!namespaceUrl) {
                namespaceUrl = "";
            }

            if (document.implementation && document.implementation.createDocument) {
                return document.implementation.createDocument(namespaceUrl, rootTagName, null);
            }

            var doc = new ActiveXObject("MSXML2.DOMDocument");

            if (rootTagName) {
                var prefix = "";
                var tagName = rootTagName;
                var p = rootTagName.indexOf(":");
                if (-1 !== p) {
                    prefix = rootTagName.substring(0, p);
                    tagName = rootTagName.substring(p + 1);
                }

                if (namespaceUrl) {
                    if (!prefix) {
                        prefix = "a0";
                    }
                } else {
                    prefix = "";
                }

                var text = "<" +
                    (prefix ? prefix + ":" : "") + tagName +
                    (namespaceUrl ?
                        (" xmlns:" + prefix + "=\"" + namespaceUrl + "\"") :
                        "") +
                    "/>";
                doc.loadXML(text);
            }

            return doc;
        },

        parse: function(text) {
            if (typeof DOMParser !== "undefined") {
                return new DOMParser().parseFromString(text, "application/xml");
            }

            if (typeof ActiveXObject !== "undefined") {
                var doc = XMLHelper.newDocument();
                doc.loadXML(text);
                return doc;
            }

            var url = "data:text/xml;charset=utf-8," + encodeURIComponent(text);
            var request = new XMLHttpRequest();
            request.open("GET", url, false);
            request.send(null);
            return request.responseXML;
        }
    };

    // export
    global.XMLHelper = XMLHelper;
})(this);
