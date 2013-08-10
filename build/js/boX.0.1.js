/*jslint onevar:true, undef:true, newcap:true, regexp:true, bitwise:true, maxerr:50, indent:4, white:false, nomen:false, plusplus:false */
/*global define:false, require:false, exports:false, module:false, signals:false */

/** @license
 * JS Signals <http://millermedeiros.github.com/js-signals/>
 * Released under the MIT license
 * Author: Miller Medeiros
 * Version: 1.0.0 - Build: 272 (2013/03/09 06:29 AM)
 */

(function(global){

    // SignalBinding -------------------------------------------------
    //================================================================

    /**
     * Object that represents a binding between a Signal and a listener function.
     * <br />- <strong>This is an internal constructor and shouldn't be called by regular users.</strong>
     * <br />- inspired by Joa Ebert AS3 SignalBinding and Robert Penner's Slot classes.
     * @author Miller Medeiros
     * @constructor
     * @internal
     * @name SignalBinding
     * @param {Signal} signal Reference to Signal object that listener is currently bound to.
     * @param {Function} listener Handler function bound to the signal.
     * @param {boolean} isOnce If binding should be executed just once.
     * @param {Object} [listenerContext] Context on which listener will be executed (object that should represent the `this` variable inside listener function).
     * @param {Number} [priority] The priority level of the event listener. (default = 0).
     */
    function SignalBinding(signal, listener, isOnce, listenerContext, priority) {

        /**
         * Handler function bound to the signal.
         * @type Function
         * @private
         */
        this._listener = listener;

        /**
         * If binding should be executed just once.
         * @type boolean
         * @private
         */
        this._isOnce = isOnce;

        /**
         * Context on which listener will be executed (object that should represent the `this` variable inside listener function).
         * @memberOf SignalBinding.prototype
         * @name context
         * @type Object|undefined|null
         */
        this.context = listenerContext;

        /**
         * Reference to Signal object that listener is currently bound to.
         * @type Signal
         * @private
         */
        this._signal = signal;

        /**
         * Listener priority
         * @type Number
         * @private
         */
        this._priority = priority || 0;
    }

    SignalBinding.prototype = {

        /**
         * If binding is active and should be executed.
         * @type boolean
         */
        active : true,

        /**
         * Default parameters passed to listener during `Signal.dispatch` and `SignalBinding.execute`. (curried parameters)
         * @type Array|null
         */
        params : null,

        /**
         * Call listener passing arbitrary parameters.
         * <p>If binding was added using `Signal.addOnce()` it will be automatically removed from signal dispatch queue, this method is used internally for the signal dispatch.</p>
         * @param {Array} [paramsArr] Array of parameters that should be passed to the listener
         * @return {*} Value returned by the listener.
         */
        execute : function (paramsArr) {
            var handlerReturn, params;
            if (this.active && !!this._listener) {
                params = this.params? this.params.concat(paramsArr) : paramsArr;
                handlerReturn = this._listener.apply(this.context, params);
                if (this._isOnce) {
                    this.detach();
                }
            }
            return handlerReturn;
        },

        /**
         * Detach binding from signal.
         * - alias to: mySignal.remove(myBinding.getListener());
         * @return {Function|null} Handler function bound to the signal or `null` if binding was previously detached.
         */
        detach : function () {
            return this.isBound()? this._signal.remove(this._listener, this.context) : null;
        },

        /**
         * @return {Boolean} `true` if binding is still bound to the signal and have a listener.
         */
        isBound : function () {
            return (!!this._signal && !!this._listener);
        },

        /**
         * @return {boolean} If SignalBinding will only be executed once.
         */
        isOnce : function () {
            return this._isOnce;
        },

        /**
         * @return {Function} Handler function bound to the signal.
         */
        getListener : function () {
            return this._listener;
        },

        /**
         * @return {Signal} Signal that listener is currently bound to.
         */
        getSignal : function () {
            return this._signal;
        },

        /**
         * Delete instance properties
         * @private
         */
        _destroy : function () {
            delete this._signal;
            delete this._listener;
            delete this.context;
        },

        /**
         * @return {string} String representation of the object.
         */
        toString : function () {
            return '[SignalBinding isOnce:' + this._isOnce +', isBound:'+ this.isBound() +', active:' + this.active + ']';
        }

    };


/*global SignalBinding:false*/

    // Signal --------------------------------------------------------
    //================================================================

    function validateListener(listener, fnName) {
        if (typeof listener !== 'function') {
            throw new Error( 'listener is a required param of {fn}() and should be a Function.'.replace('{fn}', fnName) );
        }
    }

    /**
     * Custom event broadcaster
     * <br />- inspired by Robert Penner's AS3 Signals.
     * @name Signal
     * @author Miller Medeiros
     * @constructor
     */
    function Signal() {
        /**
         * @type Array.<SignalBinding>
         * @private
         */
        this._bindings = [];
        this._prevParams = null;

        // enforce dispatch to aways work on same context (#47)
        var self = this;
        this.dispatch = function(){
            Signal.prototype.dispatch.apply(self, arguments);
        };
    }

    Signal.prototype = {

        /**
         * Signals Version Number
         * @type String
         * @const
         */
        VERSION : '1.0.0',

        /**
         * If Signal should keep record of previously dispatched parameters and
         * automatically execute listener during `add()`/`addOnce()` if Signal was
         * already dispatched before.
         * @type boolean
         */
        memorize : false,

        /**
         * @type boolean
         * @private
         */
        _shouldPropagate : true,

        /**
         * If Signal is active and should broadcast events.
         * <p><strong>IMPORTANT:</strong> Setting this property during a dispatch will only affect the next dispatch, if you want to stop the propagation of a signal use `halt()` instead.</p>
         * @type boolean
         */
        active : true,

        /**
         * @param {Function} listener
         * @param {boolean} isOnce
         * @param {Object} [listenerContext]
         * @param {Number} [priority]
         * @return {SignalBinding}
         * @private
         */
        _registerListener : function (listener, isOnce, listenerContext, priority) {

            var prevIndex = this._indexOfListener(listener, listenerContext),
                binding;

            if (prevIndex !== -1) {
                binding = this._bindings[prevIndex];
                if (binding.isOnce() !== isOnce) {
                    throw new Error('You cannot add'+ (isOnce? '' : 'Once') +'() then add'+ (!isOnce? '' : 'Once') +'() the same listener without removing the relationship first.');
                }
            } else {
                binding = new SignalBinding(this, listener, isOnce, listenerContext, priority);
                this._addBinding(binding);
            }

            if(this.memorize && this._prevParams){
                binding.execute(this._prevParams);
            }

            return binding;
        },

        /**
         * @param {SignalBinding} binding
         * @private
         */
        _addBinding : function (binding) {
            //simplified insertion sort
            var n = this._bindings.length;
            do { --n; } while (this._bindings[n] && binding._priority <= this._bindings[n]._priority);
            this._bindings.splice(n + 1, 0, binding);
        },

        /**
         * @param {Function} listener
         * @return {number}
         * @private
         */
        _indexOfListener : function (listener, context) {
            var n = this._bindings.length,
                cur;
            while (n--) {
                cur = this._bindings[n];
                if (cur._listener === listener && cur.context === context) {
                    return n;
                }
            }
            return -1;
        },

        /**
         * Check if listener was attached to Signal.
         * @param {Function} listener
         * @param {Object} [context]
         * @return {boolean} if Signal has the specified listener.
         */
        has : function (listener, context) {
            return this._indexOfListener(listener, context) !== -1;
        },

        /**
         * Add a listener to the signal.
         * @param {Function} listener Signal handler function.
         * @param {Object} [listenerContext] Context on which listener will be executed (object that should represent the `this` variable inside listener function).
         * @param {Number} [priority] The priority level of the event listener. Listeners with higher priority will be executed before listeners with lower priority. Listeners with same priority level will be executed at the same order as they were added. (default = 0)
         * @return {SignalBinding} An Object representing the binding between the Signal and listener.
         */
        add : function (listener, listenerContext, priority) {
            validateListener(listener, 'add');
            return this._registerListener(listener, false, listenerContext, priority);
        },

        /**
         * Add listener to the signal that should be removed after first execution (will be executed only once).
         * @param {Function} listener Signal handler function.
         * @param {Object} [listenerContext] Context on which listener will be executed (object that should represent the `this` variable inside listener function).
         * @param {Number} [priority] The priority level of the event listener. Listeners with higher priority will be executed before listeners with lower priority. Listeners with same priority level will be executed at the same order as they were added. (default = 0)
         * @return {SignalBinding} An Object representing the binding between the Signal and listener.
         */
        addOnce : function (listener, listenerContext, priority) {
            validateListener(listener, 'addOnce');
            return this._registerListener(listener, true, listenerContext, priority);
        },

        /**
         * Remove a single listener from the dispatch queue.
         * @param {Function} listener Handler function that should be removed.
         * @param {Object} [context] Execution context (since you can add the same handler multiple times if executing in a different context).
         * @return {Function} Listener handler function.
         */
        remove : function (listener, context) {
            validateListener(listener, 'remove');

            var i = this._indexOfListener(listener, context);
            if (i !== -1) {
                this._bindings[i]._destroy(); //no reason to a SignalBinding exist if it isn't attached to a signal
                this._bindings.splice(i, 1);
            }
            return listener;
        },

        /**
         * Remove all listeners from the Signal.
         */
        removeAll : function () {
            var n = this._bindings.length;
            while (n--) {
                this._bindings[n]._destroy();
            }
            this._bindings.length = 0;
        },

        /**
         * @return {number} Number of listeners attached to the Signal.
         */
        getNumListeners : function () {
            return this._bindings.length;
        },

        /**
         * Stop propagation of the event, blocking the dispatch to next listeners on the queue.
         * <p><strong>IMPORTANT:</strong> should be called only during signal dispatch, calling it before/after dispatch won't affect signal broadcast.</p>
         * @see Signal.prototype.disable
         */
        halt : function () {
            this._shouldPropagate = false;
        },

        /**
         * Dispatch/Broadcast Signal to all listeners added to the queue.
         * @param {...*} [params] Parameters that should be passed to each handler.
         */
        dispatch : function (params) {
            if (! this.active) {
                return;
            }

            var paramsArr = Array.prototype.slice.call(arguments),
                n = this._bindings.length,
                bindings;

            if (this.memorize) {
                this._prevParams = paramsArr;
            }

            if (! n) {
                //should come after memorize
                return;
            }

            bindings = this._bindings.slice(); //clone array in case add/remove items during dispatch
            this._shouldPropagate = true; //in case `halt` was called before dispatch or during the previous dispatch.

            //execute all callbacks until end of the list or until a callback returns `false` or stops propagation
            //reverse loop since listeners with higher priority will be added at the end of the list
            do { n--; } while (bindings[n] && this._shouldPropagate && bindings[n].execute(paramsArr) !== false);
        },

        /**
         * Forget memorized arguments.
         * @see Signal.memorize
         */
        forget : function(){
            this._prevParams = null;
        },

        /**
         * Remove all bindings from signal and destroy any reference to external objects (destroy Signal object).
         * <p><strong>IMPORTANT:</strong> calling any method on the signal instance after calling dispose will throw errors.</p>
         */
        dispose : function () {
            this.removeAll();
            delete this._bindings;
            delete this._prevParams;
        },

        /**
         * @return {string} String representation of the object.
         */
        toString : function () {
            return '[Signal active:'+ this.active +' numListeners:'+ this.getNumListeners() +']';
        }

    };


    // Namespace -----------------------------------------------------
    //================================================================

    /**
     * Signals namespace
     * @namespace
     * @name signals
     */
    var signals = Signal;

    /**
     * Custom event broadcaster
     * @see Signal
     */
    // alias for backwards compatibility (see #gh-44)
    signals.Signal = Signal;



    //exports to multiple environments
    if(typeof define === 'function' && define.amd){ //AMD
        define(function () { return signals; });
    } else if (typeof module !== 'undefined' && module.exports){ //node
        module.exports = signals;
    } else { //browser
        //use string because of Google closure compiler ADVANCED_MODE
        /*jslint sub:true */
        global['signals'] = signals;
    }

}(this));

/*
** Copyright (c) 2012 The Khronos Group Inc.
**
** Permission is hereby granted, free of charge, to any person obtaining a
** copy of this software and/or associated documentation files (the
** "Materials"), to deal in the Materials without restriction, including
** without limitation the rights to use, copy, modify, merge, publish,
** distribute, sublicense, and/or sell copies of the Materials, and to
** permit persons to whom the Materials are furnished to do so, subject to
** the following conditions:
**
** The above copyright notice and this permission notice shall be included
** in all copies or substantial portions of the Materials.
**
** THE MATERIALS ARE PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
** EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
** MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
** IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
** CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
** TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
** MATERIALS OR THE USE OR OTHER DEALINGS IN THE MATERIALS.
*/

// Various functions for helping debug WebGL apps.

