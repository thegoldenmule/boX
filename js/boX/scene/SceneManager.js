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
         * @param {String} query A query is made up of DisplayObject names and
         * searches over either immediate children or descendants at arbitrary
         * depth. A search over immediate children is given by "." while a
         * recursive search is given by "..". An example follows.
         * @param {DisplayObject} context The DisplayObject to start the search from.
         * If no context is provided, the search starts at the top of the graph,
         * i.e. the scene root.
         *
         * @example
         * SceneManager.find("a.b..(@visible==true).(@name==z)");
         * SceneManager.find("a.b..(@visible==true)..(@name==z)");
         * SceneManager.find("..(@visible==true)..(@name==z)", q);
         * SceneManager.find("..(@test==true)");
         */
        find: function(query, context) {
            if (!_root) {
                throw new Error("Must initialize SceneManager before calling find.");
            }

            if (!query){
                return [];
            }
             // grab current context
            var current = !context ? [_root] : [context];

            // define vars here
            var i, j, k, iLength, jLength, kLength;
            var sceneQuery;
            var results;

            // split at recursive queries
            var recur = false;
            var recursiveQueries = query.split("..");
            for (i = 0, iLength = recursiveQueries.length; i < iLength; i++) {
                var recursiveQuery = recursiveQueries[i];

                // split into shallow queries
                var shallowQueries = recursiveQuery.split(".");

                // ? I don't understand why split works this way.
                if ("" === shallowQueries[0]) {
                    shallowQueries.shift();
                }

                // recursive query
                if (recur) {
                    var recursiveQueryString = shallowQueries.shift();

                    // create query
                    sceneQuery = new SceneQuery(recursiveQueryString);

                    // execute query on each of the current nodes
                    results = [];
                    for (k = 0, kLength = current.length; k < kLength; k++) {
                        executeQueryRecursive(current[k], sceneQuery, results);
                    }

                    if (0 !== results.length) {
                        current = results;
                    } else {
                        return [];
                    }
                }

                // perform shallow searches
                for (j = 0, jLength = shallowQueries.length; j < jLength; j++) {
                    var shallowQueryString = shallowQueries[j];

                    // create query
                    sceneQuery = new SceneQuery(shallowQueryString);

                    // execute query on each of the current nodes
                    results = [];
                    for (k = 0, kLength = current.length; k < kLength; k++) {
                        executeQuery(current[k], sceneQuery, results);
                    }

                    if (0 !== results.length) {
                        current = results;
                    } else {
                        return [];
                    }
                }

                recur = 0 === recursiveQuery.length || 0 === i % 2;
            }

            return current;
        }
    };

    function executeQueryRecursive(node, query, results) {
        var newChild;
        var children = node.getChildren();
        for (var i = 0, len = children.length; i < len; i++) {
            newChild = children[i];
            if (query.execute(newChild)) {
                results.push(newChild);
            }

            executeQueryRecursive(newChild, query, results);
        }
    }

    function executeQuery(node, query, results) {
        var children = node.getChildren();
        for (var i = 0, len = children.length; i < len; i++) {
            var newChild = children[i];
            if (query.execute(newChild)) {
                results.push(newChild);
            }
        }
    }

})(this);
