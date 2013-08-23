(function(global) {
    "use strict";

    /**
     * @desc Logs a message to the console.
     * @private
     * @param msg
     */
    function log(msg) {
        if (console && console.log) {
            console.log(msg);
        }
    }

    /**
     * @desc Replaces tokens in a string with string passed on tokens object.
     * @example
     * replaceTokens("I am {name}.", {name:"Bob"});
     * @param {String} msg
     * @param {Object} tokens
     * @returns {string}
     */
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

    /**
     * @desc Wraps log with a specific log level.
     * @private
     * @param {String} level
     * @returns {Function}
     */
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

    /**
     * @class Log
     * @desc Defines log methods of varying levels.
     */
    global.Log = {
        /**
         * @method Log#debug
         * @desc Logs a message, prefixed by [Debug].
         * @static
         * @param {String} msg The message string to log.
         * @param {Object} tokens Tokens for string replacement.
         * @return {String}
         */
        debug : loggingFunction("Debug"),

        /**
         * @method Log#info
         * @desc Logs a message, prefixed by [Info].
         * @static
         * @param {String} msg The message string to log.
         * @param {Object} tokens Tokens for string replacement.
         * @return {String}
         */
        info : loggingFunction("Info"),

        /**
         * @method Log#warn
         * @desc Logs a message, prefixed by [Warn].
         * @static
         * @param {String} msg The message string to log.
         * @param {Object} tokens Tokens for string replacement.
         * @return {String}
         */
        warn : loggingFunction("Warn"),

        /**
         * @method Log#error
         * @desc Logs a message, prefixed by [Error].
         * @static
         * @param {String} msg The message string to log.
         * @param {Object} tokens Tokens for string replacement.
         * @return {String}
         */
        error : loggingFunction("Error")
    };
})(this);