WebGLDebugUtils = function() {

/**
 * Wrapped logging function.
 * @param {string} msg Message to log.
 */
var log = function(msg) {
  if (window.console && window.console.log) {
    window.console.log(msg);
  }
};

/**
 * Wrapped error logging function.
 * @param {string} msg Message to log.
 */
var error = function(msg) {
  if (window.console && window.console.error) {
    window.console.error(msg);
  } else {
    log(msg);
  }
};

/**
 * Which arguements are enums.
 * @type {!Object.<number, string>}
 */
var glValidEnumContexts = {

  // Generic setters and getters

  'enable': { 0:true },
  'disable': { 0:true },
  'getParameter': { 0:true },

  // Rendering

  'drawArrays': { 0:true },
  'drawElements': { 0:true, 2:true },

  // Shaders

  'createShader': { 0:true },
  'getShaderParameter': { 1:true },
  'getProgramParameter': { 1:true },

  // Vertex attributes

  'getVertexAttrib': { 1:true },
  'vertexAttribPointer': { 2:true },

  // Textures

  'bindTexture': { 0:true },
  'activeTexture': { 0:true },
  'getTexParameter': { 0:true, 1:true },
  'texParameterf': { 0:true, 1:true },
  'texParameteri': { 0:true, 1:true, 2:true },
  'texImage2D': { 0:true, 2:true, 6:true, 7:true },
  'texSubImage2D': { 0:true, 6:true, 7:true },
  'copyTexImage2D': { 0:true, 2:true },
  'copyTexSubImage2D': { 0:true },
  'generateMipmap': { 0:true },

  // Buffer objects

  'bindBuffer': { 0:true },
  'bufferData': { 0:true, 2:true },
  'bufferSubData': { 0:true },
  'getBufferParameter': { 0:true, 1:true },

  // Renderbuffers and framebuffers

  'pixelStorei': { 0:true, 1:true },
  'readPixels': { 4:true, 5:true },
  'bindRenderbuffer': { 0:true },
  'bindFramebuffer': { 0:true },
  'checkFramebufferStatus': { 0:true },
  'framebufferRenderbuffer': { 0:true, 1:true, 2:true },
  'framebufferTexture2D': { 0:true, 1:true, 2:true },
  'getFramebufferAttachmentParameter': { 0:true, 1:true, 2:true },
  'getRenderbufferParameter': { 0:true, 1:true },
  'renderbufferStorage': { 0:true, 1:true },

  // Frame buffer operations (clear, blend, depth test, stencil)

  'clear': { 0:true },
  'depthFunc': { 0:true },
  'blendFunc': { 0:true, 1:true },
  'blendFuncSeparate': { 0:true, 1:true, 2:true, 3:true },
  'blendEquation': { 0:true },
  'blendEquationSeparate': { 0:true, 1:true },
  'stencilFunc': { 0:true },
  'stencilFuncSeparate': { 0:true, 1:true },
  'stencilMaskSeparate': { 0:true },
  'stencilOp': { 0:true, 1:true, 2:true },
  'stencilOpSeparate': { 0:true, 1:true, 2:true, 3:true },

  // Culling

  'cullFace': { 0:true },
  'frontFace': { 0:true }
};

/**
 * Map of numbers to names.
 * @type {Object}
 */
var glEnums = null;

/**
 * Initializes this module. Safe to call more than once.
 * @param {!WebGLRenderingContext} ctx A WebGL context. If
 *    you have more than one context it doesn't matter which one
 *    you pass in, it is only used to pull out constants.
 */
function init(ctx) {
  if (glEnums == null) {
    glEnums = { };
    for (var propertyName in ctx) {
      if (typeof ctx[propertyName] == 'number') {
        glEnums[ctx[propertyName]] = propertyName;
      }
    }
  }
}

/**
 * Checks the utils have been initialized.
 */
function checkInit() {
  if (glEnums == null) {
    throw 'WebGLDebugUtils.init(ctx) not called';
  }
}

/**
 * Returns true or false if value matches any WebGL enum
 * @param {*} value Value to check if it might be an enum.
 * @return {boolean} True if value matches one of the WebGL defined enums
 */
function mightBeEnum(value) {
  checkInit();
  return (glEnums[value] !== undefined);
}

/**
 * Gets an string version of an WebGL enum.
 *
 * Example:
 *   var str = WebGLDebugUtil.glEnumToString(ctx.getError());
 *
 * @param {number} value Value to return an enum for
 * @return {string} The string version of the enum.
 */
function glEnumToString(value) {
  checkInit();
  var name = glEnums[value];
  return (name !== undefined) ? name :
      ("*UNKNOWN WebGL ENUM (0x" + value.toString(16) + ")");
}

/**
 * Returns the string version of a WebGL argument.
 * Attempts to convert enum arguments to strings.
 * @param {string} functionName the name of the WebGL function.
 * @param {number} argumentIndex the index of the argument.
 * @param {*} value The value of the argument.
 * @return {string} The value as a string.
 */
function glFunctionArgToString(functionName, argumentIndex, value) {
  var funcInfo = glValidEnumContexts[functionName];
  if (funcInfo !== undefined) {
    if (funcInfo[argumentIndex]) {
      return glEnumToString(value);
    }
  }
  if (value === null) {
    return "null";
  } else if (value === undefined) {
    return "undefined";
  } else {
    return value.toString();
  }
}

/**
 * Converts the arguments of a WebGL function to a string.
 * Attempts to convert enum arguments to strings.
 *
 * @param {string} functionName the name of the WebGL function.
 * @param {number} args The arguments.
 * @return {string} The arguments as a string.
 */
function glFunctionArgsToString(functionName, args) {
  // apparently we can't do args.join(",");
  var argStr = "";
  for (var ii = 0; ii < args.length; ++ii) {
    argStr += ((ii == 0) ? '' : ', ') +
        glFunctionArgToString(functionName, ii, args[ii]);
  }
  return argStr;
}


function makePropertyWrapper(wrapper, original, propertyName) {
  //log("wrap prop: " + propertyName);
  wrapper.__defineGetter__(propertyName, function() {
    return original[propertyName];
  });
  // TODO(gmane): this needs to handle properties that take more than
  // one value?
  wrapper.__defineSetter__(propertyName, function(value) {
    //log("set: " + propertyName);
    original[propertyName] = value;
  });
}

// Makes a function that calls a function on another object.
function makeFunctionWrapper(original, functionName) {
  //log("wrap fn: " + functionName);
  var f = original[functionName];
  return function() {
    //log("call: " + functionName);
    var result = f.apply(original, arguments);
    return result;
  };
}

/**
 * Given a WebGL context returns a wrapped context that calls
 * gl.getError after every command and calls a function if the
 * result is not gl.NO_ERROR.
 *
 * @param {!WebGLRenderingContext} ctx The webgl context to
 *        wrap.
 * @param {!function(err, funcName, args): void} opt_onErrorFunc
 *        The function to call when gl.getError returns an
 *        error. If not specified the default function calls
 *        console.log with a message.
 * @param {!function(funcName, args): void} opt_onFunc The
 *        function to call when each webgl function is called.
 *        You can use this to log all calls for example.
 */
function makeDebugContext(ctx, opt_onErrorFunc, opt_onFunc) {
  init(ctx);
  opt_onErrorFunc = opt_onErrorFunc || function(err, functionName, args) {
        // apparently we can't do args.join(",");
        var argStr = "";
        for (var ii = 0; ii < args.length; ++ii) {
          argStr += ((ii == 0) ? '' : ', ') +
              glFunctionArgToString(functionName, ii, args[ii]);
        }
        error("WebGL error "+ glEnumToString(err) + " in "+ functionName +
              "(" + argStr + ")");
      };

  // Holds booleans for each GL error so after we get the error ourselves
  // we can still return it to the client app.
  var glErrorShadow = { };

  // Makes a function that calls a WebGL function and then calls getError.
  function makeErrorWrapper(ctx, functionName) {
    return function() {
      if (opt_onFunc) {
        opt_onFunc(functionName, arguments);
      }
      var result = ctx[functionName].apply(ctx, arguments);
      var err = ctx.getError();
      if (err != 0) {
        glErrorShadow[err] = true;
        opt_onErrorFunc(err, functionName, arguments);
      }
      return result;
    };
  }

  // Make a an object that has a copy of every property of the WebGL context
  // but wraps all functions.
  var wrapper = {};
  for (var propertyName in ctx) {
    if (typeof ctx[propertyName] == 'function') {
       wrapper[propertyName] = makeErrorWrapper(ctx, propertyName);
     } else {
       makePropertyWrapper(wrapper, ctx, propertyName);
     }
  }

  // Override the getError function with one that returns our saved results.
  wrapper.getError = function() {
    for (var err in glErrorShadow) {
      if (glErrorShadow.hasOwnProperty(err)) {
        if (glErrorShadow[err]) {
          glErrorShadow[err] = false;
          return err;
        }
      }
    }
    return ctx.NO_ERROR;
  };

  return wrapper;
}

function resetToInitialState(ctx) {
  var numAttribs = ctx.getParameter(ctx.MAX_VERTEX_ATTRIBS);
  var tmp = ctx.createBuffer();
  ctx.bindBuffer(ctx.ARRAY_BUFFER, tmp);
  for (var ii = 0; ii < numAttribs; ++ii) {
    ctx.disableVertexAttribArray(ii);
    ctx.vertexAttribPointer(ii, 4, ctx.FLOAT, false, 0, 0);
    ctx.vertexAttrib1f(ii, 0);
  }
  ctx.deleteBuffer(tmp);

  var numTextureUnits = ctx.getParameter(ctx.MAX_TEXTURE_IMAGE_UNITS);
  for (var ii = 0; ii < numTextureUnits; ++ii) {
    ctx.activeTexture(ctx.TEXTURE0 + ii);
    ctx.bindTexture(ctx.TEXTURE_CUBE_MAP, null);
    ctx.bindTexture(ctx.TEXTURE_2D, null);
  }

  ctx.activeTexture(ctx.TEXTURE0);
  ctx.useProgram(null);
  ctx.bindBuffer(ctx.ARRAY_BUFFER, null);
  ctx.bindBuffer(ctx.ELEMENT_ARRAY_BUFFER, null);
  ctx.bindFramebuffer(ctx.FRAMEBUFFER, null);
  ctx.bindRenderbuffer(ctx.RENDERBUFFER, null);
  ctx.disable(ctx.BLEND);
  ctx.disable(ctx.CULL_FACE);
  ctx.disable(ctx.DEPTH_TEST);
  ctx.disable(ctx.DITHER);
  ctx.disable(ctx.SCISSOR_TEST);
  ctx.blendColor(0, 0, 0, 0);
  ctx.blendEquation(ctx.FUNC_ADD);
  ctx.blendFunc(ctx.ONE, ctx.ZERO);
  ctx.clearColor(0, 0, 0, 0);
  ctx.clearDepth(1);
  ctx.clearStencil(-1);
  ctx.colorMask(true, true, true, true);
  ctx.cullFace(ctx.BACK);
  ctx.depthFunc(ctx.LESS);
  ctx.depthMask(true);
  ctx.depthRange(0, 1);
  ctx.frontFace(ctx.CCW);
  ctx.hint(ctx.GENERATE_MIPMAP_HINT, ctx.DONT_CARE);
  ctx.lineWidth(1);
  ctx.pixelStorei(ctx.PACK_ALIGNMENT, 4);
  ctx.pixelStorei(ctx.UNPACK_ALIGNMENT, 4);
  ctx.pixelStorei(ctx.UNPACK_FLIP_Y_WEBGL, false);
  ctx.pixelStorei(ctx.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
  // TODO: Delete this IF.
  if (ctx.UNPACK_COLORSPACE_CONVERSION_WEBGL) {
    ctx.pixelStorei(ctx.UNPACK_COLORSPACE_CONVERSION_WEBGL, ctx.BROWSER_DEFAULT_WEBGL);
  }
  ctx.polygonOffset(0, 0);
  ctx.sampleCoverage(1, false);
  ctx.scissor(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.stencilFunc(ctx.ALWAYS, 0, 0xFFFFFFFF);
  ctx.stencilMask(0xFFFFFFFF);
  ctx.stencilOp(ctx.KEEP, ctx.KEEP, ctx.KEEP);
  ctx.viewport(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.clear(ctx.COLOR_BUFFER_BIT | ctx.DEPTH_BUFFER_BIT | ctx.STENCIL_BUFFER_BIT);

  // TODO: This should NOT be needed but Firefox fails with 'hint'
  while(ctx.getError());
}

function makeLostContextSimulatingCanvas(canvas) {
  var unwrappedContext_;
  var wrappedContext_;
  var onLost_ = [];
  var onRestored_ = [];
  var wrappedContext_ = {};
  var contextId_ = 1;
  var contextLost_ = false;
  var resourceId_ = 0;
  var resourceDb_ = [];
  var numCallsToLoseContext_ = 0;
  var numCalls_ = 0;
  var canRestore_ = false;
  var restoreTimeout_ = 0;

  // Holds booleans for each GL error so can simulate errors.
  var glErrorShadow_ = { };

  canvas.getContext = function(f) {
    return function() {
      var ctx = f.apply(canvas, arguments);
      // Did we get a context and is it a WebGL context?
      if (ctx instanceof WebGLRenderingContext) {
        if (ctx != unwrappedContext_) {
          if (unwrappedContext_) {
            throw "got different context"
          }
          unwrappedContext_ = ctx;
          wrappedContext_ = makeLostContextSimulatingContext(unwrappedContext_);
        }
        return wrappedContext_;
      }
      return ctx;
    }
  }(canvas.getContext);

  function wrapEvent(listener) {
    if (typeof(listener) == "function") {
      return listener;
    } else {
      return function(info) {
        listener.handleEvent(info);
      }
    }
  }

  var addOnContextLostListener = function(listener) {
    onLost_.push(wrapEvent(listener));
  };

  var addOnContextRestoredListener = function(listener) {
    onRestored_.push(wrapEvent(listener));
  };


  function wrapAddEventListener(canvas) {
    var f = canvas.addEventListener;
    canvas.addEventListener = function(type, listener, bubble) {
      switch (type) {
        case 'webglcontextlost':
          addOnContextLostListener(listener);
          break;
        case 'webglcontextrestored':
          addOnContextRestoredListener(listener);
          break;
        default:
          f.apply(canvas, arguments);
      }
    };
  }

  wrapAddEventListener(canvas);

  canvas.loseContext = function() {
    if (!contextLost_) {
      contextLost_ = true;
      numCallsToLoseContext_ = 0;
      ++contextId_;
      while (unwrappedContext_.getError());
      clearErrors();
      glErrorShadow_[unwrappedContext_.CONTEXT_LOST_WEBGL] = true;
      var event = makeWebGLContextEvent("context lost");
      var callbacks = onLost_.slice();
      setTimeout(function() {
          //log("numCallbacks:" + callbacks.length);
          for (var ii = 0; ii < callbacks.length; ++ii) {
            //log("calling callback:" + ii);
            callbacks[ii](event);
          }
          if (restoreTimeout_ >= 0) {
            setTimeout(function() {
                canvas.restoreContext();
              }, restoreTimeout_);
          }
        }, 0);
    }
  };

  canvas.restoreContext = function() {
    if (contextLost_) {
      if (onRestored_.length) {
        setTimeout(function() {
            if (!canRestore_) {
              throw "can not restore. webglcontestlost listener did not call event.preventDefault";
            }
            freeResources();
            resetToInitialState(unwrappedContext_);
            contextLost_ = false;
            numCalls_ = 0;
            canRestore_ = false;
            var callbacks = onRestored_.slice();
            var event = makeWebGLContextEvent("context restored");
            for (var ii = 0; ii < callbacks.length; ++ii) {
              callbacks[ii](event);
            }
          }, 0);
      }
    }
  };

  canvas.loseContextInNCalls = function(numCalls) {
    if (contextLost_) {
      throw "You can not ask a lost contet to be lost";
    }
    numCallsToLoseContext_ = numCalls_ + numCalls;
  };

  canvas.getNumCalls = function() {
    return numCalls_;
  };

  canvas.setRestoreTimeout = function(timeout) {
    restoreTimeout_ = timeout;
  };

  function isWebGLObject(obj) {
    //return false;
    return (obj instanceof WebGLBuffer ||
            obj instanceof WebGLFramebuffer ||
            obj instanceof WebGLProgram ||
            obj instanceof WebGLRenderbuffer ||
            obj instanceof WebGLShader ||
            obj instanceof WebGLTexture);
  }

  function checkResources(args) {
    for (var ii = 0; ii < args.length; ++ii) {
      var arg = args[ii];
      if (isWebGLObject(arg)) {
        return arg.__webglDebugContextLostId__ == contextId_;
      }
    }
    return true;
  }

  function clearErrors() {
    var k = Object.keys(glErrorShadow_);
    for (var ii = 0; ii < k.length; ++ii) {
      delete glErrorShadow_[k];
    }
  }

  function loseContextIfTime() {
    ++numCalls_;
    if (!contextLost_) {
      if (numCallsToLoseContext_ == numCalls_) {
        canvas.loseContext();
      }
    }
  }

  // Makes a function that simulates WebGL when out of context.
  function makeLostContextFunctionWrapper(ctx, functionName) {
    var f = ctx[functionName];
    return function() {
      // log("calling:" + functionName);
      // Only call the functions if the context is not lost.
      loseContextIfTime();
      if (!contextLost_) {
        //if (!checkResources(arguments)) {
        //  glErrorShadow_[wrappedContext_.INVALID_OPERATION] = true;
        //  return;
        //}
        var result = f.apply(ctx, arguments);
        return result;
      }
    };
  }

  function freeResources() {
    for (var ii = 0; ii < resourceDb_.length; ++ii) {
      var resource = resourceDb_[ii];
      if (resource instanceof WebGLBuffer) {
        unwrappedContext_.deleteBuffer(resource);
      } else if (resource instanceof WebGLFramebuffer) {
        unwrappedContext_.deleteFramebuffer(resource);
      } else if (resource instanceof WebGLProgram) {
        unwrappedContext_.deleteProgram(resource);
      } else if (resource instanceof WebGLRenderbuffer) {
        unwrappedContext_.deleteRenderbuffer(resource);
      } else if (resource instanceof WebGLShader) {
        unwrappedContext_.deleteShader(resource);
      } else if (resource instanceof WebGLTexture) {
        unwrappedContext_.deleteTexture(resource);
      }
    }
  }

  function makeWebGLContextEvent(statusMessage) {
    return {
      statusMessage: statusMessage,
      preventDefault: function() {
          canRestore_ = true;
        }
    };
  }

  return canvas;

  function makeLostContextSimulatingContext(ctx) {
    // copy all functions and properties to wrapper
    for (var propertyName in ctx) {
      if (typeof ctx[propertyName] == 'function') {
         wrappedContext_[propertyName] = makeLostContextFunctionWrapper(
             ctx, propertyName);
       } else {
         makePropertyWrapper(wrappedContext_, ctx, propertyName);
       }
    }

    // Wrap a few functions specially.
    wrappedContext_.getError = function() {
      loseContextIfTime();
      if (!contextLost_) {
        var err;
        while (err = unwrappedContext_.getError()) {
          glErrorShadow_[err] = true;
        }
      }
      for (var err in glErrorShadow_) {
        if (glErrorShadow_[err]) {
          delete glErrorShadow_[err];
          return err;
        }
      }
      return wrappedContext_.NO_ERROR;
    };

    var creationFunctions = [
      "createBuffer",
      "createFramebuffer",
      "createProgram",
      "createRenderbuffer",
      "createShader",
      "createTexture"
    ];
    for (var ii = 0; ii < creationFunctions.length; ++ii) {
      var functionName = creationFunctions[ii];
      wrappedContext_[functionName] = function(f) {
        return function() {
          loseContextIfTime();
          if (contextLost_) {
            return null;
          }
          var obj = f.apply(ctx, arguments);
          obj.__webglDebugContextLostId__ = contextId_;
          resourceDb_.push(obj);
          return obj;
        };
      }(ctx[functionName]);
    }

    var functionsThatShouldReturnNull = [
      "getActiveAttrib",
      "getActiveUniform",
      "getBufferParameter",
      "getContextAttributes",
      "getAttachedShaders",
      "getFramebufferAttachmentParameter",
      "getParameter",
      "getProgramParameter",
      "getProgramInfoLog",
      "getRenderbufferParameter",
      "getShaderParameter",
      "getShaderInfoLog",
      "getShaderSource",
      "getTexParameter",
      "getUniform",
      "getUniformLocation",
      "getVertexAttrib"
    ];
    for (var ii = 0; ii < functionsThatShouldReturnNull.length; ++ii) {
      var functionName = functionsThatShouldReturnNull[ii];
      wrappedContext_[functionName] = function(f) {
        return function() {
          loseContextIfTime();
          if (contextLost_) {
            return null;
          }
          return f.apply(ctx, arguments);
        }
      }(wrappedContext_[functionName]);
    }

    var isFunctions = [
      "isBuffer",
      "isEnabled",
      "isFramebuffer",
      "isProgram",
      "isRenderbuffer",
      "isShader",
      "isTexture"
    ];
    for (var ii = 0; ii < isFunctions.length; ++ii) {
      var functionName = isFunctions[ii];
      wrappedContext_[functionName] = function(f) {
        return function() {
          loseContextIfTime();
          if (contextLost_) {
            return false;
          }
          return f.apply(ctx, arguments);
        }
      }(wrappedContext_[functionName]);
    }

    wrappedContext_.checkFramebufferStatus = function(f) {
      return function() {
        loseContextIfTime();
        if (contextLost_) {
          return wrappedContext_.FRAMEBUFFER_UNSUPPORTED;
        }
        return f.apply(ctx, arguments);
      };
    }(wrappedContext_.checkFramebufferStatus);

    wrappedContext_.getAttribLocation = function(f) {
      return function() {
        loseContextIfTime();
        if (contextLost_) {
          return -1;
        }
        return f.apply(ctx, arguments);
      };
    }(wrappedContext_.getAttribLocation);

    wrappedContext_.getVertexAttribOffset = function(f) {
      return function() {
        loseContextIfTime();
        if (contextLost_) {
          return 0;
        }
        return f.apply(ctx, arguments);
      };
    }(wrappedContext_.getVertexAttribOffset);

    wrappedContext_.isContextLost = function() {
      return contextLost_;
    };

    return wrappedContext_;
  }
}

return {
    /**
     * Initializes this module. Safe to call more than once.
     * @param {!WebGLRenderingContext} ctx A WebGL context. If
    }
   *    you have more than one context it doesn't matter which one
   *    you pass in, it is only used to pull out constants.
   */
  'init': init,

  /**
   * Returns true or false if value matches any WebGL enum
   * @param {*} value Value to check if it might be an enum.
   * @return {boolean} True if value matches one of the WebGL defined enums
   */
  'mightBeEnum': mightBeEnum,

  /**
   * Gets an string version of an WebGL enum.
   *
   * Example:
   *   WebGLDebugUtil.init(ctx);
   *   var str = WebGLDebugUtil.glEnumToString(ctx.getError());
   *
   * @param {number} value Value to return an enum for
   * @return {string} The string version of the enum.
   */
  'glEnumToString': glEnumToString,

  /**
   * Converts the argument of a WebGL function to a string.
   * Attempts to convert enum arguments to strings.
   *
   * Example:
   *   WebGLDebugUtil.init(ctx);
   *   var str = WebGLDebugUtil.glFunctionArgToString('bindTexture', 0, gl.TEXTURE_2D);
   *
   * would return 'TEXTURE_2D'
   *
   * @param {string} functionName the name of the WebGL function.
   * @param {number} argumentIndx the index of the argument.
   * @param {*} value The value of the argument.
   * @return {string} The value as a string.
   */
  'glFunctionArgToString': glFunctionArgToString,

  /**
   * Converts the arguments of a WebGL function to a string.
   * Attempts to convert enum arguments to strings.
   *
   * @param {string} functionName the name of the WebGL function.
   * @param {number} args The arguments.
   * @return {string} The arguments as a string.
   */
  'glFunctionArgsToString': glFunctionArgsToString,

  /**
   * Given a WebGL context returns a wrapped context that calls
   * gl.getError after every command and calls a function if the
   * result is not NO_ERROR.
   *
   * You can supply your own function if you want. For example, if you'd like
   * an exception thrown on any GL error you could do this
   *
   *    function throwOnGLError(err, funcName, args) {
   *      throw WebGLDebugUtils.glEnumToString(err) +
   *            " was caused by call to " + funcName;
   *    };
   *
   *    ctx = WebGLDebugUtils.makeDebugContext(
   *        canvas.getContext("webgl"), throwOnGLError);
   *
   * @param {!WebGLRenderingContext} ctx The webgl context to wrap.
   * @param {!function(err, funcName, args): void} opt_onErrorFunc The function
   *     to call when gl.getError returns an error. If not specified the default
   *     function calls console.log with a message.
   * @param {!function(funcName, args): void} opt_onFunc The
   *     function to call when each webgl function is called. You
   *     can use this to log all calls for example.
   */
  'makeDebugContext': makeDebugContext,

  /**
   * Given a canvas element returns a wrapped canvas element that will
   * simulate lost context. The canvas returned adds the following functions.
   *
   * loseContext:
   *   simulates a lost context event.
   *
   * restoreContext:
   *   simulates the context being restored.
   *
   * lostContextInNCalls:
   *   loses the context after N gl calls.
   *
   * getNumCalls:
   *   tells you how many gl calls there have been so far.
   *
   * setRestoreTimeout:
   *   sets the number of milliseconds until the context is restored
   *   after it has been lost. Defaults to 0. Pass -1 to prevent
   *   automatic restoring.
   *
   * @param {!Canvas} canvas The canvas element to wrap.
   */
  'makeLostContextSimulatingCanvas': makeLostContextSimulatingCanvas,

  /**
   * Resets a context to the initial state.
   * @param {!WebGLRenderingContext} ctx The webgl context to
   *     reset.
   */
  'resetToInitialState': resetToInitialState
};

}();


/* Copyright (c) 2013, Brandon Jones, Colin MacKenzie IV. All rights reserved.

Redistribution and use in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:

  * Redistributions of source code must retain the above copyright notice, this
    list of conditions and the following disclaimer.
  * Redistributions in binary form must reproduce the above copyright notice,
    this list of conditions and the following disclaimer in the documentation 
    and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE 
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. */

if(!GLMAT_EPSILON) {
    var GLMAT_EPSILON = 0.000001;
}

if(!GLMAT_ARRAY_TYPE) {
    var GLMAT_ARRAY_TYPE = (typeof Float32Array !== 'undefined') ? Float32Array : Array;
}

/**
 * @class Common utilities
 * @name glMatrix
 */
var glMatrix = {};

/**
 * Sets the type of array used when creating new vectors and matricies
 *
 * @param {Type} type Array type, such as Float32Array or Array
 */
glMatrix.setMatrixArrayType = function(type) {
    GLMAT_ARRAY_TYPE = type;
}

if(typeof(exports) !== 'undefined') {
    exports.glMatrix = glMatrix;
}
/* Copyright (c) 2013, Brandon Jones, Colin MacKenzie IV. All rights reserved.

Redistribution and use in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:

  * Redistributions of source code must retain the above copyright notice, this
    list of conditions and the following disclaimer.
  * Redistributions in binary form must reproduce the above copyright notice,
    this list of conditions and the following disclaimer in the documentation 
    and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE 
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. */

/**
 * @class 2x2 Matrix
 * @name mat2
 */
var mat2 = {};

var mat2Identity = new Float32Array([
    1, 0,
    0, 1
]);

/**
 * Creates a new identity mat2
 *
 * @returns {mat2} a new 2x2 matrix
 */
mat2.create = function() {
    var out = new GLMAT_ARRAY_TYPE(4);
    out[0] = 1;
    out[1] = 0;
    out[2] = 0;
    out[3] = 1;
    return out;
};

/**
 * Creates a new mat2 initialized with values from an existing matrix
 *
 * @param {mat2} a matrix to clone
 * @returns {mat2} a new 2x2 matrix
 */
mat2.clone = function(a) {
    var out = new GLMAT_ARRAY_TYPE(4);
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    return out;
};

/**
 * Copy the values from one mat2 to another
 *
 * @param {mat2} out the receiving matrix
 * @param {mat2} a the source matrix
 * @returns {mat2} out
 */
mat2.copy = function(out, a) {
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    return out;
};

/**
 * Set a mat2 to the identity matrix
 *
 * @param {mat2} out the receiving matrix
 * @returns {mat2} out
 */
mat2.identity = function(out) {
    out[0] = 1;
    out[1] = 0;
    out[2] = 0;
    out[3] = 1;
    return out;
};

/**
 * Transpose the values of a mat2
 *
 * @param {mat2} out the receiving matrix
 * @param {mat2} a the source matrix
 * @returns {mat2} out
 */
mat2.transpose = function(out, a) {
    // If we are transposing ourselves we can skip a few steps but have to cache some values
    if (out === a) {
        var a1 = a[1];
        out[1] = a[2];
        out[2] = a1;
    } else {
        out[0] = a[0];
        out[1] = a[2];
        out[2] = a[1];
        out[3] = a[3];
    }
    
    return out;
};

/**
 * Inverts a mat2
 *
 * @param {mat2} out the receiving matrix
 * @param {mat2} a the source matrix
 * @returns {mat2} out
 */
mat2.invert = function(out, a) {
    var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3],

        // Calculate the determinant
        det = a0 * a3 - a2 * a1;

    if (!det) {
        return null;
    }
    det = 1.0 / det;
    
    out[0] =  a3 * det;
    out[1] = -a1 * det;
    out[2] = -a2 * det;
    out[3] =  a0 * det;

    return out;
};

/**
 * Calculates the adjugate of a mat2
 *
 * @param {mat2} out the receiving matrix
 * @param {mat2} a the source matrix
 * @returns {mat2} out
 */
mat2.adjoint = function(out, a) {
    // Caching this value is nessecary if out == a
    var a0 = a[0];
    out[0] =  a[3];
    out[1] = -a[1];
    out[2] = -a[2];
    out[3] =  a0;

    return out;
};

/**
 * Calculates the determinant of a mat2
 *
 * @param {mat2} a the source matrix
 * @returns {Number} determinant of a
 */
mat2.determinant = function (a) {
    return a[0] * a[3] - a[2] * a[1];
};

/**
 * Multiplies two mat2's
 *
 * @param {mat2} out the receiving matrix
 * @param {mat2} a the first operand
 * @param {mat2} b the second operand
 * @returns {mat2} out
 */
mat2.multiply = function (out, a, b) {
    var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3];
    var b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3];
    out[0] = a0 * b0 + a1 * b2;
    out[1] = a0 * b1 + a1 * b3;
    out[2] = a2 * b0 + a3 * b2;
    out[3] = a2 * b1 + a3 * b3;
    return out;
};

/**
 * Alias for {@link mat2.multiply}
 * @function
 */
mat2.mul = mat2.multiply;

/**
 * Rotates a mat2 by the given angle
 *
 * @param {mat2} out the receiving matrix
 * @param {mat2} a the matrix to rotate
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat2} out
 */
mat2.rotate = function (out, a, rad) {
    var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3],
        s = Math.sin(rad),
        c = Math.cos(rad);
    out[0] = a0 *  c + a1 * s;
    out[1] = a0 * -s + a1 * c;
    out[2] = a2 *  c + a3 * s;
    out[3] = a2 * -s + a3 * c;
    return out;
};

/**
 * Scales the mat2 by the dimensions in the given vec2
 *
 * @param {mat2} out the receiving matrix
 * @param {mat2} a the matrix to rotate
 * @param {vec2} v the vec2 to scale the matrix by
 * @returns {mat2} out
 **/
mat2.scale = function(out, a, v) {
    var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3],
        v0 = v[0], v1 = v[1];
    out[0] = a0 * v0;
    out[1] = a1 * v1;
    out[2] = a2 * v0;
    out[3] = a3 * v1;
    return out;
};

/**
 * Returns a string representation of a mat2
 *
 * @param {mat2} mat matrix to represent as a string
 * @returns {String} string representation of the matrix
 */
mat2.str = function (a) {
    return 'mat2(' + a[0] + ', ' + a[1] + ', ' + a[2] + ', ' + a[3] + ')';
};

if(typeof(exports) !== 'undefined') {
    exports.mat2 = mat2;
}

/* Copyright (c) 2013, Brandon Jones, Colin MacKenzie IV. All rights reserved.

Redistribution and use in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:

  * Redistributions of source code must retain the above copyright notice, this
    list of conditions and the following disclaimer.
  * Redistributions in binary form must reproduce the above copyright notice,
    this list of conditions and the following disclaimer in the documentation 
    and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE 
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. */

/**
 * @class 2x3 Matrix
 * @name mat2d
 * 
 * @description 
 * A mat2d contains six elements defined as:
 * <pre>
 * [a, b,
 *  c, d,
 *  tx,ty]
 * </pre>
 * This is a short form for the 3x3 matrix:
 * <pre>
 * [a, b, 0
 *  c, d, 0
 *  tx,ty,1]
 * </pre>
 * The last column is ignored so the array is shorter and operations are faster.
 */
var mat2d = {};

var mat2dIdentity = new Float32Array([
    1, 0,
    0, 1,
    0, 0
]);

/**
 * Creates a new identity mat2d
 *
 * @returns {mat2d} a new 2x3 matrix
 */
mat2d.create = function() {
    var out = new GLMAT_ARRAY_TYPE(6);
    out[0] = 1;
    out[1] = 0;
    out[2] = 0;
    out[3] = 1;
    out[4] = 0;
    out[5] = 0;
    return out;
};

/**
 * Creates a new mat2d initialized with values from an existing matrix
 *
 * @param {mat2d} a matrix to clone
 * @returns {mat2d} a new 2x3 matrix
 */
mat2d.clone = function(a) {
    var out = new GLMAT_ARRAY_TYPE(6);
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    out[4] = a[4];
    out[5] = a[5];
    return out;
};

/**
 * Copy the values from one mat2d to another
 *
 * @param {mat2d} out the receiving matrix
 * @param {mat2d} a the source matrix
 * @returns {mat2d} out
 */
mat2d.copy = function(out, a) {
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    out[4] = a[4];
    out[5] = a[5];
    return out;
};

/**
 * Set a mat2d to the identity matrix
 *
 * @param {mat2d} out the receiving matrix
 * @returns {mat2d} out
 */
mat2d.identity = function(out) {
    out[0] = 1;
    out[1] = 0;
    out[2] = 0;
    out[3] = 1;
    out[4] = 0;
    out[5] = 0;
    return out;
};

/**
 * Inverts a mat2d
 *
 * @param {mat2d} out the receiving matrix
 * @param {mat2d} a the source matrix
 * @returns {mat2d} out
 */
mat2d.invert = function(out, a) {
    var aa = a[0], ab = a[1], ac = a[2], ad = a[3],
        atx = a[4], aty = a[5];

    var det = aa * ad - ab * ac;
    if(!det){
        return null;
    }
    det = 1.0 / det;

    out[0] = ad * det;
    out[1] = -ab * det;
    out[2] = -ac * det;
    out[3] = aa * det;
    out[4] = (ac * aty - ad * atx) * det;
    out[5] = (ab * atx - aa * aty) * det;
    return out;
};

/**
 * Calculates the determinant of a mat2d
 *
 * @param {mat2d} a the source matrix
 * @returns {Number} determinant of a
 */
mat2d.determinant = function (a) {
    return a[0] * a[3] - a[1] * a[2];
};

/**
 * Multiplies two mat2d's
 *
 * @param {mat2d} out the receiving matrix
 * @param {mat2d} a the first operand
 * @param {mat2d} b the second operand
 * @returns {mat2d} out
 */
mat2d.multiply = function (out, a, b) {
    var aa = a[0], ab = a[1], ac = a[2], ad = a[3],
        atx = a[4], aty = a[5],
        ba = b[0], bb = b[1], bc = b[2], bd = b[3],
        btx = b[4], bty = b[5];

    out[0] = aa*ba + ab*bc;
    out[1] = aa*bb + ab*bd;
    out[2] = ac*ba + ad*bc;
    out[3] = ac*bb + ad*bd;
    out[4] = ba*atx + bc*aty + btx;
    out[5] = bb*atx + bd*aty + bty;
    return out;
};

/**
 * Alias for {@link mat2d.multiply}
 * @function
 */
mat2d.mul = mat2d.multiply;


/**
 * Rotates a mat2d by the given angle
 *
 * @param {mat2d} out the receiving matrix
 * @param {mat2d} a the matrix to rotate
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat2d} out
 */
mat2d.rotate = function (out, a, rad) {
    var aa = a[0],
        ab = a[1],
        ac = a[2],
        ad = a[3],
        atx = a[4],
        aty = a[5],
        st = Math.sin(rad),
        ct = Math.cos(rad);

    out[0] = aa*ct + ab*st;
    out[1] = -aa*st + ab*ct;
    out[2] = ac*ct + ad*st;
    out[3] = -ac*st + ct*ad;
    out[4] = ct*atx + st*aty;
    out[5] = ct*aty - st*atx;
    return out;
};

/**
 * Scales the mat2d by the dimensions in the given vec2
 *
 * @param {mat2d} out the receiving matrix
 * @param {mat2d} a the matrix to translate
 * @param {mat2d} v the vec2 to scale the matrix by
 * @returns {mat2d} out
 **/
mat2d.scale = function(out, a, v) {
    var vx = v[0], vy = v[1];
    out[0] = a[0] * vx;
    out[1] = a[1] * vy;
    out[2] = a[2] * vx;
    out[3] = a[3] * vy;
    out[4] = a[4] * vx;
    out[5] = a[5] * vy;
    return out;
};

/**
 * Translates the mat2d by the dimensions in the given vec2
 *
 * @param {mat2d} out the receiving matrix
 * @param {mat2d} a the matrix to translate
 * @param {mat2d} v the vec2 to translate the matrix by
 * @returns {mat2d} out
 **/
mat2d.translate = function(out, a, v) {
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    out[4] = a[4] + v[0];
    out[5] = a[5] + v[1];
    return out;
};

/**
 * Returns a string representation of a mat2d
 *
 * @param {mat2d} a matrix to represent as a string
 * @returns {String} string representation of the matrix
 */
mat2d.str = function (a) {
    return 'mat2d(' + a[0] + ', ' + a[1] + ', ' + a[2] + ', ' + 
                    a[3] + ', ' + a[4] + ', ' + a[5] + ')';
};

if(typeof(exports) !== 'undefined') {
    exports.mat2d = mat2d;
}

/* Copyright (c) 2013, Brandon Jones, Colin MacKenzie IV. All rights reserved.

Redistribution and use in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:

  * Redistributions of source code must retain the above copyright notice, this
    list of conditions and the following disclaimer.
  * Redistributions in binary form must reproduce the above copyright notice,
    this list of conditions and the following disclaimer in the documentation 
    and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE 
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. */

/**
 * @class 3x3 Matrix
 * @name mat3
 */
var mat3 = {};

var mat3Identity = new Float32Array([
    1, 0, 0,
    0, 1, 0,
    0, 0, 1
]);

/**
 * Creates a new identity mat3
 *
 * @returns {mat3} a new 3x3 matrix
 */
mat3.create = function() {
    var out = new GLMAT_ARRAY_TYPE(9);
    out[0] = 1;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 1;
    out[5] = 0;
    out[6] = 0;
    out[7] = 0;
    out[8] = 1;
    return out;
};

/**
 * Creates a new mat3 initialized with values from an existing matrix
 *
 * @param {mat3} a matrix to clone
 * @returns {mat3} a new 3x3 matrix
 */
mat3.clone = function(a) {
    var out = new GLMAT_ARRAY_TYPE(9);
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    out[4] = a[4];
    out[5] = a[5];
    out[6] = a[6];
    out[7] = a[7];
    out[8] = a[8];
    return out;
};

/**
 * Copy the values from one mat3 to another
 *
 * @param {mat3} out the receiving matrix
 * @param {mat3} a the source matrix
 * @returns {mat3} out
 */
mat3.copy = function(out, a) {
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    out[4] = a[4];
    out[5] = a[5];
    out[6] = a[6];
    out[7] = a[7];
    out[8] = a[8];
    return out;
};

/**
 * Set a mat3 to the identity matrix
 *
 * @param {mat3} out the receiving matrix
 * @returns {mat3} out
 */
