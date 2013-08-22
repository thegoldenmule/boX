# DisplayObject

A `DisplayObject` is the base object for any visual object in the scene. Its main components are a `Geometry` implementation, a `Transform`, and a `Material`, which may be shared between multiple `DisplayObject`s. The `DisplayObject` and scene graph as a whole are meant only for visual objects that are to be renderered.

### The Scene Graph

The scene graph is described by parent and child relationships between `DisplayObjects`, beginning with the root `DisplayObject` on `Scene`. A `DisplayObject` represents a single graph node and may have a single parent and many children. In this way, the scene graph can be traversed by walking lists of successive children. The scene graph may also be queried by the find method on `SceneManager`.

### Constructor

The`DisplayObject` constructor allows for many of it's properties to be passed in via an object. These properties include:

    * visible       :   Boolean
	* alpha			:	Number in [0, 1]
	* tint			:	Color
	* x				:	Number
	* y				:	Number
	* material		:	Material
	* mainTexture	:	Texture
	* secTexture	:	Texture
	* width			:	Number
	* height		:	Number
	* name			:	string
	* anchorX		:	Number
	* anchorY		:	Number

With this, you can construct and initialize a `DisplayObject` very quickly.

	var background = new Shape({
		x		: 0,
		y		: 0,
		width	: sceneWidth,
		height	: sceneWidth,
		name	: "Background",
		tint	: new Color()
	});

### Transform

The `Transform` object, as you can read in the generated documentation, provides access to position, rotation, scale, and the anchor point of a DisplayObject. All of these concepts should be self-explanatory except for, perhaps, the anchor point.

`Transform::anchorPoint` is an x, y position in a `DisplayObject`s local space, about which all transforms are applied. That is, positioning of the `DisplayObject` positions the anchor point of the `DisplayObject`, and rotations rotate about this point.

By default, the anchor point is set to the top left corner of a `DisplayObject`. Consider the following code that centers the anchor point. Future rotations will rotate about the center of the `DisplayObject`:

	var square = new Shape({
		width	: 50,
		height	: 50,
		name	: "Square",
		tint	: new Color(0, 1, 0)
	});
	square.transform.anchorPoint.x = square.transform.anchorPoint.y = 25;

### DisplayObject Derivations

bo-X includes several derivations of `DisplayObject` including:

1. [`Shape`](http://thegoldenmule.com/labs/boX/docs/global.Shape)
2. `SpriteSheet`		
3. [`StaticImage`](http://thegoldenmule.com/labs/boX/docs/global.StaticImage)

`Shape`, more accurately named Rectangle at the moment, is a quad of solid color. Future work is planned to implement vector drawing via the shape class.

`StaticImage` displays a single image from a material. More documentation can be found here (TODO). Future work is planned to allow `StaticImage` to use atlases more intelligently.

`SpriteSheet`, as you might imagine, can play through animations on a single quad. More in-depth documentation on usage can be found here (TODO).

### Custom DisplayObject Derivations

In `demos/js/fabricsim/Grid.js` there is a good example of a custom `DisplayObject` derivation. This file defines a custom geometry, `GridGeometry`, which implements the geometry for a point mass system (demo here (TODO)).

To work in the context of bo-X, custom Geometry must implement the following methods:

	void clearBuffers()
	void prepareBuffers(WebGLContext context)
	void pushBuffers(WebGLContext context, Shader shader)
	void draw(WebGLContext context)

The `GridGeometry` object implements its own buffers and draws using the `LINES` primitive, rather than `TRIANGLE_STRIP`, which is the default for `DisplayObject` geometries.

### More Documentation

Generated documentation describing properties and methods may be found at http://thegoldenmule.com/labs/boX/docs/global.DisplayObject.html