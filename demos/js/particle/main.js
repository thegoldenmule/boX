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

        var emitter = new ParticleEmitter([
            new particle.Position(0, 0, 2),
            new particle.Velocity(
                Math.PI / 4,
                3 * Math.PI / 4,
                0.1, 0.3)
        ]);
        emitter.emissionRate = 1;
        emitter.lifetime = 1000;
        emitter.transform.scale.x = emitter.transform.scale.y = 10;
            emitter.transform.position.x = emitter.transform.position.y = 100;
        scene.root.addChild(emitter);

        engine.onPreUpdate.add(emitter.update);

        return that;
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