(function (global) {
    "use strict";

    /**
     * @class Texture
     * @author thegoldenmule
     * @desc A Texture represents pixel data for shaders and provides management
     * for intelligently uploading images.
     * @param {Image} image An optional Image element. Images may also be
     * swapped at runtime, but the apply function must be called.
     * @returns {Texture}
     * @constructor
     */
    global.Texture = function (image) {
        var scope = this;

        /**
         * @member global.Texture#image
         * @desc The HTML Image object to act as the source.
         * @type {Image}
         */
        scope.image = undefined === image ? null : image;

        /**
         * @member global.Texture#glTexture
         * @desc The glTexture object. This is created and managed internally.
         * @type {WebGLTexture}
         */
        scope.glTexture = null;

        /**
         * @member global.Texture#flipY
         * @desc If true, flips the texture vertically.
         * @type {boolean}
         */
        scope.flipY = false;

        /**
         * @member global.Texture#filterLinear
         * @desc If true, uploads with linear filtering, otherwise with nearest.
         * @type {boolean}
         */
        scope.filterLinear = true;

        /**
         * @member global.Texture#mipmapLinear
         * @desc If true, mipmaps use linear filtering, otherwise, nearest.
         * @type {boolean}
         */
        scope.mipmapLinear = true;

        scope._apply = true;

        return scope;
    };

    global.Texture.prototype = {
        constructor:global.Texture,

        /**
         * @function global.Texture#getWidth
         * @desc Returns the width of the Texture.
         * @returns {Number}
         */
        getWidth: function() {
            return this.image ? parseInt(this.image.width, 10) : 0;
        },

        /**
         * @function global.Texture#getHeight
         * @desc Returns the height of the Texture.
         * @returns {Number}
         */
        getHeight: function() {
            return this.image ? parseInt(this.image.height, 10) : 0;
        },

        /**
         * @function global.Texture#apply
         * @desc Must be called after the source image has been updated.
         */
        apply: function() {
            this._apply = true;
        },

        /**
         * @function global.Texture#clearBuffers
         * @desc Called when the WebGLContext has been lost.
         */
        clearBuffers: function() {
            this.glTexture = null;
        },

        /**
         * @function global.Texture#prepareTexture
         * @desc Called to prepare Textures for a context. This method will not
         * bind textures or create buffers if unnecessary.
         * @param {WebGLContext} ctx The context to prepare for.
         */
        prepareTexture: function(ctx) {
            if (null === this.image) {
                return;
            }

            if (null === this.glTexture || this._apply) {
                this.glTexture = ctx.createTexture();

                ctx.bindTexture(ctx.TEXTURE_2D, this.glTexture);
                ctx.pixelStorei(ctx.UNPACK_FLIP_Y_WEBGL, this.flipY);
                ctx.pixelStorei(ctx.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
                ctx.texImage2D(ctx.TEXTURE_2D, 0, ctx.RGBA, ctx.RGBA, ctx.UNSIGNED_BYTE, this.image);
                ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MAG_FILTER, this.filterLinear ? ctx.LINEAR : ctx.NEAREST);
                ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MIN_FILTER, this.filterLinear ? ctx.LINEAR : ctx.NEAREST);
                ctx.bindTexture(ctx.TEXTURE_2D, null);

                this._apply = false;
            }
        },

        /**
         * @function global.Texture#pushTexture
         * @desc Pushes the texture buffer to the GPU.
         * @param {WebGLContext} ctx The context to push to.
         * @param {Shader} shader The Shader to grab pointers from.
         * @param {Number} textureNum Each texture is associated with a number.
         */
        pushTexture: function(ctx, shader, textureNum) {
            if (-1 === shader.mainTextureUniformPointer) {
                return;
            }

            ctx.activeTexture(textureNum);
            ctx.bindTexture(ctx.TEXTURE_2D, this.glTexture);
            ctx.uniform1i(shader.mainTextureUniformPointer, 0);
        }
    };
})(this);