(function(global) {
    "use strict";

    if (!global.particle) {
        global.particle = {};
    }

    /**
     * Position plugin.
     *
     * Give it x, y, and a radius, and it will provide a random
     * position within the bounding circle. An option innerRadius parameter may be
     * used that will omit creating particles within the innerRadius.
     */
    global.particle.Position = function(xval, yval, radius, innerRadius) {
        this.x = undefined === xval ? 0 : xval;
        this.y = undefined === yval ? 0 : yval;
        this.innerRadius = undefined === innerRadius ? 0 : innerRadius;

        if (undefined === radius) {
            radius = 10;
        }

        if (radius <= this.innerRadius) {
            radius = this.innerRadius + 1;
        }

        this.radius = radius;
    };

    global.particle.Position.prototype = {
        constructor: global.particle.Position,

        initialize: function(emitter, particle) {
            particle.transform.position.x = this.x + (Math.random() - 0.5) * Math.random() * (this.radius - this.innerRadius);
            particle.transform.position.y = this.y + (Math.random() - 0.5) * Math.random() * (this.radius - this.innerRadius);

            if (0 !== this.innerRadius) {
                var randomAngle = Math.random() * 2 * Math.PI;
                particle.transform.position.x += this.innerRadius * Math.sin(randomAngle);
                particle.transform.position.y += this.innerRadius * Math.cos(randomAngle);
            }
        }
    };

    /**
     * Rotation plugin. Chooses a random rotation for each particle between min and max.
     *
     * @param min
     * @param max
     *
     * @constructor
     */
    global.particle.Rotation = function(min, max) {
        this.min = undefined === min ? 0 : min;
        this.max = undefined === max ? Math.PI * 2 : max;
    };

    global.particle.Rotation.prototype = {
        constructor: global.particle.Rotation,

        initialize: function(emitter, particle) {
            particle.transform.rotationInRadians = this.min + Math.random() * (this.max - this.min);
        }
    };

    /**
     * Velocity plugin.
     *
     * Give it an angle range and a magnitude range and it will
     * generate velocities within the ranges.
     */
    global.particle.Velocity = function(minAngle, maxAngle, minMagnitude, maxMagnitude) {
        this.minAngle = minAngle;
        this.maxAngle = maxAngle;
        this.minMagnitude = minMagnitude;
        this.maxMagnitude = maxMagnitude;
    };

    global.particle.Velocity.prototype = {
        constructor: global.particle.Velocity,

        initialize: function(emitter, particle) {
            // pick a random angle
            var angle = (this.minAngle + Math.random() * (this.maxAngle - this.minAngle));
            var magnitude = (this.minMagnitude + Math.random() * (this.maxMagnitude - this.minMagnitude));

            particle.vx = -Math.cos(angle) * magnitude;
            particle.vy = -Math.sin(angle) * magnitude;
        }
    };

    /**
     * Acceleration plugin.
     *
     * Generates constant acceleration within the range
     * provided.
     */
    global.particle.Acceleration = function(xval, yval) {
        this.x = xval;
        this.y = yval;
    };

    global.particle.Acceleration.prototype = {
        constructor: global.particle.Acceleration,

        initialize: function(emitter, particle) {
            particle.ax = this.x;
            particle.ay = this.y;
        }
    };

    /**
     * Lifetime plugin.
     *
     * Generates a particle lifetime within a range.
     */
    global.particle.Lifetime = function(min, max) {
        this.min = min;
        this.max = max;
    };

    global.particle.Lifetime.prototype = {
        constructor: global.particle.Lifetime,

        initialize: function(emitter, particle) {
            particle.lifetime = (this.min + Math.random() * (this.max - this.min));
        }
    };

    /**
     * Attractor plugin.
     *
     * This attracts (or repels) particles. This only approximates gravitation.
     *
     */
    global.particle.Attractor = function(x, y, amount) {
        this.x = x;
        this.y = y;
        this.amount = amount;
    };

    global.particle.Attractor.prototype = {
        constructor: global.particle.Attractor,

        update: function(emitter, particle) {
            particle.ax = this.x - particle.transform.position.x / this.amount;
            particle.ay = this.y - particle.transform.position.y / this.amount;
        }
    };

    /**
     * Animates a property on Particle.
     *
     * @param propName
     * @param curve
     * @param scale
     * @constructor
     */
    global.particle.ParticlePropertyAnimator = function(propName, curve, scale) {
        this.propName = propName;
        this.curve = curve;
        this.scale = scale;
    };

    global.particle.ParticlePropertyAnimator.prototype = {
        constructor: global.particle.ParticlePropertyAnimator,

        update: function(emitter, particle) {
            particle[this.propName] = this.scale = this.curve.evaluate(particle.elapsedTime / particle.lifetime);
        }
    };

    /**
     * Animates a Particle's scale.
     *
     * @param curve The AnimationCurve instance.
     * @param scale A scalar to multiply the AnimationCurve by.
     *
     * @constructor
     */
    global.particle.ScaleAnimator = function(curve, scale) {
        this.curve = curve;
        this.scale = scale;
    };

    global.particle.ScaleAnimator.prototype = {
        constructor: global.particle.ScaleAnimator,

        update: function(emitter, particle) {
            var scale = this.scale * this.curve.evaluate(particle.elapsedTime / particle.lifetime);

            particle.transform.scale.x = particle.transform.scale.y = scale;
        }
    };

    /**
     * Animates a particle's alpha.
     *
     * @param curve
     * @param scale
     *
     * @constructor
     */
    global.particle.AlphaAnimator = function(curve, scale) {
        return new global.particle.ParticlePropertyAnimator("alpha", curve, scale);
    };

    /**
     * Animates a particle's rotation.
     *
     * @param curve
     * @param scale
     */
    global.particle.RotationAnimator = (function() {
        var id = 0;

        return function(curve, scale) {
            this.__guid = "__rotationRate" + id++;

            this.curve = curve;
            this.scale = scale;
        };
    })();

    global.particle.RotationAnimator.prototype = {
        constructor: global.particle.RotationAnimator,

        initialize: function(emitter, particle) {
            particle[this.__guid] = particle.transform.rotationInRadians;
        },

        update: function(emitter, particle, dt) {
            particle.transform.rotationInRadians =
                particle[this.__guid] + this.scale * this.curve.evaluate(particle.elapsedTime / particle.lifetime);
        }
    };

})(this);