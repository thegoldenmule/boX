# Engine

The `Engine` object is the entry point into bo-X. It manages the game tick, renderer, and scene.

### Initialization

The bo-X engine currently requires initialization with a renderer before it can be used. The only renderer provided is the `WebGLRenderer`, which must be created with an `HTMLCanvasElement`. The following code shows an example of the basic boilerplate to get bo-X up and running.

	var canvas = document.getElementById('stage');
	var engine = new Engine();
	engine.initialize(new WebGLRenderer(canvas));

### Scene

Once an `Engine` has been initialized, `Engine::getScene()` returns the `Scene` object which manages the currently active `DisplayObject` hierarchy. The `Scene` object also contains a property `root' which is the root `DisplayObject`. All `DisplayObject` instances that you wish to be rendered must be part of the connected graph extending from `root`.

In the below example, we add a static image to the scene:

	var scene = engine.getScene();
	var staticImage = scene.root.addChild(new StaticImage({
		mainTexture: new Texture(myImage),
		alpha: 0.5
	}));

### Pre and Post Update

Rather than reinvent the wheel, bo-X uses the js-signals library for event propogation. The integration at this point is very light, but future work will make greater use of the library.

The `Engine` lifecycle involves three main phases:

* Preupdate
* Render
* Postupdate

These phases can likely be divided further into sub-phases (particularly the render phase); however, for the most part preupdate and postupdate should be the main hooks for all applications.

Continuing with our example, we can rotate the `DisplayObject` about its anchor point by manipulating its `Transform` on preupdate:

	engine.onPreUpdate.add(function(dt) {
		staticImage.transform.rotationInRadians += 0.01;
	});

Here we could have just as easily used `onPostUpdate`, but we would have had to wait until the next frame for the update to be rendered. `onPostUpdate` should most likely be used for input detection and related items as, in general, input should be applied after the scene as been rendererd, not before.

### More Documentation

Generated documentation describing properties and methods may be found at http://thegoldenmule.com/labs/boX/docs/global.Engine.html