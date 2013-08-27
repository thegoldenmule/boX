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
     * @author thegoldenmule
     * @constructor
     */
    global.Engine = function() {
        var scope = this;

        // Public Vars
        scope.paused = false;
        scope.onPreUpdate = new Signal();
        scope.onPostUpdate = new Signal();

        /// Private Variables
        var _initialized = false,
            _renderer = null,
            _scene = new Scene(),
            _spriteSheetScheduler = new SpriteSheetScheduler(),
            _lastUpdate = 0,
            _totalTime = 0,
            _stopped = false;

        /**
         * @field global.Engine#simulationTimeMultiplier
         * @desc Multiplies the dt values propagated via the update cycle.
         * @type {number}
         */
        scope.simulationTimeMultiplier = 1;

        /**
         * @method global.Engine#getSimulationTime
         * @desc Returns the time, in seconds, since the start of the
         * simulation.
         * @returns {Number} The time, in seconds, since the start of the
         * simulation.
         */
        scope.getSimulationTime = function() {
            return _totalTime;
        };

        /**
         * @method global.Engine#getRenderer
         * @desc Returns the WebGLRenderer instance.
         * @returns {WebGLRenderer}
         */
        scope.getRenderer = function() {
            return _renderer;
        };

        /**
         * @method global.Engine#getScene
         * @desc Returns the Scene being rendered.
         * @returns {Scene}
         */
        scope.getScene = function() {
            return _scene;
        };

        /**
         * @method global.Engine#getSpriteSheetScheduler
         * @desc Returns the SpriteSheetScheduler for updating SpriteSheets.
         * @returns {SpriteSheetScheduler}
         */
        scope.getSpriteSheetScheduler = function() {
            return _spriteSheetScheduler;
        };

        /**
         * @method global.Engine#initialize
         * @desc Initializes this object. This starts the game tick and begins
         * calling the renderer.
         * @param {WebGLRenderer} renderer The WebGLRenderer to render the
         * scene with.
         */
        scope.initialize = function(renderer) {
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
                    var dt = (now - _lastUpdate) * scope.simulationTimeMultiplier;
                    _lastUpdate = now;

                    update(dt);

                    window.requestAnimationFrame(Step);
                });
        };

        /**
         * @method global.Engine#start
         * @desc Starts the simulation. This is automatically called by
         * initialize.
         */
        scope.start = function() {
            _stopped = false;
        };

        /**
         * @method global.Engine#stop
         * @desc Stops the simulation.
         */
        scope.stop = function() {
            _stopped = true;
        };

        /// Private Method
        function update(dt) {
            if (scope.paused) {
                return;
            }

            _totalTime += dt;

            _renderer.preUpdate();
            scope.onPreUpdate.dispatch(dt);
            _spriteSheetScheduler.onPreUpdate(dt);

            _scene.update(dt, _renderer);

            scope.onPostUpdate.dispatch(dt);
        }

        return scope;
    };

    global.Engine.prototype = {
        constructor: global.Engine
    };
})(this);