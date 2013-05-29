/**
 * Author: thegoldenmule
 * Date: 3/11/13
 */

(function (global) {
    "use strict";

    // imports
    var Signal = signals.Signal;

    var __GUIDS = 0,
        __tempVec3 = vec3.create(),
        __tempRect = new Rectangle();

    // TODO: These are so expensive, and a parent's matrix is recalculated once for every child.
    function composeTransforms(displayObject, out) {
        mat4.identity(out);

        if (null !== displayObject.parent) {
            appendTransform(displayObject.parent, out);
        }

        mat4.multiply(out, out, displayObject.transform.recalculateMatrix());

        return out;
    }

    function appendTransform(displayObject, out) {
        if (null !== displayObject.parent) {
            appendTransform(displayObject.parent, out);
        }

        // recalc
        mat4.multiply(out, out, displayObject.transform.recalculateMatrix());
    }

    var DisplayObject = function (parameters) {
        var scope = this;

        var _id = __GUIDS++,
            _worldMatrix = mat4.create(),
            _boundingBox = new Rectangle(0, 0, 0, 0),
            _worldBoundingBox = new Rectangle(0, 0, 0, 0);

        if (undefined === parameters) {
            parameters = {};
        }

        scope.visible = false === parameters.visible ? false : true;

        scope.alpha = undefined === parameters.alpha ? 1 : parameters.alpha;

        scope.tint = undefined === parameters.tint ? new Color(1, 1, 1) : parameters.tint;

        scope.transform = new Transform();
        scope.transform.position.x = undefined === parameters.x ? 0 : parameters.x;
        scope.transform.position.y = undefined === parameters.y ? 0 : parameters.y;

        scope.material = undefined === parameters.material ? new Material() : parameters.material;
        if (undefined !== parameters.mainTexture) {
            scope.material.mainTexture = parameters.mainTexture;
        }
        if (undefined !== parameters.secTexture) {
            scope.material.secTexture = parameters.secTexture;
        }

        scope.geometry = new Quad();
        scope.geometry.width = undefined === parameters.width ? 1 : parameters.width;
        scope.geometry.height = undefined === parameters.height ? 1 : parameters.height;
        scope.geometry.apply();

        scope.children = [];

        scope.parent = null;

        scope.getWidth = function() {
            return scope.geometry.width;
        };

        scope.getHeight = function() {
            return scope.geometry.height;
        };

        scope.recalculateWorldMatrix = function() {
            return composeTransforms(scope, _worldMatrix);
        };

        scope.getUniqueId = function() {
            return _id;
        };

        scope.getLocalBB = function() {
            // locally, this is always axis aligned
            var x = scope.transform.position.x;
            var y = scope.transform.position.y;
            var width = scope.geometry.width;
            var height = scope.geometry.height;

            _boundingBox.set(
                x, y,
                x + width,
                y + height);

            return _boundingBox;
        };

        scope.getWorldBB = function() {
            var scope = this;

            // get local AABB
            var local = scope.getLocalAABB();

            // get world transformation matrix
            var mat = scope.recalculateWorldMatrix();

            // transform origin
            vec3.transformMat4(__tempVec3, vec3.set(__tempVec3, local.x, local.y, 0), mat);

            var tempX = __tempVec3[0];
            var tempY = __tempVec3[1];

            // transform far corner
            vec3.transformMat4(__tempVec3, vec3.set(__tempVec3, this.x + this.w, this.y + this.h, 0), mat);

            // set
            _worldBoundingBox.set(
                tempX,
                tempY,
                __tempVec3[0] - tempX,
                __tempVec3[1] - tempY);

            return _worldBoundingBox;
        };

        return scope;
    };

    DisplayObject.prototype = {
        constructor:DisplayObject,

        addChild: function(child) {
            // remove from old parent
            if (child.parent &&
                child.parent !== this) {
                child.parent.removeChild(child);
            }

            // we are the new parent
            child.parent = this;
            this.children.push(child);

            return child;
        },

        addChildren: function(children) {
            this.children = this.children.concat(children);
        },

        removeChild: function(child) {
            // TODO: Save indices on child, replace hole with last
            var index = this.children.indexOf(child);
            if (-1 !== index) {
                this.children.splice(index, 1);

                child.parent = null;
            }

            return child;
        },

        removeChildren: function(children) {
            var newChildren = [];
            this.children.forEach(function(node) {
                if (-1 === children.indexOf(node)) {
                    newChildren.push(node);
                } else {
                    node.parent = null;
                }
            });
            this.children = newChildren;
        }
    };

    // export
    global.DisplayObject = DisplayObject;
})(this);