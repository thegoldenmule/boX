(function (global) {
    "use strict";

    // imports
    var Signal = signals.Signal;

    var __GUIDS = 0,
        __tempVec3 = vec3.create();

    /**
     * The base object for all items in the scene.
     *
     * @class DisplayObject
     *
     * @param {Object} parameters An object for initializing the DisplayObject.
     * This object may contain the following properties: visible, alpha, tint,
     * x, y, material, mainTexture, secTexture, width, height, name, anchorX,
     * and anchorY.
     *
     * @returns {DisplayObject}
     *
     * @example
     * var sprite = new Shape({
     *      x: 10,
     *      y: 100,
     *      tint: new Color(0, 1, 0)
     * });
     *
     * @constructor
     *
     * @author thegoldenmule
     */
    global.DisplayObject = function (parameters) {
        var scope = this;

        var _id = __GUIDS++,
            _boundingBox = new Rectangle(0, 0, 0, 0),
            _worldBoundingBox = new Rectangle(0, 0, 0, 0);

        /**
         * @member global.DisplayObject#_worldMatrix
         * @desc Holds the world transform of this object.
         * @private
         * @type {mat4}
         */
        scope._worldMatrix = mat4.create();

        /**
         * @member global.DisplayObject#_composedTint
         * @desc Holds the tint composed through all parent tints
         * @type {Color}
         * @private
         */
        scope._composedTint = new Color(1, 1, 1);

        /**
         * @member global.DisplayObject#_composedAlpha
         * @desc Holds the alpha composed through all parent tints
         * @type {Color}
         * @private
         */
        scope._composedAlpha = 1;

        if (undefined === parameters) {
            parameters = {};
        }

        /**
         * @member global.DisplayObject#name
         * @desc A non-unique name.
         * @type {string}
         */
        scope.name = undefined === parameters.name ? "displayObject"  + _id.toString() : parameters.name;

        /**
         * @member global.DisplayObject#visible
         * @desc Toggles the visibility of this DisplayObject and all children.
         *
         * @type {boolean}
         */
        scope.visible = false === parameters.visible ? false : true;

        /**
         * @member global.DisplayObject#alpha
         * @desc A value between 0 and 1 that determines the alpha of this
         * DisplayObject.
         *
         * @type {number}
         */
        scope.alpha = undefined === parameters.alpha ? 1 : parameters.alpha;

        /**
         * @member global.DisplayObject#tint
         * @desc A Color to tint this DisplayObject.
         *
         * @type {Color}
         */
        scope.tint = undefined === parameters.tint ? new Color(1, 1, 1) : parameters.tint;

        /**
         * @member global.DisplayObject#transform
         * @desc The transform component to apply to this DisplayObject.
         *
         * @type {Transform}
         */
        scope.transform = new Transform();
        scope.transform.position.x = undefined === parameters.x ? 0 : parameters.x;
        scope.transform.position.y = undefined === parameters.y ? 0 : parameters.y;
        scope.transform.anchorPoint.x = undefined === parameters.anchorX ? 0 : parameters.anchorX;
        scope.transform.anchorPoint.y = undefined === parameters.anchorY ? 0 : parameters.anchorY;

        /**
         * @member global.DisplayObject#material
         * @desc The Material instance with chich to render this DisplayObject.
         *
         * @type {Material}
         */
        scope.material = undefined === parameters.material ? new Material() : parameters.material;
        if (undefined !== parameters.mainTexture) {
            scope.material.mainTexture = parameters.mainTexture;
        }
        if (undefined !== parameters.secTexture) {
            scope.material.secTexture = parameters.secTexture;
        }

        /**
         * @member global.DisplayObject#geometry
         * @desc The IGeometry implementation for this DisplayObject. Defaults
         * to Quad.
         *
         * @type {Quad}
         */
        scope.geometry = new Quad();
        scope.geometry.width = undefined === parameters.width ? 1 : parameters.width;
        scope.geometry.height = undefined === parameters.height ? 1 : parameters.height;
        scope.geometry.apply();

        /**
         * @member global.DisplayObject#children
         * @desc An array of child DisplayObjects.
         * @private
         *
         * @type {Array}
         */
        scope._children = [];

        /**
         * @member global.DisplayObject#parent
         * @desc The DisplayObject instance to which this instance has been
         * added as a child.
         * @private
         *
         * @type {DisplayObject}
         */
        scope._parent = null;

        /**
         * @function global.DisplayObject#getWidth
         * @desc Returns the local width of the underlying geometry.
         *
         * @returns {number}
         */
        scope.getWidth = function() {
            return scope.geometry.width;
        };

        /**
         * @function global.DisplayObject#getHeight
         * @desc Returns the local height of the underlying geometry.
         *
         * @returns {number}
         */
        scope.getHeight = function() {
            return scope.geometry.height;
        };

        /**
         * @function global.DisplayObject#recalculateWorldMatrix
         * @desc Calculates the world matrix of this DisplayObject and returns
         * it.
         *
         * @returns {mat4}
         */
        scope.recalculateWorldMatrix = (function() {

            function appendTransform(displayObject, out) {
                if (null !== displayObject._parent && displayObject._parent !== displayObject) {
                    appendTransform(displayObject._parent, out);
                }

                // recalc
                mat4.multiply(out, out, displayObject.transform.recalculateMatrix());
            }

            function composeTransforms(displayObject, out) {
                mat4.identity(out);

                if (null !== displayObject._parent && displayObject._parent !== displayObject) {
                    appendTransform(displayObject._parent, out);
                }

                mat4.multiply(out, out, displayObject.transform.recalculateMatrix());

                return out;
            }

            return function() {
                return composeTransforms(scope, scope._worldMatrix);
            };
        })();

        /**
         * @function global.DisplayObject#getUniqueId
         * @desc All DisplayObject instances are assigned an id at
         * instantiation that is unique across all DisplayObject
         * instances. This function returns that value.
         *
         * @returns {number}
         */
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

    global.DisplayObject.prototype = {
        constructor:global.DisplayObject,

        /**
         * Retrieves the parent DisplayObject.
         *
         * @returns {DisplayObject}
         */
        getParent: function() {
            return this._parent;
        },

        /**
         * Retrieves a copy of the array of children for this DisplayObject.
         *
         * @returns {Array}
         */
        getChildren: function() {
            return this._children.slice(0);
        },

        /**
         * Returns a child by name, or null if no child by that name exists.
         * @param {String} name The name of the child to return.
         *
         * @return {DisplayObject}
         */
        getChildByName: function(name) {
            for (var i = 0, len = this._children.length; i < len; i++) {
                if (this._children[i].name === name) {
                    return this._children[i];
                }
            }

            return null;
        },

        /**
         * Adds a DisplayObject as a child of this one.
         *
         * @param {DisplayObject} child A DisplayObject instance to add as a
         * child.
         *
         * @returns {DisplayObject}
         */
        addChild: function(child) {
            if (this === child) {
                throw new Error("Cannot add self to self.");
            }

            // root
            if (child._parent === child) {
                throw new Error("Cannot add root to another DisplayObject.");
            }

            // already added
            if (child._parent === this) {
                return;
            }

            // remove from old parent
            if (child._parent) {
                child._parent.removeChild(child);
            }

            // we are the new parent
            child._parent = this;
            this._children.push(child);

            if (null !== this.getParent()) {
                global.SceneManager.__addDisplayObject(child);
            }

            return child;
        },

        /**
         * Adds a list of DisplayObjects as children.
         *
         * @param {Array} children an array of DisplayObjects to add as
         * children.
         */
        addChildren: function(children) {
            children.forEach(this.addChild);
        },

        /**
         * Removes a DisplayObject from the list of children.
         *
         * @param {DisplayObject} child A DisplayObject instance to remove
         * @returns {DisplayObject}
         */
        removeChild: function(child) {
            // TODO: Save indices on child, replace hole with last
            var index = this._children.indexOf(child);
            if (-1 !== index) {
                this._children.splice(index, 1);

                child._parent = null;

                global.SceneManager.__removeDisplayObject(child);
            }

            return child;
        },

        /**
         * Removes a list of DisplayObjects as children.
         *
         * @param children
         */
        removeChildren: function(children) {
            children.forEach(this.removeChild);
        },

        /**
         * Safely removes this DisplayObject from its parent.
         */
        removeFromParent: function() {
            if (this._parent) {
                this._parent.removeChild(this);
            }
        },

        /**
         * Removes all children from this DisplayObject.
         */
        removeAllChildren: function() {
            var children = this._children.slice(0);
            for (var i = 0, len = children; i <len; i++) {
                this.removeChild(children[i]);
            }
        }
    };
})(this);