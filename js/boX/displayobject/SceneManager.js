/**
 * Author: thegoldenmule
 * Date: 8/11/13
 */

(function (global) {
    "use strict";

    var _root = null,
        _objectsById = {};

    /**
     * @class SceneManager
     * @desc Manages all objects in the scene and provides an interface for
     * querying.
     * @returns {SceneManager}
     * @constructor
     */
    global.SceneManager = {
        /**
         * @desc Initializes the SceneManager with the root DisplayObject.
         * @param {DisplayObject} displayObject The root DisplayObject.
         *
         * @private
         */
        __initialize: function(displayObject) {
            _root = displayObject;
        },

        /**
         * @desc Adds a DisplayObject to the SceneManager for management.
         * @param {DisplayObject} displayObject The DisplayObject instance to
         * add.
         *
         * @private
         */
        __addDisplayObject: function(displayObject) {
            _objectsById[displayObject.getUniqueId()] = displayObject;
        },

        /**
         * @desc Removes a DisplayObject from the SceneManager.
         * @param {DisplayObject} displayObject The DisplayObject instance to
         * remove.
         *
         * @private
         */
        __removeDisplayObject: function(displayObject) {
            delete _objectsById[displayObject.getUniqueId()];
        },

        /**
         * @desc Retrieves a DisplayObject from the scene by id.
         * @param {number} id The integral id of the DisplayObject to retrieve.
         * @return {DisplayObject}
         */
        getById: function(id) {
            return id in _objectsById ? _objectsById[id] : null;
        },

        /**
         * @desc Basic query method to find collections of objects.
         * @param {Array} query A query is made up of DisplayObject names and
         * searches over either immediate children or descendants at arbitrary
         * depth. A search over immediate children is given by "." while a
         * recursive search is given by "..". An example follows.
         * @param {DisplayObject} context The DisplayObject to start the search from.
         * If no context is provided, the search starts at the top of the graph,
         * i.e. the scene root.
         *
         * @example
         * // for root -> a -> b -> c -> ... -> z
         * var a = SceneManager.find("a");
         * var z = SceneManager.find("..z");
         * var f = SceneManager.find("a.b.c.d.e.f");
         * var f = SceneManager.find("a..f");
         * var g = SceneManager.find("a..f.g");
         * var g = SceneManager.find("..f.g", c);
         * var g = SceneManager.find("..f..g");
         * var z = SceneManager.find(".f..z", e);
         */
        find: function(query, context) {
            if (!_root) {
                throw new Error("Must initialize SceneManager before calling find.");
            }

            if (!query){
                return null;
            }

            var current = !context ? _root : context;

            // split at recursive searches
            var recurse = false;
            var recursiveQueries = query.split("..");
            for (var i = 0, ilen = recursiveQueries.length; i < ilen; i++) {
                var recursiveQuery = recursiveQueries[i];

                // split into shallow searches
                var shallowQueries = recursiveQuery.split(".");

                // ? I don't understand why split works this way.
                if ("" === shallowQueries[0]) {
                    shallowQueries.shift();
                }

                // recursive find
                if (recurse) {
                    var recursiveChildName = shallowQueries.shift();

                    var recursiveChild = recursiveFindChildByName(current, recursiveChildName);
                    if (null !== recursiveChild) {
                        current = recursiveChild;
                    } else {
                        return null;
                    }
                }

                // perform hallow searches
                for (var j = 0, jlen = shallowQueries.length; j < jlen; j++) {
                    var shallowQuery = shallowQueries[j];

                    // get immediate child by name
                    var child = current.getChildByName(shallowQuery);
                    if (null !== child) {
                        current = child;
                    } else {
                        return null;
                    }
                }

                recurse = 0 === recursiveQuery.length || 0 === i % 2;
            }

            return current;
        }
    };

    function recursiveFindChildByName(child, name) {
        var newChild = child.getChildByName(name);
        if (null === newChild) {
            var children = child.getChildren();
            for (var i = 0, len = children.length; i < len; i++) {
                newChild = recursiveFindChildByName(children[i], name);

                if (null !== newChild) {
                    return newChild;
                }
            }
        }

        return newChild;
    }

})(this);
