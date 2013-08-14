/**
 * Author: thegoldenmule
 */
var main = (function() {
    "use strict";

    var canvas,
        renderer,
        engine = new Engine(),
        scene = engine.getScene();

    var runTests = (function() {
        var index = 0;

        return function(suite) {
            if (suite.tests.length > index) {
                suite.tests[index++]();

                setTimeout(runTests, 2000, suite);
            }
        };
    })();

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
        var displayObjects = [];
        [
            new Color(1, 0, 0),
            new Color(0.75, 0.25, 0),
            new Color(0.5, 0.5, 0),
            new Color(0.25, 0.75, 0.5),
            new Color(0, 1, 0),
            new Color(0, 0.75, 0.25),
            new Color(0, 0.5, 0.5),
            new Color(0, 0.25, 0.75),
            new Color(0, 0, 1),
            new Color(0, 0, 0)
        ].forEach(function(item, index, array) {
            var shape = new Shape({
                width: Math.pow(2, array.length - index),
                height: Math.pow(2, array.length - index),
                tint: item
            });

            engine.getScene().root.addChild(shape);

            displayObjects.push(shape);
        });

        runTests(new TestSuite(displayObjects));
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

var TestSuite = (function() {
    "use strict";

    return function(displayObjects) {
        this.tests = [
            parentTest,
            colorTest,
            colorRootTest,
            anchorPointTest,
            anchorPointRotationTest
        ];

        function parentTest() {
            for (var i = 1, len = displayObjects.length; i < len; i++) {
                displayObjects[i - 1].addChild(displayObjects[i]);

                displayObjects[i].transform.position.x = displayObjects[i - 1].getWidth() / 2 - displayObjects[i].getWidth() / 2;
                displayObjects[i].transform.position.y = displayObjects[i - 1].getHeight() / 2 - displayObjects[i].getHeight() / 2;
                displayObjects[i - 1].transform.rotationInRadians = Math.PI / 12;
            }
        }

        function colorTest() {
            displayObjects[0].transform.rotationInRadians = 0;
            for (var i = 1, len = displayObjects.length; i < len; i++) {
                displayObjects[0].addChild(displayObjects[i]);

                displayObjects[i].transform.position.x = displayObjects[i - 1].getWidth() / 2 - displayObjects[i].getWidth() / 2;
                displayObjects[i].transform.position.y = displayObjects[i - 1].getHeight() / 2 - displayObjects[i].getHeight() / 2;
                displayObjects[i].transform.rotationInRadians = 0;
            }
        }

        function colorRootTest() {
            for (var i = 1, len = displayObjects.length; i < len; i++) {
                displayObjects[0].getParent().addChild(displayObjects[i]);

                displayObjects[i].transform.position.x = displayObjects[i - 1].getWidth() / 2 - displayObjects[i].getWidth() / 2;
                displayObjects[i].transform.position.y = displayObjects[i - 1].getHeight() / 2 - displayObjects[i].getHeight() / 2;
                displayObjects[i].transform.rotationInRadians = 0;
            }
        }

        function anchorPointTest() {
            for (var i = 1, len = displayObjects.length; i < len; i++) {
                displayObjects[0].getParent().addChild(displayObjects[i]);

                displayObjects[i].transform.anchorPoint.x =  displayObjects[i].getWidth() / 2;
                displayObjects[i].transform.anchorPoint.y =  displayObjects[i].getHeight() / 2;

                displayObjects[i].transform.position.x = displayObjects[0].getWidth() / 2;
                displayObjects[i].transform.position.y = displayObjects[0].getHeight() / 2;
                displayObjects[i].transform.rotationInRadians = 0;
            }
        }

        function anchorPointRotationTest() {
            for (var i = 1, len = displayObjects.length; i < len; i++) {
                displayObjects[0].getParent().addChild(displayObjects[i]);

                displayObjects[i].transform.anchorPoint.x =  displayObjects[i].getWidth() / 2;
                displayObjects[i].transform.anchorPoint.y =  displayObjects[i].getHeight() / 2;

                displayObjects[i].transform.position.x = displayObjects[0].getWidth() / 2;
                displayObjects[i].transform.position.y = displayObjects[0].getHeight() / 2;
                displayObjects[i].transform.rotationInRadians = (2 * Math.PI / len) * i;
            }
        }
    };
})();