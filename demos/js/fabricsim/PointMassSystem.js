/**
 * Author: thegoldenmule
 * Date: 5/10/13
 * Time: 2:57 PM
 */

var PointMassConstraint = (function() {
    "use strict";

    return function(a, b, distance) {
        var that = this;
        
        that.a = a;
        that.b = b;
        that.restDistance = undefined === distance ? 1 : distance;

        return that;
    };
})();

var PointMass = (function() {
    "use strict";

    return function(index, x, y) {
        var that = this;
        
        var _index = index;

        that.getIndex = function() {
            return _index;
        };

        that.cx = undefined === x ? 0 : x;
        that.cy = undefined === y ? 0 : y;

        that.px = that.cx;
        that.py = that.cy;

        that.invMass = 1;

        that.forces = {
            x:0, y:0
        };

        that.left = that.right = that.top = that.bottom = null;

        return that;
    };
})();

PointMass.prototype = (function() {
    "use strict";

    return {
        constructor: PointMass,

        clearForces: function() {
            this.forces.x = this.forces.y = 0;
        },

        setPosition: function(x, y) {
            this.cx = this.px = x;
            this.cy = this.py = y;
        }
    };
})();

var PointMassSystem = (function () {
    "use strict";

    return function (parameters) {
        var that = this;

        if (undefined === parameters) {
            parameters = {};
        }

        var width = (undefined === parameters.width) ? 11 : parameters.width;
        var height = (undefined === parameters.height) ? 11 : parameters.height;

        var shear = true === parameters.shear;
        var bending = true === parameters.bending;

        that.getWidth = function() {
            return width;
        };

        that.getHeight = function() {
            return height;
        };

        // stiffness constant
        that.stiffness = 1;

        // point masses
        that.pointMasses = new Array(width * height);

        // constraints!
        that.constraints = [];

        that.constantForce = {
            x: 0,
            y: 0
        };

        // now create grid of point masses, unit distance apart
        var pointMass;
        var i, j;
        for (i = 0; i < width; i++) {
            for (j = 0; j < height; j++) {
                pointMass = that.pointMasses[that.getIndex(i, j)] = new PointMass(that.getIndex(i, j), i, j);
            }
        }

        // now hook them together
        for (i = 0; i < width; i++) {
            for (j = 0; j < height; j++) {
                pointMass = that.pointMasses[that.getIndex(i, j)];

                if (i > 0) {
                    pointMass.left = that.pointMasses[that.getIndex(i - 1, j)];
                }
                if (i < width - 1) {
                    pointMass.right = that.pointMasses[that.getIndex(i + 1, j)];
                }
                if (j > 0) {
                    pointMass.top = that.pointMasses[that.getIndex(i, j - 1)];
                }
                if (j < height - 1) {
                    pointMass.bottom = that.pointMasses[that.getIndex(i, j + 1)];
                }
            }
        }
        
        // create constraints
        for (i = 0; i < width; i++) {
            for (j = 0; j < height; j++) {
                if (j < height - 1) {
                    that.constraints.push(
                        new PointMassConstraint(
                            that.pointMasses[that.getIndex(i, j)],
                            that.pointMasses[that.getIndex(i, j + 1)],
                            1));
                }

                if (i < width - 1) {
                    that.constraints.push(
                        new PointMassConstraint(
                            that.pointMasses[that.getIndex(i, j)],
                            that.pointMasses[that.getIndex(i + 1, j)],
                            1));
                }

                if (shear) {
                    if (i < width - 1 && j < height - 1) {
                        that.constraints.push(
                            new PointMassConstraint(
                                that.pointMasses[that.getIndex(i, j)],
                                that.pointMasses[that.getIndex(i + 1, j + 1)]
                            ));
                    }

                    if (i < width - 1 && j > 0) {
                        that.constraints.push(
                            new PointMassConstraint(
                                that.pointMasses[that.getIndex(i, j)],
                                that.pointMasses[that.getIndex(i + 1, j - 1)]
                            ));
                    }

                    if (i > 0 && j > 0) {
                        that.constraints.push(
                            new PointMassConstraint(
                                that.pointMasses[that.getIndex(i, j)],
                                that.pointMasses[that.getIndex(i - 1, j - 1)]
                            ));
                    }

                    if (i > 0 && j < height - 1) {
                        that.constraints.push(
                            new PointMassConstraint(
                                that.pointMasses[that.getIndex(i, j)],
                                that.pointMasses[that.getIndex(i - 1, j + 1)]
                            ));
                    }
                }
            }
        }

        return that;
    };
})();

