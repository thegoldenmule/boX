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