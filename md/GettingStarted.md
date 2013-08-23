# Getting Started

This is a short tutorial on the basics of setting up an `Engine` and controlling an animated character via the keyboard. Essentially, this walks through the demo contained in `demos/index-wyvern.html` and `demos/js/wyvern/main.js`.

### The HTML

The only script you will need to include is either the full or the minified version of bo-X found in `build/js`. At the time of this writing, bo-X is at version 0.8:

    <script src="js/boX.0.8.js"></script>
	
Next, you need a canvas element:

	<body>
	<div>
		<canvas id=stage></canvas>
	</div>
	</body>

Finally, some method of calling your JS when the DOM is ready. Because I can, I've used jquery:

	<script>$(document).ready(main);</script>

### The Boilerplate

Just like all software ever, there's some boilerplate you will need to write in order to setup bo-X. This is explained in more detail in the `Engine` documentation, so I will only go over it briefly here:

	// retrieve the HTMLCanvasElement
	var canvas = document.getElementById('stage');
	
	// create a renderer
	var renderer = new WebGLRenderer(canvas);
	
	// create and initialize an Engine
	var engine = new Engine();
	engine.initialize(renderer);

At this point, the engine is ticking away, and rendering the scene.

### Setting Up a Container

The animated character we're going to use is a dragon-- well, to be perfectly precise, it's a Wyvern (these apparently have a dragon's head and a reptilian body). We are going to have both an animated shadow and an animated wyvern-- two layers so that the shadow can correctly depth sort with other objects, should we add them in the future.

So that we will have a single `DisplayObject` to control, we can put both the shadow and the image of the wyvern in a container `DisplayObject`:

    var wyvernParent = new DisplayObject();
    scene.root.addChild(wyvernParent);

### Loading Textures

For this demo, we need to load an image to use as a `Texture` for the `SpriteSheet`s. The assets can be found in `demos/images/wyvern`. bo-X comes with some basic loaders that can help make this a bit easier, so we'll use the `ImageLoader` class.

	// load spritesheets
	ImageLoader.loadResources(
		[
			"images/wyvern/wyvern_flap.png",
			"images/wyvern/wyvern_flap_shadow.png"
		],
		onResourcesLoaded);

In this case, we are loading the wyvern flapping animation and the corresponding shadow animation. Once both of those have been loaded, onResourcesLoaded is called.

### Creating the SpriteSheets

`onResourcesLoaded` will be called with a list of `ImageLoader` instances. This method is given below:
    
    // define variables
    var wyvern, wyvernShadow;
    
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
        
        // translate the shadow down so it looks right
        wyvernShadow.transform.position.x = -18;
    }

### Adding Animations

Now that we have a could of `SpriteSheet` instances to play with, we need to actually define how they will play out animations. As you can see in the source PNG, there are 8 directions for the flap animation. We will use cardinal directions (N, S, E, W) to refer to these animations.

    // add an animation for each direction
	["W", "NW", "N", "NE", "E", "SE", "S", "SW"].forEach(
		function(direction, index, array) {
            // add a new animation to the wyvern for this rotation
			wyvern.addAnimation(
				new Animation({
					name:               "flap_" + direction,

					startFrame:         8 * index,
					animationLength:    8,

					frameRate:          12
				}));
            
            // now add a corresponding animation for the shadow
			wyvernShadow.addAnimation(
				new Animation({
					name:               "flap_" + direction,

					startFrame:         8 * index,
					animationLength:    8,

					frameRate:          12
				}));
            
            // add to the parent in the order in which we want them to render
            wyvernParent.addChild(wyvernShadow);
            wyvernParent.addChild(wyvern);
		});

Now we have a flap animation for each rotation.

Once the `SpriteSheet` has been setup, they must be added to the `SpriteSheetScheduler` for updates:

    spriteSheetScheduler.addSpriteSheet(wyvern);
    spriteSheetScheduler.addSpriteSheet(wyvernShadow);

Additionally, they should be set to play an animation:

    // flap south
    wyvern.setCurrentAnimationByName("flap_S");
    wyvernShadow.setCurrentAnimationByName("flap_S");

### Run the App

Open `index.html` in your favorite browser and view the magnificience of a flapping wyvern.

### Keyboard Control

For a bit of extra fun, we can add keyboard input to control the wyvern's movement and animation. For this we need two more functions:

    var keysDown = {};
    function addInput() {
		$(document)
			.keydown(function(event) {
				if (13 === event.which) {
				   engine.paused = !engine.paused;
				}

				toggle(event.which, true);
			})
			.keyup(function(event) {
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

Here we've defined a function that simply adds flags to an object keyed by the keycode of keys that are currently down. In addition, we need to actually update the wyvern:

        engine.onPreUpdate.add(onPreUpdate);

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
        
        // change the animation based on which way wyvern faces
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
	}

And that's it! Now run the app agai and the arrows should move the wyvern about, changing the animation such that the wyvern faces the direction in which it is moving.

### Next Steps

Can I talk you into [contributing]?

How about submitting [bugs]?

No? Well then give the rest of the documentation a readthrough and make something awesome.