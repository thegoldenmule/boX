/**
 * Author: thegoldenmule
 * Date: 3/10/13
 */

(function (global) {
    "use strict";

    var Signal = signals.Signal;

    var __totalBatches = 0,
        __total;

    var Scene = function () {
        var scope = this;

        scope.root = new DisplayObject();
        scope.root._parent = scope.root;

        // initialize the SceneManager
        SceneManager.__initialize(scope.root);

        scope.showBoundingBoxes = false;

        scope.update = function(dt, renderer) {
            // traverse scene and render

            // TODO: More analysis needs to be done here!
            //
            // TODO: More than likely, there are better ways to do this so we
            // TODO: don't have to figure all this stuff out every tick.
            var children = [];
            getChildrenRecursively(this.root, children, 0, 100);

            // we now have a set of batches and a list of DisplayObjects
            var context = renderer.getContext();

            // render the non-batched elements on top
            context.disable(context.DEPTH_TEST);
            for (var i = 0, len = children.length; i < len; i++) {
                var child = children[i];

                var localMatrix = child.transform.recalculateMatrix();

                // prepend the parent
                mat4.multiply(child._worldMatrix, child.getParent()._worldMatrix, localMatrix);

                // multiply parent tint with local tint
                // TODO: this method is difficult to understand
                child._composedTint.r = child.tint.r * child.getParent()._composedTint.r;
                child._composedTint.g = child.tint.g * child.getParent()._composedTint.g;
                child._composedTint.b = child.tint.b * child.getParent()._composedTint.b;

                // multiply parent alpha with local
                child._composedAlpha = child.alpha * child.getParent()._composedAlpha;

                renderer.drawDisplayObject(children[i]);
            }

            // render bounding boxes
            if (scope.showBoundingBoxes) {
                for (i = 0; i < len; i++) {
                    renderer.drawBoundingBox(children[i]);
                }
            }
        };

        function getChildrenRecursively(node, list, depthMin, depthMax) {
            var children = node._children;
            var len = children.length;
            if (0 === len) {
                return;
            }

            var diff = (depthMax - depthMin) / len;
            var diffMin = diff / 10;
            var diffMax = 9 * diff / 10;
            for (var i = 0; i < len; i++) {
                var child = children[i];

                // worldmatrix -> identity
                mat4.identity(child._worldMatrix);

                // reset tint
                child._composedTint.white();

                // reset alpha
                child._composedAlpha = 1;

                // invisible!
                if (!child.visible) {
                    continue;
                }

                // set depth
                child.__depth = depthMin + diff * i;

                list.push(child);

                getChildrenRecursively(child, list, child.__depth + diffMin, child.__depth + diffMax);
            }
        }

        return scope;
    };

    Scene.prototype = {
        constructor : Scene
    };

    // export
    global.Scene = Scene;
})(this);