# Roadmap

### 0.6.1
* Masks
* Add pause + resume functionality.
* Scalar multiplier for simulation time.

### 0.6.2
* `Shader` improvements. Many of the shaders can be combined, this will greatly improve performance.
* `ParticleEmitter` v.2.
* Better support for atlasing `StaticImage`.

### 0.6.3
* Bounding boxes.
* Click detection.
* Better lost context handling.
* `SpriteSheet` v.2. This includes a better interface for animations and rotations, multiple textures, etc.

### 0.6.4
* Dynamic batching support. This was a part of 0.5.x, and was removed for implementation improvements.

### 0.7
* TexturePacker support for `SpriteSheet` and `StaticImage`.
* `FileSystem` support.
* Distortion and other fx shaders.

### Cool Ideas

* `SceneGraphIterator` (generator function)
* boQL for property manipulation, i.e. new PropertyAnimator("transform..x", new AnimationCurve())
* Compose `AnimationCurve`s into an approximation of a Taylor series. In this way we could approximate virtually any function.