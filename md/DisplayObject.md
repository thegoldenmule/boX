# DisplayObject

A `DisplayObject` is the base object for any visual object in the scene. Its main components are a `Geometry` implementation, a `Transform`, and a `Material`, which may be shared between multiple `DisplayObject`s. The `DisplayObject` and scene graph as a whole are meant only for visual objects that are to be renderered.

### The Scene Graph

The scene graph is described by parent and child relationships between `DisplayObjects`. A `DisplayObject` represents a single graph node and may have a single parent and many children. In this way, the scene graph can be traversed by walking lists of successive children. The scene graph may also be queried by the find method on `SceneManager`.

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