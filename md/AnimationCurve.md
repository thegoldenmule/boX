# AnimationCurve
You will find that bo-X contains no direct support for a tweening library. Instead, the `AnimationCurve` class controls all animated properties. `ParticleEmitters`, `SpriteSheets`-- everything is built specifically with curves in mind rather than tweening engines.

### What Are They?
An `AnimationCurve` defines a smooth function through a set of points. Each point is given by `(x, t)` such that `x` and `t` are in the unit interval, `\[0, 1\]`. When combined with the included interpolation functions, an `AnimationCurve` will also always return a value in `\[0, 1\]`.

### Why Shouldn't I Use a Tweening Engine?
Tweening engines are great and their syntax is often great fun, but they create as many problems as they solve. Defining animations via a curve is not only more intuitive, it is easier and often more flexible.

A tweening engine is a tool for an engineer, yet it is not engineers that should be creating animations. Designers and artists are not interested in defining tween logic with little bits of code, they are interested in intuitive visual methods.

It's possible to write an intuitive visual editor for tweenjs or related libraries, but in the end they would closely resemble moving points about on a single `AnimationCurve`.

In addition, it's not clear, without a decent amount of thought, how you would serialize a tween definition in a conventional tweening engine. With `AnimationCurve` it is immediately straightforward.

Finally, abstracting away a tweening engine is an awful bit of work. For instance, the particle system leverages curves to define how to animate properties like rotation of alpha. How exactly would the particle engine plugin to a tweening engine? The problem only grows when you try to abstract further to allow anyone to use any tweening engine. Again, not impossible, but why?

### I'm Convinced, Where Should I Start?

A good place to look for examples is in `DefaultParticlePlugins.js`. Here you will see numerous uses of AnimationCurve to define property animators for scale, alpha and rotation. In fact, the `ParticlePropertyAnimator` can be used to create elaborate animations over any property of a particle. In `demos/js/particle/main.ja` you can see some of those plugins being used.

    // create a curve for scale from 0.2 -> 1
	var scaleCurve = new AnimationCurve();
	scaleCurve.getKeys()[0].value = 0.2;

	// create a curve for alpha, but reverse it (from 1 -> 0)
	var alphaCurve = new AnimationCurve();
	alphaCurve.getKeys()[0].value = 1;
	alphaCurve.getKeys()[1].value = 0;

    // create the emitter
	var emitter = new ParticleEmitter([
		new particle.Position(0, 0, 2),
		new particle.Rotation(),
		new particle.Velocity(
			Math.PI / 4,
			3 * Math.PI / 4,
			0.3, 0.7),
		new particle.Acceleration(0, -0.0098),
		new particle.ScaleAnimator(scaleCurve, 20),
		new particle.AlphaAnimator(alphaCurve),
		new particle.RotationAnimator(new AnimationCurve(), 2)
	]);
	emitter.emissionRate = 2;
	emitter.lifetime = 2000;
	emitter.transform.position.x = emitter.transform.position.y = 300;
	emitter.tint = new Color(1, 0, 0);
	scene.root.addChild(emitter);

By default, an `AnimationCurve` instance has two keys: `(0, 0)` and `(1, 1)` and a `Quadratic.InOut` ease function that interpolates between them. To govern scale, we use a curve from 0.2 -> 1, but the ScaleAnimator object also takes a scalar which multiplies the output of the curve. In this case we pass in `20` so we get a nice smooth scale from 4 to 20.

The curve governing the alpha of particles we've switched: so instead of moving from 0 -> 1, the alpha moves smoothly from 1 -> 0, fading out the particles.