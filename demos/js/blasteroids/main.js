/**
 * Author: thegoldenmule
 * Date: 5/17/13
 * Time: 6:21 PM
 */

var main = (function() {
    "use strict";

    return function() {
        Log.debug("main()");

        // initialize engine
        var canvas = document.getElementById('stage');
        var renderer = new WebGLRenderer(canvas);
        var engine = new Engine();
        engine.initialize(renderer);

        // comment out for better performance
        setupDebugEnvironment(engine);

        // add background
        var bg = new Shape({
            tint: new Color(0.2, 0.2, 0.2),
            height: canvas.clientHeight,
            width: canvas.clientWidth
        });
        engine.getScene().root.addChild(bg);

        // start the model
        var resolution = 20;
        var ratio = 2 / 3;
        var system = new PointMassSystem({
            width: Math.floor(ratio * canvas.clientWidth / resolution) + 1,
            height: Math.floor(ratio * canvas.clientHeight / resolution) + 1
        });

        // space the boundaries!
        var widthSpacing = (canvas.clientWidth / system.getWidth() + 1) / resolution;
        var heightSpacing = (canvas.clientHeight / system.getHeight() + 1) / resolution;
        for (var i = 0, ilen = system.getWidth(); i < ilen; i++) {
            for (var j = 0, jlen = system.getHeight(); j < jlen; j++) {
                if (0 === i || 0 === j || ilen - 1 === i || jlen - 1 === j) {
                    system.getPointMassAt(i, j).invMass = 0;
                }

                system.getPointMassAt(i, j).setPosition(
                    i * widthSpacing,
                    j * heightSpacing);
            }
        }

        // make a renderer
        var scale = resolution;
        var grid = new Grid(system, scale);
        grid.tint = new Color(0.5, 0.5, 0.5);
        engine.getScene().root.addChild(grid);

        // solve on preupdate
        var timeScale = 1;
        engine.onPreUpdate.add(function() {
            system.solve(timeScale / 60);
            grid.geometry.rebuild();
        });

        function screenPointToSystemPoint(val) {
            return val / scale;
        }

        $(document)
                .click(function(event) {
                    // get points adjacent to click
                    var x = screenPointToSystemPoint(event.pageX);
                    var y = screenPointToSystemPoint(event.pageY);

                    var multiplier = 1000;
                    var points = [
                        system.getPointMassAt(Math.floor(x), Math.floor(y)),
                        system.getPointMassAt(Math.floor(x), Math.ceil(y)),
                        system.getPointMassAt(Math.ceil(x), Math.floor(y)),
                        system.getPointMassAt(Math.ceil(x), Math.ceil(y))];
                    for (i = 0, ilen = points.length; i < ilen; i++) {
                        var pointMass = points[i];

                        // calculate explosion direction
                        var dx = pointMass.cx - x;
                        var dy = pointMass.cy - y;

                        pointMass.forces.x += dx * multiplier;
                        pointMass.forces.y += dy * multiplier;
                    }});
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
    }
})();