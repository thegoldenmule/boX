/**
 * Author: thegoldenmule
 * Date: 5/27/13
 */

(function (global) {
    "use strict";

    var Particle = function () {
        var scope = this;

        // basic physics model
        scope.x = 0;
        scope.y = 0;
        scope.vx = 0;
        scope.vy = 0;
        scope.ax = 0;
        scope.ay = 0;

        scope.alive = 0;

        return scope;
    };

    var ParticleEmitter = function (plugins, x, y) {
        var scope = this;

        // extend DisplayObject
        DisplayObject.call(scope);

        var _plugins = plugins ? [].concat(plugins) : [],
            _helper = 0,
            _bufferIndex = 0,
            _particlesDoubleBuffer = [[], []];

        // special geometry + rendering
        scope.geometry = new ParticleEmitterGeometry();
        scope.material.shader.setShaderProgramIds("particle-shader-vs", "particle-shader-fs");

        scope.emissionRate = 50;
        scope.particles = _particlesDoubleBuffer[_bufferIndex];
        scope.maxParticles = 10000;
        scope.lifetime = 1000;

        function applyPlugins(particle, plugins, method, dt) {
            for (var j = 0, len = plugins.length; j < len; j++) {
                var plugin = plugins[j];
                if ("function" === typeof plugin[method]) {
                    plugin[method](scope, particle, dt);
                }
            }
        }

        scope.withProperty = function(property, value) {
            scope[property] = value;

            return scope;
        };

        scope.addPlugin = function(plugin) {
            _plugins.push(plugin);

            return scope;
        };

        scope.removePlugin = function(plugin) {
            var index = _plugins.indexOf(plugin);
            if (-1 !== index) {
                _plugins = _plugins.splice(index, 1);
            }

            return scope;
        };

        scope.update = function(dt) {
            applyPlugins(null, _plugins, "updateGlobal", dt);

            // add new particles
            var particle;
            var rate = scope.emissionRate,
            len = scope.particles.length;
            for (var i = 0; i < rate; i++) {
                particle = new Particle();
                particle.lifetime = scope.lifetime;

                // apply plugins
                applyPlugins(particle, _plugins, "initialize", dt);

                // kick out particles over the max
                if (len === scope.maxParticles) {
                    scope.particles[_helper++ % scope.maxParticles] = particle;
                } else {
                    scope.particles.push(particle);
                }
            }

            // update particles + remove dead ones
            var aliveBuffer = _particlesDoubleBuffer[++_bufferIndex % 2];
            aliveBuffer.length = 0;
            for (i = 0, len = scope.particles.length; i < len; i++) {
                particle = scope.particles[i];

                // apply plugins
                applyPlugins(particle, _plugins, "update", dt);

                // we're not doing real integration here, though plugins are free to

                // apply acceleration
                particle.vx += particle.ax;
                particle.vy += particle.ay;

                // apply velocity
                particle.x += particle.vx;
                particle.y += particle.vy;

                // update age + prune
                particle.alive += dt;

                if (particle.alive < particle.lifetime) {
                    // apply plugins
                    applyPlugins(particle, _plugins, "render", dt);

                    aliveBuffer.push(particle);
                }
            }
            scope.particles = aliveBuffer;

            // tell plugins they are done!
            applyPlugins(null, _plugins, "updateEndGlobal", dt);
        };
    };

    ParticleEmitter.prototype = new DisplayObject();
    ParticleEmitter.prototype.constructor = ParticleEmitter;

    var ParticleEmitterGeometry = function() {
        this.vertices = [];
        this.vertexBuffer = null;
    };

    ParticleEmitterGeometry.prototype = {
        apply: function() {

        },

        clearBuffers: function() {

        },

        prepareBuffers: function(ctx) {

        },

        pushBuffers: function(ctx) {

        },

        draw: function(ctx) {

        }
    };

    // export
    global.Particle = Particle;
    global.ParticleEmitter = ParticleEmitter;
})(this);