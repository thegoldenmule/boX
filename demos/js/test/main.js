/**
 * Author: thegoldenmule
 */

var main = (function () {
    "use strict";

    var canvas,
        renderer,
        engine = new Engine(),
        scene = engine.getScene();

    return function () {
        var that = this;

        //////////////
        // boilerplate
        canvas = document.getElementById('stage');
        renderer = new WebGLRenderer(canvas);
        engine.initialize(renderer);

        setupDebugEnvironment(engine);
        // end boilerplate
        //////////////////

        loadImage();

        return that;
    };

    function loadImage() {
        // load an image
        var image = null;
        var loader = new ImageLoader();
        loader.onLoaded.addOnce(function() {
            // create an instance
            image = new StaticImage({
                mainTexture: new Texture(loader.image),
                alpha:0.5
            });

            // add
            scene.root.addChild(image);

            // create a bunch w/behaviors
            var sprites = [];
            for (var i = 0; i < 500; i++) {
                var sprite = scene.root.addChild(new StaticImage({
                    material:image.material,

                    x: Math.random() * renderer.getWidth(),
                    y: Math.random() * renderer.getHeight(),

                    width: 100,
                    height: 100,

                    anchor:{
                        x: Math.random() * 64,
                        y: Math.random() * 64
                    },

                    alpha: Math.random()
                }));

                // random direction + speed
                var dir = 2 * Math.random() * Math.PI;
                sprite.direction = vec2.set(vec2.create(), Math.cos(dir), Math.sin(dir));
                sprite.speed = Math.random() * 5;
                sprite.orientationSpeed = Math.random() / 100;

                sprites.push(sprite);
            }

            engine.onPreUpdate.add(function() {
                var rendererWidth = renderer.getWidth();
                var rendererHeight = renderer.getHeight();
                for (var j = 0, len = sprites.length; j < len; j++) {
                    var sprite = sprites[j];

                    var x = sprite.transform.position.x + sprite.speed * sprite.direction[0];
                    var y = sprite.transform.position.y + sprite.speed * sprite.direction[1];

                    if (x < 0) {
                        x += rendererWidth;
                    } else if (x > rendererWidth) {
                        x -= rendererWidth;
                    }

                    if (y < 0) {
                        y += rendererHeight;
                    } else if (y > rendererHeight) {
                        y -= rendererHeight;
                    }

                    sprite.transform.position.x = x;
                    sprite.transform.position.y = y;
                    sprite.transform.rotationInRadians += sprite.orientationSpeed;
                }
            });
        });
        loader.load("images/head.png");
    }

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