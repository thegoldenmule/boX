## TwoDee - WebGL-Powered 2D Engine
TwoDee is a flexible, high-performance 2D rendering engine built on WebGL.

## Features
The aim of TwoDee is to provide a clean API for users that don't want to know WebGL, and an extensible interface for all
those that do.

The basic object for rendering in TwoDee is called the DisplayObject. This object contains a Quad, Transform, and
Material. The DisplayObject also acts as the entry point into the scene graph. Here's a basic outline:

    DisplayObject.js
        visible : Boolean

        alpha : float

        transform : Transform
            position : {float, float}
            scale : float
            rotationInRadians : float

        material : Material
            mainTexture : Texture
            secondaryTexture : Texture
            shader : Shader

        quad : Quad
            vertices : Float32Array
            uvs : Float32Array
            colors : Float32Array

        children : Array of DisplayObject

        parent : DisplayObject

TwoDee contains more advanced features as well, like dynamic batching and culling.

## Usage
Here's an example of getting a image on-screen with keyboard movement, rotation (and tinting!).

         // initialize engine
        var engine = new Engine();
        engine.initialize(new WebGLRenderer(document.getElementById("stage")));

        // load an image
        var spaceShip = null;
        var loader = new ImageLoader();
        loader.onLoaded.addOnce(function() {
            // create a new static image
            spaceShip = engine.scene.root.addChild(
                new StaticImage({
                    texture: new Texture(loader.image)
                }));
        });
        loader.load("images/ufo_small.png");

        // movement
        var left, right, up, down, shift;
        $(document).keydown(function(event) {
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
        }

        engine.onPreUpdate.add(function(dt) {
            if (shift) {
                if (left) {
                    spaceShip.transform.rotationInRadians -= 0.04;
                }
                if (right) {
                    spaceShip.transform.rotationInRadians += 0.04;
                }
                // tint!
                if (up) {
                    spaceShip.material.tint.r += 0.01;
                }
                if (down) {
                    spaceShip.material.tint.r -= 0.01;
                    if (spaceShip.material.tint.r < 0) {
                        spaceShip.material.tint.r = 0;
                    }
                }
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

## This reminds me of something...
Is it Unity? Flash? Starling? Cocos-2d? THREE.js? Yup. There's a little bit of everything in TwoDee, and hopefully some
stuff you've never seen before. The easy of Unity without the burden of a black-boxed renderer or scene graph. The
familiar API of Flash or Starling without the stupidity (and with loads more performance). The mechanical preciseness of
 Cocos2d without the unbe-bloody-lievably horrible usability. To top it all off, that certain JavaScript grace and
 sophistication of THREE.js.

## Motivation
When I started writing this, I didn't see any existing WebGL powered 2D engines, so I decided to make one.