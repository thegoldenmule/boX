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

        var _canvas,
            _ctx;

        scope.getWidth = function() {
            return canvas.clientWidth;
        };

        scope.getHeight = function() {
            return canvas.clientHeight;
        };

        scope.getCanvas = function() {
            return _canvas;
        };

        scope.getContext = function() {
            return _ctx;
        };

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
                    height, 0
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

        preUpdate: function() {
            this.resize();

            var context = this.getContext();
            context.clear(context.COLOR_BUFFER_BIT | context.DEPTH_BUFFER_BIT);
        },

        drawBatch: function(renderBatch) {
            var context = this.getContext();

            // set the program to use
            var shader = renderBatch.getMaterial().shader;
            shader.compile(context);
            context.useProgram(shader.getShaderProgram());

            // tell the shader to do its thang
            shader.pushCustomUniforms(context);

            // set projection
            if (-1 !== shader.projectionMatrixUniformPointer) {
                context.uniformMatrix4fv(shader.projectionMatrixUniformPointer, false, this.projectionMatrix);
            }

            // prepare material once
            renderBatch.getMaterial().prepareTextures(context);
            renderBatch.getMaterial().pushTextures(context, shader);

            var displayObjects = renderBatch.getDisplayObjects();
            for (var i = 0, len = displayObjects.length; i < len; i++) {
                var displayObject = displayObjects[i];

                // depth
                if (-1 !== shader.depthUniformPointer) {
                    context.uniform1f(shader.depthUniformPointer, displayObject.__depth);
                }

                // update + set transform
                // TODO: possibly have a dirty flag?
                if (-1 !== shader.modelMatrixUniformPointer) {
                    context.uniformMatrix4fv(shader.modelMatrixUniformPointer, false, displayObject.recalculateWorldMatrix(__tempModelMatrix));
                }

                // color
                if (-1 !== shader.colorUniformPointer) {
                    var tint = displayObject.tint;
                    __tempColor[0] = tint.r;
                    __tempColor[1] = tint.g;
                    __tempColor[2] = tint.b;
                    __tempColor[3] = displayObject.alpha;
                    context.uniform4fv(shader.colorUniformPointer, __tempColor);
                }

                // prepare + push buffers
                displayObject.geometry.prepareBuffers(context);
                displayObject.geometry.pushBuffers(context, shader);

                // draw
                displayObject.geometry.draw(context);
            }
        },

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
                context.uniformMatrix4fv(shader.modelMatrixUniformPointer, false, displayObject.recalculateWorldMatrix());
            }

            // color
            if (-1 !== shader.colorUniformPointer) {
                __tempColor[0] = __tempColor[1] = __tempColor[2] = __tempColor[3] = 1;
                context.uniform4fv(shader.colorUniformPointer, composeColor(displayObject, __tempColor));
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

        drawParticleSystem: function(particleSystem) {

        },

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

    function composeColor(displayObject, out) {
        if (null !== displayObject.parent) {
            composeColor(displayObject.parent, out);
        }

        out[0] *= displayObject.tint.r;
        out[1] *= displayObject.tint.g;
        out[2] *= displayObject.tint.b;
        out[3] *= displayObject.alpha;

        return out;
    }

    // export
    global.WebGLRenderer = WebGLRenderer;
})(this);