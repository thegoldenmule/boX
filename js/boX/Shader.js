/**
 * Author: thegoldenmule
 * Date: 2/2/13
 * Time: 8:26 PM
 */

(function(global) {
    "use strict";

    /**
     * @desc Defines potential types of uniforms.
     * @static
     * @private
     * @type {{FLOAT: number, VEC2: number, VEC3: number, VEC4: number, MAT2: number, MAT3: number, MAT4: number}}
     */
    var ShaderUniformTypes = {
        FLOAT   : 0,

        VEC2    : 1,
        VEC3    : 2,
        VEC4    : 3,

        MAT2    : 4,
        MAT3    : 5,
        MAT4    : 6
    };

    /**
     * @class Shader
     * @desc Defines an object that represents a glsl shader. This object
     * provides an interface through which uniforms may be uploaded and shader
     * definitions may be compiled.
     *
     * @returns {Shader}
     * @author thegoldenmule
     * @constructor
     */
    global.Shader = function() {
        var that = this;

        /**
         * @member global.Shader#vertexBufferAttributePointer
         * @desc This pointer is updated when the shader is compiled and points
         * to the index of the vertex buffer.
         * @type {number}
         */
        that.vertexBufferAttributePointer = null;

        /**
         * @member global.Shader#vertexColorBufferAttributePointer
         * @desc This pointer is updated when the shader is compiled and points
         * to the index of the vertex color buffer.
         * @type {number}
         */
        that.vertexColorBufferAttributePointer = null;

        /**
         * @member global.Shader#uvBufferAttributePointer
         * @desc This pointer is updated when the shader is compiled and points
         * to the index of the vertex uv buffer.
         * @type {number}
         */
        that.uvBufferAttributePointer = null;

        /**
         * @member global.Shader#projectionMatrixUniformPointer
         * @desc This pointer is updated when the shader is compiled and points
         * to the index of the projection matrix uniform.
         * @type {number}
         */
        that.projectionMatrixUniformPointer = null;

        /**
         * @member global.Shader#modelMatrixUniformPointer
         * @desc This pointer is updated when the shader is compiled and points
         * to the index of the model matrix uniform.
         * @type {number}
         */
        that.modelMatrixUniformPointer = null;

        /**
         * @member global.Shader#colorUniformPointer
         * @desc This pointer is updated when the shader is compiled and points
         * to the index of the color uniform.
         * @type {number}
         */
        that.colorUniformPointer = null;

        /**
         * @member global.Shader#depthUniformPointer
         * @desc This pointer is updated when the shader is compiled and points
         * to the index of the depth uniform.
         * @type {number}
         */
        that.depthUniformPointer = null;

        /**
         * @member global.Shader#mainTextureUniformPointer
         * @desc This pointer is updated when the shader is compiled and points
         * to the index of the main texture uniform.
         * @type {number}
         */
        that.mainTextureUniformPointer = null;

        /**
         * @member global.Shader#secTextureUniformPointer
         * @desc This pointer is updated when the shader is compiled and points
         * to the index of the secondary texture uniform.
         * @type {number}
         */
        that.secTextureUniformPointer = null;

        var _compiled = false,
            _dirtyPointers = true,
            _shaderProgram = null,
            _vertexProgramId = "texture-shader-vs",
            _fragmentProgramId = "texture-shader-fs",

            _customUniforms = {};

        /**
         * @function global.Shader#setShaderProgramIds
         * @desc This method sets the ids of the vertex and fragment shaders.
         * Once these are changed, the shader needs to be recompiled.
         * @param {String} vertex The id of the vertex shader.
         * @param {String} fragment The id of the fragment shader.
         */
        that.setShaderProgramIds = function(vertex, fragment) {
            if (vertex === _vertexProgramId && fragment === _fragmentProgramId) {
                return;
            }

            _vertexProgramId = vertex;
            _fragmentProgramId = fragment;

            _shaderProgram = null;

            _compiled = false;
        };

        /**
         * @function global.Shader#getShaderProgram
         * @desc Once compiled, this function returns the shader program that
         * should be uploaded to the GPU.
         * @returns {GLShaderProgram}
         */
        that.getShaderProgram = function() {
            return _shaderProgram;
        };

        /**
         * @function global.Shader#setUniformFloat
         * @desc Sets a float value for a specific uniform.
         * @param {String} name The name of the uniform to set.
         * @param {Number} value The value to upload.
         * @type {Function}
         */
        that.setUniformFloat = setUniformValue(ShaderUniformTypes.FLOAT);

        /**
         * @function global.Shader#setUniformVec2
         * @desc Sets a vec2 value for a specific uniform.
         * @param {String} name The name of the uniform to set.
         * @param {Float32Array} value The value to upload.
         * @type {Function}
         */
        that.setUniformVec2 = setUniformValue(ShaderUniformTypes.VEC2);

        /**
         * @function global.Shader#setUniformVec3
         * @desc Sets a vec3 value for a specific uniform.
         * @param {String} name The name of the uniform to set.
         * @param {Float32Array} value The value to upload.
         * @type {Function}
         */
        that.setUniformVec3 = setUniformValue(ShaderUniformTypes.VEC3);

        /**
         * @function global.Shader#setUniformVec4
         * @desc Sets a vec4 value for a specific uniform.
         * @param {String} name The name of the uniform to set.
         * @param {Float32Array} value The value to upload.
         * @type {Function}
         */
        that.setUniformVec4 = setUniformValue(ShaderUniformTypes.VEC4);

        /**
         * @function global.Shader#setUniformMat2
         * @desc Sets a mat2 value for a specific uniform.
         * @param {String} name The name of the uniform to set.
         * @param {Float32Array} value The value to upload.
         * @type {Function}
         */
        that.setUniformMat2 = setUniformValue(ShaderUniformTypes.MAT2);

        /**
         * @function global.Shader#setUniformMat3
         * @desc Sets a mat3 value for a specific uniform.
         * @param {String} name The name of the uniform to set.
         * @param {Float32Array} value The value to upload.
         * @type {Function}
         */
        that.setUniformMat3 = setUniformValue(ShaderUniformTypes.MAT3);

        /**
         * @function global.Shader#setUniformMat4
         * @desc Sets a mat4 value for a specific uniform.
         * @param {String} name The name of the uniform to set.
         * @param {Float32Array} value The value to upload.
         * @type {Function}
         */
        that.setUniformMat4 = setUniformValue(ShaderUniformTypes.MAT4);

        /**
         * @function global.Shader#compile
         * @desc Compiles a shader, given a WebGLContext. This is necessary if
         * the context is lost or the shader ids have been changed.
         * @param {WebGLContext} ctx The context to compile with.
         * @returns {boolean} Returns true if successful.
         */
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

        /**
         * @function global.Shader#pushCustomUniforms
         * @desc This method uploads all custom uniforms to the GPU.
         * @param {WebGLContext} ctx The context to upload through.
         */
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

        /**
         * @private
         * @desc Returns a function that will set a uniform by type.
         * @param {Number} type The type of uniform.
         * @returns {Function}
         */
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

        /**
         * @function global.Shader#compuleShader
         * @private
         * @desc Heavily borrowed from:
         * https://developer.mozilla.org/en-US/docs/WebGL/Adding_2D_content_to_a_WebGL_context
         *
         * This method compiles a shader by element id.
         * @param {WebGLContext} ctx The context with which to compile
         * @param {string} id The string id of the DOMElement containing the
         * shader definition.
         * @returns {GLShaderProgram}
         */
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

        /**
         * @function global.Shader#setupPointers
         * @desc Sets up all uniform + attribute pointers.
         * @param {WebGLContext} ctx The context from which to grab pointers.
         * @private
         */
        function setupPointers(ctx) {
            setupAttributePointers(ctx);
            setupUniformPointers(ctx);
            setupCustomUniformPointers(ctx);
        }

        /**
         * @function global.Shader#setupAttributePointers
         * @desc Sets up all attribute pointers.
         * @param {WebGLContext} ctx The context from which to grab pointers.
         * @private
         */
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

        /**
         * @function global.Shader#setupUniformPointers
         * @desc Sets up all uniform pointers.
         * @param {WebGLContext} ctx The context from which to grab pointers.
         * @private
         */
        function setupUniformPointers(ctx) {
            that.projectionMatrixUniformPointer = ctx.getUniformLocation(_shaderProgram, "uProjectionMatrix");
            that.modelMatrixUniformPointer = ctx.getUniformLocation(_shaderProgram, "uModelViewMatrix");
            that.colorUniformPointer = ctx.getUniformLocation(_shaderProgram, "uColor");
            that.depthUniformPointer = ctx.getUniformLocation(_shaderProgram, "uDepth");
            that.mainTextureUniformPointer = ctx.getUniformLocation(_shaderProgram, "uMainTextureSampler");
            that.secTextureUniformPointer = ctx.getUniformLocation(_shaderProgram, "uSecTextureSampler");
        }

        /**
         * TODO: This is suboptimal.
         *
         * @function global.Shader#setupCustomUniformPointers
         * @desc Sets up all custom uniform pointers.
         * @param {WebGLContext} ctx The context from which to grab pointers.
         * @private
         */
        function setupCustomUniformPointers(ctx) {
            Object.keys(_customUniforms).forEach(
                function(name) {
                    var definition = _customUniforms[name];
                    definition.pointer = ctx.getUniformLocation(_shaderProgram, name);
                });
        }

        return that;
    };

    global.Shader.prototype = {
        constructor: global.Shader
    };
})(this);