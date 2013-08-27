/**
 * Author: thegoldenmule
 * Date: 3/11/13
 */

(function (global) {
    "use strict";

    var GUIDS = 0;

    /**
     * @class Material
     * @desc Material's hold a Shader and texture information. Materials may be
     * shared between multiple DisplayObjects.
     * @returns {Material}
     * @constructor
     */
    global.Material = function () {
        var scope = this;

        // get unique id
        var _id = GUIDS++;

        /**
         * @function global.Material#getId
         * @desc Returns an id unique across all Materials.
         * @returns {number}
         */
        scope.getId = function() {
            return _id;
        };

        /**
         * @member global.Material#shader
         * @desc The Shader instance for this Material. This object compiles the
         * glsl and acts as an interface for uploading uniforms and attribtes.
         * @type {Shader}
         */
        scope.shader = new Shader();

        /**
         * @member global.Material#mainTexture
         * @desc The Texture uploaded as the Shader's main texture. This is
         * used for most texture mapping.
         * @type {Texture}
         */
        scope.mainTexture = new Texture();

        /**
         * @member global.Material#secTexture
         * @desc The secondary texture to upload. This is unused most of the
         * time unless a custom shader requires it.
         * @type {Texture}
         */
        scope.secTexture = new Texture();

        return scope;
    };

    global.Material.prototype = {
        constructor:global.Material,

        /**
         * @function global.Material#prepareTextures
         * @desc Prepares Textures for upload.
         * @param {WebGLContext} ctx The context to prepare textures for.
         */
        prepareTextures: function(ctx) {
            if (null !== this.mainTexture) {
                this.mainTexture.prepareTexture(ctx);
            }

            if (null !== this.secTexture) {
                this.secTexture.prepareTexture(ctx);
            }
        },

        /**
         * @function global.Material#pushTextures
         * @desc Uploads Textures to the GPU.
         * @param {WebGLContext} ctx The context to push textures to.
         */
        pushTextures: function(ctx) {
            if (null !== this.mainTexture) {
                this.mainTexture.pushTexture(ctx, this.shader, ctx.TEXTURE0);
            }

            if (null !== this.secTexture) {
                this.secTexture.pushTexture(ctx, this.shader, ctx.TEXTURE1);
            }
        }
    };
})(this);