/**
 * Author: thegoldenmule
 * Date: 8/11/13
 */

(function (global) {
    "use strict";

    var _objectsById = {};

    /**
     * @class SceneManager
     * @desc Manages all objects in the scene and provides an interface for
     * querying.
     * @returns {SceneManager}
     * @constructor
     */
    global.SceneManager = {
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
        }
    };

})(this);
