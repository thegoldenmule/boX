/**
 * Author: thegoldenmule
 * Date: 5/26/13
 */

(function (global) {
    "use strict";

    /**
     * @class SpriteSheetScheduler
     * @desc This object manages SpriteSheet updates.
     * @returns {SpriteSheetScheduler}
     * @author thegoldenmule
     * @constructor
     */
    global.SpriteSheetScheduler = function () {
        var scope = this;

        var _spriteSheets = new Set();

        /**
         * @function global.SpriteSheetScheduler#addSpriteSheet
         * @desc Adds a SpriteSheet to be managed. Updates are not guaranteed
         * to be ordered.
         * @param {SpriteSheet} spriteSheet The SpriteSheet instance to manage.
         */
        scope.addSpriteSheet = function(spriteSheet) {
            _spriteSheets.add(spriteSheet);
        };

        /**
         * @function global.SpriteSheetScheduler#removeSpriteSheet
         * @desc Removes a SpriteSheet from management.
         * @param {SpriteSheet} spriteSheet The SpriteSheet to remove.
         */
        scope.removeSpriteSheet = function(spriteSheet) {
            _spriteSheets.remove(spriteSheet);
        };

        /**
         * @function globalSpriteSheetScheduler#onPreUpdate
         * @desc Should be called as part of bo-X's preupdate cycle.
         * @param {Number} dt The amount of time that has passed since last
         * update.
         */
        scope.onPreUpdate = function(dt) {
            var elements = _spriteSheets.getElements();
            for (var i = 0, len = elements.length; i < len; i++) {
                elements[i].update(dt);
            }
        };

        return scope;
    };

    global.SpriteSheetScheduler.prototype = {
        constructor: global.SpriteSheetScheduler
    };
})(this);