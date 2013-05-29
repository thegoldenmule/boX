function main() {
    "use strict";

    Log.debug("test()");

    window.isTwoDeeDebug = false;

    // stats
    var stats = new Stats();
    stats.setMode(0);
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.left = '0px';
    stats.domElement.style.top = '0px';
    document.body.appendChild(stats.domElement);

    // initialize engine
    var renderer = new WebGLRenderer(document.getElementById('stage'));
    var engine = new Engine();
    engine.getScene().autoBatch = true;
    engine.initialize(renderer);

    // update stats
    engine.onPreUpdate.add(stats.begin);
    engine.onPostUpdate.add(stats.end);

    engine.getScene().root.addChild(new Shape({
        width:100,
        height:100,
        tint:new Color(0, 0, 1)
    }));

    // load an image
    var spaceShip = null;
    var loader = new ImageLoader();
    loader.onLoaded.addOnce(function() {
        // create an instance
        spaceShip = new StaticImage({
            mainTexture: new Texture(loader.image),
            alpha:0.5
        });

        // create a bunch of ships flying around
        createLoadsOfShips(300, spaceShip.material);

        // add
        engine.getScene().root.addChild(spaceShip);

        // create some children
        spaceShip.addChild(new Shape({
            x: 44,
            y: 44,
            width: 20,
            height: 20,
            tint: new Color(0, 1, 0),
            alpha: 1
        }));

        spaceShip.addChild(new Shape({
            width: 20,
            height: 20,
            tint: new Color(1, 0, 0)
        }));
    });
    loader.load("images/head.png");

    function createLoadsOfShips(num, material) {
        // create a bunch w/behaviors
        var ships = [];
        var cutoff = Math.random();
        for (var i = 0; i < num; i++) {
            var ship = engine.getScene().root.addChild(new StaticImage({
                material:material,

                x: Math.random() * renderer.getWidth(),
                y: Math.random() * renderer.getHeight(),

                width: 100,
                height: 100,

                anchor:{
                    x: Math.random() * 64,
                    y: Math.random() * 64
                },

                alpha: Math.random()// > cutoff ? Math.random() : 1
            }));

            // random direction + speed
            var dir = 2 * Math.random() * Math.PI;
            ship.direction = vec2.set(vec2.create(), Math.cos(dir), Math.sin(dir));
            ship.speed = Math.random() * 5;
            ship.orientationSpeed = Math.random() / 100;

            ships.push(ship);
        }

        engine.onPreUpdate.add(function() {
            var rendererWidth = renderer.getWidth();
            var rendererHeight = renderer.getHeight();
            for (var j = 0, jlen = ships.length; j < jlen; j++) {
                var ship = ships[j];

                var x = ship.transform.position.x + ship.speed * ship.direction[0];
                var y = ship.transform.position.y + ship.speed * ship.direction[1];

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

                ship.transform.position.x = x;
                ship.transform.position.y = y;
                ship.transform.rotationInRadians += ship.orientationSpeed;
            }
        });
    }

    // shape
    var shape = engine.getScene().root.addChild(new Shape(100, 100));
    shape.tint.r = shape.tint.b = 0;

    // debugging
    var left, right, up, down, shift, ctrl, space;
    $(document).keydown(function(event) {
        if (13 === event.which) {
           engine.paused = !engine.paused;
        }

        toggle(event.which, true);
    }).keyup(function(event) {
        toggle(event.which, false);
    });

    function toggle(keyCode, isDown) {
        if (null === spaceShip) {
            return;
        }

        if (37 === keyCode) {
            left = isDown;
        }
        else if (39 === keyCode) {
            right = isDown;
        }
        else if (38 === keyCode) {
            up = isDown;
        }
        else if (40 === keyCode) {
            down = isDown;
        }
        else if (16 === keyCode) {
            shift = isDown;
        }
        else if (17 === keyCode) {
            ctrl = isDown;
        }
        else if (32 === keyCode) {
            space = isDown;
        }
    }

    engine.onPreUpdate.add(function(dt) {
        if (shift) {
            if (left) {
                spaceShip.transform.rotationInRadians -= 0.04;
            }
            if (right) {
                spaceShip.transform.rotationInRadians += 0.04;
            }
            if (up) {
                spaceShip.transform.scale.x += 0.01;
                spaceShip.transform.scale.y += 0.01;
            }
            if (down) {
                spaceShip.transform.scale.x -= 0.01;
                spaceShip.transform.scale.y -= 0.01;
            }
        } else if (ctrl) {
            if (left) {
                spaceShip.tint.r += 0.01;
            }
            if (right) {
                spaceShip.tint.r -= 0.01;
            }

            spaceShip.tint.r = TwoDeeMath.clamp(spaceShip.tint.r, 0, 1);

            if (up) {
                spaceShip.alpha += 0.01;
            }
            if (down) {
                spaceShip.alpha -= 0.01;
            }

            spaceShip.alpha = TwoDeeMath.clamp(spaceShip.alpha, 0, 1);
        } else {
            if (left) {
                spaceShip.transform.position.x -= 2;
            }
            if (right) {
                spaceShip.transform.position.x += 2;
            }
            if (up) {
                spaceShip.transform.position.y -= 2;
            }
            if (down) {
                spaceShip.transform.position.y += 2;
            }
        }
    });
}