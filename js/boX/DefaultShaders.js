/**
 * Author: thegoldenmule
 * Date: 3/17/13
 */

(function (global) {
    "use strict";

    var colorShaderVS = {
        name: "color-shader-vs",
        type: "x-shader/x-vertex",
        body:
            "precision highp float;" +

            "uniform mat4 uProjectionMatrix;" +
            "uniform mat4 uModelViewMatrix;" +

            "uniform vec4 uColor;" +

            "uniform float uDepth;" +

            "attribute vec2 aPosition;" +
            "attribute vec4 aColor;" +

            "varying vec4 vColor;" +

            "void main(void) {" +
                // vertex transform
                "gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aPosition, uDepth, 1.0);" +

                // calculate color
                "vColor = uColor * aColor;" +
            "}"
    };

    var colorShaderFS = {
        name: "color-shader-fs",
        type: "x-shader/x-fragment",
        body:
            "precision highp float;" +

            "varying vec4 vColor;" +

            "void main(void) {" +
                "gl_FragColor = vColor;" +
            "}"
    };

    var textureShaderVS = {
        name: "texture-shader-vs",
        type: "x-shader/x-vertex",
        body:
            "precision highp float;" +

            "uniform mat4 uProjectionMatrix;" +
            "uniform mat4 uModelViewMatrix;" +

            "uniform vec4 uColor;" +

            "uniform float uDepth;" +

            "attribute vec2 aPosition;" +
            "attribute vec2 aUV;" +
            "attribute vec4 aColor;" +

            "varying vec4 vColor;" +
            "varying vec2 vUV;" +

            "void main(void) {" +
                // vertex transform
                "gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aPosition, uDepth, 1.0);" +

                // pass color + uv through
                "vColor = aColor * uColor;" +
                "vUV = aUV;" +
            "}"
    };

    var textureShaderFS = {
        name: "texture-shader-fs",
        type: "x-shader/x-fragment",
        body:
            "precision highp float;" +

            "varying vec4 vColor;" +
            "varying vec2 vUV;" +

            "uniform sampler2D uMainTextureSampler;" +

            "void main(void) {" +
                "gl_FragColor = texture2D(uMainTextureSampler, vUV) * vColor;" +
            "}"
    };

    var spriteSheetShaderVS = {
            name: "ss-shader-vs",
            type: "x-shader/x-vertex",
            body:
                "precision highp float;" +

                "uniform mat4 uProjectionMatrix;" +
                "uniform mat4 uModelViewMatrix;" +

                "uniform vec4 uColor;" +

                "uniform float uDepth;" +

                "attribute vec2 aPosition;" +
                "attribute vec2 aUV;" +
                "attribute vec4 aColor;" +

                "varying vec4 vColor;" +
                "varying vec4 vVertexColor;" +
                "varying vec2 vUV;" +

                "void main(void) {" +
                    // vertex transform
                    "gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aPosition, uDepth, 1.0);" +

                    // pass color + uv through
                    "vColor = uColor;" +

                    // note that in this shader, color.xy is the previous frame's uvs!
                    "vUV = aUV;" +
                    "vVertexColor = aColor;" +
                "}"
        };

        var spriteSheetShaderFS = {
            name: "ss-shader-fs",
            type: "x-shader/x-fragment",
            body:
                "precision highp float;" +

                "varying vec4 vColor;" +
                "varying vec4 vVertexColor;" +
                "varying vec2 vUV;" +

                "uniform sampler2D uMainTextureSampler;" +
                "uniform float uFutureBlendScalar;" +
                "uniform float uBlendWeight;" +

                "void main(void) {" +
                    "vec4 currentFrame = texture2D(uMainTextureSampler, vUV);" +
                    "vec4 futureFrame = texture2D(uMainTextureSampler, vec2(vVertexColor.xy));" +
                    "float blendWeight = uBlendWeight * uFutureBlendScalar;" +
                    "gl_FragColor = futureFrame * blendWeight + currentFrame * (1.0 - blendWeight);" +
                "}"
        };

    var boundingBoxShaderVS = {
        name: "bb-shader-vs",
        type: "x-shader/x-vertex",
        body:
            "precision highp float;" +

            "uniform mat4 uProjectionMatrix;" +
            "uniform mat4 uModelViewMatrix;" +

            "attribute vec2 aPosition;" +
            "attribute vec2 aUV;" +

            "varying vec2 vUV;" +

            "void main(void) {" +
                // vertex transform
                "gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aPosition, 0.0, 1.0);" +

                "vUV = aUV;" +
            "}"
    };

    var boundingBoxShaderFS = {
        name: "bb-shader-fs",
        type: "x-shader/x-fragment",
        body:
            "varying vec2 vUV;" +

            "void main(void) {" +
                "gl_FragColor = vec4(1.0, 0.0, 0.0, 0.2);" +
            "}"
    };

    var particleShaderVS = {
        name: "particle-shader-vs",
        type: "x-shader/x-vertex",
        body:
            "precision highp float;" +

            "uniform mat4 uProjectionMatrix;" +
            "uniform mat4 uModelViewMatrix;" +

            "uniform vec4 uColor;" +

            "uniform float uDepth;" +

            "attribute vec2 aPosition;" +
            "attribute vec2 aUV;" +
            "attribute vec4 aColor;" +

            "varying vec4 vColor;" +
            "varying vec2 vUV;" +

            "void main(void) {" +
                // vertex transform
                "gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aPosition, uDepth, 1.0);" +

                // pass color + uv through
                "vColor = aColor * uColor;" +
                "vUV = aUV;" +
            "}"
    };

    var particleShaderFS = {
        name: "particle-shader-fs",
        type: "x-shader/x-fragment",
        body:
            "precision highp float;" +

            "varying vec4 vColor;" +
            "varying vec2 vUV;" +

            "uniform sampler2D uMainTextureSampler;" +

            "void main(void) {" +
                "gl_FragColor = texture2D(uMainTextureSampler, vUV) * vColor;" +
            "}"
    };

    global.__DEFAULT_SHADERS = [
        colorShaderVS,
        colorShaderFS,

        textureShaderVS,
        textureShaderFS,

        spriteSheetShaderFS,
        spriteSheetShaderVS,

        boundingBoxShaderVS,
        boundingBoxShaderFS,

        particleShaderVS,
        particleShaderFS
    ];

})(this);