/**
 * User: ti83
 * Date: 3/10/13
 */

var Signal = signals.Signal;

var ImageLoader = (function () {
    "use strict";

    return function () {
        var that = this;

        that.image = null;
        that.onLoaded = new Signal();

        return that;
    };
})();

ImageLoader.prototype = {
    constructor: ImageLoader,
    load: function(url, imageElement) {
        var that = this;

        // TODO: consider pooling
        if (undefined === imageElement) {
            imageElement = new Image();
        }

        imageElement.onload = function() {
            that.image = imageElement;
            that.onLoaded.dispatch();
        };
        imageElement.crossOrigin = "localhost";
        imageElement.src = url;
    }
};

ImageLoader.loadResources = function(urls, callback) {
    "use strict";

    var loaded = 0;
    function onLoaded(loader) {
        if (++loaded === urls.length) {
            callback(loaders);
        }
    }

    var loaders = urls.map(function(url) {
        var loader = new ImageLoader();
        loader.onLoaded.add(onLoaded);
        loader.load(url);
        return loader;
    });
};