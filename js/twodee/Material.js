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