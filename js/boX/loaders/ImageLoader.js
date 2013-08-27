(function (global) {
    "use strict";

    var Signal = signals.Signal;

    /**
     * @class ImageLoader
     * @author thegoldenmule
     * @desc This object provides an interface for loading textures into Image
     * elements.
     * @returns {ImageLoader}
     * @constructor
     */
    global.ImageLoader = function () {
        var scope = this;

        /**
         * @member global.ImageLoader#image
         * @desc The Image element that is being loaded.
         * @type {Image}
         */
        scope.image = null;

        /**
         * @member global.ImageLoader#onLoaded
         * @desc This signal is dispatched when the Image has been loaded.
         * @type {Signal}
         */
        scope.onLoaded = new Signal();

        return scope;
    };

    global.ImageLoader.prototype = {
        constructor: global.ImageLoader,

        /**
         * @function global.ImageLoader#load
         * @desc Loads a url into an Image element.
         * @param {String} url The URL to load.
         * @param {Image} imageElement An optional Image instance to load through.
         */
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

    /**
     * @function global.ImageLoader#loadResources
     * @static
     * @desc Loads a list of URLs and calls the associated callback.
     * @param {String} urls The List of URLs to load.
     * @param {Function} callback A Function to call once the images have been
     * loaded.
     */
    global.ImageLoader.loadResources = function(urls, callback) {
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
})(this);