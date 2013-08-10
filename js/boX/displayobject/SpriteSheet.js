/**
 * Author: thegoldenmule
 * Date: 5/18/13
 * Time: 7:13 AM
 */

(function (global) {
    "use strict";

    var Animation = function(parameters) {
        var that = this;

        if (!parameters) {
            parameters = {};
        }

        this.name = undefined === parameters.name ? "" : parameters.name;

        this.startFrame = undefined === parameters.startFrame ? 0 : parameters.startFrame;
        this.animationLength = undefined === parameters.animationLength ? 0 : parameters.animationLength;

        this.frameRate = undefined === parameters.frameRate ? 60 : parameters.frameRate;

        return that;
    };

    var SpriteSheet = function (parameters) {
        var that = this;

        if (undefined === parameters) {
            parameters = {};
        }

        if (undefined === parameters.width) {
            throw new Error("Must define width and height!");
        }

        if (undefined === parameters.height) {
            throw new Error("Must define width and height!");
        }

        if (undefined === parameters.mainTexture) {
            throw new Error("Must define mainTexture!");
        }

        DisplayObject.call(that, parameters);

        that.material.shader.setShaderProgramIds("ss-shader-vs", "ss-shader-fs");

        var _animations = [],

            _currentAnimation = null,
            _currentTimeMS = 0,
            _currentFrame = 0,

            _totalFrameWidth = that.material.mainTexture.getWidth() / that.getWidth(),
            _totalFrameHeight = that.material.mainTexture.getHeight() / that.getWidth(),

            _normalizedFrameWidth = 1 / _totalFrameWidth,
            _normalizedFrameHeight = 1 / _totalFrameHeight,

            _blendCurve = new AnimationCurve();

        _blendCurve.addKey(new AnimationCurveKey(0, 0));
        _blendCurve.addKey(new AnimationCurveKey(1, 1));
        _blendCurve.easingFunction = Easing.Quadratic.In;

        that.getBlendCurve = function() {
            return _blendCurve;
        };

        that.addAnimation = function(animationData) {
            _animations.push(animationData);
        };

        that.removeAnimationByName = function(animationName) {
            for (var i = 0, len = _animations.length; i < len; i++) {
                if (_animations[i].name === animationName) {
                    _animations = _animations.splice(i, 0);
                    return;
                }
            }
        };

        that.setCurrentAnimationByName = function(animationName) {
            if (null !== _currentAnimation && _currentAnimation.name === animationName) {
                return;
            }

            for (var i = 0, len = _animations.length; i < len; i++) {
                if (_animations[i].name === animationName) {
                    _currentAnimation = _animations[i];

                    return;
                }
            }
        };

        that.getCurrentAnimation = function() {
            return _currentAnimation;
        };

        that.setCurrentFrame = function(value) {
            // get the animation
            var animation = _currentAnimation;
            if (null === animation) {
                return;
            }

            // no change!
            if (value === _currentFrame) {
                return;
            }

            _currentFrame = value % animation.animationLength;

            // update the time from the frame value
            _currentTimeMS = _currentFrame * 1000;

            // update the UVs!
            updateUVs();
        };

        that.getCurrentFrame = function() {
            return _currentFrame;
        };

        that.setCurrentTime = function(value) {
            // get the animation
            var animation = _currentAnimation;
            if (null === animation) {
                return;
            }

            _currentTimeMS = value;

            // set current frame from the current time
            var msPerFrame = Math.floor(1000 / animation.frameRate);
            var newFrame = Math.floor(_currentTimeMS / msPerFrame) % animation.animationLength;

            // set the blend uniform
            that.material.shader.setUniformFloat(
                "uFutureBlendScalar",
                _blendCurve.evaluate((_currentTimeMS % msPerFrame) / msPerFrame));

            // did we switch frames?
            if (_currentFrame === newFrame) {
                return;
            }

            _currentFrame = newFrame;

            updateUVs();
        };

        that.update = function(dt) {
            that.setCurrentTime(_currentTimeMS + dt);
        };

        function updateUVs() {
            // get the animation
            var animation = _currentAnimation;
            if (null === animation) {
                return;
            }

            // find location of frame
            var actualFrame = animation.startFrame + _currentFrame;

            var frameX = actualFrame % _totalFrameWidth;
            var frameY = Math.floor(actualFrame / _totalFrameWidth);

            // normalize them
            var normalizedFrameX = frameX / _totalFrameWidth;
            var normalizedFrameY = frameY / _totalFrameHeight;

            // set the uvs
            var uvs = that.geometry.uvs;
            uvs[0] = normalizedFrameX;
            uvs[1] = normalizedFrameY;

            uvs[2] = normalizedFrameX;
            uvs[3] = normalizedFrameY + _normalizedFrameHeight;

            uvs[4] = normalizedFrameX + _normalizedFrameWidth;
            uvs[5] = normalizedFrameY;

            uvs[6] = normalizedFrameX + _normalizedFrameWidth;
            uvs[7] = normalizedFrameY + _normalizedFrameHeight;

            // now set uvs for the future frame
            actualFrame = animation.startFrame +
                (animation.animationLength - 1 === _currentFrame ?
                    0 :
                    _currentFrame + 1);
            frameX = actualFrame % _totalFrameWidth;
            frameY = Math.floor(actualFrame / _totalFrameWidth);

            // normalize them
            normalizedFrameX = frameX / _totalFrameWidth;
            normalizedFrameY = frameY / _totalFrameHeight;

            // set the uvs
            var colors = that.geometry.colors;
            colors[0] = normalizedFrameX;
            colors[1] = normalizedFrameY;

            colors[4] = normalizedFrameX;
            colors[5] = normalizedFrameY + _normalizedFrameHeight;

            colors[8] = normalizedFrameX + _normalizedFrameWidth;
            colors[9] = normalizedFrameY;

            colors[12] = normalizedFrameX + _normalizedFrameWidth;
            colors[13] = normalizedFrameY + _normalizedFrameHeight;

            that.geometry.apply();
        }

        return that;
    };

    SpriteSheet.prototype = new DisplayObject();
    SpriteSheet.prototype.constructor = SpriteSheet;

    global.Animation = Animation;
    global.SpriteSheet = SpriteSheet;
})(this);