mat3.identity = function(out) {
    out[0] = 1;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 1;
    out[5] = 0;
    out[6] = 0;
    out[7] = 0;
    out[8] = 1;
    return out;
};

/**
 * Transpose the values of a mat3
 *
 * @param {mat3} out the receiving matrix
 * @param {mat3} a the source matrix
 * @returns {mat3} out
 */
mat3.transpose = function(out, a) {
    // If we are transposing ourselves we can skip a few steps but have to cache some values
    if (out === a) {
        var a01 = a[1], a02 = a[2], a12 = a[5];
        out[1] = a[3];
        out[2] = a[6];
        out[3] = a01;
        out[5] = a[7];
        out[6] = a02;
        out[7] = a12;
    } else {
        out[0] = a[0];
        out[1] = a[3];
        out[2] = a[6];
        out[3] = a[1];
        out[4] = a[4];
        out[5] = a[7];
        out[6] = a[2];
        out[7] = a[5];
        out[8] = a[8];
    }
    
    return out;
};

/**
 * Inverts a mat3
 *
 * @param {mat3} out the receiving matrix
 * @param {mat3} a the source matrix
 * @returns {mat3} out
 */
mat3.invert = function(out, a) {
    var a00 = a[0], a01 = a[1], a02 = a[2],
        a10 = a[3], a11 = a[4], a12 = a[5],
        a20 = a[6], a21 = a[7], a22 = a[8],

        b01 = a22 * a11 - a12 * a21,
        b11 = -a22 * a10 + a12 * a20,
        b21 = a21 * a10 - a11 * a20,

        // Calculate the determinant
        det = a00 * b01 + a01 * b11 + a02 * b21;

    if (!det) { 
        return null; 
    }
    det = 1.0 / det;

    out[0] = b01 * det;
    out[1] = (-a22 * a01 + a02 * a21) * det;
    out[2] = (a12 * a01 - a02 * a11) * det;
    out[3] = b11 * det;
    out[4] = (a22 * a00 - a02 * a20) * det;
    out[5] = (-a12 * a00 + a02 * a10) * det;
    out[6] = b21 * det;
    out[7] = (-a21 * a00 + a01 * a20) * det;
    out[8] = (a11 * a00 - a01 * a10) * det;
    return out;
};

/**
 * Calculates the adjugate of a mat3
 *
 * @param {mat3} out the receiving matrix
 * @param {mat3} a the source matrix
 * @returns {mat3} out
 */
mat3.adjoint = function(out, a) {
    var a00 = a[0], a01 = a[1], a02 = a[2],
        a10 = a[3], a11 = a[4], a12 = a[5],
        a20 = a[6], a21 = a[7], a22 = a[8];

    out[0] = (a11 * a22 - a12 * a21);
    out[1] = (a02 * a21 - a01 * a22);
    out[2] = (a01 * a12 - a02 * a11);
    out[3] = (a12 * a20 - a10 * a22);
    out[4] = (a00 * a22 - a02 * a20);
    out[5] = (a02 * a10 - a00 * a12);
    out[6] = (a10 * a21 - a11 * a20);
    out[7] = (a01 * a20 - a00 * a21);
    out[8] = (a00 * a11 - a01 * a10);
    return out;
};

/**
 * Calculates the determinant of a mat3
 *
 * @param {mat3} a the source matrix
 * @returns {Number} determinant of a
 */
mat3.determinant = function (a) {
    var a00 = a[0], a01 = a[1], a02 = a[2],
        a10 = a[3], a11 = a[4], a12 = a[5],
        a20 = a[6], a21 = a[7], a22 = a[8];

    return a00 * (a22 * a11 - a12 * a21) + a01 * (-a22 * a10 + a12 * a20) + a02 * (a21 * a10 - a11 * a20);
};

/**
 * Multiplies two mat3's
 *
 * @param {mat3} out the receiving matrix
 * @param {mat3} a the first operand
 * @param {mat3} b the second operand
 * @returns {mat3} out
 */
mat3.multiply = function (out, a, b) {
    var a00 = a[0], a01 = a[1], a02 = a[2],
        a10 = a[3], a11 = a[4], a12 = a[5],
        a20 = a[6], a21 = a[7], a22 = a[8],

        b00 = b[0], b01 = b[1], b02 = b[2],
        b10 = b[3], b11 = b[4], b12 = b[5],
        b20 = b[6], b21 = b[7], b22 = b[8];

    out[0] = b00 * a00 + b01 * a10 + b02 * a20;
    out[1] = b00 * a01 + b01 * a11 + b02 * a21;
    out[2] = b00 * a02 + b01 * a12 + b02 * a22;

    out[3] = b10 * a00 + b11 * a10 + b12 * a20;
    out[4] = b10 * a01 + b11 * a11 + b12 * a21;
    out[5] = b10 * a02 + b11 * a12 + b12 * a22;

    out[6] = b20 * a00 + b21 * a10 + b22 * a20;
    out[7] = b20 * a01 + b21 * a11 + b22 * a21;
    out[8] = b20 * a02 + b21 * a12 + b22 * a22;
    return out;
};

/**
 * Alias for {@link mat3.multiply}
 * @function
 */
mat3.mul = mat3.multiply;

/**
 * Translate a mat3 by the given vector
 *
 * @param {mat3} out the receiving matrix
 * @param {mat3} a the matrix to translate
 * @param {vec2} v vector to translate by
 * @returns {mat3} out
 */
mat3.translate = function(out, a, v) {
    var a00 = a[0], a01 = a[1], a02 = a[2],
        a10 = a[3], a11 = a[4], a12 = a[5],
        a20 = a[6], a21 = a[7], a22 = a[8],
        x = v[0], y = v[1];

    out[0] = a00;
    out[1] = a01;
    out[2] = a02;

    out[3] = a10;
    out[4] = a11;
    out[5] = a12;

    out[6] = x * a00 + y * a10 + a20;
    out[7] = x * a01 + y * a11 + a21;
    out[8] = x * a02 + y * a12 + a22;
    return out;
};

/**
 * Rotates a mat3 by the given angle
 *
 * @param {mat3} out the receiving matrix
 * @param {mat3} a the matrix to rotate
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat3} out
 */
mat3.rotate = function (out, a, rad) {
    var a00 = a[0], a01 = a[1], a02 = a[2],
        a10 = a[3], a11 = a[4], a12 = a[5],
        a20 = a[6], a21 = a[7], a22 = a[8],

        s = Math.sin(rad),
        c = Math.cos(rad);

    out[0] = c * a00 + s * a10;
    out[1] = c * a01 + s * a11;
    out[2] = c * a02 + s * a12;

    out[3] = c * a10 - s * a00;
    out[4] = c * a11 - s * a01;
    out[5] = c * a12 - s * a02;

    out[6] = a20;
    out[7] = a21;
    out[8] = a22;
    return out;
};

/**
 * Scales the mat3 by the dimensions in the given vec2
 *
 * @param {mat3} out the receiving matrix
 * @param {mat3} a the matrix to rotate
 * @param {vec2} v the vec2 to scale the matrix by
 * @returns {mat3} out
 **/
mat3.scale = function(out, a, v) {
    var x = v[0], y = v[2];

    out[0] = x * a[0];
    out[1] = x * a[1];
    out[2] = x * a[2];

    out[3] = y * a[3];
    out[4] = y * a[4];
    out[5] = y * a[5];

    out[6] = a[6];
    out[7] = a[7];
    out[8] = a[8];
    return out;
};

/**
 * Copies the values from a mat2d into a mat3
 *
 * @param {mat3} out the receiving matrix
 * @param {mat3} a the matrix to rotate
 * @param {vec2} v the vec2 to scale the matrix by
 * @returns {mat3} out
 **/
mat3.fromMat2d = function(out, a) {
    out[0] = a[0];
    out[1] = a[1];
    out[2] = 0;

    out[3] = a[2];
    out[4] = a[3];
    out[5] = 0;

    out[6] = a[4];
    out[7] = a[5];
    out[8] = 1;
    return out;
};

/**
* Calculates a 3x3 matrix from the given quaternion
*
* @param {mat3} out mat3 receiving operation result
* @param {quat} q Quaternion to create matrix from
*
* @returns {mat3} out
*/
mat3.fromQuat = function (out, q) {
    var x = q[0], y = q[1], z = q[2], w = q[3],
        x2 = x + x,
        y2 = y + y,
        z2 = z + z,

        xx = x * x2,
        xy = x * y2,
        xz = x * z2,
        yy = y * y2,
        yz = y * z2,
        zz = z * z2,
        wx = w * x2,
        wy = w * y2,
        wz = w * z2;

    out[0] = 1 - (yy + zz);
    out[1] = xy + wz;
    out[2] = xz - wy;

    out[3] = xy - wz;
    out[4] = 1 - (xx + zz);
    out[5] = yz + wx;

    out[6] = xz + wy;
    out[7] = yz - wx;
    out[8] = 1 - (xx + yy);

    return out;
};

/**
 * Returns a string representation of a mat3
 *
 * @param {mat3} mat matrix to represent as a string
 * @returns {String} string representation of the matrix
 */
mat3.str = function (a) {
    return 'mat3(' + a[0] + ', ' + a[1] + ', ' + a[2] + ', ' + 
                    a[3] + ', ' + a[4] + ', ' + a[5] + ', ' + 
                    a[6] + ', ' + a[7] + ', ' + a[8] + ')';
};

if(typeof(exports) !== 'undefined') {
    exports.mat3 = mat3;
}

/* Copyright (c) 2013, Brandon Jones, Colin MacKenzie IV. All rights reserved.

Redistribution and use in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:

  * Redistributions of source code must retain the above copyright notice, this
    list of conditions and the following disclaimer.
  * Redistributions in binary form must reproduce the above copyright notice,
    this list of conditions and the following disclaimer in the documentation 
    and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE 
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. */

/**
 * @class 4x4 Matrix
 * @name mat4
 */
var mat4 = {};

var mat4Identity = new Float32Array([
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1
]);

/**
 * Creates a new identity mat4
 *
 * @returns {mat4} a new 4x4 matrix
 */
mat4.create = function() {
    var out = new GLMAT_ARRAY_TYPE(16);
    out[0] = 1;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = 1;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[10] = 1;
    out[11] = 0;
    out[12] = 0;
    out[13] = 0;
    out[14] = 0;
    out[15] = 1;
    return out;
};

/**
 * Creates a new mat4 initialized with values from an existing matrix
 *
 * @param {mat4} a matrix to clone
 * @returns {mat4} a new 4x4 matrix
 */
mat4.clone = function(a) {
    var out = new GLMAT_ARRAY_TYPE(16);
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    out[4] = a[4];
    out[5] = a[5];
    out[6] = a[6];
    out[7] = a[7];
    out[8] = a[8];
    out[9] = a[9];
    out[10] = a[10];
    out[11] = a[11];
    out[12] = a[12];
    out[13] = a[13];
    out[14] = a[14];
    out[15] = a[15];
    return out;
};

/**
 * Copy the values from one mat4 to another
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the source matrix
 * @returns {mat4} out
 */
mat4.copy = function(out, a) {
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    out[4] = a[4];
    out[5] = a[5];
    out[6] = a[6];
    out[7] = a[7];
    out[8] = a[8];
    out[9] = a[9];
    out[10] = a[10];
    out[11] = a[11];
    out[12] = a[12];
    out[13] = a[13];
    out[14] = a[14];
    out[15] = a[15];
    return out;
};

/**
 * Set a mat4 to the identity matrix
 *
 * @param {mat4} out the receiving matrix
 * @returns {mat4} out
 */
mat4.identity = function(out) {
    out[0] = 1;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = 1;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[10] = 1;
    out[11] = 0;
    out[12] = 0;
    out[13] = 0;
    out[14] = 0;
    out[15] = 1;
    return out;
};

/**
 * Transpose the values of a mat4
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the source matrix
 * @returns {mat4} out
 */
mat4.transpose = function(out, a) {
    // If we are transposing ourselves we can skip a few steps but have to cache some values
    if (out === a) {
        var a01 = a[1], a02 = a[2], a03 = a[3],
            a12 = a[6], a13 = a[7],
            a23 = a[11];

        out[1] = a[4];
        out[2] = a[8];
        out[3] = a[12];
        out[4] = a01;
        out[6] = a[9];
        out[7] = a[13];
        out[8] = a02;
        out[9] = a12;
        out[11] = a[14];
        out[12] = a03;
        out[13] = a13;
        out[14] = a23;
    } else {
        out[0] = a[0];
        out[1] = a[4];
        out[2] = a[8];
        out[3] = a[12];
        out[4] = a[1];
        out[5] = a[5];
        out[6] = a[9];
        out[7] = a[13];
        out[8] = a[2];
        out[9] = a[6];
        out[10] = a[10];
        out[11] = a[14];
        out[12] = a[3];
        out[13] = a[7];
        out[14] = a[11];
        out[15] = a[15];
    }
    
    return out;
};

/**
 * Inverts a mat4
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the source matrix
 * @returns {mat4} out
 */
mat4.invert = function(out, a) {
    var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3],
        a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7],
        a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11],
        a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15],

        b00 = a00 * a11 - a01 * a10,
        b01 = a00 * a12 - a02 * a10,
        b02 = a00 * a13 - a03 * a10,
        b03 = a01 * a12 - a02 * a11,
        b04 = a01 * a13 - a03 * a11,
        b05 = a02 * a13 - a03 * a12,
        b06 = a20 * a31 - a21 * a30,
        b07 = a20 * a32 - a22 * a30,
        b08 = a20 * a33 - a23 * a30,
        b09 = a21 * a32 - a22 * a31,
        b10 = a21 * a33 - a23 * a31,
        b11 = a22 * a33 - a23 * a32,

        // Calculate the determinant
        det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;

    if (!det) { 
        return null; 
    }
    det = 1.0 / det;

    out[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
    out[1] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
    out[2] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
    out[3] = (a22 * b04 - a21 * b05 - a23 * b03) * det;
    out[4] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
    out[5] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
    out[6] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
    out[7] = (a20 * b05 - a22 * b02 + a23 * b01) * det;
    out[8] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
    out[9] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
    out[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
    out[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det;
    out[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det;
    out[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det;
    out[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det;
    out[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det;

    return out;
};

/**
 * Calculates the adjugate of a mat4
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the source matrix
 * @returns {mat4} out
 */
mat4.adjoint = function(out, a) {
    var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3],
        a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7],
        a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11],
        a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];

    out[0]  =  (a11 * (a22 * a33 - a23 * a32) - a21 * (a12 * a33 - a13 * a32) + a31 * (a12 * a23 - a13 * a22));
    out[1]  = -(a01 * (a22 * a33 - a23 * a32) - a21 * (a02 * a33 - a03 * a32) + a31 * (a02 * a23 - a03 * a22));
    out[2]  =  (a01 * (a12 * a33 - a13 * a32) - a11 * (a02 * a33 - a03 * a32) + a31 * (a02 * a13 - a03 * a12));
    out[3]  = -(a01 * (a12 * a23 - a13 * a22) - a11 * (a02 * a23 - a03 * a22) + a21 * (a02 * a13 - a03 * a12));
    out[4]  = -(a10 * (a22 * a33 - a23 * a32) - a20 * (a12 * a33 - a13 * a32) + a30 * (a12 * a23 - a13 * a22));
    out[5]  =  (a00 * (a22 * a33 - a23 * a32) - a20 * (a02 * a33 - a03 * a32) + a30 * (a02 * a23 - a03 * a22));
    out[6]  = -(a00 * (a12 * a33 - a13 * a32) - a10 * (a02 * a33 - a03 * a32) + a30 * (a02 * a13 - a03 * a12));
    out[7]  =  (a00 * (a12 * a23 - a13 * a22) - a10 * (a02 * a23 - a03 * a22) + a20 * (a02 * a13 - a03 * a12));
    out[8]  =  (a10 * (a21 * a33 - a23 * a31) - a20 * (a11 * a33 - a13 * a31) + a30 * (a11 * a23 - a13 * a21));
    out[9]  = -(a00 * (a21 * a33 - a23 * a31) - a20 * (a01 * a33 - a03 * a31) + a30 * (a01 * a23 - a03 * a21));
    out[10] =  (a00 * (a11 * a33 - a13 * a31) - a10 * (a01 * a33 - a03 * a31) + a30 * (a01 * a13 - a03 * a11));
    out[11] = -(a00 * (a11 * a23 - a13 * a21) - a10 * (a01 * a23 - a03 * a21) + a20 * (a01 * a13 - a03 * a11));
    out[12] = -(a10 * (a21 * a32 - a22 * a31) - a20 * (a11 * a32 - a12 * a31) + a30 * (a11 * a22 - a12 * a21));
    out[13] =  (a00 * (a21 * a32 - a22 * a31) - a20 * (a01 * a32 - a02 * a31) + a30 * (a01 * a22 - a02 * a21));
    out[14] = -(a00 * (a11 * a32 - a12 * a31) - a10 * (a01 * a32 - a02 * a31) + a30 * (a01 * a12 - a02 * a11));
    out[15] =  (a00 * (a11 * a22 - a12 * a21) - a10 * (a01 * a22 - a02 * a21) + a20 * (a01 * a12 - a02 * a11));
    return out;
};

/**
 * Calculates the determinant of a mat4
 *
 * @param {mat4} a the source matrix
 * @returns {Number} determinant of a
 */
mat4.determinant = function (a) {
    var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3],
        a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7],
        a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11],
        a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15],

        b00 = a00 * a11 - a01 * a10,
        b01 = a00 * a12 - a02 * a10,
        b02 = a00 * a13 - a03 * a10,
        b03 = a01 * a12 - a02 * a11,
        b04 = a01 * a13 - a03 * a11,
        b05 = a02 * a13 - a03 * a12,
        b06 = a20 * a31 - a21 * a30,
        b07 = a20 * a32 - a22 * a30,
        b08 = a20 * a33 - a23 * a30,
        b09 = a21 * a32 - a22 * a31,
        b10 = a21 * a33 - a23 * a31,
        b11 = a22 * a33 - a23 * a32;

    // Calculate the determinant
    return b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
};

/**
 * Multiplies two mat4's
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the first operand
 * @param {mat4} b the second operand
 * @returns {mat4} out
 */
mat4.multiply = function (out, a, b) {
    var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3],
        a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7],
        a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11],
        a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];

    // Cache only the current line of the second matrix
    var b0  = b[0], b1 = b[1], b2 = b[2], b3 = b[3];  
    out[0] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
    out[1] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
    out[2] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
    out[3] = b0*a03 + b1*a13 + b2*a23 + b3*a33;

    b0 = b[4]; b1 = b[5]; b2 = b[6]; b3 = b[7];
    out[4] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
    out[5] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
    out[6] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
    out[7] = b0*a03 + b1*a13 + b2*a23 + b3*a33;

    b0 = b[8]; b1 = b[9]; b2 = b[10]; b3 = b[11];
    out[8] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
    out[9] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
    out[10] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
    out[11] = b0*a03 + b1*a13 + b2*a23 + b3*a33;

    b0 = b[12]; b1 = b[13]; b2 = b[14]; b3 = b[15];
    out[12] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
    out[13] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
    out[14] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
    out[15] = b0*a03 + b1*a13 + b2*a23 + b3*a33;
    return out;
};

/**
 * Alias for {@link mat4.multiply}
 * @function
 */
mat4.mul = mat4.multiply;

/**
 * Translate a mat4 by the given vector
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the matrix to translate
 * @param {vec3} v vector to translate by
 * @returns {mat4} out
 */
mat4.translate = function (out, a, v) {
    var x = v[0], y = v[1], z = v[2],
        a00, a01, a02, a03,
        a10, a11, a12, a13,
        a20, a21, a22, a23;

    if (a === out) {
        out[12] = a[0] * x + a[4] * y + a[8] * z + a[12];
        out[13] = a[1] * x + a[5] * y + a[9] * z + a[13];
        out[14] = a[2] * x + a[6] * y + a[10] * z + a[14];
        out[15] = a[3] * x + a[7] * y + a[11] * z + a[15];
    } else {
        a00 = a[0]; a01 = a[1]; a02 = a[2]; a03 = a[3];
        a10 = a[4]; a11 = a[5]; a12 = a[6]; a13 = a[7];
        a20 = a[8]; a21 = a[9]; a22 = a[10]; a23 = a[11];

        out[0] = a00; out[1] = a01; out[2] = a02; out[3] = a03;
        out[4] = a10; out[5] = a11; out[6] = a12; out[7] = a13;
        out[8] = a20; out[9] = a21; out[10] = a22; out[11] = a23;

        out[12] = a00 * x + a10 * y + a20 * z + a[12];
        out[13] = a01 * x + a11 * y + a21 * z + a[13];
        out[14] = a02 * x + a12 * y + a22 * z + a[14];
        out[15] = a03 * x + a13 * y + a23 * z + a[15];
    }

    return out;
};

/**
 * Scales the mat4 by the dimensions in the given vec3
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the matrix to scale
 * @param {vec3} v the vec3 to scale the matrix by
 * @returns {mat4} out
 **/
mat4.scale = function(out, a, v) {
    var x = v[0], y = v[1], z = v[2];

    out[0] = a[0] * x;
    out[1] = a[1] * x;
    out[2] = a[2] * x;
    out[3] = a[3] * x;
    out[4] = a[4] * y;
    out[5] = a[5] * y;
    out[6] = a[6] * y;
    out[7] = a[7] * y;
    out[8] = a[8] * z;
    out[9] = a[9] * z;
    out[10] = a[10] * z;
    out[11] = a[11] * z;
    out[12] = a[12];
    out[13] = a[13];
    out[14] = a[14];
    out[15] = a[15];
    return out;
};

/**
 * Rotates a mat4 by the given angle
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the matrix to rotate
 * @param {Number} rad the angle to rotate the matrix by
 * @param {vec3} axis the axis to rotate around
 * @returns {mat4} out
 */
mat4.rotate = function (out, a, rad, axis) {
    var x = axis[0], y = axis[1], z = axis[2],
        len = Math.sqrt(x * x + y * y + z * z),
        s, c, t,
        a00, a01, a02, a03,
        a10, a11, a12, a13,
        a20, a21, a22, a23,
        b00, b01, b02,
        b10, b11, b12,
        b20, b21, b22;

    if (Math.abs(len) < GLMAT_EPSILON) { return null; }
    
    len = 1 / len;
    x *= len;
    y *= len;
    z *= len;

    s = Math.sin(rad);
    c = Math.cos(rad);
    t = 1 - c;

    a00 = a[0]; a01 = a[1]; a02 = a[2]; a03 = a[3];
    a10 = a[4]; a11 = a[5]; a12 = a[6]; a13 = a[7];
    a20 = a[8]; a21 = a[9]; a22 = a[10]; a23 = a[11];

    // Construct the elements of the rotation matrix
    b00 = x * x * t + c; b01 = y * x * t + z * s; b02 = z * x * t - y * s;
    b10 = x * y * t - z * s; b11 = y * y * t + c; b12 = z * y * t + x * s;
    b20 = x * z * t + y * s; b21 = y * z * t - x * s; b22 = z * z * t + c;

    // Perform rotation-specific matrix multiplication
    out[0] = a00 * b00 + a10 * b01 + a20 * b02;
    out[1] = a01 * b00 + a11 * b01 + a21 * b02;
    out[2] = a02 * b00 + a12 * b01 + a22 * b02;
    out[3] = a03 * b00 + a13 * b01 + a23 * b02;
    out[4] = a00 * b10 + a10 * b11 + a20 * b12;
    out[5] = a01 * b10 + a11 * b11 + a21 * b12;
    out[6] = a02 * b10 + a12 * b11 + a22 * b12;
    out[7] = a03 * b10 + a13 * b11 + a23 * b12;
    out[8] = a00 * b20 + a10 * b21 + a20 * b22;
    out[9] = a01 * b20 + a11 * b21 + a21 * b22;
    out[10] = a02 * b20 + a12 * b21 + a22 * b22;
    out[11] = a03 * b20 + a13 * b21 + a23 * b22;

    if (a !== out) { // If the source and destination differ, copy the unchanged last row
        out[12] = a[12];
        out[13] = a[13];
        out[14] = a[14];
        out[15] = a[15];
    }
    return out;
};

/**
 * Rotates a matrix by the given angle around the X axis
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the matrix to rotate
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat4} out
 */
mat4.rotateX = function (out, a, rad) {
    var s = Math.sin(rad),
        c = Math.cos(rad),
        a10 = a[4],
        a11 = a[5],
        a12 = a[6],
        a13 = a[7],
        a20 = a[8],
        a21 = a[9],
        a22 = a[10],
        a23 = a[11];

    if (a !== out) { // If the source and destination differ, copy the unchanged rows
        out[0]  = a[0];
        out[1]  = a[1];
        out[2]  = a[2];
        out[3]  = a[3];
        out[12] = a[12];
        out[13] = a[13];
        out[14] = a[14];
        out[15] = a[15];
    }

    // Perform axis-specific matrix multiplication
    out[4] = a10 * c + a20 * s;
    out[5] = a11 * c + a21 * s;
    out[6] = a12 * c + a22 * s;
    out[7] = a13 * c + a23 * s;
    out[8] = a20 * c - a10 * s;
    out[9] = a21 * c - a11 * s;
    out[10] = a22 * c - a12 * s;
    out[11] = a23 * c - a13 * s;
    return out;
};

/**
 * Rotates a matrix by the given angle around the Y axis
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the matrix to rotate
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat4} out
 */
mat4.rotateY = function (out, a, rad) {
    var s = Math.sin(rad),
        c = Math.cos(rad),
        a00 = a[0],
        a01 = a[1],
        a02 = a[2],
        a03 = a[3],
        a20 = a[8],
        a21 = a[9],
        a22 = a[10],
        a23 = a[11];

    if (a !== out) { // If the source and destination differ, copy the unchanged rows
        out[4]  = a[4];
        out[5]  = a[5];
        out[6]  = a[6];
        out[7]  = a[7];
        out[12] = a[12];
        out[13] = a[13];
        out[14] = a[14];
        out[15] = a[15];
    }

    // Perform axis-specific matrix multiplication
    out[0] = a00 * c - a20 * s;
    out[1] = a01 * c - a21 * s;
    out[2] = a02 * c - a22 * s;
    out[3] = a03 * c - a23 * s;
    out[8] = a00 * s + a20 * c;
    out[9] = a01 * s + a21 * c;
    out[10] = a02 * s + a22 * c;
    out[11] = a03 * s + a23 * c;
    return out;
};

/**
 * Rotates a matrix by the given angle around the Z axis
 *
 * @param {mat4} out the receiving matrix
 * @param {mat4} a the matrix to rotate
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat4} out
 */
