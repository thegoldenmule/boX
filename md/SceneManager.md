# SceneManager

`SceneManager` provides a central management system for all objects in the scene graph (see the `DisplayObject` section on The Scene Graph). Any object that derives from `DisplayObject` will be automatically registered and unregistered with the SceneManager as it is added and removed as a child node in the graph. That is, `DisplayObject` instances that are diconnected from the root node of the `Scene` are not registered with `SceneManager` and will not be accessible via its query methods.

### boQL
bo-X provides a simple, yet powerful query languages called boQL (awesome name, right?) based on a number of existing graph languages including e4x, css, and xpath to name a few.

After all, what's the power of a scene graph when there is no way to query it?

boQL queries are made up of simple match statements, separated by a search depth operator which defines whether the match statement should be executed at a shallow or recursive level. This is best explained by a few examples.

Suppose, for `DisplayObject`s with names "a", ... "z", the following scene graph:

    "a" -> "b" -> ... -> "z"

That is, `a` is parent to `b` is parent to `c`-- and so on down the line. Suppose we would like a reference to `g`. With boQL, there are a number of ways to accomplish this:

    // specify an explicit path to g
    var g = SceneManager.find("a.b.c.d.e.f.g");
    
    // specify any part of the path, using .. to specify recursion
    var g = SceneManager.find("a..e..g");
    var g = SceneManager.find("..g");

This form of boQL matches `DisplayObject` instances by name, but boQL also supports matching by arbitrary `DisplayObject` properties by using the `@` symbol.

Here are a few examples:

    // find all visible DisplayObjects that are below b in the graph
    var visibleElements = SceneManager.find("..b..(@visible==true)");
    
    // find all DisplayObjects with alpha less than 1
    var alphaElements = SceneManager.find("..(@alpha<1)")
    
    // find all immediate children of a with id greater than or equal to 10
    var objects - SceneManager.find("a.(@id>=10)");

### GetById
Every `DisplayObject` has an integral id unique across all `DisplayObject` instances, accessible via `DisplayObject::getUniqueId()`. The SceneManager has a constant time lookup by id for all `DisplayObject` instances.