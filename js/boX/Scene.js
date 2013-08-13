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

        scope.autoBatch = false;
        scope.root = new DisplayObject();
        scope.root._parent = scope.root;

        scope.showBoundingBoxes = false;

        scope.update = function(dt, renderer) {
            // traverse scene and render

            // TODO: More analysis needs to be done here!
            //
            // TODO: More than likely, there are better ways to do this so we
            // TODO: don't have to figure all this stuff out every tick.
            var children = [],
                batches = {};
            getChildrenRecursively(this.root, children, batches, 0, 100);

            // we now have a set of batches and a list of DisplayObjects
            var context = renderer.getContext();
            context.enable(context.DEPTH_TEST);
            for (var id in batches) {
                renderer.drawBatch(batches[id]);
            }

            // render the non-batched elements on top
            context.disable(context.DEPTH_TEST);
            for (var i = 0, len = children.length; i < len; i++) {
                renderer.drawDisplayObject(children[i]);
            }

            // render bounding boxes
            if (scope.showBoundingBoxes) {
                for (i = 0; i < len; i++) {
                    renderer.drawBoundingBox(children[i]);
                }
            }
        };

        function getChildrenRecursively(node, list, batches, depthMin, depthMax) {
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

                //child.__calculatedWorldMatrix =

                // invisible!
                if (!child.visible) {
                    continue;
                }

                // set depth
                child.__depth = depthMin + diff * i;

                // can we batch?
                if (scope.autoBatch && RenderBatch.canBatch(child)) {
                    var batch = batches[child.material.getId()];
                    if (undefined === batch) {
                        batch = batches[child.material.getId()] = new RenderBatch(child.material);
                    }

                    batch.addDisplayObject(child);
                } else {
                    // otherwise, add to the ordered list
                    list.push(child);
                }

                getChildrenRecursively(child, list, batches, child.__depth + diffMin, child.__depth + diffMax);
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