mat4.rotateZ = function (out, a, rad) {
    var s = Math.sin(rad),
        c = Math.cos(rad),
        a00 = a[0],
        a01 = a[1],
        a02 = a[2],
        a03 = a[3],
        a10 = a[4],
        a11 = a[5],
        a12 = a[6],
        a13 = a[7];

    if (a !== out) { // If the source and destination differ, copy the unchanged last row
        out[8]  = a[8];
        out[9]  = a[9];
        out[10] = a[10];
        out[11] = a[11];
        out[12] = a[12];
        out[13] = a[13];
        out[14] = a[14];
        out[15] = a[15];
    }

    // Perform axis-specific matrix multiplication
    out[0] = a00 * c + a10 * s;
    out[1] = a01 * c + a11 * s;
    out[2] = a02 * c + a12 * s;
    out[3] = a03 * c + a13 * s;
    out[4] = a10 * c - a00 * s;
    out[5] = a11 * c - a01 * s;
    out[6] = a12 * c - a02 * s;
    out[7] = a13 * c - a03 * s;
    return out;
};

/**
 * Creates a matrix from a quaternion rotation and vector translation
 * This is equivalent to (but much faster than):
 *
 *     mat4.identity(dest);
 *     mat4.translate(dest, vec);
 *     var quatMat = mat4.create();
 *     quat4.toMat4(quat, quatMat);
 *     mat4.multiply(dest, quatMat);
 *
 * @param {mat4} out mat4 receiving operation result
 * @param {quat4} q Rotation quaternion
 * @param {vec3} v Translation vector
 * @returns {mat4} out
 */
mat4.fromRotationTranslation = function (out, q, v) {
    // Quaternion math
    var x = q[0], y = q[1], z = q[2], w = q[3],
        x2 = x + x,
        y2 = y + y,
        z2 = z + z,

        xx = x * x2,
        xy = x * y2,
        xz = x * z2,
        yy = y * y2,
        yz = y * z2,
        zz = z * z2,
        wx = w * x2,
        wy = w * y2,
        wz = w * z2;

    out[0] = 1 - (yy + zz);
    out[1] = xy + wz;
    out[2] = xz - wy;
    out[3] = 0;
    out[4] = xy - wz;
    out[5] = 1 - (xx + zz);
    out[6] = yz + wx;
    out[7] = 0;
    out[8] = xz + wy;
    out[9] = yz - wx;
    out[10] = 1 - (xx + yy);
    out[11] = 0;
    out[12] = v[0];
    out[13] = v[1];
    out[14] = v[2];
    out[15] = 1;
    
    return out;
};

/**
* Calculates a 4x4 matrix from the given quaternion
*
* @param {mat4} out mat4 receiving operation result
* @param {quat} q Quaternion to create matrix from
*
* @returns {mat4} out
*/
mat4.fromQuat = function (out, q) {
    var x = q[0], y = q[1], z = q[2], w = q[3],
        x2 = x + x,
        y2 = y + y,
        z2 = z + z,

        xx = x * x2,
        xy = x * y2,
        xz = x * z2,
        yy = y * y2,
        yz = y * z2,
        zz = z * z2,
        wx = w * x2,
        wy = w * y2,
        wz = w * z2;

    out[0] = 1 - (yy + zz);
    out[1] = xy + wz;
    out[2] = xz - wy;
    out[3] = 0;

    out[4] = xy - wz;
    out[5] = 1 - (xx + zz);
    out[6] = yz + wx;
    out[7] = 0;

    out[8] = xz + wy;
    out[9] = yz - wx;
    out[10] = 1 - (xx + yy);
    out[11] = 0;

    out[12] = 0;
    out[13] = 0;
    out[14] = 0;
    out[15] = 1;

    return out;
};

/**
 * Generates a frustum matrix with the given bounds
 *
 * @param {mat4} out mat4 frustum matrix will be written into
 * @param {Number} left Left bound of the frustum
 * @param {Number} right Right bound of the frustum
 * @param {Number} bottom Bottom bound of the frustum
 * @param {Number} top Top bound of the frustum
 * @param {Number} near Near bound of the frustum
 * @param {Number} far Far bound of the frustum
 * @returns {mat4} out
 */
mat4.frustum = function (out, left, right, bottom, top, near, far) {
    var rl = 1 / (right - left),
        tb = 1 / (top - bottom),
        nf = 1 / (near - far);
    out[0] = (near * 2) * rl;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = (near * 2) * tb;
    out[6] = 0;
    out[7] = 0;
    out[8] = (right + left) * rl;
    out[9] = (top + bottom) * tb;
    out[10] = (far + near) * nf;
    out[11] = -1;
    out[12] = 0;
    out[13] = 0;
    out[14] = (far * near * 2) * nf;
    out[15] = 0;
    return out;
};

/**
 * Generates a perspective projection matrix with the given bounds
 *
 * @param {mat4} out mat4 frustum matrix will be written into
 * @param {number} fovy Vertical field of view in radians
 * @param {number} aspect Aspect ratio. typically viewport width/height
 * @param {number} near Near bound of the frustum
 * @param {number} far Far bound of the frustum
 * @returns {mat4} out
 */
mat4.perspective = function (out, fovy, aspect, near, far) {
    var f = 1.0 / Math.tan(fovy / 2),
        nf = 1 / (near - far);
    out[0] = f / aspect;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = f;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[10] = (far + near) * nf;
    out[11] = -1;
    out[12] = 0;
    out[13] = 0;
    out[14] = (2 * far * near) * nf;
    out[15] = 0;
    return out;
};

/**
 * Generates a orthogonal projection matrix with the given bounds
 *
 * @param {mat4} out mat4 frustum matrix will be written into
 * @param {number} left Left bound of the frustum
 * @param {number} right Right bound of the frustum
 * @param {number} bottom Bottom bound of the frustum
 * @param {number} top Top bound of the frustum
 * @param {number} near Near bound of the frustum
 * @param {number} far Far bound of the frustum
 * @returns {mat4} out
 */
mat4.ortho = function (out, left, right, bottom, top, near, far) {
    var lr = 1 / (left - right),
        bt = 1 / (bottom - top),
        nf = 1 / (near - far);
    out[0] = -2 * lr;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = -2 * bt;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[10] = 2 * nf;
    out[11] = 0;
    out[12] = (left + right) * lr;
    out[13] = (top + bottom) * bt;
    out[14] = (far + near) * nf;
    out[15] = 1;
    return out;
};

/**
 * Generates a look-at matrix with the given eye position, focal point, and up axis
 *
 * @param {mat4} out mat4 frustum matrix will be written into
 * @param {vec3} eye Position of the viewer
 * @param {vec3} center Point the viewer is looking at
 * @param {vec3} up vec3 pointing up
 * @returns {mat4} out
 */
mat4.lookAt = function (out, eye, center, up) {
    var x0, x1, x2, y0, y1, y2, z0, z1, z2, len,
        eyex = eye[0],
        eyey = eye[1],
        eyez = eye[2],
        upx = up[0],
        upy = up[1],
        upz = up[2],
        centerx = center[0],
        centery = center[1],
        centerz = center[2];

    if (Math.abs(eyex - centerx) < GLMAT_EPSILON &&
        Math.abs(eyey - centery) < GLMAT_EPSILON &&
        Math.abs(eyez - centerz) < GLMAT_EPSILON) {
        return mat4.identity(out);
    }

    z0 = eyex - centerx;
    z1 = eyey - centery;
    z2 = eyez - centerz;

    len = 1 / Math.sqrt(z0 * z0 + z1 * z1 + z2 * z2);
    z0 *= len;
    z1 *= len;
    z2 *= len;

    x0 = upy * z2 - upz * z1;
    x1 = upz * z0 - upx * z2;
    x2 = upx * z1 - upy * z0;
    len = Math.sqrt(x0 * x0 + x1 * x1 + x2 * x2);
    if (!len) {
        x0 = 0;
        x1 = 0;
        x2 = 0;
    } else {
        len = 1 / len;
        x0 *= len;
        x1 *= len;
        x2 *= len;
    }

    y0 = z1 * x2 - z2 * x1;
    y1 = z2 * x0 - z0 * x2;
    y2 = z0 * x1 - z1 * x0;

    len = Math.sqrt(y0 * y0 + y1 * y1 + y2 * y2);
    if (!len) {
        y0 = 0;
        y1 = 0;
        y2 = 0;
    } else {
        len = 1 / len;
        y0 *= len;
        y1 *= len;
        y2 *= len;
    }

    out[0] = x0;
    out[1] = y0;
    out[2] = z0;
    out[3] = 0;
    out[4] = x1;
    out[5] = y1;
    out[6] = z1;
    out[7] = 0;
    out[8] = x2;
    out[9] = y2;
    out[10] = z2;
    out[11] = 0;
    out[12] = -(x0 * eyex + x1 * eyey + x2 * eyez);
    out[13] = -(y0 * eyex + y1 * eyey + y2 * eyez);
    out[14] = -(z0 * eyex + z1 * eyey + z2 * eyez);
    out[15] = 1;

    return out;
};

/**
 * Returns a string representation of a mat4
 *
 * @param {mat4} mat matrix to represent as a string
 * @returns {String} string representation of the matrix
 */
mat4.str = function (a) {
    return 'mat4(' + a[0] + ', ' + a[1] + ', ' + a[2] + ', ' + a[3] + ', ' +
                    a[4] + ', ' + a[5] + ', ' + a[6] + ', ' + a[7] + ', ' +
                    a[8] + ', ' + a[9] + ', ' + a[10] + ', ' + a[11] + ', ' + 
                    a[12] + ', ' + a[13] + ', ' + a[14] + ', ' + a[15] + ')';
};

if(typeof(exports) !== 'undefined') {
    exports.mat4 = mat4;
}

/* Copyright (c) 2013, Brandon Jones, Colin MacKenzie IV. All rights reserved.

Redistribution and use in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:

  * Redistributions of source code must retain the above copyright notice, this
    list of conditions and the following disclaimer.
  * Redistributions in binary form must reproduce the above copyright notice,
    this list of conditions and the following disclaimer in the documentation 
    and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE 
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. */

/**
 * @class 2 Dimensional Vector
 * @name vec2
 */
var vec2 = {};

/**
 * Creates a new, empty vec2
 *
 * @returns {vec2} a new 2D vector
 */
vec2.create = function() {
    var out = new GLMAT_ARRAY_TYPE(2);
    out[0] = 0;
    out[1] = 0;
    return out;
};

/**
 * Creates a new vec2 initialized with values from an existing vector
 *
 * @param {vec2} a vector to clone
 * @returns {vec2} a new 2D vector
 */
vec2.clone = function(a) {
    var out = new GLMAT_ARRAY_TYPE(2);
    out[0] = a[0];
    out[1] = a[1];
    return out;
};

/**
 * Creates a new vec2 initialized with the given values
 *
 * @param {Number} x X component
 * @param {Number} y Y component
 * @returns {vec2} a new 2D vector
 */
vec2.fromValues = function(x, y) {
    var out = new GLMAT_ARRAY_TYPE(2);
    out[0] = x;
    out[1] = y;
    return out;
};

/**
 * Copy the values from one vec2 to another
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the source vector
 * @returns {vec2} out
 */
vec2.copy = function(out, a) {
    out[0] = a[0];
    out[1] = a[1];
    return out;
};

/**
 * Set the components of a vec2 to the given values
 *
 * @param {vec2} out the receiving vector
 * @param {Number} x X component
 * @param {Number} y Y component
 * @returns {vec2} out
 */
vec2.set = function(out, x, y) {
    out[0] = x;
    out[1] = y;
    return out;
};

/**
 * Adds two vec2's
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the first operand
 * @param {vec2} b the second operand
 * @returns {vec2} out
 */
vec2.add = function(out, a, b) {
    out[0] = a[0] + b[0];
    out[1] = a[1] + b[1];
    return out;
};

/**
 * Subtracts two vec2's
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the first operand
 * @param {vec2} b the second operand
 * @returns {vec2} out
 */
vec2.subtract = function(out, a, b) {
    out[0] = a[0] - b[0];
    out[1] = a[1] - b[1];
    return out;
};

/**
 * Alias for {@link vec2.subtract}
 * @function
 */
vec2.sub = vec2.subtract;

/**
 * Multiplies two vec2's
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the first operand
 * @param {vec2} b the second operand
 * @returns {vec2} out
 */
vec2.multiply = function(out, a, b) {
    out[0] = a[0] * b[0];
    out[1] = a[1] * b[1];
    return out;
};

/**
 * Alias for {@link vec2.multiply}
 * @function
 */
vec2.mul = vec2.multiply;

/**
 * Divides two vec2's
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the first operand
 * @param {vec2} b the second operand
 * @returns {vec2} out
 */
vec2.divide = function(out, a, b) {
    out[0] = a[0] / b[0];
    out[1] = a[1] / b[1];
    return out;
};

/**
 * Alias for {@link vec2.divide}
 * @function
 */
vec2.div = vec2.divide;

/**
 * Returns the minimum of two vec2's
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the first operand
 * @param {vec2} b the second operand
 * @returns {vec2} out
 */
vec2.min = function(out, a, b) {
    out[0] = Math.min(a[0], b[0]);
    out[1] = Math.min(a[1], b[1]);
    return out;
};

/**
 * Returns the maximum of two vec2's
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the first operand
 * @param {vec2} b the second operand
 * @returns {vec2} out
 */
vec2.max = function(out, a, b) {
    out[0] = Math.max(a[0], b[0]);
    out[1] = Math.max(a[1], b[1]);
    return out;
};

/**
 * Scales a vec2 by a scalar number
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the vector to scale
 * @param {Number} b amount to scale the vector by
 * @returns {vec2} out
 */
vec2.scale = function(out, a, b) {
    out[0] = a[0] * b;
    out[1] = a[1] * b;
    return out;
};

/**
 * Calculates the euclidian distance between two vec2's
 *
 * @param {vec2} a the first operand
 * @param {vec2} b the second operand
 * @returns {Number} distance between a and b
 */
vec2.distance = function(a, b) {
    var x = b[0] - a[0],
        y = b[1] - a[1];
    return Math.sqrt(x*x + y*y);
};

/**
 * Alias for {@link vec2.distance}
 * @function
 */
vec2.dist = vec2.distance;

/**
 * Calculates the squared euclidian distance between two vec2's
 *
 * @param {vec2} a the first operand
 * @param {vec2} b the second operand
 * @returns {Number} squared distance between a and b
 */
vec2.squaredDistance = function(a, b) {
    var x = b[0] - a[0],
        y = b[1] - a[1];
    return x*x + y*y;
};

/**
 * Alias for {@link vec2.squaredDistance}
 * @function
 */
vec2.sqrDist = vec2.squaredDistance;

/**
 * Calculates the length of a vec2
 *
 * @param {vec2} a vector to calculate length of
 * @returns {Number} length of a
 */
vec2.length = function (a) {
    var x = a[0],
        y = a[1];
    return Math.sqrt(x*x + y*y);
};

/**
 * Alias for {@link vec2.length}
 * @function
 */
vec2.len = vec2.length;

/**
 * Calculates the squared length of a vec2
 *
 * @param {vec2} a vector to calculate squared length of
 * @returns {Number} squared length of a
 */
vec2.squaredLength = function (a) {
    var x = a[0],
        y = a[1];
    return x*x + y*y;
};

/**
 * Alias for {@link vec2.squaredLength}
 * @function
 */
vec2.sqrLen = vec2.squaredLength;

/**
 * Negates the components of a vec2
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a vector to negate
 * @returns {vec2} out
 */
vec2.negate = function(out, a) {
    out[0] = -a[0];
    out[1] = -a[1];
    return out;
};

/**
 * Normalize a vec2
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a vector to normalize
 * @returns {vec2} out
 */
vec2.normalize = function(out, a) {
    var x = a[0],
        y = a[1];
    var len = x*x + y*y;
    if (len > 0) {
        //TODO: evaluate use of glm_invsqrt here?
        len = 1 / Math.sqrt(len);
        out[0] = a[0] * len;
        out[1] = a[1] * len;
    }
    return out;
};

/**
 * Calculates the dot product of two vec2's
 *
 * @param {vec2} a the first operand
 * @param {vec2} b the second operand
 * @returns {Number} dot product of a and b
 */
vec2.dot = function (a, b) {
    return a[0] * b[0] + a[1] * b[1];
};

/**
 * Computes the cross product of two vec2's
 * Note that the cross product must by definition produce a 3D vector
 *
 * @param {vec3} out the receiving vector
 * @param {vec2} a the first operand
 * @param {vec2} b the second operand
 * @returns {vec3} out
 */
vec2.cross = function(out, a, b) {
    var z = a[0] * b[1] - a[1] * b[0];
    out[0] = out[1] = 0;
    out[2] = z;
    return out;
};

/**
 * Performs a linear interpolation between two vec2's
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the first operand
 * @param {vec2} b the second operand
 * @param {Number} t interpolation amount between the two inputs
 * @returns {vec2} out
 */
vec2.lerp = function (out, a, b, t) {
    var ax = a[0],
        ay = a[1];
    out[0] = ax + t * (b[0] - ax);
    out[1] = ay + t * (b[1] - ay);
    return out;
};

/**
 * Transforms the vec2 with a mat2
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the vector to transform
 * @param {mat2} m matrix to transform with
 * @returns {vec2} out
 */
vec2.transformMat2 = function(out, a, m) {
    var x = a[0],
        y = a[1];
    out[0] = m[0] * x + m[2] * y;
    out[1] = m[1] * x + m[3] * y;
    return out;
};

/**
 * Transforms the vec2 with a mat2d
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the vector to transform
 * @param {mat2d} m matrix to transform with
 * @returns {vec2} out
 */
vec2.transformMat2d = function(out, a, m) {
    var x = a[0],
        y = a[1];
    out[0] = m[0] * x + m[2] * y + m[4];
    out[1] = m[1] * x + m[3] * y + m[5];
    return out;
};

/**
 * Transforms the vec2 with a mat3
 * 3rd vector component is implicitly '1'
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the vector to transform
 * @param {mat3} m matrix to transform with
 * @returns {vec2} out
 */
vec2.transformMat3 = function(out, a, m) {
    var x = a[0],
        y = a[1];
    out[0] = m[0] * x + m[3] * y + m[6];
    out[1] = m[1] * x + m[4] * y + m[7];
    return out;
};

/**
 * Transforms the vec2 with a mat4
 * 3rd vector component is implicitly '0'
 * 4th vector component is implicitly '1'
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the vector to transform
 * @param {mat4} m matrix to transform with
 * @returns {vec2} out
 */
vec2.transformMat4 = function(out, a, m) {
    var x = a[0], 
        y = a[1];
    out[0] = m[0] * x + m[4] * y + m[12];
    out[1] = m[1] * x + m[5] * y + m[13];
    return out;
};

/**
 * Perform some operation over an array of vec2s.
 *
 * @param {Array} a the array of vectors to iterate over
 * @param {Number} stride Number of elements between the start of each vec2. If 0 assumes tightly packed
 * @param {Number} offset Number of elements to skip at the beginning of the array
 * @param {Number} count Number of vec2s to iterate over. If 0 iterates over entire array
 * @param {Function} fn Function to call for each vector in the array
 * @param {Object} [arg] additional argument to pass to fn
 * @returns {Array} a
 * @function
 */
vec2.forEach = (function() {
    var vec = vec2.create();

    return function(a, stride, offset, count, fn, arg) {
        var i, l;
        if(!stride) {
            stride = 2;
        }

        if(!offset) {
            offset = 0;
        }
        
        if(count) {
            l = Math.min((count * stride) + offset, a.length);
        } else {
            l = a.length;
        }

        for(i = offset; i < l; i += stride) {
            vec[0] = a[i]; vec[1] = a[i+1];
            fn(vec, vec, arg);
            a[i] = vec[0]; a[i+1] = vec[1];
        }
        
        return a;
    };
})();

/**
 * Returns a string representation of a vector
 *
 * @param {vec2} vec vector to represent as a string
 * @returns {String} string representation of the vector
 */
vec2.str = function (a) {
    return 'vec2(' + a[0] + ', ' + a[1] + ')';
};

if(typeof(exports) !== 'undefined') {
    exports.vec2 = vec2;
}

/* Copyright (c) 2013, Brandon Jones, Colin MacKenzie IV. All rights reserved.

Redistribution and use in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:

  * Redistributions of source code must retain the above copyright notice, this
    list of conditions and the following disclaimer.
  * Redistributions in binary form must reproduce the above copyright notice,
    this list of conditions and the following disclaimer in the documentation 
    and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE 
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. */

/**
 * @class 3 Dimensional Vector
 * @name vec3
 */
var vec3 = {};

/**
 * Creates a new, empty vec3
 *
 * @returns {vec3} a new 3D vector
 */
vec3.create = function() {
    var out = new GLMAT_ARRAY_TYPE(3);
    out[0] = 0;
    out[1] = 0;
    out[2] = 0;
    return out;
};

/**
 * Creates a new vec3 initialized with values from an existing vector
 *
 * @param {vec3} a vector to clone
 * @returns {vec3} a new 3D vector
 */
vec3.clone = function(a) {
    var out = new GLMAT_ARRAY_TYPE(3);
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    return out;
};

/**
 * Creates a new vec3 initialized with the given values
 *
 * @param {Number} x X component
 * @param {Number} y Y component
 * @param {Number} z Z component
 * @returns {vec3} a new 3D vector
 */
vec3.fromValues = function(x, y, z) {
    var out = new GLMAT_ARRAY_TYPE(3);
    out[0] = x;
    out[1] = y;
    out[2] = z;
    return out;
};

/**
 * Copy the values from one vec3 to another
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the source vector
 * @returns {vec3} out
 */
vec3.copy = function(out, a) {
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    return out;
};

/**
 * Set the components of a vec3 to the given values
 *
 * @param {vec3} out the receiving vector
 * @param {Number} x X component
 * @param {Number} y Y component
 * @param {Number} z Z component
 * @returns {vec3} out
 */
vec3.set = function(out, x, y, z) {
    out[0] = x;
    out[1] = y;
    out[2] = z;
    return out;
};

/**
 * Adds two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {vec3} out
 */
vec3.add = function(out, a, b) {
    out[0] = a[0] + b[0];
    out[1] = a[1] + b[1];
    out[2] = a[2] + b[2];
    return out;
};

/**
 * Subtracts two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {vec3} out
 */
vec3.subtract = function(out, a, b) {
    out[0] = a[0] - b[0];
    out[1] = a[1] - b[1];
    out[2] = a[2] - b[2];
    return out;
};

/**
 * Alias for {@link vec3.subtract}
 * @function
 */
vec3.sub = vec3.subtract;

/**
 * Multiplies two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {vec3} out
 */
vec3.multiply = function(out, a, b) {
    out[0] = a[0] * b[0];
    out[1] = a[1] * b[1];
    out[2] = a[2] * b[2];
    return out;
};

/**
 * Alias for {@link vec3.multiply}
 * @function
 */
vec3.mul = vec3.multiply;

/**
 * Divides two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {vec3} out
 */
vec3.divide = function(out, a, b) {
    out[0] = a[0] / b[0];
    out[1] = a[1] / b[1];
    out[2] = a[2] / b[2];
    return out;
};

/**
 * Alias for {@link vec3.divide}
 * @function
 */
vec3.div = vec3.divide;

/**
 * Returns the minimum of two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {vec3} out
 */
vec3.min = function(out, a, b) {
    out[0] = Math.min(a[0], b[0]);
    out[1] = Math.min(a[1], b[1]);
    out[2] = Math.min(a[2], b[2]);
    return out;
};

/**
 * Returns the maximum of two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {vec3} out
 */
vec3.max = function(out, a, b) {
    out[0] = Math.max(a[0], b[0]);
    out[1] = Math.max(a[1], b[1]);
    out[2] = Math.max(a[2], b[2]);
    return out;
};

/**
 * Scales a vec3 by a scalar number
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the vector to scale
 * @param {Number} b amount to scale the vector by
 * @returns {vec3} out
 */
vec3.scale = function(out, a, b) {
    out[0] = a[0] * b;
    out[1] = a[1] * b;
    out[2] = a[2] * b;
    return out;
};

/**
 * Calculates the euclidian distance between two vec3's
 *
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {Number} distance between a and b
 */
vec3.distance = function(a, b) {
    var x = b[0] - a[0],
        y = b[1] - a[1],
        z = b[2] - a[2];
    return Math.sqrt(x*x + y*y + z*z);
};

/**
 * Alias for {@link vec3.distance}
 * @function
 */
vec3.dist = vec3.distance;

/**
 * Calculates the squared euclidian distance between two vec3's
 *
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {Number} squared distance between a and b
 */
vec3.squaredDistance = function(a, b) {
    var x = b[0] - a[0],
        y = b[1] - a[1],
        z = b[2] - a[2];
    return x*x + y*y + z*z;
};

/**
 * Alias for {@link vec3.squaredDistance}
 * @function
 */
vec3.sqrDist = vec3.squaredDistance;

/**
 * Calculates the length of a vec3
 *
 * @param {vec3} a vector to calculate length of
 * @returns {Number} length of a
 */
vec3.length = function (a) {
    var x = a[0],
        y = a[1],
        z = a[2];
    return Math.sqrt(x*x + y*y + z*z);
};

/**
 * Alias for {@link vec3.length}
 * @function
 */
vec3.len = vec3.length;

/**
 * Calculates the squared length of a vec3
 *
 * @param {vec3} a vector to calculate squared length of
 * @returns {Number} squared length of a
 */
vec3.squaredLength = function (a) {
    var x = a[0],
        y = a[1],
        z = a[2];
    return x*x + y*y + z*z;
};

/**
 * Alias for {@link vec3.squaredLength}
 * @function
 */
vec3.sqrLen = vec3.squaredLength;

/**
 * Negates the components of a vec3
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a vector to negate
 * @returns {vec3} out
 */
vec3.negate = function(out, a) {
    out[0] = -a[0];
    out[1] = -a[1];
    out[2] = -a[2];
    return out;
};

/**
 * Normalize a vec3
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a vector to normalize
 * @returns {vec3} out
 */
vec3.normalize = function(out, a) {
    var x = a[0],
        y = a[1],
        z = a[2];
    var len = x*x + y*y + z*z;
    if (len > 0) {
        //TODO: evaluate use of glm_invsqrt here?
        len = 1 / Math.sqrt(len);
        out[0] = a[0] * len;
        out[1] = a[1] * len;
        out[2] = a[2] * len;
    }
    return out;
};

/**
 * Calculates the dot product of two vec3's
 *
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {Number} dot product of a and b
 */
vec3.dot = function (a, b) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
};

/**
 * Computes the cross product of two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @returns {vec3} out
 */
