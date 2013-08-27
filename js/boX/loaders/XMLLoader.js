(function (global) {
    "use strict";

    var Signal = signals.Signal;

    global.XMLLoader = function () {
        var scope = this;

        scope.onLoaded = new Signal();
        scope.data = null;

        return scope;
    };

    global.XMLLoader.prototype = {
        constructor: global.XMLLoader,

        load: function(url) {
            var scope = this;
            var request = HTTPHelper.newRequest(url);
            request.onreadystatechange = function() {
                if (4 === request.readyState) {
                    scope.data = request.responseText;

                    scope.onLoaded.dispatch(scope);
                }
            };
            request.send(null);
        }
    };
})(this);