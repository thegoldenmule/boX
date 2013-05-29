function main() {
    "use strict";

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
    var system = new PointMassSystem({
        width: Math.floor(canvas.clientWidth / resolution) + 1,
        height: Math.floor((2 * canvas.clientHeight / 3) / resolution) + 1
    });
    system.constantForce.y = 98;

    // make the top static
    for (var i = 0, len = system.getWidth(); i < len; i++) {
        system.getPointMassAt(i, 0).invMass = 0;
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

    var keys = {};
    function isKeyDown(keyCode) {
        return undefined !== keys[keyCode];
    }

    function screenPointToSystemPoint(val) {
        return val / scale;
    }

    $(document)
        .keydown(function(event) {
            keys[event.which] = event;

            if (13 !== event.which) {
                return;
            }

            togglePaused();
        })
        .keyup(function(event) {
            delete keys[event.which];
        });

    $(document).mousedown(function(event) {
        if (isKeyDown(16)) {
            Log.debug("STICK");
            pointMass = system.getPointMassNearest(
                screenPointToSystemPoint(event.pageX),
                screenPointToSystemPoint(event.pageY));
            pointMass.invMass = 0;
            pointMass.px = pointMass.cx;
            pointMass.py = pointMass.cy;

            pointMass = null;
        }
        else {
            startDrag(event);
        }
    });
    $(document).mouseup(stopDrag);

    var originalPosition = {
        x:0, y:0
    };
    var pointMass = null;
    function startDrag(event) {
        // find the nearest point-mass
        pointMass = system.getPointMassNearest(
            screenPointToSystemPoint(event.pageX),
            screenPointToSystemPoint(event.pageY));

        pointMass.invMass = 0;

        $(document).mousemove(updateDrag);
    }

    function updateDrag(event) {
        pointMass.cx = pointMass.px = event.pageX / scale;
        pointMass.cy = pointMass.py = event.pageY / scale;
    }

    function stopDrag(event) {
        if (pointMass) {
            $(document).unbind("mousemove", updateDrag);

            pointMass.invMass = 1;
        }
    }

    function togglePaused() {
        engine.paused = !engine.paused;

        if (engine.paused) {
            Log.debug("Paused.");
        } else {
            Log.debug("Un-paused.");
        }
    }
}

function setupDebugEnvironment(engine) {
    "use strict";

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