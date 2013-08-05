/**
 * Author: thegoldenmule
 * Date: 1/30/13
 * Time: 4:35 PM
 */

/// requestAnimationFrame
window.requestAnimationFrame = window.requestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.msRequestAnimationFrame;

// logging
var Log = (function() {
    function log(msg) {
        if (console && console.log) {
            console.log(msg);
        }
    }

    function replaceTokens(msg, tokens) {
        var message = [];
        var messagePieces = msg.split(/\{\}/);
        for (var i = 0, len = Math.min(tokens.length, messagePieces.length); i < len; i++) {
            message.push(messagePieces[i]);
            message.push(tokens[i]);
        }

        if (i < messagePieces.length) {
            message.push(messagePieces.slice(i).join(""));
        }

        return message.join("");
    }

    function loggingFunction(level) {
        return function() {
            var args =  Array.prototype.slice.call(arguments);
            if (0 === args.length) {
                return;
            } else if (1 === args.length) {
                log("[" + level + "] : " + args[0]);
            } else {
                log("[" + level + "] : " + replaceTokens(args[0], args.slice(1)));
            }
        };
    }

    return {
        debug : loggingFunction("Debug"),
        warn : loggingFunction("Warn"),
        error : loggingFunction("Error")
    };
})();

var Signal = signals.Signal;

/**
 * Engine
 *
 * @type {*}
 */
var Engine = (function() {
    "use strict";

    /// Static Variables

    /// Static Methods

    return function() {
        var that = this;

        var _scene = new Scene();

        // Public Vars
        that.paused = false;
        that.onPreUpdate = new Signal();
        that.onPostUpdate = new Signal();

        /// Private Variables
        var _initialized = false,
            _renderer = null,
            _lastUpdate = 0;

        // Public Methods
        that.getRenderer = function() {
            return _renderer;
        };

        that.getScene = function() {
            return _scene;
        };

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
            _renderer.preUpdate();
            that.onPreUpdate.dispatch(dt);

            _scene.update(dt, _renderer);

            that.onPostUpdate.dispatch(dt);
        }

        return that;
    };
})();

Engine.prototype = {
    constructor : Engine
};