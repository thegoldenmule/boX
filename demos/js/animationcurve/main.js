/**
 * Author: thegoldenmule
 * Date: 8/10/13
 */

(function (global) {
    "use strict";

    var canvas,
        renderer,
        engine = new Engine(),
        scene = engine.getScene();

    var main = function () {

        //////////////
        // boilerplate
        canvas = document.getElementById('stage');
        renderer = new WebGLRenderer(canvas);
        engine.initialize(renderer);
        // end boilerplate
        //////////////////

        // set up curve editor
        var animationCurve = new AnimationCurve();
        for (var i = 0; i < 3; i++) {
            animationCurve.addKey(new AnimationCurveKey(Math.random(), Math.random()));
        }
        animationCurve.easingFunction = Easing.Quadratic.InOut;

        var animationCurveEditor = new AnimationCurveEditor();
        animationCurveEditor.initialize(document.getElementById("editor"));
        animationCurveEditor.edit(animationCurve);
    };

    global.main = main;

})(this);
