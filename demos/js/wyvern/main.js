/**
 * Author: thegoldenmule
 * Date: 5/18/13
 * Time: 7:10 AM
 */

var main = (function () {
    "use strict";

    var canvas,
        renderer,
        engine = new Engine(),
        spriteSheetScheduler = new SpriteSheetScheduler(),

        wyvernParent,
        wyvern,
        wyvernShadow,
        keysDown = {};

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

        // load spritesheets
        ImageLoader.loadResources(
            [
                "images/wyvern/wyvern_flap.png",
                "images/wyvern/wyvern_flap_shadow.png"
            ],
            onResourcesLoaded);

        // add wyvern
        wyvernParent = new DisplayObject();
        engine.getScene().root.addChild(wyvernParent);

        // input listeners
        addInput();

        // update loop
        engine.onPreUpdate.add(onPreUpdate);
        engine.onPostUpdate.add(onPostUpdate);

        // plug in the scheduler
        engine.onPreUpdate.add(spriteSheetScheduler.onPreUpdate);

        return that;
    };

    function onPreUpdate(dt) {
        var speed = 3;
        // left
        if (keysDown[37]) {
            wyvernParent.transform.position.x -= speed;
        }
        // right
        if (keysDown[39]) {
            wyvernParent.transform.position.x += speed;
        }
        // up
        if (keysDown[38]) {
            wyvernParent.transform.position.y -= speed;
        }
        // down
        if (keysDown[40]) {
            wyvernParent.transform.position.y += speed;
        }

        if (!wyvern || !wyvernShadow) {
            return;
        }

        var animationName = "flap_S";
        if (keysDown[37] && keysDown[38]) {
            animationName = "flap_NW";
        } else if (keysDown[37] && keysDown[40]) {
            animationName = "flap_SW";
        } else if (keysDown[39] && keysDown[40]) {
            animationName = "flap_SE";
        } else if (keysDown[39] && keysDown[38]) {
            animationName = "flap_NE";
        } else if (keysDown[38]) {
            animationName = "flap_N";
        } else if (keysDown[40]) {
            animationName = "flap_S";
        } else if (keysDown[37]) {
            animationName = "flap_W";
        } else if (keysDown[39]) {
            animationName = "flap_E";
        }

        wyvern.setCurrentAnimationByName(animationName);
        wyvernShadow.setCurrentAnimationByName(animationName);

        /*
        else if (16 === keyCode) {
            shift = isDown;
        }
        else if (17 === keyCode) {
            ctrl = isDown;
        }
        else if (32 === keyCode) {
            space = isDown;
        }
        */
    }

    function onPostUpdate(dt) {

    }

    function addInput() {
        $(document).keydown(function(event) {
            if (13 === event.which) {
               engine.paused = !engine.paused;
            }

            toggle(event.which, true);
        }).keyup(function(event) {
            toggle(event.which, false);
        });

        function toggle(keyCode, isDown) {
            if (isDown) {
                keysDown[keyCode] = true;
            } else {
                delete keysDown[keyCode];
            }
        }
    }

    function onResourcesLoaded(loaders) {
        // create a new SpriteSheet
        wyvern = new SpriteSheet({
            mainTexture: new Texture(loaders[0].image),

            width: 256,
            height: 256
        });
        wyvernShadow = new SpriteSheet({
            mainTexture: new Texture(loaders[1].image),

            width: 256,
            height: 256
        });
        wyvernShadow.transform.position.x = -18;

        var blend = 0.05;
        wyvern.setBlendWeight(blend);
        wyvernShadow.setBlendWeight(blend);

        spriteSheetScheduler.addSpriteSheet(wyvern);
        spriteSheetScheduler.addSpriteSheet(wyvernShadow);

        // add an animation for each direction
        ["W", "NW", "N", "NE", "E", "SE", "S", "SW"].forEach(
            function(direction, index, array) {
                wyvern.addAnimation(
                    new Animation({
                        name:               "flap_" + direction,

                        startFrame:         8 * index,
                        animationLength:    8,

                        frameRate:          12
                    }));

                wyvernShadow.addAnimation(
                    new Animation({
                        name:               "flap_" + direction,

                        startFrame:         8 * index,
                        animationLength:    8,

                        frameRate:          12
                    }));
            });

        // flap south!
        wyvern.setCurrentAnimationByName("flap_S");
        wyvernShadow.setCurrentAnimationByName("flap_S");

        wyvernParent.addChild(wyvernShadow);
        wyvernParent.addChild(wyvern);
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