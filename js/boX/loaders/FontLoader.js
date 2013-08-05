/**
 * Author: thegoldenmule
 * Date: 3/24/13
 */

(function (global) {
    "use strict";

    var Signal = signals.Signal;

    var FontLoader = function () {
        var scope = this;

        scope.onLoaded = new Signal();
        scope.font = null;

        return scope;
    };

    FontLoader.prototype = {
        constructor: FontLoader,

        load: function(baseUrl, name) {
            var scope = this;

            if (baseUrl[baseUrl.length - 1] !== "/") {
                baseUrl += "/";
            }

            function callback() {
                if (null !== imageLoader.image &&
                    null !== xmlLoader.data) {
                    scope.font = new Font();
                    scope.font.initialize(new FontDefinition(xmlLoader.data, imageLoader.image));

                    scope.onLoaded.dispatch();
                }
            }

            var imageLoader = new ImageLoader();
            imageLoader.onLoaded.addOnce(callback);
            imageLoader.load(baseUrl + name + ".png");

            var xmlLoader = new XMLLoader();
            xmlLoader.onLoaded.addOnce(callback);
            xmlLoader.load(baseUrl + name + ".fnt");
        }
    };

    // export
    global.FontLoader = FontLoader;
})(this);