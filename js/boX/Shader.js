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
                        {
                            ctx.uniform1f(definition.pointer, definition.value);
                            break;
                        }
                        case ShaderUniformTypes.VEC2:
                        {
                            ctx.uniform2fv(definition.pointer, definition.value);
                            break;
                        }
                        case ShaderUniformTypes.VEC3:
                        {
                            ctx.uniform3fv(definition.pointer, definition.value);
                            break;
                        }
                        case ShaderUniformTypes.VEC4:
                        {
                            ctx.uniform4fv(definition.pointer, definition.value);
                            break;
                        }
                        case ShaderUniformTypes.MAT2:
                        {
                            ctx.uniformMatrix2fv(definition.pointer, false, definition.value);
                            break;
                        }
                        case ShaderUniformTypes.MAT3:
                        {
                            ctx.uniformMatrix3fv(definition.pointer, false, definition.value);
                            break;
                        }
                        case ShaderUniformTypes.MAT4:
                        {
                            ctx.uniformMatrix4fv(definition.pointer, false, definition.value);
                            break;
                        }
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