vec3.cross = function(out, a, b) {
    var ax = a[0], ay = a[1], az = a[2],
        bx = b[0], by = b[1], bz = b[2];

    out[0] = ay * bz - az * by;
    out[1] = az * bx - ax * bz;
    out[2] = ax * by - ay * bx;
    return out;
};

/**
 * Performs a linear interpolation between two vec3's
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the first operand
 * @param {vec3} b the second operand
 * @param {Number} t interpolation amount between the two inputs
 * @returns {vec3} out
 */
vec3.lerp = function (out, a, b, t) {
    var ax = a[0],
        ay = a[1],
        az = a[2];
    out[0] = ax + t * (b[0] - ax);
    out[1] = ay + t * (b[1] - ay);
    out[2] = az + t * (b[2] - az);
    return out;
};

/**
 * Transforms the vec3 with a mat4.
 * 4th vector component is implicitly '1'
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the vector to transform
 * @param {mat4} m matrix to transform with
 * @returns {vec3} out
 */
vec3.transformMat4 = function(out, a, m) {
    var x = a[0], y = a[1], z = a[2];
    out[0] = m[0] * x + m[4] * y + m[8] * z + m[12];
    out[1] = m[1] * x + m[5] * y + m[9] * z + m[13];
    out[2] = m[2] * x + m[6] * y + m[10] * z + m[14];
    return out;
};

/**
 * Transforms the vec3 with a quat
 *
 * @param {vec3} out the receiving vector
 * @param {vec3} a the vector to transform
 * @param {quat} q quaternion to transform with
 * @returns {vec3} out
 */
vec3.transformQuat = function(out, a, q) {
    var x = a[0], y = a[1], z = a[2],
        qx = q[0], qy = q[1], qz = q[2], qw = q[3],

        // calculate quat * vec
        ix = qw * x + qy * z - qz * y,
        iy = qw * y + qz * x - qx * z,
        iz = qw * z + qx * y - qy * x,
        iw = -qx * x - qy * y - qz * z;

    // calculate result * inverse quat
    out[0] = ix * qw + iw * -qx + iy * -qz - iz * -qy;
    out[1] = iy * qw + iw * -qy + iz * -qx - ix * -qz;
    out[2] = iz * qw + iw * -qz + ix * -qy - iy * -qx;
    return out;
};

/**
 * Perform some operation over an array of vec3s.
 *
 * @param {Array} a the array of vectors to iterate over
 * @param {Number} stride Number of elements between the start of each vec3. If 0 assumes tightly packed
 * @param {Number} offset Number of elements to skip at the beginning of the array
 * @param {Number} count Number of vec3s to iterate over. If 0 iterates over entire array
 * @param {Function} fn Function to call for each vector in the array
 * @param {Object} [arg] additional argument to pass to fn
 * @returns {Array} a
 * @function
 */
vec3.forEach = (function() {
    var vec = vec3.create();

    return function(a, stride, offset, count, fn, arg) {
        var i, l;
        if(!stride) {
            stride = 3;
        }

        if(!offset) {
            offset = 0;
        }
        
        if(count) {
            l = Math.min((count * stride) + offset, a.length);
        } else {
            l = a.length;
        }

        for(i = offset; i < l; i += stride) {
            vec[0] = a[i]; vec[1] = a[i+1]; vec[2] = a[i+2];
            fn(vec, vec, arg);
            a[i] = vec[0]; a[i+1] = vec[1]; a[i+2] = vec[2];
        }
        
        return a;
    };
})();

/**
 * Returns a string representation of a vector
 *
 * @param {vec3} vec vector to represent as a string
 * @returns {String} string representation of the vector
 */
vec3.str = function (a) {
    return 'vec3(' + a[0] + ', ' + a[1] + ', ' + a[2] + ')';
};

if(typeof(exports) !== 'undefined') {
    exports.vec3 = vec3;
}

/* Copyright (c) 2013, Brandon Jones, Colin MacKenzie IV. All rights reserved.

Redistribution and use in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:

  * Redistributions of source code must retain the above copyright notice, this
    list of conditions and the following disclaimer.
  * Redistributions in binary form must reproduce the above copyright notice,
    this list of conditions and the following disclaimer in the documentation 
    and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE 
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. */

/**
 * @class 4 Dimensional Vector
 * @name vec4
 */
var vec4 = {};

/**
 * Creates a new, empty vec4
 *
 * @returns {vec4} a new 4D vector
 */
vec4.create = function() {
    var out = new GLMAT_ARRAY_TYPE(4);
    out[0] = 0;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    return out;
};

/**
 * Creates a new vec4 initialized with values from an existing vector
 *
 * @param {vec4} a vector to clone
 * @returns {vec4} a new 4D vector
 */
vec4.clone = function(a) {
    var out = new GLMAT_ARRAY_TYPE(4);
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    return out;
};

/**
 * Creates a new vec4 initialized with the given values
 *
 * @param {Number} x X component
 * @param {Number} y Y component
 * @param {Number} z Z component
 * @param {Number} w W component
 * @returns {vec4} a new 4D vector
 */
vec4.fromValues = function(x, y, z, w) {
    var out = new GLMAT_ARRAY_TYPE(4);
    out[0] = x;
    out[1] = y;
    out[2] = z;
    out[3] = w;
    return out;
};

/**
 * Copy the values from one vec4 to another
 *
 * @param {vec4} out the receiving vector
 * @param {vec4} a the source vector
 * @returns {vec4} out
 */
vec4.copy = function(out, a) {
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    return out;
};

/**
 * Set the components of a vec4 to the given values
 *
 * @param {vec4} out the receiving vector
 * @param {Number} x X component
 * @param {Number} y Y component
 * @param {Number} z Z component
 * @param {Number} w W component
 * @returns {vec4} out
 */
vec4.set = function(out, x, y, z, w) {
    out[0] = x;
    out[1] = y;
    out[2] = z;
    out[3] = w;
    return out;
};

/**
 * Adds two vec4's
 *
 * @param {vec4} out the receiving vector
 * @param {vec4} a the first operand
 * @param {vec4} b the second operand
 * @returns {vec4} out
 */
vec4.add = function(out, a, b) {
    out[0] = a[0] + b[0];
    out[1] = a[1] + b[1];
    out[2] = a[2] + b[2];
    out[3] = a[3] + b[3];
    return out;
};

/**
 * Subtracts two vec4's
 *
 * @param {vec4} out the receiving vector
 * @param {vec4} a the first operand
 * @param {vec4} b the second operand
 * @returns {vec4} out
 */
vec4.subtract = function(out, a, b) {
    out[0] = a[0] - b[0];
    out[1] = a[1] - b[1];
    out[2] = a[2] - b[2];
    out[3] = a[3] - b[3];
    return out;
};

/**
 * Alias for {@link vec4.subtract}
 * @function
 */
vec4.sub = vec4.subtract;

/**
 * Multiplies two vec4's
 *
 * @param {vec4} out the receiving vector
 * @param {vec4} a the first operand
 * @param {vec4} b the second operand
 * @returns {vec4} out
 */
vec4.multiply = function(out, a, b) {
    out[0] = a[0] * b[0];
    out[1] = a[1] * b[1];
    out[2] = a[2] * b[2];
    out[3] = a[3] * b[3];
    return out;
};

/**
 * Alias for {@link vec4.multiply}
 * @function
 */
vec4.mul = vec4.multiply;

/**
 * Divides two vec4's
 *
 * @param {vec4} out the receiving vector
 * @param {vec4} a the first operand
 * @param {vec4} b the second operand
 * @returns {vec4} out
 */
vec4.divide = function(out, a, b) {
    out[0] = a[0] / b[0];
    out[1] = a[1] / b[1];
    out[2] = a[2] / b[2];
    out[3] = a[3] / b[3];
    return out;
};

/**
 * Alias for {@link vec4.divide}
 * @function
 */
vec4.div = vec4.divide;

/**
 * Returns the minimum of two vec4's
 *
 * @param {vec4} out the receiving vector
 * @param {vec4} a the first operand
 * @param {vec4} b the second operand
 * @returns {vec4} out
 */
vec4.min = function(out, a, b) {
    out[0] = Math.min(a[0], b[0]);
    out[1] = Math.min(a[1], b[1]);
    out[2] = Math.min(a[2], b[2]);
    out[3] = Math.min(a[3], b[3]);
    return out;
};

/**
 * Returns the maximum of two vec4's
 *
 * @param {vec4} out the receiving vector
 * @param {vec4} a the first operand
 * @param {vec4} b the second operand
 * @returns {vec4} out
 */
vec4.max = function(out, a, b) {
    out[0] = Math.max(a[0], b[0]);
    out[1] = Math.max(a[1], b[1]);
    out[2] = Math.max(a[2], b[2]);
    out[3] = Math.max(a[3], b[3]);
    return out;
};

/**
 * Scales a vec4 by a scalar number
 *
 * @param {vec4} out the receiving vector
 * @param {vec4} a the vector to scale
 * @param {Number} b amount to scale the vector by
 * @returns {vec4} out
 */
vec4.scale = function(out, a, b) {
    out[0] = a[0] * b;
    out[1] = a[1] * b;
    out[2] = a[2] * b;
    out[3] = a[3] * b;
    return out;
};

/**
 * Calculates the euclidian distance between two vec4's
 *
 * @param {vec4} a the first operand
 * @param {vec4} b the second operand
 * @returns {Number} distance between a and b
 */
vec4.distance = function(a, b) {
    var x = b[0] - a[0],
        y = b[1] - a[1],
        z = b[2] - a[2],
        w = b[3] - a[3];
    return Math.sqrt(x*x + y*y + z*z + w*w);
};

/**
 * Alias for {@link vec4.distance}
 * @function
 */
vec4.dist = vec4.distance;

/**
 * Calculates the squared euclidian distance between two vec4's
 *
 * @param {vec4} a the first operand
 * @param {vec4} b the second operand
 * @returns {Number} squared distance between a and b
 */
vec4.squaredDistance = function(a, b) {
    var x = b[0] - a[0],
        y = b[1] - a[1],
        z = b[2] - a[2],
        w = b[3] - a[3];
    return x*x + y*y + z*z + w*w;
};

/**
 * Alias for {@link vec4.squaredDistance}
 * @function
 */
vec4.sqrDist = vec4.squaredDistance;

/**
 * Calculates the length of a vec4
 *
 * @param {vec4} a vector to calculate length of
 * @returns {Number} length of a
 */
vec4.length = function (a) {
    var x = a[0],
        y = a[1],
        z = a[2],
        w = a[3];
    return Math.sqrt(x*x + y*y + z*z + w*w);
};

/**
 * Alias for {@link vec4.length}
 * @function
 */
vec4.len = vec4.length;

/**
 * Calculates the squared length of a vec4
 *
 * @param {vec4} a vector to calculate squared length of
 * @returns {Number} squared length of a
 */
vec4.squaredLength = function (a) {
    var x = a[0],
        y = a[1],
        z = a[2],
        w = a[3];
    return x*x + y*y + z*z + w*w;
};

/**
 * Alias for {@link vec4.squaredLength}
 * @function
 */
vec4.sqrLen = vec4.squaredLength;

/**
 * Negates the components of a vec4
 *
 * @param {vec4} out the receiving vector
 * @param {vec4} a vector to negate
 * @returns {vec4} out
 */
vec4.negate = function(out, a) {
    out[0] = -a[0];
    out[1] = -a[1];
    out[2] = -a[2];
    out[3] = -a[3];
    return out;
};

/**
 * Normalize a vec4
 *
 * @param {vec4} out the receiving vector
 * @param {vec4} a vector to normalize
 * @returns {vec4} out
 */
vec4.normalize = function(out, a) {
    var x = a[0],
        y = a[1],
        z = a[2],
        w = a[3];
    var len = x*x + y*y + z*z + w*w;
    if (len > 0) {
        len = 1 / Math.sqrt(len);
        out[0] = a[0] * len;
        out[1] = a[1] * len;
        out[2] = a[2] * len;
        out[3] = a[3] * len;
    }
    return out;
};

/**
 * Calculates the dot product of two vec4's
 *
 * @param {vec4} a the first operand
 * @param {vec4} b the second operand
 * @returns {Number} dot product of a and b
 */
vec4.dot = function (a, b) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
};

/**
 * Performs a linear interpolation between two vec4's
 *
 * @param {vec4} out the receiving vector
 * @param {vec4} a the first operand
 * @param {vec4} b the second operand
 * @param {Number} t interpolation amount between the two inputs
 * @returns {vec4} out
 */
vec4.lerp = function (out, a, b, t) {
    var ax = a[0],
        ay = a[1],
        az = a[2],
        aw = a[3];
    out[0] = ax + t * (b[0] - ax);
    out[1] = ay + t * (b[1] - ay);
    out[2] = az + t * (b[2] - az);
    out[3] = aw + t * (b[3] - aw);
    return out;
};

/**
 * Transforms the vec4 with a mat4.
 *
 * @param {vec4} out the receiving vector
 * @param {vec4} a the vector to transform
 * @param {mat4} m matrix to transform with
 * @returns {vec4} out
 */
vec4.transformMat4 = function(out, a, m) {
    var x = a[0], y = a[1], z = a[2], w = a[3];
    out[0] = m[0] * x + m[4] * y + m[8] * z + m[12] * w;
    out[1] = m[1] * x + m[5] * y + m[9] * z + m[13] * w;
    out[2] = m[2] * x + m[6] * y + m[10] * z + m[14] * w;
    out[3] = m[3] * x + m[7] * y + m[11] * z + m[15] * w;
    return out;
};

/**
 * Transforms the vec4 with a quat
 *
 * @param {vec4} out the receiving vector
 * @param {vec4} a the vector to transform
 * @param {quat} q quaternion to transform with
 * @returns {vec4} out
 */
vec4.transformQuat = function(out, a, q) {
    var x = a[0], y = a[1], z = a[2],
        qx = q[0], qy = q[1], qz = q[2], qw = q[3],

        // calculate quat * vec
        ix = qw * x + qy * z - qz * y,
        iy = qw * y + qz * x - qx * z,
        iz = qw * z + qx * y - qy * x,
        iw = -qx * x - qy * y - qz * z;

    // calculate result * inverse quat
    out[0] = ix * qw + iw * -qx + iy * -qz - iz * -qy;
    out[1] = iy * qw + iw * -qy + iz * -qx - ix * -qz;
    out[2] = iz * qw + iw * -qz + ix * -qy - iy * -qx;
    return out;
};

/**
 * Perform some operation over an array of vec4s.
 *
 * @param {Array} a the array of vectors to iterate over
 * @param {Number} stride Number of elements between the start of each vec4. If 0 assumes tightly packed
 * @param {Number} offset Number of elements to skip at the beginning of the array
 * @param {Number} count Number of vec2s to iterate over. If 0 iterates over entire array
 * @param {Function} fn Function to call for each vector in the array
 * @param {Object} [arg] additional argument to pass to fn
 * @returns {Array} a
 * @function
 */
vec4.forEach = (function() {
    var vec = vec4.create();

    return function(a, stride, offset, count, fn, arg) {
        var i, l;
        if(!stride) {
            stride = 4;
        }

        if(!offset) {
            offset = 0;
        }
        
        if(count) {
            l = Math.min((count * stride) + offset, a.length);
        } else {
            l = a.length;
        }

        for(i = offset; i < l; i += stride) {
            vec[0] = a[i]; vec[1] = a[i+1]; vec[2] = a[i+2]; vec[3] = a[i+3];
            fn(vec, vec, arg);
            a[i] = vec[0]; a[i+1] = vec[1]; a[i+2] = vec[2]; a[i+3] = vec[3];
        }
        
        return a;
    };
})();

/**
 * Returns a string representation of a vector
 *
 * @param {vec4} vec vector to represent as a string
 * @returns {String} string representation of the vector
 */
vec4.str = function (a) {
    return 'vec4(' + a[0] + ', ' + a[1] + ', ' + a[2] + ', ' + a[3] + ')';
};

if(typeof(exports) !== 'undefined') {
    exports.vec4 = vec4;
}

/* Copyright (c) 2013, Brandon Jones, Colin MacKenzie IV. All rights reserved.

Redistribution and use in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:

  * Redistributions of source code must retain the above copyright notice, this
    list of conditions and the following disclaimer.
  * Redistributions in binary form must reproduce the above copyright notice,
    this list of conditions and the following disclaimer in the documentation 
    and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE 
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. */

/**
 * @class Quaternion
 * @name quat
 */
var quat = {};

var quatIdentity = new Float32Array([0, 0, 0, 1]);

/**
 * Creates a new identity quat
 *
 * @returns {quat} a new quaternion
 */
quat.create = function() {
    var out = new GLMAT_ARRAY_TYPE(4);
    out[0] = 0;
    out[1] = 0;
    out[2] = 0;
    out[3] = 1;
    return out;
};

/**
 * Creates a new quat initialized with values from an existing quaternion
 *
 * @param {quat} a quaternion to clone
 * @returns {quat} a new quaternion
 * @function
 */
quat.clone = vec4.clone;

/**
 * Creates a new quat initialized with the given values
 *
 * @param {Number} x X component
 * @param {Number} y Y component
 * @param {Number} z Z component
 * @param {Number} w W component
 * @returns {quat} a new quaternion
 * @function
 */
quat.fromValues = vec4.fromValues;

/**
 * Copy the values from one quat to another
 *
 * @param {quat} out the receiving quaternion
 * @param {quat} a the source quaternion
 * @returns {quat} out
 * @function
 */
quat.copy = vec4.copy;

/**
 * Set the components of a quat to the given values
 *
 * @param {quat} out the receiving quaternion
 * @param {Number} x X component
 * @param {Number} y Y component
 * @param {Number} z Z component
 * @param {Number} w W component
 * @returns {quat} out
 * @function
 */
quat.set = vec4.set;

/**
 * Set a quat to the identity quaternion
 *
 * @param {quat} out the receiving quaternion
 * @returns {quat} out
 */
quat.identity = function(out) {
    out[0] = 0;
    out[1] = 0;
    out[2] = 0;
    out[3] = 1;
    return out;
};

/**
 * Sets a quat from the given angle and rotation axis,
 * then returns it.
 *
 * @param {quat} out the receiving quaternion
 * @param {vec3} axis the axis around which to rotate
 * @param {Number} rad the angle in radians
 * @returns {quat} out
 **/
quat.setAxisAngle = function(out, axis, rad) {
    rad = rad * 0.5;
    var s = Math.sin(rad);
    out[0] = s * axis[0];
    out[1] = s * axis[1];
    out[2] = s * axis[2];
    out[3] = Math.cos(rad);
    return out;
};

/**
 * Adds two quat's
 *
 * @param {quat} out the receiving quaternion
 * @param {quat} a the first operand
 * @param {quat} b the second operand
 * @returns {quat} out
 * @function
 */
quat.add = vec4.add;

/**
 * Multiplies two quat's
 *
 * @param {quat} out the receiving quaternion
 * @param {quat} a the first operand
 * @param {quat} b the second operand
 * @returns {quat} out
 */
quat.multiply = function(out, a, b) {
    var ax = a[0], ay = a[1], az = a[2], aw = a[3],
        bx = b[0], by = b[1], bz = b[2], bw = b[3];

    out[0] = ax * bw + aw * bx + ay * bz - az * by;
    out[1] = ay * bw + aw * by + az * bx - ax * bz;
    out[2] = az * bw + aw * bz + ax * by - ay * bx;
    out[3] = aw * bw - ax * bx - ay * by - az * bz;
    return out;
};

/**
 * Alias for {@link quat.multiply}
 * @function
 */
quat.mul = quat.multiply;

/**
 * Scales a quat by a scalar number
 *
 * @param {quat} out the receiving vector
 * @param {quat} a the vector to scale
 * @param {Number} b amount to scale the vector by
 * @returns {quat} out
 * @function
 */
quat.scale = vec4.scale;

/**
 * Rotates a quaternion by the given angle around the X axis
 *
 * @param {quat} out quat receiving operation result
 * @param {quat} a quat to rotate
 * @param {number} rad angle (in radians) to rotate
 * @returns {quat} out
 */
quat.rotateX = function (out, a, rad) {
    rad *= 0.5; 

    var ax = a[0], ay = a[1], az = a[2], aw = a[3],
        bx = Math.sin(rad), bw = Math.cos(rad);

    out[0] = ax * bw + aw * bx;
    out[1] = ay * bw + az * bx;
    out[2] = az * bw - ay * bx;
    out[3] = aw * bw - ax * bx;
    return out;
};

/**
 * Rotates a quaternion by the given angle around the Y axis
 *
 * @param {quat} out quat receiving operation result
 * @param {quat} a quat to rotate
 * @param {number} rad angle (in radians) to rotate
 * @returns {quat} out
 */
quat.rotateY = function (out, a, rad) {
    rad *= 0.5; 

    var ax = a[0], ay = a[1], az = a[2], aw = a[3],
        by = Math.sin(rad), bw = Math.cos(rad);

    out[0] = ax * bw - az * by;
    out[1] = ay * bw + aw * by;
    out[2] = az * bw + ax * by;
    out[3] = aw * bw - ay * by;
    return out;
};

/**
 * Rotates a quaternion by the given angle around the Z axis
 *
 * @param {quat} out quat receiving operation result
 * @param {quat} a quat to rotate
 * @param {number} rad angle (in radians) to rotate
 * @returns {quat} out
 */
quat.rotateZ = function (out, a, rad) {
    rad *= 0.5; 

    var ax = a[0], ay = a[1], az = a[2], aw = a[3],
        bz = Math.sin(rad), bw = Math.cos(rad);

    out[0] = ax * bw + ay * bz;
    out[1] = ay * bw - ax * bz;
    out[2] = az * bw + aw * bz;
    out[3] = aw * bw - az * bz;
    return out;
};

/**
 * Calculates the W component of a quat from the X, Y, and Z components.
 * Assumes that quaternion is 1 unit in length.
 * Any existing W component will be ignored.
 *
 * @param {quat} out the receiving quaternion
 * @param {quat} a quat to calculate W component of
 * @returns {quat} out
 */
quat.calculateW = function (out, a) {
    var x = a[0], y = a[1], z = a[2];

    out[0] = x;
    out[1] = y;
    out[2] = z;
    out[3] = -Math.sqrt(Math.abs(1.0 - x * x - y * y - z * z));
    return out;
};

/**
 * Calculates the dot product of two quat's
 *
 * @param {quat} a the first operand
 * @param {quat} b the second operand
 * @returns {Number} dot product of a and b
 * @function
 */
quat.dot = vec4.dot;

/**
 * Performs a linear interpolation between two quat's
 *
 * @param {quat} out the receiving quaternion
 * @param {quat} a the first operand
 * @param {quat} b the second operand
 * @param {Number} t interpolation amount between the two inputs
 * @returns {quat} out
 * @function
 */
quat.lerp = vec4.lerp;

/**
 * Performs a spherical linear interpolation between two quat
 *
 * @param {quat} out the receiving quaternion
 * @param {quat} a the first operand
 * @param {quat} b the second operand
 * @param {Number} t interpolation amount between the two inputs
 * @returns {quat} out
 */
quat.slerp = function (out, a, b, t) {
    var ax = a[0], ay = a[1], az = a[2], aw = a[3],
        bx = b[0], by = b[1], bz = b[2], bw = b[3];

    var cosHalfTheta = ax * bx + ay * by + az * bz + aw * bw,
        halfTheta,
        sinHalfTheta,
        ratioA,
        ratioB;

    if (Math.abs(cosHalfTheta) >= 1.0) {
        if (out !== a) {
            out[0] = ax;
            out[1] = ay;
            out[2] = az;
            out[3] = aw;
        }
        return out;
    }

    halfTheta = Math.acos(cosHalfTheta);
    sinHalfTheta = Math.sqrt(1.0 - cosHalfTheta * cosHalfTheta);

    if (Math.abs(sinHalfTheta) < 0.001) {
        out[0] = (ax * 0.5 + bx * 0.5);
        out[1] = (ay * 0.5 + by * 0.5);
        out[2] = (az * 0.5 + bz * 0.5);
        out[3] = (aw * 0.5 + bw * 0.5);
        return out;
    }

    ratioA = Math.sin((1 - t) * halfTheta) / sinHalfTheta;
    ratioB = Math.sin(t * halfTheta) / sinHalfTheta;

    out[0] = (ax * ratioA + bx * ratioB);
    out[1] = (ay * ratioA + by * ratioB);
    out[2] = (az * ratioA + bz * ratioB);
    out[3] = (aw * ratioA + bw * ratioB);

    return out;
};

/**
 * Calculates the inverse of a quat
 *
 * @param {quat} out the receiving quaternion
 * @param {quat} a quat to calculate inverse of
 * @returns {quat} out
 */
quat.invert = function(out, a) {
    var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3],
        dot = a0*a0 + a1*a1 + a2*a2 + a3*a3,
        invDot = dot ? 1.0/dot : 0;
    
    // TODO: Would be faster to return [0,0,0,0] immediately if dot == 0

    out[0] = -a0*invDot;
    out[1] = -a1*invDot;
    out[2] = -a2*invDot;
    out[3] = a3*invDot;
    return out;
};

/**
 * Calculates the conjugate of a quat
 * If the quaternion is normalized, this function is faster than quat.inverse and produces the same result.
 *
 * @param {quat} out the receiving quaternion
 * @param {quat} a quat to calculate conjugate of
 * @returns {quat} out
 */
quat.conjugate = function (out, a) {
    out[0] = -a[0];
    out[1] = -a[1];
    out[2] = -a[2];
    out[3] = a[3];
    return out;
};

/**
 * Calculates the length of a quat
 *
 * @param {quat} a vector to calculate length of
 * @returns {Number} length of a
 * @function
 */
quat.length = vec4.length;

/**
 * Alias for {@link quat.length}
 * @function
 */
quat.len = quat.length;

/**
 * Calculates the squared length of a quat
 *
 * @param {quat} a vector to calculate squared length of
 * @returns {Number} squared length of a
 * @function
 */
quat.squaredLength = vec4.squaredLength;

/**
 * Alias for {@link quat.squaredLength}
 * @function
 */
quat.sqrLen = quat.squaredLength;

/**
 * Normalize a quat
 *
 * @param {quat} out the receiving quaternion
 * @param {quat} a quaternion to normalize
 * @returns {quat} out
 * @function
 */
quat.normalize = vec4.normalize;

/**
 * Creates a quaternion from the given 3x3 rotation matrix.
 *
 * @param {quat} out the receiving quaternion
 * @param {mat3} m rotation matrix
 * @returns {quat} out
 * @function
 */
