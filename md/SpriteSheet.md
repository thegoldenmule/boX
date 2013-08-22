# SpriteSheet

A `SpriteSheet` plays through `Animation`s on an atlas, using an `AnimationCurve` to blend between frames.

### Defining Animations

A demo leveraging SpriteSheets has been provided in the demos folder. In `demos\js\wyvern\main.js`, we are creating a SpriteSheet, then defining several animations over an atlas.

    // create SpriteSheet
	var wyvern = new SpriteSheet({
            mainTexture: new Texture(loaders[0].image),

            width: 256,
            height: 256
        });
	
	// add to the scheduler
	spriteSheetScheduler.addSpriteSheet(wyvern);
	
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
		});

Some code has been elided for clarity.

The `Animation` being played is then set based on keypress with:

	wyvern.setCurrentAnimationByName("flap_" + direction);

### SpriteSheetScheduler

The scene graph does not propogate an update tick. Because of this, `SpriteSheet`s need some way to update. While this may be done manually, `SpriteSheetScheduler` is provided for ease of use. It currently resides on the `Engine` object and `SpriteSheet`s must be added to the scheduler for updates.

### Frame Blending

bo-X `SpriteSheet`s support the use of a curve to alpha blend between frames. An `AnimationCurve` defines a continuous function between two or more control points. Using this curve, an animation may look to have more frames than it really does. What's more, motion blur becomes trivial.

### More Documentation

Generated documentation describing properties and methods may be found at http://thegoldenmule.com/labs/boX/docs/global.SpriteSheet.html