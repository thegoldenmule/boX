(function (global) {
    "use strict";

    /**
     * @class Animation
     * @desc Defines an animation for a SpriteSheet.
     * @param {Object} parameters An object initializer that may contain the
     * following parameters: name, startFrame, animationLength, frameRate.
     * @returns {Animation}
     * @author thegoldenmule
     * @constructor
     */
    global.Animation = function(parameters) {
        var scope = this;

        if (!parameters) {
            parameters = {};
        }

        /**
         * @member global.Animation#name
         * @desc The name of the Animation. This is used to key animations.
         * @type {string}
         */
        scope.name = undefined === parameters.name ? "" : parameters.name;

        /**
         * @member global.Animation#startFrame
         * @desc Defines the frame on which to start the animation.
         * @type {number}
         */
        scope.startFrame = undefined === parameters.startFrame ? 0 : parameters.startFrame;

        /**
         * @member global.Animation#animationLength
         * @desc Defines how many frames are in the animation.
         * @type {number}
         */
        scope.animationLength = undefined === parameters.animationLength ? 0 : parameters.animationLength;

        /**
         * @member global.Animation#frameRate
         * @desc Defines the speed at which to playback the animation.
         * @type {number}
         */
        scope.frameRate = undefined === parameters.frameRate ? 60 : parameters.frameRate;

        return scope;
    };

    /**
     * @class SpriteSheet
     * @desc A SpriteSheet is a DisplayObject that plays back animations.
     * @param {Object} parameters An object initializer that may must contain:
     * width
     * height
     * mainTexture
     *
     * But may also contain any values appropriate for a DisplayObject.
     * @returns {SpriteSheet}
     * @constructor
     */
    global.SpriteSheet = function (parameters) {
        var scope = this;

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

        DisplayObject.call(scope, parameters);

        scope.material.shader.setShaderProgramIds("ss-shader-vs", "ss-shader-fs");

        var _animations = [],

            _currentAnimation = null,
            _currentTimeMS = 0,
            _currentFrame = 0,

            _totalFrameWidth = scope.material.mainTexture.getWidth() / scope.getWidth(),
            _totalFrameHeight = scope.material.mainTexture.getHeight() / scope.getWidth(),

            _normalizedFrameWidth = 1 / _totalFrameWidth,
            _normalizedFrameHeight = 1 / _totalFrameHeight,

            _blendCurve = new AnimationCurve();

        _blendCurve.easingFunction = Easing.Quadratic.In;

        /**
         * @function global.SpriteSheet#getBlendCurve
         * @desc Returns the AnimationCurve instance used for blending between
         * frames.
         * @returns {AnimationCurve}
         */
        scope.getBlendCurve = function() {
            return _blendCurve;
        };

        /**
         * @function global.SpriteSheet#addAnimation
         * @desc Adds an Animation object to this SpriteSheet.
         * @param {Animation} animationData The Animation instane to add.
         */
        scope.addAnimation = function(animationData) {
            _animations.push(animationData);
        };

        /**
         * @function global.SpriteSheet#removeAnimationByName
         * @desc Removes an Animation instance by name.
         * @param {String} animationName The name of the Animation to remove.
         */
        scope.removeAnimationByName = function(animationName) {
            for (var i = 0, len = _animations.length; i < len; i++) {
                if (_animations[i].name === animationName) {
                    _animations = _animations.splice(i, 0);
                    return;
                }
            }
        };

        /**
         * @function global.SpriteSheet#setCurrentAnimationByName
         * @desc Sets the current Animation to play back by name.
         * @param {String} animationName The name of the Animation to play.
         */
        scope.setCurrentAnimationByName = function(animationName) {
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

        /**
         * @function global.SpriteSheet#getCurrentAnimation
         * @desc Retrieves the currently playing Animation.
         * @returns {Animation}
         */
        scope.getCurrentAnimation = function() {
            return _currentAnimation;
        };

        /**
         * @function global.SpriteSheet#setCurrentFrame
         * @desc Sets the current frame.
         * @param {Number} value The frame number to play.
         */
        scope.setCurrentFrame = function(value) {
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

        /**
         * @function global.SpriteSheet#getCurrentFrame
         * @desc Returns the number of the frame currently playing.
         * @returns {number}
         */
        scope.getCurrentFrame = function() {
            return _currentFrame;
        };

        /**
         * @function global.SpriteSheet#setCurrentTime
         * @desc Rather than setting the frame number, the time may also be
         * set, in which case, the frame number is derived.
         * @param value
         */
        scope.setCurrentTime = function(value) {
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
            scope.material.shader.setUniformFloat(
                "uFutureBlendScalar",
                _blendCurve.evaluate((_currentTimeMS % msPerFrame) / msPerFrame));

            // did we switch frames?
            if (_currentFrame === newFrame) {
                return;
            }

            _currentFrame = newFrame;

            updateUVs();
        };

        /**
         * @function global.SpriteSheet#update
         * @desc Updates the SpriteSheet. This method motors the animation.
         * @param {Number} dt The time, in seconds, since the last update was
         * called.
         */
        scope.update = function(dt) {
            scope.setCurrentTime(_currentTimeMS + dt);
        };

        /**
         * @function global.SpriteSheet#updateUVs
         * @private
         * @desc Updates the uv buffer. Since SpriteSheets actually upload two
         * frames at a time, the color buffer also holds uv information.
         */
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
            var uvs = scope.geometry.uvs;
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
            var colors = scope.geometry.colors;
            colors[0] = normalizedFrameX;
            colors[1] = normalizedFrameY;

            colors[4] = normalizedFrameX;
            colors[5] = normalizedFrameY + _normalizedFrameHeight;

            colors[8] = normalizedFrameX + _normalizedFrameWidth;
            colors[9] = normalizedFrameY;

            colors[12] = normalizedFrameX + _normalizedFrameWidth;
            colors[13] = normalizedFrameY + _normalizedFrameHeight;

            scope.geometry.apply();
        }

        return scope;
    };

    global.SpriteSheet.prototype = new DisplayObject();
    global.SpriteSheet.prototype.constructor = SpriteSheet;
})(this);