quat.fromMat3 = (function() {
    var s_iNext = [1,2,0];
    return function(out, m) {
        // Algorithm in Ken Shoemake's article in 1987 SIGGRAPH course notes
        // article "Quaternion Calculus and Fast Animation".
        var fTrace = m[0] + m[4] + m[8];
        var fRoot;

        if ( fTrace > 0.0 ) {
            // |w| > 1/2, may as well choose w > 1/2
            fRoot = Math.sqrt(fTrace + 1.0);  // 2w
            out[3] = 0.5 * fRoot;
            fRoot = 0.5/fRoot;  // 1/(4w)
            out[0] = (m[7]-m[5])*fRoot;
            out[1] = (m[2]-m[6])*fRoot;
            out[2] = (m[3]-m[1])*fRoot;
        } else {
            // |w| <= 1/2
            var i = 0;
            if ( m[4] > m[0] )
              i = 1;
            if ( m[8] > m[i*3+i] )
              i = 2;
            var j = s_iNext[i];
            var k = s_iNext[j];
            
            fRoot = Math.sqrt(m[i*3+i]-m[j*3+j]-m[k*3+k] + 1.0);
            out[i] = 0.5 * fRoot;
            fRoot = 0.5 / fRoot;
            out[3] = (m[k*3+j] - m[j*3+k]) * fRoot;
            out[j] = (m[j*3+i] + m[i*3+j]) * fRoot;
            out[k] = (m[k*3+i] + m[i*3+k]) * fRoot;
        }
        
        return out;
    };
})();

/**
 * Returns a string representation of a quatenion
 *
 * @param {quat} vec vector to represent as a string
 * @returns {String} string representation of the vector
 */
quat.str = function (a) {
    return 'quat(' + a[0] + ', ' + a[1] + ', ' + a[2] + ', ' + a[3] + ')';
};

if(typeof(exports) !== 'undefined') {
    exports.quat = quat;
}


/**
 * Author: thegoldenmule
 * Date: 3/10/13
 */

(function (global) {
    "use strict";

    var Color = function(r, g, b) {
        var that = this;

        that.r = undefined === r ? 0 : r;
        that.g = undefined === g ? 0 : g;
        that.b = undefined === b ? 0 : b;

        return that;
    };

    Color.prototype = {
        constructor : Color,

        multiply : function(color) {
            return new Color(
                color.r * this.r,
                color.g * this.g,
                color.b * this.b);
        }
    };

    // export
    global.Color = Color;
})(this);
/**
 * Author: thegoldenmule
 * Date: 3/17/13
 */

(function (global) {
    "use strict";

    var colorShaderVS = {
        name: "color-shader-vs",
        type: "x-shader/x-vertex",
        body:
            "precision highp float;" +

            "uniform mat4 uProjectionMatrix;" +
            "uniform mat4 uModelViewMatrix;" +

            "uniform vec4 uColor;" +

            "uniform float uDepth;" +

            "attribute vec2 aPosition;" +
            "attribute vec4 aColor;" +

            "varying vec4 vColor;" +

            "void main(void) {" +
                // vertex transform
                "gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aPosition, uDepth, 1.0);" +

                // calculate color
                "vColor = uColor * aColor;" +
            "}"
    };

    var colorShaderFS = {
        name: "color-shader-fs",
        type: "x-shader/x-fragment",
        body:
            "precision highp float;" +

            "varying vec4 vColor;" +

            "void main(void) {" +
                "gl_FragColor = vColor;" +
            "}"
    };

    var textureShaderVS = {
        name: "texture-shader-vs",
        type: "x-shader/x-vertex",
        body:
            "precision highp float;" +

            "uniform mat4 uProjectionMatrix;" +
            "uniform mat4 uModelViewMatrix;" +

            "uniform vec4 uColor;" +

            "uniform float uDepth;" +

            "attribute vec2 aPosition;" +
            "attribute vec2 aUV;" +
            "attribute vec4 aColor;" +

            "varying vec4 vColor;" +
            "varying vec2 vUV;" +

            "void main(void) {" +
                // vertex transform
                "gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aPosition, uDepth, 1.0);" +

                // pass color + uv through
                "vColor = aColor * uColor;" +
                "vUV = aUV;" +
            "}"
    };

    var textureShaderFS = {
        name: "texture-shader-fs",
        type: "x-shader/x-fragment",
        body:
            "precision highp float;" +

            "varying vec4 vColor;" +
            "varying vec2 vUV;" +

            "uniform sampler2D uMainTextureSampler;" +

            "void main(void) {" +
                "gl_FragColor = texture2D(uMainTextureSampler, vUV) * vColor;" +
            "}"
    };

    var spriteSheetShaderVS = {
            name: "ss-shader-vs",
            type: "x-shader/x-vertex",
            body:
                "precision highp float;" +

                "uniform mat4 uProjectionMatrix;" +
                "uniform mat4 uModelViewMatrix;" +

                "uniform vec4 uColor;" +

                "uniform float uDepth;" +

                "attribute vec2 aPosition;" +
                "attribute vec2 aUV;" +
                "attribute vec4 aColor;" +

                "varying vec4 vColor;" +
                "varying vec4 vVertexColor;" +
                "varying vec2 vUV;" +

                "void main(void) {" +
                    // vertex transform
                    "gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aPosition, uDepth, 1.0);" +

                    // pass color + uv through
                    "vColor = uColor;" +

                    // note that in this shader, color.xy is the previous frame's uvs!
                    "vUV = aUV;" +
                    "vVertexColor = aColor;" +
                "}"
        };

        var spriteSheetShaderFS = {
            name: "ss-shader-fs",
            type: "x-shader/x-fragment",
            body:
                "precision highp float;" +

                "varying vec4 vColor;" +
                "varying vec4 vVertexColor;" +
                "varying vec2 vUV;" +

                "uniform sampler2D uMainTextureSampler;" +
                "uniform float uFutureBlendScalar;" +
                "uniform float uBlendWeight;" +

                "void main(void) {" +
                    "vec4 currentFrame = texture2D(uMainTextureSampler, vUV);" +
                    "vec4 futureFrame = texture2D(uMainTextureSampler, vec2(vVertexColor.xy));" +
                    "float blendWeight = uBlendWeight * uFutureBlendScalar;" +
                    "gl_FragColor = futureFrame * blendWeight + currentFrame * (1.0 - blendWeight);" +
                "}"
        };

    var boundingBoxShaderVS = {
        name: "bb-shader-vs",
        type: "x-shader/x-vertex",
        body:
            "precision highp float;" +

            "uniform mat4 uProjectionMatrix;" +
            "uniform mat4 uModelViewMatrix;" +

            "attribute vec2 aPosition;" +
            "attribute vec2 aUV;" +

            "varying vec2 vUV;" +

            "void main(void) {" +
                // vertex transform
                "gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aPosition, 0.0, 1.0);" +

                "vUV = aUV;" +
            "}"
    };

    var boundingBoxShaderFS = {
        name: "bb-shader-fs",
        type: "x-shader/x-fragment",
        body:
            "varying vec2 vUV;" +

            "void main(void) {" +
                "gl_FragColor = vec4(1.0, 0.0, 0.0, 0.2);" +
            "}"
    };

    var particleShaderVS = {
        name: "particle-shader-vs",
        type: "x-shader/x-vertex",
        body:
            "precision highp float;" +

            "uniform mat4 uProjectionMatrix;" +
            "uniform mat4 uModelViewMatrix;" +

            "uniform vec4 uColor;" +

            "uniform float uDepth;" +

            "attribute vec2 aPosition;" +
            "attribute vec2 aUV;" +
            "attribute vec4 aColor;" +

            "varying vec4 vColor;" +
            "varying vec2 vUV;" +

            "void main(void) {" +
                // vertex transform
                "gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aPosition, uDepth, 1.0);" +

                // pass color + uv through
                "vColor = aColor * uColor;" +
                "vUV = aUV;" +
            "}"
    };

    var particleShaderFS = {
        name: "particle-shader-fs",
        type: "x-shader/x-fragment",
        body:
            "precision highp float;" +

            "varying vec4 vColor;" +
            "varying vec2 vUV;" +

            "uniform sampler2D uMainTextureSampler;" +

            "void main(void) {" +
                "gl_FragColor = texture2D(uMainTextureSampler, vUV) * vColor;" +
            "}"
    };

    global.__DEFAULT_SHADERS = [
        colorShaderVS,
        colorShaderFS,

        textureShaderVS,
        textureShaderFS,

        spriteSheetShaderFS,
        spriteSheetShaderVS,

        boundingBoxShaderVS,
        boundingBoxShaderFS,

        particleShaderVS,
        particleShaderFS
    ];

})(this);
/**
 * Author: thegoldenmule
 * Date: 1/30/13
 * Time: 4:35 PM
 */

/// requestAnimationFrame
window.requestAnimationFrame = window.requestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.msRequestAnimationFrame;

// logging
var Log = (function() {
    function log(msg) {
        if (console && console.log) {
            console.log(msg);
        }
    }

    function replaceTokens(msg, tokens) {
        var message = [];
        var messagePieces = msg.split(/\{\}/);
        for (var i = 0, len = Math.min(tokens.length, messagePieces.length); i < len; i++) {
            message.push(messagePieces[i]);
            message.push(tokens[i]);
        }

        if (i < messagePieces.length) {
            message.push(messagePieces.slice(i).join(""));
        }

        return message.join("");
    }

    function loggingFunction(level) {
        return function() {
            var args =  Array.prototype.slice.call(arguments);
            if (0 === args.length) {
                return;
            } else if (1 === args.length) {
                log("[" + level + "] : " + args[0]);
            } else {
                log("[" + level + "] : " + replaceTokens(args[0], args.slice(1)));
            }
        };
    }

    return {
        debug : loggingFunction("Debug"),
        info : loggingFunction("Info"),
        warn : loggingFunction("Warn"),
        error : loggingFunction("Error")
    };
})();

var Signal = signals.Signal;

/**
 * Engine
 *
 * @type {*}
 */
var Engine = (function() {
    "use strict";

    /// Static Variables

    /// Static Methods

    return function() {
        var that = this;

        var _scene = new Scene();

        // Public Vars
        that.paused = false;
        that.onPreUpdate = new Signal();
        that.onPostUpdate = new Signal();

        /// Private Variables
        var _initialized = false,
            _renderer = null,
            _lastUpdate = 0,
            _totalTime = 0;

        // Public Methods
        that.getSimulationTime = function() {
            return _totalTime;
        };

        that.getRenderer = function() {
            return _renderer;
        };

        that.getScene = function() {
            return _scene;
        };

        that.initialize = function(renderer) {
            if (true === _initialized) {
                throw new Error("Cannot initialize Engine twice!");
            }
            _initialized = true;

            _renderer = renderer;

            _lastUpdate = Date.now();

            // start the game loop
            window.requestAnimationFrame(
                function Step() {
                    var now = Date.now();
                    var dt = now - _lastUpdate;
                    _lastUpdate = now;

                    update(dt);

                    window.requestAnimationFrame(Step);
                });
        };

        /// Private Methods
        function update(dt) {
            if (that.paused) {
                return;
            }

            _totalTime += dt;

            _renderer.preUpdate();
            that.onPreUpdate.dispatch(dt);

            _scene.update(dt, _renderer);

            that.onPostUpdate.dispatch(dt);
        }

        return that;
    };
})();

Engine.prototype = {
    constructor : Engine
};
/**
 * Author: thegoldenmule
 * Date: 3/11/13
 */

(function (global) {
    "use strict";

    var GUIDS = 0;

    var Material = function () {
        var scope = this;

        // get unique id
        var _id = GUIDS++;

        scope.getId = function() {
            return _id;
        };

        scope.shader = new Shader();
        scope.mainTexture = new Texture();
        scope.secTexture = new Texture();

        return scope;
    };

    Material.prototype = {
        constructor:Material,

        prepareTextures: function(ctx) {
            if (null !== this.mainTexture) {
                this.mainTexture.prepareTexture(ctx);
            }

            if (null !== this.secTexture) {
                this.secTexture.prepareTexture(ctx);
            }
        },

        pushTextures: function(ctx, shader) {
            if (null !== this.mainTexture) {
                this.mainTexture.pushTexture(ctx, shader, ctx.TEXTURE0);
            }

            if (null !== this.secTexture) {
                this.secTexture.pushTexture(ctx, shader, ctx.TEXTURE1);
            }
        }
    };

    // export
    global.Material = Material;
})(this);
/**
 * User: ti83
 * Date: 3/10/13
 */

(function(global) {
    "use strict";

    var __tempVec3 = vec3.create();

    var Rectangle = function(x, y, w, h) {
        var scope = this;

        scope.x = undefined === x ? 0 : x;
        scope.y = undefined === y ? 0 : y;
        scope.w = undefined === w ? 0 : w;
        scope.h = undefined === h ? 0 : h;

        return scope;
    };

    Rectangle.prototype = {
        constructor: Rectangle,

        zero: function() {
            this.x = this.y = this.w = this.h = 0;
        },

        set: function(x, y, w, h) {
            this.x = x;
            this.y = y;
            this.w = w;
            this.h = h;
        },

        copy: function(rect) {
            this.x = rect.x;
            this.y = rect.y;
            this.w = rect.w;
            this.h = rect.h;
        }
    };

    global.Rectangle = Rectangle;

})(this);

// Math extensions
(function() {
    "use strict";

    Math.clamp = function(value, min, max) {
        return value < min ? min : value > max ? max : value;
    };
})();
/**
 * User: ti83
 * Date: 3/9/13
 */
(function(global) {
    "use strict";

    var Quad = function () {
        var that = this;

        that.width = 1;
        that.height = 1;

        that.vertices = new Float32Array([
            0, 0,
            0, 1,
            1, 0,
            1, 1]);

        that.uvs = new Float32Array([
            0, 0,
            0, 1,
            1, 0,
            1, 1]);

        that.colors = new Float32Array([
            1, 1, 1, 1,
            1, 1, 1, 1,
            1, 1, 1, 1,
            1, 1, 1, 1]);

        that.vertexBuffer = null;
        that.uvBuffer = null;
        that.colorBuffer = null;

        that.__apply = true;

        return that;
    };

    Quad.prototype = {
        constructor: Quad,

        apply: function() {
            // update from width/height
            this.vertices[4] = this.vertices[6] = this.width;
            this.vertices[3] = this.vertices[7] = this.height;

            this.__apply = true;
        },

        clearBuffers: function() {
            this.vertexBuffer = this.uvBuffer = this.colorBuffer = null;
        },

        prepareBuffers: function(ctx) {
            if (null === this.vertexBuffer) {
                this.vertexBuffer = ctx.createBuffer();
            }

            if (null === this.uvBuffer) {
                this.uvBuffer = ctx.createBuffer();
            }

            if (null === this.colorBuffer) {
                this.colorBuffer = ctx.createBuffer();
            }

            if (this.__apply) {
                ctx.bindBuffer(ctx.ARRAY_BUFFER, this.vertexBuffer);
                ctx.bufferData(ctx.ARRAY_BUFFER, this.vertices, ctx.STATIC_DRAW);

                ctx.bindBuffer(ctx.ARRAY_BUFFER, this.uvBuffer);
                ctx.bufferData(ctx.ARRAY_BUFFER, this.uvs, ctx.STATIC_DRAW);

                ctx.bindBuffer(ctx.ARRAY_BUFFER, this.colorBuffer);
                ctx.bufferData(ctx.ARRAY_BUFFER, this.colors, ctx.STATIC_DRAW);
            }

            this.__apply = false;
        },

        pushBuffers: function(ctx, shader) {
            if (-1 < shader.vertexBufferAttributePointer) {
                ctx.bindBuffer(ctx.ARRAY_BUFFER, this.vertexBuffer);
                ctx.vertexAttribPointer(shader.vertexBufferAttributePointer, 2, ctx.FLOAT, false, 0, 0);
            }

            if (-1 < shader.uvBufferAttributePointer) {
                ctx.bindBuffer(ctx.ARRAY_BUFFER, this.uvBuffer);
                ctx.vertexAttribPointer(shader.uvBufferAttributePointer, 2, ctx.FLOAT, false, 0, 0);
            }

            if (-1 < shader.vertexColorBufferAttributePointer) {
                ctx.bindBuffer(ctx.ARRAY_BUFFER, this.colorBuffer);
                ctx.vertexAttribPointer(shader.vertexColorBufferAttributePointer, 4, ctx.FLOAT, false, 0, 0);
            }
        },

        draw: function(ctx) {
            ctx.drawArrays(
                ctx.TRIANGLE_STRIP,
                0,
                4);
        }
    };

    // export
    global.Quad = Quad;
})(this);
/**
 * Author: thegoldenmule
 * Date: 3/20/13
 */

