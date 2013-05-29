/**
 * Default particle plugins:
 *
 * Position, Velocity, Acceleration, Lifetime,
 * EmissionRateFade, Attractor.
 *
 * @author thegoldenmule
 *
 * MIT license.
 */
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
        this.x = xval;
        this.y = yval;
        this.innerRadius = innerRadius ? innerRadius : 0;

        if (radius <= this.innerRadius) {
            radius = this.innerRadius + 1;
        }

        this.radius = radius;
    };

    global.particle.Position.prototype = {
        initialize:
            function(emitter, particle) {
                particle.x = this.x + (Math.random() - 0.5) * Math.random() * (this.radius - this.innerRadius);
                particle.y = this.y + (Math.random() - 0.5) * Math.random() * (this.radius - this.innerRadius);

                if (0 !== this.innerRadius) {
                    var randomAngle = Math.random() * 2 * Math.PI;
                    particle.x += this.innerRadius * Math.sin(randomAngle);
                    particle.y += this.innerRadius * Math.cos(randomAngle);
                }
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
        initialize:
            function(emitter, particle) {
                // pick a random angle
                var angle = (this.minAngle + Math.random() * (this.maxAngle - this.minAngle));
                var magnitude = (this.minMagnitude + Math.random() * (this.maxMagnitude - this.minMagnitude));

                particle.vx = Math.sin(angle) * magnitude;
                particle.vy = Math.cos(angle) * magnitude;
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
        initialize:
            function(emitter, particle) {
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
        initialize:
            function(emitter, particle) {
                particle.lifetime = (this.min + Math.random() * (this.max - this.min));
            }
    };

    /**
     * EmissionRateFade plugin.
     *
     * This tweens the emitter's emission rate from start to finish in time.
     */
    global.particle.EmissionRateFade = function(start, finish, time) {
        this.start = start;
        this.finish = finish;
        this.time = time;

        this.elapsed = 0;
    };

    global.particle.EmissionRateFade.prototype = {
        updateGlobal:
            function(emitter, particle, dt) {
                this.elapsed += dt;

                if (this.elapsed >= this.time) {
                    emitter.emissionRate = this.finish;
                } else {
                    emitter.emissionRate = ~~(this.start + (this.elapsed / this.time) * (this.finish - this.start));
                }
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

    global.particle.Attractor.prototype = (function() {
        var G = 1; // teehee

        return {
            update:
                function(emitter, particle) {
                    particle.ax = this.x - particle.x / this.amount;
                    particle.ay = this.y - particle.y / this.amount;
                }
        };
    })();

})(this);