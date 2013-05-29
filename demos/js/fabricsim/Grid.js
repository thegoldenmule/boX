/**
 * Author: thegoldenmule
 * Date: 3/30/13
 */

(function (global) {
    "use strict";

    var GridGeometry = function(pointMassSystem, scale) {
        var _pointMassSystem = pointMassSystem;

        this.scale = scale;

        this.getPointMassSystem = function() {
            return _pointMassSystem;
        };

        this.rebuild();
    };

    GridGeometry.prototype = {
        constructor: GridGeometry,

        rebuild: function() {
            var system = this.getPointMassSystem();
            var scale = this.scale;

            var verts = [];
            for (var i = 0, ilen = system.getWidth(); i < ilen; i++) {
                for (var j = 0, jlen = system.getHeight(); j < jlen; j++) {
                    var mass = system.getPointMassAt(i, j);

                    // (i, j) -> (i + 1, j)
                    if (null !== mass.right) {
                        verts.push(mass.cx * scale);
                        verts.push(mass.cy * scale);

                        verts.push(mass.right.cx * scale);
                        verts.push(mass.right.cy * scale);
                    }

                    // (i, j) -> (i, j + 1)
                    if (null !== mass.bottom) {
                        verts.push(mass.cx * scale);
                        verts.push(mass.cy * scale);

                        verts.push(mass.bottom.cx * scale);
                        verts.push(mass.bottom.cy * scale);
                    }
                }
            }

            this.vertices = new Float32Array(verts);
            this.vertexBuffer = null;
        },

        clearBuffers: function() {
            this.vertexBuffer = null;
        },

        prepareBuffers: function(ctx) {
            if (null === this.vertexBuffer) {
                this.vertexBuffer = ctx.createBuffer();
            }

            ctx.bindBuffer(ctx.ARRAY_BUFFER, this.vertexBuffer);
            ctx.bufferData(ctx.ARRAY_BUFFER, this.vertices, ctx.STATIC_DRAW);
        },

        pushBuffers: function(ctx, shader) {
            if (-1 !== shader.vertexBufferAttributePointer) {
                ctx.bindBuffer(ctx.ARRAY_BUFFER, this.vertexBuffer);
                ctx.vertexAttribPointer(shader.vertexBufferAttributePointer, 2, ctx.FLOAT, false, 0, 0);
            }
        },

        draw: function(ctx) {
            ctx.drawArrays(
                ctx.LINES,
                0,
                this.vertices.length / 2);
        }
    };

    // append shader to defaults
    global.__DEFAULT_SHADERS.push(
        {
            name: "line-shader-vs",
            type: "x-shader/x-vertex",
            body:
                "precision highp float;" +

                "attribute vec2 aPosition;" +

                "uniform float uDepth;" +
                "uniform mat4 uProjectionMatrix;" +
                "uniform mat4 uModelViewMatrix;" +

                "void main(void) {" +
                    // vertex transform
                    "gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aPosition, uDepth, 1.0);" +
                "}"
        },

        {
            name: "line-shader-fs",
            type: "x-shader/x-fragment",
            body:
                "precision highp float;" +

                "uniform vec4 uColor;" +

                "void main(void) {" +
                    "gl_FragColor = uColor;" +
                "}"
        }
    );

    var Grid = function (width, height, resolution) {
        DisplayObject.apply(this);

        var scope = this;

        // set custom shader ids
        scope.material = new Material();
        scope.material.shader.setShaderProgramIds("line-shader-vs", "line-shader-fs");

        scope.tint = new Color(0.5, 0.5, 0.5);

        // create custom geometry
        scope.geometry = new GridGeometry(width, height, resolution);

        return scope;
    };

    Grid.prototype = new DisplayObject();
    Grid.prototype.constructor = Grid;

    // export
    global.Grid = Grid;
})(this);