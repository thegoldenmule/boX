/**
 * Author: thegoldenmule
 */
var main = (function() {
    "use strict";

    var canvas,
        renderer,
        engine = new Engine(),
        scene = engine.getScene();

    return function() {
        var that = this;

        //////////////
        // boilerplate
        canvas = document.getElementById('stage');
        renderer = new WebGLRenderer(canvas);
        engine.initialize(renderer);

        setupDebugEnvironment(engine);
        // end boilerplate
        //////////////////

        
    };

    function setupDebugEnvironment(engine) {
        window.isTwoDeeDebug = true;

        // stats
        var stats = new Stats();
        stats.setMode(0);
        stats.domElement.style.position = 'absolute';
        stats.domElement.style.left = '0px';
        stats.domElement.style.top = '0px';
        document.body.appendChild(stats.domElement);

        // update stats
        engine.onPreUpdate.add(stats.begin);
        engine.onPostUpdate.add(stats.end);

        $(document).keydown(function(event) {
            if (13 === event.which) {
                engine.paused = !engine.paused;
            }
        });
    }
})();