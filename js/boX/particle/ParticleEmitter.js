(function (global) {
    "use strict";

    /**
     * A Particle class. This extends DisplayObject and holds a simple physical
     * model.
     *
     * @param material The material to use.
     * @returns {*}
     * @author thegoldenmule
     * @constructor
     */
    var Particle = function (material) {
        var scope = this;

        // extend DisplayObject
        DisplayObject.call(scope, {color:new Color(1, 0, 0, 1)});

        // set the anchor point to the center
        scope.transform.anchorPoint.x = scope.transform.anchorPoint.y = 1;

        scope.material = material;
        scope.material.shader.setShaderProgramIds("texture-shader-vs", "texture-shader-fs");

        // basic physics model
        scope.vx = 0;
        scope.vy = 0;
        scope.ax = 0;
        scope.ay = 0;
        scope.elapsedTime = 0;
        scope.isAlive = false;

        return scope;
    };

    Particle.prototype = new DisplayObject();
    Particle.prototype.constructor = Particle;

    /**
     * The ParticleEmitter class emits Particle objects, which are children.
     *
     * @param plugins
     * @param x
     * @param y
     * @param maxParticles
     * @constructor
     */
    var ParticleEmitter = function (plugins, x, y, maxParticles) {
        var scope = this;

        // extend DisplayObject
        DisplayObject.call(scope);

        var _plugins = plugins ? [].concat(plugins) : [],
            _helper = 0,
            _bufferIndex = 0,
            _maxParticles = (undefined === maxParticles) ? 1000 : maxParticles,
            _particleBuffer = new Set(),    // particles do not need to be ordered

            // create a pool of particles
            _particlePool = new ObjectPool(
                _maxParticles,
                function allocate() {
                    return new Particle(scope.material);
                },
                function get(instance) {
                    scope.addChild(instance);

                    instance.elapsedTime = 0;
                    instance.isAlive = true;
                    instance.lifetime = scope.lifetime;
                },
                function put(instance) {
                    scope.removeChild(instance);

                    instance.isAlive = false;
                });

        scope.material.shader.setShaderProgramIds("particle-shader-vs", "particle-shader-fs");

        scope.emissionRate = 5;
        scope.lifetime = 1000;

        /**
         * Adds a plugin dynamically.
         *
         * @param plugin
         * @returns {*}
         */
        scope.addPlugin = function(plugin) {
            _plugins.push(plugin);

            return scope;
        };

        /**
         * Removes a plugin dynamically.
         *
         * @param plugin
         * @returns {*}
         */
        scope.removePlugin = function(plugin) {
            var index = _plugins.indexOf(plugin);
            if (-1 !== index) {
                _plugins = _plugins.splice(index, 1);
            }

            return scope;
        };

        /**
         * Called as part of boX's update loop.
         *
         * @param dt
         */
        scope.update = function(dt) {
            applyPlugins(null, _plugins, "updateGlobal", dt);

            // add new particles
            var particle;
            var rate = scope.emissionRate;
            for (var i = _bufferIndex, len = _bufferIndex + rate; i < len; i++) {
                particle = _particlePool.get();

                if (null === particle) {
                    break;
                }

                // initialize phase
                applyPlugins(particle, _plugins, "initialize", dt);

                // add to buffer
                _particleBuffer.add(particle);
            }

            // update particles + remove dead ones
            var particles = _particleBuffer.getElements();
            for (i = 0, len = particles.length; i < len; i++) {
                particle = particles[i];

                // update age + prune
                particle.elapsedTime += dt;

                // dead?
                if (particle.elapsedTime >= particle.lifetime) {
                    _particleBuffer.remove(particle);
                    _particlePool.put(particle);

                    continue;
                }

                // TODO: at least use Euler...

                // apply acceleration
                particle.vx += particle.ax;
                particle.vy += particle.ay;

                // apply velocity
                particle.transform.position.x += particle.vx;
                particle.transform.position.y += particle.vy;

                // apply plugins
                applyPlugins(particle, _plugins, "update", dt);
            }

            // tell plugins they are done!
            applyPlugins(null, _plugins, "updateEndGlobal", dt);
        };

        function applyPlugins(particle, plugins, method, dt) {
            for (var j = 0, len = plugins.length; j < len; j++) {
                var plugin = plugins[j];
                if ("function" === typeof plugin[method]) {
                    plugin[method](scope, particle, dt);
                }
            }
        }
    };

    ParticleEmitter.prototype = new DisplayObject();
    ParticleEmitter.prototype.constructor = ParticleEmitter;

    // export
    global.Particle = Particle;
    global.ParticleEmitter = ParticleEmitter;
})(this);