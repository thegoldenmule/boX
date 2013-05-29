/**
 * Author: thegoldenmule
 * Date: 5/26/13
 */

(function (global) {
    "use strict";

    var SpriteSheetScheduler = function () {
        var scope = this;

        var _spriteSheets = new Set();

        scope.addSpriteSheet = function(spriteSheet) {
            _spriteSheets.add(spriteSheet);
        };

        scope.removeSpriteSheet = function(spriteSheet) {
            _spriteSheets.remove(spriteSheet);
        };

        scope.onPreUpdate = function(dt) {
            var elements = _spriteSheets.getElements();
            for (var i = 0, len = elements.length; i < len; i++) {
                elements[i].update(dt);
            }
        };

        return scope;
    };

    SpriteSheetScheduler.prototype = {
        constructor: SpriteSheetScheduler
    };

    // export
    global.SpriteSheetScheduler = SpriteSheetScheduler;
})(this);