(function (global) {
    "use strict";

    var EPSILON = 0.0001;

    var RenderBatch = function (material) {
        var scope = this;

        var _material = material;
        var _displayObjects = [];

        scope.getMaterial = function() {
            return _material;
        };

        scope.getDisplayObjects = function() {
            // returning a copy will definitely affect performance...
            return _displayObjects;
        };

        scope.addDisplayObject = function(displayObject) {
            if (displayObject.material !== _material) {
                return false;
            }

            if (!RenderBatch.canBatch(displayObject)) {
                return false;
            }

            // for good measure...
            displayObject.alpha = 1;

            _displayObjects.push(displayObject);
        };

        scope.removeDisplayObject = function(displayObject) {
            var index = _displayObjects.indexOf(displayObject);
            if (-1 !== index) {
                _displayObjects.splice(index, 1);
            }
        };

        return scope;
    };

    RenderBatch.canBatch = function(displayObject) {
        // cannot batch when alpha is involved
        if (Math.abs(1 - displayObject.alpha) > EPSILON) {
            return false;
        }

        return true;
    };

    RenderBatch.prototype = {
        constructor: RenderBatch
    };

    // export
    global.RenderBatch = RenderBatch;
})(this);
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
            var children = node.children;
            var len = children.length;
            if (0 === len) {
                return;
            }

            var diff = (depthMax - depthMin) / len;
            var diffMin = diff / 10;
            var diffMax = 9 * diff / 10;
            for (var i = 0; i < len; i++) {
                var child = children[i];

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
/**
 * Author: thegoldenmule
 * Date: 2/2/13
 * Time: 8:26 PM
 */

var Shader = (function() {
    "use strict";

    var ShaderUniformTypes = {
        FLOAT   : 0,

        VEC2    : 1,
        VEC3    : 2,
        VEC4    : 3,

        MAT2    : 4,
        MAT3    : 5,
        MAT4    : 6
    };

    return function() {
        var that = this;

        that.vertexBufferAttributePointer = null;
        that.vertexColorBufferAttributePointer = null;
        that.uvBufferAttributePointer = null;

        that.projectionMatrixUniformPointer = null;
        that.modelMatrixUniformPointer = null;
        that.colorUniformPointer = null;
        that.depthUniformPointer = null;
        that.mainTextureUniformPointer = null;
        that.secTextureUniformPointer = null;

        var _compiled = false,
            _dirtyPointers = true,
            _shaderProgram = null,
            _vertexProgramId = "texture-shader-vs",
            _fragmentProgramId = "texture-shader-fs",

            _customUniforms = {};

        that.setShaderProgramIds = function(vertex, fragment) {
            if (vertex === _vertexProgramId && fragment === _fragmentProgramId) {
                return;
            }

            _vertexProgramId = vertex;
            _fragmentProgramId = fragment;

            _compiled = false;
        };

        that.getShaderProgram = function() {
            return _shaderProgram;
        };

        function setUniformValue(type) {
            return function (name, value) {
                if (undefined === _customUniforms[name]) {
                    _customUniforms[name] = {
                        type: type,
                        pointer: -1,
                        value: value
                    };

                    _dirtyPointers = true;
                } else {
                    _customUniforms[name].value = value;
                }
            };
        }

        that.setUniformFloat = setUniformValue(ShaderUniformTypes.FLOAT);

        that.setUniformVec2 = setUniformValue(ShaderUniformTypes.VEC2);

        that.setUniformVec3 = setUniformValue(ShaderUniformTypes.VEC3);

        that.setUniformVec4 = setUniformValue(ShaderUniformTypes.VEC4);

        that.setUniformMat2 = setUniformValue(ShaderUniformTypes.MAT2);

        that.setUniformMat3 = setUniformValue(ShaderUniformTypes.MAT3);

        that.setUniformMat4 = setUniformValue(ShaderUniformTypes.MAT4);

        that.compile = function(ctx) {
            if (!_compiled) {
                if (null === _vertexProgramId || null === _fragmentProgramId) {
                    return false;
                }

                if (window.isTwoDeeDebug) {
                    Log.debug("Compiling program {" + _vertexProgramId + " :: " + _fragmentProgramId + "}");
                }

                var fragmentShader = compileShader(ctx, _fragmentProgramId);
                var vertexShader = compileShader(ctx, _vertexProgramId);

                _shaderProgram = ctx.createProgram();

                if (null === vertexShader || null === fragmentShader) {
                    return false;
                }

                try {
                    ctx.attachShader(_shaderProgram, vertexShader);
                    ctx.attachShader(_shaderProgram, fragmentShader);
                } catch (error) {
                    return false;
                }

                ctx.linkProgram(_shaderProgram);

                if (!ctx.getProgramParameter(_shaderProgram, ctx.LINK_STATUS)) {
                    return false;
                }

                _compiled = true;
            }

            if (_dirtyPointers) {
                setupPointers(ctx);

                _dirtyPointers = true;
            }

            return true;
        };

        // TODO: This is obviously not optimal!
        that.pushCustomUniforms = function(ctx) {
            Object.keys(_customUniforms).forEach(
                function(name) {
                    var definition = _customUniforms[name];
                    if (-1 === definition.pointer) {
                        return;
                    }

                    switch (definition.type) {
                        case ShaderUniformTypes.FLOAT:
                            ctx.uniform1f(definition.pointer, definition.value);
                            break;

                        case ShaderUniformTypes.VEC2:
                            ctx.uniform2fv(definition.pointer, definition.value);
                            break;

                        case ShaderUniformTypes.VEC3:
                            ctx.uniform3fv(definition.pointer, definition.value);
                            break;

                        case ShaderUniformTypes.VEC4:
                            ctx.uniform4fv(definition.pointer, definition.value);
                            break;

                        case ShaderUniformTypes.MAT2:
                            ctx.uniformMatrix2fv(definition.pointer, false, definition.value);
                            break;

                        case ShaderUniformTypes.MAT3:
                            ctx.uniformMatrix3fv(definition.pointer, false, definition.value);
                            break;

                        case ShaderUniformTypes.MAT4:
                            ctx.uniformMatrix4fv(definition.pointer, false, definition.value);
                            break;
                    }
                });
        };

        // This function is based on
        // https://developer.mozilla.org/en-US/docs/WebGL/Adding_2D_content_to_a_WebGL_context.
        function compileShader(ctx, id) {
            var script = document.getElementById(id);

            if (null === script) {
                Log.error("Could not find shader " + id + ".");
                return null;
            }

            var source = "";
            var currentChild = script.firstChild;

            while (currentChild) {
                if (currentChild.nodeType === currentChild.TEXT_NODE) {
                    source += currentChild.textContent;
                }

                currentChild = currentChild.nextSibling;
            }

            var shader = null;

            if ("x-shader/x-fragment" === script.type) {
                shader = ctx.createShader(ctx.FRAGMENT_SHADER);
            } else if ("x-shader/x-vertex" === script.type) {
                shader = ctx.createShader(ctx.VERTEX_SHADER);
            } else {
                // Unknown shader type
                Log.error("Unknown shader type : " + script.type);
                return null;
            }

            ctx.shaderSource(shader, source);

            // Compile the shader program
            ctx.compileShader(shader);

            // See if it compiled successfully
            if (!ctx.getShaderParameter(shader, ctx.COMPILE_STATUS)) {
                if (window.isTwoDeeDebug) {
                    Log.error("Could not compile shader :\n{}", ctx.getShaderInfoLog(shader));
                }
                return null;
            }

            return shader;
        }

        function setupPointers(ctx) {
            setupAttributePointers(ctx);
            setupUniformPointers(ctx);
            setupCustomUniformPointers(ctx);
        }

        function setupAttributePointers(ctx) {
            that.vertexBufferAttributePointer = ctx.getAttribLocation(_shaderProgram, "aPosition");
            if (-1 !== that.vertexBufferAttributePointer) {
                ctx.enableVertexAttribArray(that.vertexBufferAttributePointer);
            }

            that.vertexColorBufferAttributePointer = ctx.getAttribLocation(_shaderProgram, "aColor");
            if (-1 !== that.vertexColorBufferAttributePointer) {
                ctx.enableVertexAttribArray(that.vertexColorBufferAttributePointer);
            }

            that.uvBufferAttributePointer = ctx.getAttribLocation(_shaderProgram, "aUV");
            if (-1 !== that.uvBufferAttributePointer) {
                ctx.enableVertexAttribArray(that.uvBufferAttributePointer);
            }
        }

        function setupUniformPointers(ctx) {
            that.projectionMatrixUniformPointer = ctx.getUniformLocation(_shaderProgram, "uProjectionMatrix");
            that.modelMatrixUniformPointer = ctx.getUniformLocation(_shaderProgram, "uModelViewMatrix");
            that.colorUniformPointer = ctx.getUniformLocation(_shaderProgram, "uColor");
            that.depthUniformPointer = ctx.getUniformLocation(_shaderProgram, "uDepth");
            that.mainTextureUniformPointer = ctx.getUniformLocation(_shaderProgram, "uMainTextureSampler");
            that.secTextureUniformPointer = ctx.getUniformLocation(_shaderProgram, "uSecTextureSampler");
        }

        // TODO: This method is obviously not optimal!
        function setupCustomUniformPointers(ctx) {
            Object.keys(_customUniforms).forEach(
                function(name) {
                    var definition = _customUniforms[name];
                    definition.pointer = ctx.getUniformLocation(_shaderProgram, name);
                });
        }

        return that;
    };
})();
/**
 * Author: thegoldenmule
 * Date: 5/26/13
 */

(function (global) {
    "use strict";

    var SpriteSheetScheduler = function () {
        var scope = this;

        var _spriteSheets = new Set();

        scope.addSpriteSheet = function(spriteSheet) {
            _spriteSheets.add(spriteSheet);
        };

        scope.removeSpriteSheet = function(spriteSheet) {
            _spriteSheets.remove(spriteSheet);
        };

        scope.onPreUpdate = function(dt) {
            var elements = _spriteSheets.getElements();
            for (var i = 0, len = elements.length; i < len; i++) {
                elements[i].update(dt);
            }
        };

        return scope;
    };

    SpriteSheetScheduler.prototype = {
        constructor: SpriteSheetScheduler
    };

    // export
    global.SpriteSheetScheduler = SpriteSheetScheduler;
})(this);
/**
 * Author: thegoldenmule
 * Date: 3/10/13
 */

(function (global) {
    "use strict";

    var Texture = function (image) {
        var scope = this;

        scope.image = undefined === image ? null : image;
        scope.glTexture = null;
        scope.flipY = false;
        scope.filterLinear = true;
        scope.mipmapLinear = true;

        return scope;
    };

    Texture.prototype = {
        constructor:Texture,

        getWidth: function() {
            return this.image ? parseInt(this.image.width, 10) : 0;
        },

        getHeight: function() {
            return this.image ? parseInt(this.image.height, 10) : 0;
        },

        prepareTexture: function(ctx) {
            if (null === this.image) {
                return;
            }

            if (null === this.glTexture) {
                this.glTexture = ctx.createTexture();

                ctx.bindTexture(ctx.TEXTURE_2D, this.glTexture);
                ctx.pixelStorei(ctx.UNPACK_FLIP_Y_WEBGL, this.flipY);
                ctx.pixelStorei(ctx.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
                ctx.texImage2D(ctx.TEXTURE_2D, 0, ctx.RGBA, ctx.RGBA, ctx.UNSIGNED_BYTE, this.image);
                ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MAG_FILTER, this.filterLinear ? ctx.LINEAR : ctx.NEAREST);
                ctx.texParameteri(ctx.TEXTURE_2D, ctx.TEXTURE_MIN_FILTER, this.filterLinear ? ctx.LINEAR : ctx.NEAREST);
                ctx.bindTexture(ctx.TEXTURE_2D, null);
            }
        },

        pushTexture: function(ctx, shader, textureNum) {
            if (-1 === shader.mainTextureUniformPointer) {
                return;
            }

            ctx.activeTexture(textureNum);
            ctx.bindTexture(ctx.TEXTURE_2D, this.glTexture);
            ctx.uniform1i(shader.mainTextureUniformPointer, 0);
        }
    };

    // export
    global.Texture = Texture;
})(this);
/**
 * Author: thegoldenmule
 * Date: 3/10/13
 */

(function (global) {
    "use strict";

    var __tempVec3 = vec3.create();

    var Transform = function () {
        var scope = this;

        var _matrix = mat4.create();

        scope.anchorPoint = {
            x:0,
            y:0
        };

        scope.position = {
            x:0,
            y:0
        };

        scope.rotationInRadians = 0;

        scope.scale = {
            x: 1,
            y: 1
        };

        scope.getMatrix = function() {
            return _matrix;
        };

        scope.recalculateMatrix = function() {
            // this takes the anchor point into consideration
            mat4.identity(_matrix);
            mat4.translate(_matrix, _matrix,
                vec3.set(
                    __tempVec3,
                    scope.position.x,
                    scope.position.y,
                    0.0));
            mat4.rotateZ(_matrix, _matrix, scope.rotationInRadians);
            mat4.translate(_matrix, _matrix,
                vec3.set(
                    __tempVec3,
                    -scope.anchorPoint.x,
                    -scope.anchorPoint.y,
                    0.0));

            mat4.scale(_matrix, _matrix,
                vec3.set(
                    __tempVec3,
                    scope.scale.x,
                    scope.scale.y,
                    1.0));

            return _matrix;
        };

        return scope;
    };

    Transform.prototype = {
        constructor:Transform,

        clone: function() {
            var newTransform = new Transform();
            newTransform.copy(this);
            return newTransform;
        },

        copy: function(transform) {
            this.position.x = transform.position.x;
            this.position.y = transform.position.y;
            this.scale.x = transform.scale.x;
            this.scale.y = transform.scale.y;
            this.rotationInRadians = transform.rotationInRadians;
        }
    };

    // export
    global.Transform = Transform;
})(this);
/**
 * Author: thegoldenmule
 * Date: 3/10/13
 */

(function (global) {
    "use strict";

    var __tempModelMatrix = mat4.create(),
        __tempColor = new Float32Array([1, 1, 1, 1]);

    var WebGLRenderer = function(canvas) {
        var scope = this;

        var _canvas = canvas,
            _ctx,
            _debugInformation = {};

        /**
         * Returns the CanvasDomElement being used.
         *
         * @returns {*}
         */
        scope.getCanvas = function() {
            return _canvas;
        };

        /**
         * Returns the WebGL context eing used.
         *
         * @returns {*}
         */
        scope.getContext = function() {
            return _ctx;
        };

        /**
         * Resizes the viewport based on a resize to the CanvasDomElement.
         */
        scope.resize = (function() {

            var oldWidth = 0;
            var oldHeight = 0;

            return function() {
                var width = canvas.clientWidth;
                var height = canvas.clientHeight;

                if (width === oldWidth &&
                    height === oldHeight) {
                    return;
                }

                canvas.width = width;
                canvas.height = height;

                _ctx.viewport(0, 0, _ctx.drawingBufferWidth, _ctx.drawingBufferHeight);

                scope.projectionMatrix = mat4.ortho(
                    mat4.create(),
                    0, width,
                    height,
                    -1, 1);
            };
        })();

        // init context
        try {
            var params = {
                premultipliedAlpha: false,
                alpha: false
            };
            _ctx = canvas.getContext("webgl", params) || canvas.getContext("experimental-webgl", params);

            // size
            scope.resize();

            // use the debug context if we want to see verbose logs
            if (window.isTwoDeeDebug) {
                _ctx = WebGLDebugUtils.makeDebugContext(_ctx);

                _debugInformation.isDebugCanvas = true;
            }

            _ctx.clearColor(1, 1, 1, 1);

            // alpha blending
            _ctx.enable(_ctx.BLEND);
            _ctx.blendFunc(_ctx.SRC_ALPHA, _ctx.ONE_MINUS_SRC_ALPHA);
        } catch (error) {
            Log.error(error);
        }

        // inject shaders here
        if (global.__DEFAULT_SHADERS) {
            global.__DEFAULT_SHADERS.forEach(this.appendShader);
        }

        return scope;
    };

    WebGLRenderer.prototype = {
        constructor:WebGLRenderer,

        /**
         * Returns the width of the viewport.
         *
         * @returns {number}
         */
        getWidth: function() {
            return this.getCanvas().clientWidth;
        },

        /**
         * Returns the height of the viewport.
         *
         * @returns {number}
         */
        getHeight: function() {
            return this.getCanvas().clientHeight;
        },

        /**
         * Appends a shader to the DOM. Definitions are objects in the form:
         *
         * {
         *  name,   (a unique name for the shader tag)
         *  type,   (x-shader/x-vertex or x-shader/x-fragment)
         *  body    (the glsl body of the shader)
         * }
         * @param definition
         */
        appendShader: function(definition) {
            var shader = document.createElement('script');
            shader.type = definition.type;
            shader.id = definition.name;

            try {
                shader.appendChild(document.createTextNode(definition.body));
            } catch (error) {
                shader.text = definition.body;
            } finally {
                document.body.appendChild(shader);
            }
        },

        /**
         * Called as part of the boX cycle, before any drawing is done.
         */
        preUpdate: function() {
            this.resize();

            var context = this.getContext();
            context.clear(context.COLOR_BUFFER_BIT | context.DEPTH_BUFFER_BIT);
        },

        /**
         * Draws a RenderBatch to the screen.
         *
         * @param renderBatch
         */
        drawBatch: function(renderBatch) {
            var context = this.getContext();

            // set the program to use
            var shader = renderBatch.getMaterial().shader;
            shader.compile(context);
            context.useProgram(shader.getShaderProgram());

            // tell the shader to do its thang
            shader.pushCustomUniforms(context);

            // set projection
            if (-1 !== shader.projectionMatrixUniformPointer) {
                context.uniformMatrix4fv(shader.projectionMatrixUniformPointer, false, this.projectionMatrix);
            }

            // prepare material once
            renderBatch.getMaterial().prepareTextures(context);
            renderBatch.getMaterial().pushTextures(context, shader);

            var displayObjects = renderBatch.getDisplayObjects();
            for (var i = 0, len = displayObjects.length; i < len; i++) {
                var displayObject = displayObjects[i];

                // depth
                if (-1 !== shader.depthUniformPointer) {
                    context.uniform1f(shader.depthUniformPointer, displayObject.__depth);
                }

                // update + set transform
                // TODO: possibly have a dirty flag?
                if (-1 !== shader.modelMatrixUniformPointer) {
                    context.uniformMatrix4fv(shader.modelMatrixUniformPointer, false, displayObject.recalculateWorldMatrix(__tempModelMatrix));
                }

                // color
                if (-1 !== shader.colorUniformPointer) {
                    var tint = displayObject.tint;
                    __tempColor[0] = tint.r;
                    __tempColor[1] = tint.g;
                    __tempColor[2] = tint.b;
                    __tempColor[3] = displayObject.alpha;
                    context.uniform4fv(shader.colorUniformPointer, __tempColor);
                }

                // prepare + push buffers
                displayObject.geometry.prepareBuffers(context);
                displayObject.geometry.pushBuffers(context, shader);

                // draw
                displayObject.geometry.draw(context);
            }
        },

        /**
         * Draws a single DisplayObject.
         *
         * @param displayObject
         */
        drawDisplayObject: function(displayObject) {
            var context = this.getContext();

            // set the program to use
            var shader = displayObject.material.shader;
            shader.compile(context);
            context.useProgram(shader.getShaderProgram());

            // upload custom shader attributes + uniforms
            shader.pushCustomUniforms(context);

            // set projection
            if (-1 !== shader.projectionMatrixUniformPointer) {
                context.uniformMatrix4fv(shader.projectionMatrixUniformPointer, false, this.projectionMatrix);
            }

            // depth
            // NO DEPTH for DisplayObjects drawn singly as the CPU sorts them before drawing
            if (-1 !== shader.depthUniformPointer) {
                context.uniform1f(shader.depthUniformPointer, displayObject.__depth);
            }

            // update + set transform
            if (-1 !== shader.modelMatrixUniformPointer) {
                context.uniformMatrix4fv(shader.modelMatrixUniformPointer, false, displayObject.recalculateWorldMatrix());
            }

            // color
            if (-1 !== shader.colorUniformPointer) {
                __tempColor[0] = __tempColor[1] = __tempColor[2] = __tempColor[3] = 1;
                context.uniform4fv(shader.colorUniformPointer, composeColor(displayObject, __tempColor));
            }

            // prepare + push buffers

            // TODO: evaluate where this belongs
            displayObject.material.prepareTextures(context);
            displayObject.material.pushTextures(context, shader);

            displayObject.geometry.prepareBuffers(context);
            displayObject.geometry.pushBuffers(context, shader);

            // draw
            displayObject.geometry.draw(context);
        },

        /**
         * Draws a bounding box for a DisplayObject.
         */
        drawBoundingBox: (function() {
            var bbShader = null;

            return function(displayObject) {
                var context = this.getContext();

                if (null === bbShader) {
                    bbShader = new Shader();
                    bbShader.setShaderProgramIds("bb-shader-vs", "bb-shader-fs");
                    bbShader.compile(context);
                }

                context.useProgram(bbShader.getShaderProgram());

                // set projection
                if (-1 !== bbShader.projectionMatrixUniformPointer) {
                    context.uniformMatrix4fv(shader.projectionMatrixUniformPointer, false, this.projectionMatrix);
                }

                // update + set transform
                if (-1 !== bbShader.modelMatrixUniformPointer) {
                    context.uniformMatrix4fv(shader.modelMatrixUniformPointer, false, displayObject.recalculateWorldMatrix());
                }

                // prepare + push buffers
                displayObject.quad.prepareBuffers(context);
                displayObject.quad.pushBuffers(context, shader);

                // TODO: Finish!
            };
        })()
    };

    /**
     * Composes a Color through the scene graph.
     *
     * @param displayObject
     * @param out
     * @returns {*}
     */
    function composeColor(displayObject, out) {
        if (null !== displayObject.parent) {
            composeColor(displayObject.parent, out);
        }

        out[0] *= displayObject.tint.r;
        out[1] *= displayObject.tint.g;
        out[2] *= displayObject.tint.b;
        out[3] *= displayObject.alpha;

        return out;
    }

    // export
    global.WebGLRenderer = WebGLRenderer;
})(this);
/**
 * Author: thegoldenmule
 * Date: 8/9/13
 */

(function (global) {
    "use strict";

    var AnimationCurveKey = function(time, value) {
        var scope = this;

        scope.time = time;
        scope.value = value;

        return scope;
    };

    var AnimationCurve = function () {
        var scope = this;

        var _keys = [];

        /**
         * Defines the ease method to use.
         *
         * @type {*}
         */
        scope.easingFunction = Easing.Quadratic.In;

        /**
         * Retrieves a copy of the keys array.
         *
         * @returns {Array}
         */
        scope.getKeys = function() {
            return _keys.slice(0);
        };

        /**
         * Adds a key time.
         *
         * @param key An AnimationCurveKey.
         */
        scope.addKey = function(key) {
            // simple sort on insert
            for (var i = 0, len = _keys.length - 1; i < len; i++) {
                if (_keys[i].time < key.time &&
                    _keys[i + 1].time > key.time) {
                    _keys.splice(i + 1, 0, key);

                    return;
                }
            }

            _keys.push(key);
        };

        /**
         * Removes a key time.
         *
         * @param key An AnimationCurveKey.
         */
        scope.removeKey = function(key) {
            // remove
            var index = _keys.indexOf(key);
            if (-1 !== index) {
                _keys.splice(index, 1);
            }
        };

        /**
         * Evaluates the animation curve at a normalized parameter t.
         *
         * @param t
         */
        scope.evaluate = function(t) {
            // clamp input
            t = Math.clamp(t, 0, 1);

            // find the two keys to evaluate between
            var len = _keys.length;
            if (len < 2) {
                return 0;
            }

            // TODO: we may be able to speed this up by using the index we last
            // used instead of starting with 0.
            var a, b;
            for (var i = 0; i < len - 1; i++) {
                a = _keys[i];
                b = _keys[i + 1];

                if (a.time <= t &&
                    b.time >= t) {
                    return interpolate(a.value, b.value, (t - a.time) / (b.time - a.time));
                }
            }

            // in this case, there is no key defined after the t passed in,
            // so clamp to the last keys value
            return _keys[len - 1].value;
        };

        /**
         * Linearly interpolates using the easing function (which is possibly
         * non-linear).
         *
         * @param a
         * @param b
         * @param t
         * @returns {number}
         */
        function interpolate(a, b, t) {
            return a + scope.easingFunction(t) * (b - a);
        }

        return scope;
    };

    AnimationCurve.prototype = {
        constructor: AnimationCurve
    };

    // export
    global.AnimationCurveKey = AnimationCurveKey;
    global.AnimationCurve = AnimationCurve;

})(this);

/**
 * Author: thegoldenmule
 * Date: 8/9/13
 */

(function (global) {
    "use strict";

    /**
     * TODO: LICENSE
     */
    var Easing = {

        Linear: {

            None: function ( k ) {

                return k;

            }

        },

        Quadratic: {

            In: function ( k ) {

                return k * k;

            },

            Out: function ( k ) {

                return k * ( 2 - k );

            },

            InOut: function ( k ) {

                if ( ( k *= 2 ) < 1 ) {
                    return 0.5 * k * k;
                }

                return - 0.5 * ( --k * ( k - 2 ) - 1 );

            }

        },

        Cubic: {

            In: function ( k ) {

                return k * k * k;

            },

            Out: function ( k ) {

                return --k * k * k + 1;

            },

            InOut: function ( k ) {

                if ( ( k *= 2 ) < 1 ) {
                    return 0.5 * k * k * k;
                }

                return 0.5 * ( ( k -= 2 ) * k * k + 2 );

            }

        },

        Quartic: {

            In: function ( k ) {

                return k * k * k * k;

            },

            Out: function ( k ) {

                return 1 - ( --k * k * k * k );

            },

            InOut: function ( k ) {

                if ( ( k *= 2 ) < 1) {
                    return 0.5 * k * k * k * k;
                }

                return - 0.5 * ( ( k -= 2 ) * k * k * k - 2 );

            }

        },

        Quintic: {

            In: function ( k ) {

                return k * k * k * k * k;

            },

            Out: function ( k ) {

                return --k * k * k * k * k + 1;

            },

            InOut: function ( k ) {

                if ( ( k *= 2 ) < 1 ) {
                    return 0.5 * k * k * k * k * k;
                }

                return 0.5 * ( ( k -= 2 ) * k * k * k * k + 2 );

            }

        },

        Sinusoidal: {

            In: function ( k ) {

                return 1 - Math.cos( k * Math.PI / 2 );

            },

            Out: function ( k ) {

                return Math.sin( k * Math.PI / 2 );

            },

            InOut: function ( k ) {

                return 0.5 * ( 1 - Math.cos( Math.PI * k ) );

            }

        },

        Exponential: {

            In: function ( k ) {

                return k === 0 ? 0 : Math.pow( 1024, k - 1 );

            },

            Out: function ( k ) {

                return k === 1 ? 1 : 1 - Math.pow( 2, - 10 * k );

            },

            InOut: function ( k ) {

                if ( k === 0 ) {
                    return 0;
                }

                if ( k === 1 ) {
                    return 1;
                }

                if ( ( k *= 2 ) < 1 ) {
                    return 0.5 * Math.pow( 1024, k - 1 );
                }

                return 0.5 * ( - Math.pow( 2, - 10 * ( k - 1 ) ) + 2 );

            }

        },

        Circular: {

            In: function ( k ) {

                return 1 - Math.sqrt( 1 - k * k );

            },

            Out: function ( k ) {

                return Math.sqrt( 1 - ( --k * k ) );

            },

            InOut: function ( k ) {

                if ( ( k *= 2 ) < 1) {
                    return - 0.5 * ( Math.sqrt( 1 - k * k) - 1);
                }

                return 0.5 * ( Math.sqrt( 1 - ( k -= 2) * k) + 1);

            }

        },

        Elastic: {

            In: function ( k ) {

                var s, a = 0.1, p = 0.4;
                if ( k === 0 ) {
                    return 0;
                }

                if ( k === 1 ) {
                    return 1;
                }

                if ( !a || a < 1 )
                {
                    a = 1; s = p / 4;
                }
                else {
                    s = p * Math.asin( 1 / a ) / ( 2 * Math.PI );
                }

                return - ( a * Math.pow( 2, 10 * ( k -= 1 ) ) * Math.sin( ( k - s ) * ( 2 * Math.PI ) / p ) );

            },

            Out: function ( k ) {

                var s, a = 0.1, p = 0.4;
                if ( k === 0 ) {
                    return 0;
                }

                if ( k === 1 ) {
                    return 1;
                }

                if ( !a || a < 1 )
                {
                    a = 1; s = p / 4;
                }
                else {
                    s = p * Math.asin( 1 / a ) / ( 2 * Math.PI );
                }

                return ( a * Math.pow( 2, - 10 * k) * Math.sin( ( k - s ) * ( 2 * Math.PI ) / p ) + 1 );

            },

            InOut: function ( k ) {

                var s, a = 0.1, p = 0.4;
                if ( k === 0 ) {
                    return 0;
                }

                if ( k === 1 ) {
                    return 1;
                }

                if ( !a || a < 1 )
                {
                    a = 1; s = p / 4;
                }
                else {
                    s = p * Math.asin( 1 / a ) / ( 2 * Math.PI );
                }

                if ( ( k *= 2 ) < 1 ) {
                    return - 0.5 * ( a * Math.pow( 2, 10 * ( k -= 1 ) ) * Math.sin( ( k - s ) * ( 2 * Math.PI ) / p ) );
                }

                return a * Math.pow( 2, -10 * ( k -= 1 ) ) * Math.sin( ( k - s ) * ( 2 * Math.PI ) / p ) * 0.5 + 1;

            }

        },

        Back: {

            In: function ( k ) {

                var s = 1.70158;
                return k * k * ( ( s + 1 ) * k - s );

            },

            Out: function ( k ) {

                var s = 1.70158;
                return --k * k * ( ( s + 1 ) * k + s ) + 1;

            },

            InOut: function ( k ) {

                var s = 1.70158 * 1.525;
                if ( ( k *= 2 ) < 1 ) {
                    return 0.5 * ( k * k * ( ( s + 1 ) * k - s ) );
                }

                return 0.5 * ( ( k -= 2 ) * k * ( ( s + 1 ) * k + s ) + 2 );

            }

        },

        Bounce: {

            In: function ( k ) {

                return 1 - TWEEN.Easing.Bounce.Out( 1 - k );

            },

            Out: function ( k ) {

                if ( k < ( 1 / 2.75 ) ) {

                    return 7.5625 * k * k;

                } else if ( k < ( 2 / 2.75 ) ) {

                    return 7.5625 * ( k -= ( 1.5 / 2.75 ) ) * k + 0.75;

                } else if ( k < ( 2.5 / 2.75 ) ) {

                    return 7.5625 * ( k -= ( 2.25 / 2.75 ) ) * k + 0.9375;

                } else {

                    return 7.5625 * ( k -= ( 2.625 / 2.75 ) ) * k + 0.984375;

                }

            },

            InOut: function ( k ) {

                if ( k < 0.5 ) {
                    return TWEEN.Easing.Bounce.In( k * 2 ) * 0.5;
                }

                return TWEEN.Easing.Bounce.Out( k * 2 - 1 ) * 0.5 + 0.5;

            }

        }

    };

    global.Easing = Easing;

})(this);

/**
 * Quick and dirty object pool implementation. Does not grow.
 *
 * Author: thegoldenmule
 */
(function(global) {
    "use strict";

    var IDS = 0;

    /**
     * Creates a static pool of objects.
     *
     * @param size      The number of objects to allocate.
     * @param factory   A Function that returns a new object.
     * @param onGet     (optional) A Function to call when an instance is retrieved.
     * @param onPut     (optional) A Function to call ehwn an instance is released.
     * @returns {*}
     * @constructor
     */
    var ObjectPool = function(size, factory, onGet, onPut) {
        var scope = this,
            _id = "__pool" + (++IDS),
            _instances = [size],
            _availableIndices = [size];

        for (var i = 0; i < size; i++) {
            _availableIndices[i] = i;

            _instances[i] = factory();
            _instances[i][_id] = i;
        }

        /**
         * Retrieves an object, or null if none are left in the pool.
         *
         * @returns {*}
         */
        scope.get = function() {
            if (_availableIndices.length > 0) {
                var index = _availableIndices.pop();
                var instance = _instances[index];
                instance[_id] = index;

                if (undefined !== onGet) {
                    onGet(instance);
                }

                return instance;
            }

            return null;
        };

        /**
         * Puts an object back in the pool.
         *
         * @param instance
         */
        scope.put = function(instance) {
            if (undefined === instance[_id]) {
                return;
            }

            _availableIndices.push(instance[_id]);

            if (undefined !== onPut) {
                onPut(instance);
            }
        };

        return scope;
    };

    global.ObjectPool = ObjectPool;

})(this);
/**
 * Author: thegoldenmule
 * Date: 5/26/13
 *
 * Very basic unordered data structure with fast add + remove.
 */
(function (global) {
    "use strict";

    var __indices = 0;

    var Set = function () {
        var scope = this;

        var _guidKey = "__set" + (++__indices),
            _elements = [];

        /**
         * Adds an element to the set.
         *
         * @param element
         */
        scope.add = function(element) {
            scope.remove(element);

            element[_guidKey] = _elements.length;
            _elements.push(element);

            return element;
        };

        /**
         * Removes an element from the set.
         *
         * @param element
         */
        scope.remove = function(element) {
            if (undefined === element[_guidKey]) {
                return;
            }

            if (_elements.length > 1) {
                var index = element[_guidKey];

                if (index === _elements.length - 1) {
                    _elements.pop();
                }
                else {
                    _elements[index] = _elements.pop();
                    _elements[index][_guidKey] = index;
                }

                delete element[_guidKey];
            } else {
                _elements.pop();
            }

            return element;
        };

        /**
         * Retrieves all elements of the set.
         *
         * @returns {Array}
         */
        scope.getElements = function() {
            return [].concat(_elements);
        };

        return scope;
    };

    Set.prototype = {
        constructor: Set
    };

    // export
    global.Set = Set;
})(this);
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
/**
 * Author: thegoldenmule
 * Date: 3/10/13
 */

(function (global) {
    var Shape = function (parameters) {
        var scope = this;

        // extend DisplayObject
        DisplayObject.call(scope, parameters);

        scope.material.shader.setShaderProgramIds("color-shader-vs", "color-shader-fs");

        return scope;
    };

    Shape.prototype = new DisplayObject();
    Shape.prototype.constructor = Shape;

    // export
    global.Shape = Shape;
})(this);
/**
 * Author: thegoldenmule
 * Date: 5/18/13
 * Time: 7:13 AM
 */

(function (global) {
    "use strict";

    var Animation = function(parameters) {
        var that = this;

        if (!parameters) {
            parameters = {};
        }

        this.name = undefined === parameters.name ? "" : parameters.name;

        this.startFrame = undefined === parameters.startFrame ? 0 : parameters.startFrame;
        this.animationLength = undefined === parameters.animationLength ? 0 : parameters.animationLength;

        this.frameRate = undefined === parameters.frameRate ? 60 : parameters.frameRate;

        return that;
    };

    var SpriteSheet = function (parameters) {
        var that = this;

        if (undefined === parameters) {
            parameters = {};
        }

        if (undefined === parameters.width) {
            throw new Error("Must define width and height!");
        }

        if (undefined === parameters.height) {
            throw new Error("Must define width and height!");
        }

        if (undefined === parameters.mainTexture) {
            throw new Error("Must define mainTexture!");
        }

        DisplayObject.call(that, parameters);

        that.material.shader.setShaderProgramIds("ss-shader-vs", "ss-shader-fs");

        var _animations = [],

            _currentAnimation = null,
            _currentTimeMS = 0,
            _currentFrame = 0,

            _totalFrameWidth = that.material.mainTexture.getWidth() / that.getWidth(),
            _totalFrameHeight = that.material.mainTexture.getHeight() / that.getWidth(),

            _normalizedFrameWidth = 1 / _totalFrameWidth,
            _normalizedFrameHeight = 1 / _totalFrameHeight,

            _blendWeight = 0;

        that.setBlendWeight = function(normalizedValue) {
            _blendWeight = Math.clamp(normalizedValue, 0, 1);

            that.material.shader.setUniformFloat("uBlendWeight", _blendWeight);
        };

        that.getBlendWeight = function() {
            return _blendWeight;
        };

        that.addAnimation = function(animationData) {
            _animations.push(animationData);
        };

        that.removeAnimationByName = function(animationName) {
            for (var i = 0, len = _animations.length; i < len; i++) {
                if (_animations[i].name === animationName) {
                    _animations = _animations.splice(i, 0);
                    return;
                }
            }
        };

        that.setCurrentAnimationByName = function(animationName) {
            if (null !== _currentAnimation && _currentAnimation.name === animationName) {
                return;
            }

            for (var i = 0, len = _animations.length; i < len; i++) {
                if (_animations[i].name === animationName) {
                    _currentAnimation = _animations[i];

                    return;
                }
            }
        };

        that.getCurrentAnimation = function() {
            return _currentAnimation;
        };

        that.setCurrentFrame = function(value) {
            // get the animation
            var animation = _currentAnimation;
            if (null === animation) {
                return;
            }

            // no change!
            if (value === _currentFrame) {
                return;
            }

            _currentFrame = value % animation.animationLength;

            // update the time from the frame value
            _currentTimeMS = _currentFrame * 1000;

            // update the UVs!
            updateUVs();
        };

        that.getCurrentFrame = function() {
            return _currentFrame;
        };

        that.setCurrentTime = function(value) {
            // get the animation
            var animation = _currentAnimation;
            if (null === animation) {
                return;
            }

            _currentTimeMS = value;

            // set current frame from the current time
            var msPerFrame = Math.floor(1000 / animation.frameRate);
            var newFrame = Math.floor(_currentTimeMS / msPerFrame) % animation.animationLength;

            // set the blend uniform
            that.material.shader.setUniformFloat("uFutureBlendScalar",
                (_currentTimeMS % msPerFrame) / msPerFrame);

            // did we switch frames?
            if (_currentFrame === newFrame) {
                return;
            }

            _currentFrame = newFrame;

            updateUVs();
        };

        that.update = function(dt) {
            that.setCurrentTime(_currentTimeMS + dt);
        };

        function updateUVs() {
            // get the animation
            var animation = _currentAnimation;
            if (null === animation) {
                return;
            }

            // find location of frame
            var actualFrame = animation.startFrame + _currentFrame;

            var frameX = actualFrame % _totalFrameWidth;
            var frameY = Math.floor(actualFrame / _totalFrameWidth);

            // normalize them
            var normalizedFrameX = frameX / _totalFrameWidth;
            var normalizedFrameY = frameY / _totalFrameHeight;

            // set the uvs
            var uvs = that.geometry.uvs;
            uvs[0] = normalizedFrameX;
            uvs[1] = normalizedFrameY;

            uvs[2] = normalizedFrameX;
            uvs[3] = normalizedFrameY + _normalizedFrameHeight;

            uvs[4] = normalizedFrameX + _normalizedFrameWidth;
            uvs[5] = normalizedFrameY;

            uvs[6] = normalizedFrameX + _normalizedFrameWidth;
            uvs[7] = normalizedFrameY + _normalizedFrameHeight;

            // now set uvs for the future frame
            actualFrame = animation.startFrame +
                (animation.animationLength - 1 === _currentFrame ?
                    0 :
                    _currentFrame + 1);
            frameX = actualFrame % _totalFrameWidth;
            frameY = Math.floor(actualFrame / _totalFrameWidth);

            // normalize them
            normalizedFrameX = frameX / _totalFrameWidth;
            normalizedFrameY = frameY / _totalFrameHeight;

            // set the uvs
            var colors = that.geometry.colors;
            colors[0] = normalizedFrameX;
            colors[1] = normalizedFrameY;

            colors[4] = normalizedFrameX;
            colors[5] = normalizedFrameY + _normalizedFrameHeight;

            colors[8] = normalizedFrameX + _normalizedFrameWidth;
            colors[9] = normalizedFrameY;

            colors[12] = normalizedFrameX + _normalizedFrameWidth;
            colors[13] = normalizedFrameY + _normalizedFrameHeight;

            that.geometry.apply();
        }

        return that;
    };

    SpriteSheet.prototype = new DisplayObject();
    SpriteSheet.prototype.constructor = SpriteSheet;

    global.Animation = Animation;
    global.SpriteSheet = SpriteSheet;
})(this);
/**
 * Author: thegoldenmule
 * Date: 3/11/13
 */

(function (global) {
    "use strict";

    var StaticImage = function (parameters) {
        var scope = this;

        if (undefined === parameters) {
            parameters = {};
        }

        if (undefined !== parameters.mainTexture) {
            if (undefined === parameters.width) {
                parameters.width = parameters.mainTexture.getWidth();
            }

            if (undefined === parameters.height) {
                parameters.height = parameters.mainTexture.getHeight();
            }
        }

        DisplayObject.call(scope, parameters);

        // set texture shader
        scope.material.shader.setShaderProgramIds("texture-shader-vs", "texture-shader-fs");

        return scope;
    };

    StaticImage.prototype = new DisplayObject();
    StaticImage.prototype.constructor = StaticImage;

    // export
    global.StaticImage = StaticImage;
})(this);
/**
 * Author: thegoldenmule
 * Date: 3/24/13
 */

(function (global) {
    "use strict";

    var Signal = signals.Signal;

    var FontLoader = function () {
        var scope = this;

        scope.onLoaded = new Signal();
        scope.font = null;

        return scope;
    };

    FontLoader.prototype = {
        constructor: FontLoader,

        load: function(baseUrl, name) {
            var scope = this;

            if (baseUrl[baseUrl.length - 1] !== "/") {
                baseUrl += "/";
            }

            function callback() {
                if (null !== imageLoader.image &&
                    null !== xmlLoader.data) {
                    scope.font = new Font();
                    scope.font.initialize(new FontDefinition(xmlLoader.data, imageLoader.image));

                    scope.onLoaded.dispatch();
                }
            }

            var imageLoader = new ImageLoader();
            imageLoader.onLoaded.addOnce(callback);
            imageLoader.load(baseUrl + name + ".png");

            var xmlLoader = new XMLLoader();
            xmlLoader.onLoaded.addOnce(callback);
            xmlLoader.load(baseUrl + name + ".fnt");
        }
    };

    // export
    global.FontLoader = FontLoader;
})(this);
/**
 * User: ti83
 * Date: 3/10/13
 */

var Signal = signals.Signal;

var ImageLoader = (function () {
    "use strict";

    return function () {
        var that = this;

        that.image = null;
        that.onLoaded = new Signal();

        return that;
    };
})();

ImageLoader.prototype = {
    constructor: ImageLoader,
    load: function(url, imageElement) {
        var that = this;

        // TODO: consider pooling
        if (undefined === imageElement) {
            imageElement = new Image();
        }

        imageElement.onload = function() {
            that.image = imageElement;
            that.onLoaded.dispatch();
        };
        imageElement.crossOrigin = "localhost";
        imageElement.src = url;
    }
};

ImageLoader.loadResources = function(urls, callback) {
    "use strict";

    var loaded = 0;
    function onLoaded(loader) {
        if (++loaded === urls.length) {
            callback(loaders);
        }
    }

    var loaders = urls.map(function(url) {
        var loader = new ImageLoader();
        loader.onLoaded.add(onLoaded);
        loader.load(url);
        return loader;
    });
};
/**
 * Author: thegoldenmule
 * Date: 3/23/13
 */

(function (global) {
    "use strict";

    var Signal = signals.Signal;

    var XMLLoader = function () {
        var scope = this;

        scope.onLoaded = new Signal();
        scope.data = null;

        return scope;
    };

    XMLLoader.prototype = {
        constructor: XMLLoader,

        load: function(url) {
            var scope = this;
            var request = HTTPHelper.newRequest(url);
            request.onreadystatechange = function() {
                if (4 === request.readyState) {
                    scope.data = request.responseText;

                    scope.onLoaded.dispatch(scope);
                }
            };
            request.send(null);
        }
    };

    // export
    global.XMLLoader = XMLLoader;
})(this);
/**
 * Default particle plugins:
 *
 * Position, Velocity, Acceleration, Lifetime,
 * EmissionRateFade, Attractor.
 *
 * @author thegoldenmule
 */
(function(global) {
    "use strict";

    if (!global.particle) {
        global.particle = {};
    }

    /**
     * Position plugin.
     *
     * Give it x, y, and a radius, and it will provide a random
     * position within the bounding circle. An option innerRadius parameter may be
     * used that will omit creating particles within the innerRadius.
     */
    global.particle.Position = function(xval, yval, radius, innerRadius) {
        this.x = undefined === xval ? 0 : xval;
        this.y = undefined === yval ? 0 : yval;
        this.innerRadius = undefined === innerRadius ? 0 : innerRadius;

        if (undefined === radius) {
            radius = 10;
        }

        if (radius <= this.innerRadius) {
            radius = this.innerRadius + 1;
        }

        this.radius = radius;
    };

    global.particle.Position.prototype = {
        initialize:
            function(emitter, particle) {
                particle.transform.position.x = this.x + (Math.random() - 0.5) * Math.random() * (this.radius - this.innerRadius);
                particle.transform.position.y = this.y + (Math.random() - 0.5) * Math.random() * (this.radius - this.innerRadius);

                if (0 !== this.innerRadius) {
                    var randomAngle = Math.random() * 2 * Math.PI;
                    particle.transform.position.x += this.innerRadius * Math.sin(randomAngle);
                    particle.transform.position.y += this.innerRadius * Math.cos(randomAngle);
                }
            }
    };

    /**
     * Velocity plugin.
     *
     * Give it an angle range and a magnitude range and it will
     * generate velocities within the ranges.
     */
    global.particle.Velocity = function(minAngle, maxAngle, minMagnitude, maxMagnitude) {
        this.minAngle = minAngle;
        this.maxAngle = maxAngle;
        this.minMagnitude = minMagnitude;
        this.maxMagnitude = maxMagnitude;
    };

    global.particle.Velocity.prototype = {
        initialize:
            function(emitter, particle) {
                // pick a random angle
                var angle = (this.minAngle + Math.random() * (this.maxAngle - this.minAngle));
                var magnitude = (this.minMagnitude + Math.random() * (this.maxMagnitude - this.minMagnitude));

                particle.vx = -Math.cos(angle) * magnitude;
                particle.vy = -Math.sin(angle) * magnitude;
            }
    };

    /**
     * Acceleration plugin.
     *
     * Generates constant acceleration within the range
     * provided.
     */
    global.particle.Acceleration = function(xval, yval) {
        this.x = xval;
        this.y = yval;
    };

    global.particle.Acceleration.prototype = {
        initialize:
            function(emitter, particle) {
                particle.ax = this.x;
                particle.ay = this.y;
            }
    };

    /**
     * Lifetime plugin.
     *
     * Generates a particle lifetime within a range.
     */
    global.particle.Lifetime = function(min, max) {
        this.min = min;
        this.max = max;
    };

    global.particle.Lifetime.prototype = {
        initialize:
            function(emitter, particle) {
                particle.lifetime = (this.min + Math.random() * (this.max - this.min));
            }
    };

    /**
     * EmissionRateFade plugin.
     *
     * This tweens the emitter's emission rate from start to finish in time.
     */
    global.particle.EmissionRateFade = function(start, finish, time) {
        this.start = start;
        this.finish = finish;
        this.time = time;

        this.elapsed = 0;
    };

    global.particle.EmissionRateFade.prototype = {
        updateGlobal:
            function(emitter, particle, dt) {
                this.elapsed += dt;

                if (this.elapsed >= this.time) {
                    emitter.emissionRate = this.finish;
                } else {
                    emitter.emissionRate = ~~(this.start + (this.elapsed / this.time) * (this.finish - this.start));
                }
            }
    };

    /**
     * Attractor plugin.
     *
     * This attracts (or repels) particles. This only approximates gravitation.
     *
     */
    global.particle.Attractor = function(x, y, amount) {
        this.x = x;
        this.y = y;
        this.amount = amount;
    };

    global.particle.Attractor.prototype = (function() {
        var G = 1; // teehee

        return {
            update:
                function(emitter, particle) {
                    particle.ax = this.x - particle.transform.position.x / this.amount;
                    particle.ay = this.y - particle.transform.position.y / this.amount;
                }
        };
    })();

})(this);
/**
 * Author: thegoldenmule
 * Date: 5/27/13
 */

(function (global) {
    "use strict";

    /**
     * A Particle class. This extends DisplayObject and holds a simple physical
     * model.
     *
     * @param material The material to use.
     * @returns {*}
     * @constructor
     */
    var Particle = function (material) {
        var scope = this;

        // extend DisplayObject
        DisplayObject.call(scope, {color:new Color(1, 0, 0, 1)});

        scope.material = material;
        scope.material.shader.setShaderProgramIds("texture-shader-vs", "texture-shader-fs");

        // basic physics model
        scope.vx = 0;
        scope.vy = 0;
        scope.ax = 0;
        scope.ay = 0;
        scope.elapsedTime = 0;
        scope.isAlive = false;

        return scope;
    };

    Particle.prototype = new DisplayObject();
    Particle.prototype.constructor = Particle;

    /**
     * The ParticleEmitter class emits Particle objects, which are children.
     *
     * @param plugins
     * @param x
     * @param y
     * @param maxParticles
     * @constructor
     */
    var ParticleEmitter = function (plugins, x, y, maxParticles) {
        var scope = this;

        // extend DisplayObject
        DisplayObject.call(scope);

        var _plugins = plugins ? [].concat(plugins) : [],
            _helper = 0,
            _bufferIndex = 0,
            _maxParticles = (undefined === maxParticles) ? 1000 : maxParticles,
            _particleBuffer = new Set(),    // particles do not need to be ordered

            // create a pool of particles
            _particlePool = new ObjectPool(
                _maxParticles,
                function allocate() {
                    return new Particle(scope.material);
                },
                function get(instance) {
                    scope.addChild(instance);

                    instance.elapsedTime = 0;
                    instance.isAlive = true;
                    instance.lifetime = scope.lifetime;
                },
                function put(instance) {
                    scope.removeChild(instance);

                    instance.isAlive = false;
                });

        scope.material.shader.setShaderProgramIds("particle-shader-vs", "particle-shader-fs");

        scope.emissionRate = 5;
        scope.lifetime = 1000;

        /**
         * Adds a plugin dynamically.
         *
         * @param plugin
         * @returns {*}
         */
        scope.addPlugin = function(plugin) {
            _plugins.push(plugin);

            return scope;
        };

        /**
         * Removes a plugin dynamically.
         *
         * @param plugin
         * @returns {*}
         */
        scope.removePlugin = function(plugin) {
            var index = _plugins.indexOf(plugin);
            if (-1 !== index) {
                _plugins = _plugins.splice(index, 1);
            }

            return scope;
        };

        /**
         * Called as part of boX's update loop.
         *
         * @param dt
         */
        scope.update = function(dt) {
            applyPlugins(null, _plugins, "updateGlobal", dt);

            // add new particles
            var particle;
            var rate = scope.emissionRate;
            for (var i = _bufferIndex, len = _bufferIndex + rate; i < len; i++) {
                particle = _particlePool.get();

                if (null === particle) {
                    break;
                }

                // initialize phase
                applyPlugins(particle, _plugins, "initialize", dt);

                // add to buffer
                _particleBuffer.add(particle);
            }

            // update particles + remove dead ones
            var particles = _particleBuffer.getElements();
            for (i = 0, len = particles.length; i < len; i++) {
                particle = particles[i];

                // update age + prune
                particle.elapsedTime += dt;

                // dead?
                if (particle.elapsedTime >= particle.lifetime) {
                    _particleBuffer.remove(particle);
                    _particlePool.put(particle);

                    continue;
                }

                // TODO: at least use Euler...

                // apply acceleration
                particle.vx += particle.ax;
                particle.vy += particle.ay;

                // apply velocity
                particle.transform.position.x += particle.vx;
                particle.transform.position.y += particle.vy;

                // apply plugins
                applyPlugins(particle, _plugins, "update", dt);
            }

            // tell plugins they are done!
            applyPlugins(null, _plugins, "updateEndGlobal", dt);
        };

        function applyPlugins(particle, plugins, method, dt) {
            for (var j = 0, len = plugins.length; j < len; j++) {
                var plugin = plugins[j];
                if ("function" === typeof plugin[method]) {
                    plugin[method](scope, particle, dt);
                }
            }
        }
    };

    ParticleEmitter.prototype = new DisplayObject();
    ParticleEmitter.prototype.constructor = ParticleEmitter;

    // export
    global.Particle = Particle;
    global.ParticleEmitter = ParticleEmitter;
})(this);
/**
 * Author: thegoldenmule
 */

(function(global) {
    "use strict";

    var ParticleEmitterGeometry = function (emitter) {
        var scope = this;

        scope.width = 1;
        scope.height = 1;

        scope.vertices = null;
        scope.uvs = null;
        scope.colors = null;

        scope.vertexBuffer = null;
        scope.uvBuffer = null;
        scope.colorBuffer = null;

        scope.__apply = true;

        return scope;
    };

    ParticleEmitterGeometry.prototype = {
        constructor: ParticleEmitterGeometry,

        rebuild: function(particles) {
            this.vertices = new Float32Array(particles * 8);    // 4 verts, 2 coords
            this.uvs = new Float32Array(particles * 8);         // 4 verts, 2 coords
            this.colors = new Float32Array(particles * 16);     // 4 verts, 4 coords
        },

        apply: function() {
            this.__apply = true;
        },

        clearBuffers: function() {
            this.vertexBuffer = this.uvBuffer = this.colorBuffer = null;
        },

        prepareBuffers: function() {
            if (null === this.vertexBuffer) {
                this.vertexBuffer = ctx.createBuffer();
            }

            if (null === this.uvBuffer) {
                this.uvBuffer = ctx.createBuffer();
            }

            if (null === this.colorBuffer) {
                this.colorBuffer = ctx.createBuffer();
            }

            if (this.__apply) {
                ctx.bindBuffer(ctx.ARRAY_BUFFER, this.vertexBuffer);
                ctx.bufferData(ctx.ARRAY_BUFFER, this.vertices, ctx.STATIC_DRAW);

                ctx.bindBuffer(ctx.ARRAY_BUFFER, this.uvBuffer);
                ctx.bufferData(ctx.ARRAY_BUFFER, this.uvs, ctx.STATIC_DRAW);

                ctx.bindBuffer(ctx.ARRAY_BUFFER, this.colorBuffer);
                ctx.bufferData(ctx.ARRAY_BUFFER, this.colors, ctx.STATIC_DRAW);
            }

            this.__apply = false;
        },

        pushBuffers: function(ctx, shader) {
            if (-1 < shader.vertexBufferAttributePointer) {
                ctx.bindBuffer(ctx.ARRAY_BUFFER, this.vertexBuffer);
                ctx.vertexAttribPointer(shader.vertexBufferAttributePointer, 2, ctx.FLOAT, false, 0, 0);
            }

            if (-1 < shader.uvBufferAttributePointer) {
                ctx.bindBuffer(ctx.ARRAY_BUFFER, this.uvBuffer);
                ctx.vertexAttribPointer(shader.uvBufferAttributePointer, 2, ctx.FLOAT, false, 0, 0);
            }

            if (-1 < shader.vertexColorBufferAttributePointer) {
                ctx.bindBuffer(ctx.ARRAY_BUFFER, this.colorBuffer);
                ctx.vertexAttribPointer(shader.vertexColorBufferAttributePointer, 4, ctx.FLOAT, false, 0, 0);
            }
        },

        draw: function(ctx) {

        }
    };

    global.ParticleEmitterGeometry = ParticleEmitterGeometry;
})(this);
/**
 * Author: thegoldenmule
 * Date: 3/22/13
 */

(function (global) {
    "use strict";

    var FontDefinition = function(xmlDefinition, image) {
        this.xmlDefinition = xmlDefinition;
        this.image = image;
    };

    var CharDefinition = function() {

    };

    CharDefinition.prototype = {
        constructor: CharDefinition,

        toString: function() {
            return "[CharDefinition" +
                " id: " + this.id +
                " x: " + this.x +
                " y: " + this.y +
                " width: " + this.width +
                " height: " + this.height +
                " xoffset: " + this.xoffset +
                " yoffset: " + this.yoffset +
                " xadvance: " + this.xadvance +
                " yadvance: " + this.yadvance +
                " page: " + this.page +
                " chnl: " + this.chnl + "]";
        }
    };

    CharDefinition.FromXML = function(element) {
        var def = new CharDefinition();
        def.id = parseInt(element.getAttribute("id"), 10);
        def.x = parseInt(element.getAttribute("x"), 10);
        def.y = parseInt(element.getAttribute("y"), 10);
        def.width = parseInt(element.getAttribute("width"), 10);
        def.height = parseInt(element.getAttribute("height"), 10);
        def.xoffset = parseInt(element.getAttribute("xoffset"), 10);
        def.yoffset = parseInt(element.getAttribute("yoffset"), 10);
        def.xadvance = parseInt(element.getAttribute("xadvance"), 10);
        def.yadvance = parseInt(element.getAttribute("yadvance"), 10);
        def.page = parseInt(element.getAttribute("page"), 10);
        def.chnl = parseInt(element.getAttribute("chnl"), 10);

        return def;
    };

    var Font = function () {
        var scope = this;

        scope.glyphIndex = [];

        return scope;
    };

    Font.prototype = {
        constructor: Font,

        initialize: function(definition) {
            // parse it!
            var doc = XMLHelper.parse(definition.xmlDefinition);
            var chars = doc.getElementsByTagName("char");
            for (var i = 0, len = chars.length; i < len; i++) {
                var def = CharDefinition.FromXML(chars[i]);
                this.glyphIndex[def.id] = def;
            }
        }
    };

    // export
    global.FontDefinition = FontDefinition;
    global.Font = Font;
})(this);
/**
 * Author: thegoldenmule
 * Date: 8/7/13
 */

(function (global) {
    "use strict";

    var TextField = function (parameters) {
        var scope = this;

        if (undefined === parameters) {
            parameters = {};
        }

        scope.font = (undefined === parameters.font) ? new Font() : parameters.font;

        return scope;
    };

    TextField.prototype = {
        constructor: TextField,

        setText: function(text) {

        },

        appendText: function(text) {

        }
    };

    global.TextField = TextField;

})(this);

function extend(subClass, superClass) {
    var F = function() {};
    F.prototype = superClass.prototype;
    subClass.prototype = new F();
    subClass.prototype.constructor = subClass;

    subClass.superclass = superClass.prototype;
    if(superClass.prototype.constructor == Object.prototype.constructor) {
        superClass.prototype.constructor = superClass;
    }
}

if (!Object.keys) {
  Object.keys = (function () {
    var hasOwnProperty = Object.prototype.hasOwnProperty,
        hasDontEnumBug = !({toString: null}).propertyIsEnumerable('toString'),
        dontEnums = [
          'toString',
          'toLocaleString',
          'valueOf',
          'hasOwnProperty',
          'isPrototypeOf',
          'propertyIsEnumerable',
          'constructor'
        ],
        dontEnumsLength = dontEnums.length;

    return function (obj) {
      if (typeof obj !== 'object' && typeof obj !== 'function' || obj === null) throw new TypeError('Object.keys called on non-object');

      var result = [];

      for (var prop in obj) {
        if (hasOwnProperty.call(obj, prop)) result.push(prop);
      }

      if (hasDontEnumBug) {
        for (var i=0; i < dontEnumsLength; i++) {
          if (hasOwnProperty.call(obj, dontEnums[i])) result.push(dontEnums[i]);
        }
      }
      return result;
    };
  })();
}
/**
 * Author: thegoldenmule
 * Date: 3/23/13
 */

(function (global) {
    "use strict";

    var __factories = [
        function() {
            return new XMLHttpRequest();
        },
        function() {
            return new ActiveXObject("Microsoft.XMLHTTP");
        },
        function() {
            return new ActiveXObject("MSXML2.XMLHTTP.3.0");
        },
        function() {
            return new ActiveXObject("MSXML2.XMLHTTP");
        }
    ];

    var HTTPHelper = {

        newRequest: (function(method) {
            if (undefined === method) {
                method = "GET";
            }

            var workingFactory = null;

            return function(url) {
                if (null === workingFactory) {
                    for (var i = 0, len = __factories.length; i < len; i++) {
                        try {
                            var factoryMethod = __factories[i];
                            var request = factoryMethod();

                            if (null !== request) {
                                workingFactory = factoryMethod;

                                break;
                            }
                        } catch (error) {
                            continue;
                        }
                    }

                    if (null === workingFactory) {
                        workingFactory = function() {
                            throw new Error("XMLHTTPRequest not supported.");
                        };
                    }
                }

                var httpRequest = workingFactory();
                httpRequest.open(method, url);
                httpRequest.setRequestHeader("User-Agent", "XMLHttpRequest");
                httpRequest.setRequestHeader("Accept-Language", "en");

                return httpRequest;
            };
        })()
    };

    // export
    global.HTTPHelper = HTTPHelper;
})(this);
/**
 * Author: thegoldenmule
 * Date: 3/22/13
 */

(function (global) {
    "use strict";

    var XMLHelper = {

        newDocument: function(rootTagName, namespaceUrl) {
            if (!rootTagName) {
                rootTagName = "";
            }

            if (!namespaceUrl) {
                namespaceUrl = "";
            }

            if (document.implementation && document.implementation.createDocument) {
                return document.implementation.createDocument(namespaceUrl, rootTagName, null);
            }

            var doc = new ActiveXObject("MSXML2.DOMDocument");

            if (rootTagName) {
                var prefix = "";
                var tagName = rootTagName;
                var p = rootTagName.indexOf(":");
                if (-1 !== p) {
                    prefix = rootTagName.substring(0, p);
                    tagName = rootTagName.substring(p + 1);
                }

                if (namespaceUrl) {
                    if (!prefix) {
                        prefix = "a0";
                    }
                } else {
                    prefix = "";
                }

                var text = "<" +
                    (prefix ? prefix + ":" : "") + tagName +
                    (namespaceUrl ?
                        (" xmlns:" + prefix + "=\"" + namespaceUrl + "\"") :
                        "") +
                    "/>";
                doc.loadXML(text);
            }

            return doc;
        },

        parse: function(text) {
            if (typeof DOMParser !== "undefined") {
                return new DOMParser().parseFromString(text, "application/xml");
            }

            if (typeof ActiveXObject !== "undefined") {
                var doc = XMLHelper.newDocument();
                doc.loadXML(text);
                return doc;
            }

            var url = "data:text/xml;charset=utf-8," + encodeURIComponent(text);
            var request = new XMLHttpRequest();
            request.open("GET", url, false);
            request.send(null);
            return request.responseXML;
        }
    };

    // export
    global.XMLHelper = XMLHelper;
})(this);

var __buildTimestamp = "Sat, 10 Aug 2013 09:59:48 -0700";
