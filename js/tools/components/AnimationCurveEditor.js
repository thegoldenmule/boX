/**
 * Author: thegoldenmule
 * Date: 8/9/13
 */

(function (global) {
    "use strict";

    var AnimationCurveEditor = function () {
        var scope = this;

        scope.canvas = null;
        scope.context = null;

        // set up a default
        scope._animationCurve = new AnimationCurve();
        scope._animationCurve.addKey(new AnimationCurveKey(0, 0));
        scope._animationCurve.addKey(new AnimationCurveKey(1, 1));

        return scope;
    };

    AnimationCurveEditor.prototype = {
        constructor: AnimationCurveEditor,

        initialize: function(canvas) {
            this.canvas = canvas;
            this.context = this.canvas.getContext("2d");

            //this.redraw();
        },

        edit: function(curve) {
            this._animationCurve = curve;

            this.redraw();
        },

        redraw: function() {
            if (!this._animationCurve ||
                this._animationCurve.getKeys().length < 2 ||
                !this.context ||
                !this.canvas) {
                return;
            }

            // fill
            this.context.fillStyle = "#CCCCCC";
            this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.context.fill();

            // draw grid
            this.context.beginPath();
            var gridRes = 4;
            for (var x = 0, xlen = this.canvas.width / gridRes; x < xlen; x++) {
                this.context.moveTo(x * xlen, 0);
                this.context.lineTo(x * xlen, this.canvas.height);
                for (var y = 0, ylen = this.canvas.height / gridRes; y < ylen; y++) {
                    this.context.moveTo(0, y * ylen);
                    this.context.lineTo(this.canvas.width, y * ylen);
                }
            }
            this.context.lineWidth = 1;
            this.context.strokeStyle = "#999999";
            this.context.stroke();
            this.context.closePath();

            // use resolution
            this.context.beginPath();
            this.context.moveTo(0, this._animationCurve.evaluate(0) * this.canvas.height);

            var keys = this._animationCurve.getKeys();
            for (var i = 0, len = keys.length; i < len - 1; i++) {
                drawSegment(this.canvas, this.context, this._animationCurve, keys[i], keys[i + 1]);
            }

            this.context.lineWidth = 1;
            this.context.lineCap = "round";
            this.context.lineJoin = "round";
            this.context.strokeStyle = "#DD0000";
            this.context.stroke();
            this.context.closePath();
        }
    };

    function drawSegment(canvas, context, curve, a, b) {
        var totalDeltaTime = b.time - a.time;
        var pieces = 16;

        for (var i = 0; i < 1; i += 1 / pieces) {
            var startT = a.time + i * totalDeltaTime;
            var endT = a.time + (i + 1 / pieces) * totalDeltaTime;

            var start = curve.evaluate(startT);
            var end = curve.evaluate(endT);

            var distance = Math.sqrt(
                (b.time - a.time) * (b.time - a.time) +
                (end - start) * (end - start));

            var dx = endT - startT;
            for (var j = 0; j < distance; j++) {
                var x = startT + j * dx;
                var y = curve.evaluate(x);
                context.lineTo(
                    x * canvas.width,
                    y * canvas.height
                );
            }
        }

        context.lineTo(
            b.time * canvas.width,
            b.value * canvas.height
        );
    }

    global.AnimationCurveEditor = AnimationCurveEditor;

})(this);