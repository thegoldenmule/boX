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