PointMassSystem.NUM_ITERATIONS = 5;
PointMassSystem.DAMPING = 0.005;

PointMassSystem.prototype = (function() {
    "use strict";

    var _springForceCache = [];

    return {
        constructor: PointMassSystem,

        getPointMassAt: function(x, y) {
            x = Math.floor(x);
            y = Math.floor(y);

            return this.pointMasses[this.getIndex(x, y)];
        },

        getPointMassNearest: function(x, y) {
            var minDistanceSquared = Number.MAX_VALUE;
            var massIndex = 0;

            for (var i = 0, len = this.pointMasses.length; i < len; i++) {
                // distance squared
                var dx = this.pointMasses[i].cx - x;
                var dy = this.pointMasses[i].cy - y;

                var distanceSquared = dx * dx + dy * dy;

                if (distanceSquared < minDistanceSquared) {
                    massIndex = i;

                    minDistanceSquared = distanceSquared;
                }
            }

            return this.pointMasses[massIndex];
        },

        getIndex: function(x, y) {
            return x + y * this.getWidth();
        },

        solve: function(dt) {
            // iterate over point masses
            var i,
                ilen = this.pointMasses.length,
                pointMass;

            // accumulate all forces
            for (i = 0; i < ilen; i++) {
                // grab the point mass
                pointMass = this.pointMasses[i];

                // reset force accumulation
                pointMass.forces.x += this.constantForce.x;
                pointMass.forces.y += this.constantForce.y;
            }

            // integrate
            var dtSquared = dt * dt;
            for (i = 0; i < ilen; i++) {
                pointMass = this.pointMasses[i];

                var cx = pointMass.cx;
                var cy = pointMass.cy;

                var px = pointMass.px;
                var py = pointMass.py;

                var invMass = pointMass.invMass;

                var fx = pointMass.forces.x;
                var fy = pointMass.forces.y;

                // F = ma
                // F / m = a
                var ax = fx * invMass;
                var ay = fy * invMass;

                // make it rain
                pointMass.cx += (1 - PointMassSystem.DAMPING) * (cx - px) + ax * dtSquared;
                pointMass.cy += (1 - PointMassSystem.DAMPING) * (cy - py) + ay * dtSquared;
                pointMass.px = cx;
                pointMass.py = cy;
            }

            // satisfy constraints
            for (var k = 0; k < PointMassSystem.NUM_ITERATIONS; k++) {
                for (i = 0, ilen = this.constraints.length; i < ilen; i++) {
                    var constraint = this.constraints[i];

                    var a = constraint.a;
                    var b = constraint.b;

                    if (a.invMass + b.invMass < 0.000001) {
                        continue;
                    }

                    var dx = b.cx - a.cx;
                    var dy = b.cy - a.cy;

                    var deltaScalar = Math.sqrt(dx * dx + dy * dy);

                    var correctionx = dx * (1 - 1 / deltaScalar);
                    var correctiony = dy * (1 - 1 / deltaScalar);

                    var sa = a.invMass / (a.invMass + b.invMass);
                    var sb = b.invMass / (a.invMass + b.invMass);

                    a.cx += correctionx / 2 * sa;
                    a.cy += correctiony / 2 * sa;

                    b.cx -= correctionx / 2 * sb;
                    b.cy -= correctiony / 2 * sb;
                }
            }

            // reset forces
            for (i = 0, ilen = this.pointMasses.length; i < ilen; i++) {
                // grab the point mass
                pointMass = this.pointMasses[i];

                // reset force accumulation
                pointMass.forces.x = pointMass.forces.y = 0;
            }
        }
    };
})();