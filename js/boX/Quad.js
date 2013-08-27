(function(global) {
    "use strict";

    /**
     * @class Quad
     * @desc The Quad class represents a simple quad geometry. It includes a
     * vertex, uv, and vertex color buffer. Quads are drawn using the triangle
     * strip primitive.
     * @returns {Quad}
     * @author thegoldenmule
     * @constructor
     */
    global.Quad = function () {
        var scope = this;

        /**
         * @member global.Quad#width
         * @desc The width of the Quad.
         * @type {number}
         */
        scope.width = 1;

        /**
         * @member global.Quad#height
         * @desc The height of the Quad.
         * @type {number}
         */
        scope.height = 1;

        /**
         * @member global.Quad#vertices
         * @desc An array of x, y coordinates that represent the
         * Quad's vertices.
         * @type {Float32Array}
         */
        scope.vertices = new Float32Array([
            0, 0,
            0, 1,
            1, 0,
            1, 1]);

        /**
         * @member global.Quad#uvs
         * @desc An array of u, v texture coordinates.
         * @type {Float32Array}
         */
        scope.uvs = new Float32Array([
            0, 0,
            0, 1,
            1, 0,
            1, 1]);

        /**
         * @member global.Quad#colors
         * @desc An array of rgba values that represent vertex colors.
         * @type {Float32Array}
         */
        scope.colors = new Float32Array([
            1, 1, 1, 1,
            1, 1, 1, 1,
            1, 1, 1, 1,
            1, 1, 1, 1]);

        /**
         * @member global.Quad#vertexBuffer
         * @desc The vertex buffer to push to the GPU.
         * @type {WebGLBuffer}
         */
        scope.vertexBuffer = null;

        /**
         * @member global.Quad#uvBuffer
         * @desc The uv buffer to push to the GPU.
         * @type {WebGLBuffer}
         */
        scope.uvBuffer = null;

        /**
         * @member global.Quad#colorBuffer
         * @desc The vertex color buffer to push to the GPU.
         * @type {WebGLBuffer}
         */
        scope.colorBuffer = null;

        scope.__apply = true;

        return scope;
    };

    global.Quad.prototype = {
        constructor: global.Quad,

        /**
         * @function global.Quad#apply
         * @desc Applies width and height changes to the Quad's geometry. This
         * must be called after width or height has been changed.
         */
        apply: function() {
            // update from width/height
            this.vertices[4] = this.vertices[6] = this.width;
            this.vertices[3] = this.vertices[7] = this.height;

            this.__apply = true;
        },

        /**
         * @function global.Quad#clearBuffers
         * @desc Called when the WebGLContext has been lost.
         */
        clearBuffers: function() {
            this.vertexBuffer = this.uvBuffer = this.colorBuffer = null;
        },

        /**
         * @function global.Quad#prepareBuffers
         * @desc Creates buffers and binds data only when necessary.
         * @param {WebGLContext} ctx The context to prepare for.
         */
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

        /**
         * @function global.Quad#pushBuffers
         * @param {WebGLContext} ctx The context to push the buffers to.
         * @param {Shader} shader The shader to grab pointers from.
         */
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

        /**
         * @function global.Quad#draw
         * @desc Makes the actual draw call.
         * @param {WebGLContext} ctx The context to draw on.
         */
        draw: function(ctx) {
            ctx.drawArrays(
                ctx.TRIANGLE_STRIP,
                0,
                4);
        }
    };
})(this);