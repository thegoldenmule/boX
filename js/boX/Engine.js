(function(global) {
    "use strict";

    var Signal = signals.Signal;

    /// setup requestAnimationFrame
    window.requestAnimationFrame = window.requestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.msRequestAnimationFrame;

    /**
     * @class Engine
     * @desc The main entry point into bo-X. This class manages the scene, renderer,
     * and update tick.
     * @returns {Engine}
     * @constructor
     */
    global.Engine = function() {
        var that = this;

        // Public Vars
        that.paused = false;
        that.onPreUpdate = new Signal();
        that.onPostUpdate = new Signal();

        /// Private Variables
        var _initialized = false,
            _renderer = null,
            _scene = new Scene(),
            _spriteSheetScheduler = new SpriteSheetScheduler(),
            _lastUpdate = 0,
            _totalTime = 0;

        /**
         * @method global.Engine#getSimulationTime
         * @desc Returns the time, in seconds, since the start of the
         * simulation.
         * @returns {Number} The time, in seconds, since the start of the
         * simulation.
         */
        that.getSimulationTime = function() {
            return _totalTime;
        };

        /**
         * @method global.Engine#getRenderer
         * @desc Returns the WebGLRenderer instance.
         * @returns {WebGLRenderer}
         */
        that.getRenderer = function() {
            return _renderer;
        };

        /**
         * @method global.Engine#getScene
         * @desc Returns the Scene being rendered.
         * @returns {Scene}
         */
        that.getScene = function() {
            return _scene;
        };

        /**
         * @method global.Engine#getSpriteSheetScheduler
         * @desc Returns the SpriteSheetScheduler for updating SpriteSheets.
         * @returns {SpriteSheetScheduler}
         */
        that.getSpriteSheetScheduler = function() {
            return _spriteSheetScheduler;
        };

        /**
         * @method global.Engine#initialize
         * @desc Initializes this object. This starts the game tick and begins
         * calling the renderer.
         * @param {WebGLRenderer} renderer The WebGLRenderer to render the
         * scene with.
         */
        that.initialize = function(renderer) {
            if (true === _initialized) {
                throw new Error("Cannot initialize Engine twice!");
            }
            _initialized = true;

            _renderer = renderer;

            _lastUpdate = Date.now();

            // start the game loop
            window.requestAnimationFrame(
                function Step() {
                    var now = Date.now();
                    var dt = now - _lastUpdate;
                    _lastUpdate = now;

                    update(dt);

                    window.requestAnimationFrame(Step);
                });
        };

        /// Private Methods
        function update(dt) {
            if (that.paused) {
                return;
            }

            _totalTime += dt;

            _renderer.preUpdate();
            that.onPreUpdate.dispatch(dt);
            _spriteSheetScheduler.onPreUpdate(dt);

            _scene.update(dt, _renderer);

            that.onPostUpdate.dispatch(dt);
        }

        return that;
    };

    global.Engine.prototype = {
        constructor: global.Engine
    };
})(this);