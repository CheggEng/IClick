
(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define('IClick',[],function () {
            return factory();
        });
    } else {
        root.IClick = factory();
    }
}(this, function () {
    function find(obj /*[,item [,item ...]]*/){
        var list = Array.prototype.splice.call(arguments,1),
            name;


        if (!obj) return null;

        if (list.length == 1 && list[0].indexOf('.')>-1){
            list = list[0].split('.');
        }

        while (name = list.shift()){
            if (obj == null) return null;
            obj = obj[name];
        }

        return obj;
    }

    function extend(obj, props) {
        for (var key in props) obj[key] = props[key];
    }

    /**
     * This class provides a costume events that triggers immediately after
     * a user has clicked an element.
     * Class supports adding new drivers to allow multiple devices inputs.
     *
     * @class IClick
     * @constructor
     *
     * @param {Element}  [root] if provided will use this element as root element
     */
    function IClick(root) {
        this.resetFiredFlag = this.resetFiredFlag.bind(this);

        this.rootElement = root || document;

        this.attach();
    };


    /**
     * Adds device support
     * @method addDevice
     *
     * @static
     *
     * @param {String} name name of device
     * @param {Object} config  device configurations
     *
     *      @param {string} config.start_event name of start event
     *      @param {objcet} config.event_map a map of event names and their phase name. eg:
     *           {
     *             mousedown : 'START_EVENT',
     *             mousemove : 'MOVE_EVENT',
     *             mouseup   : 'END_EVENT'
     *           }
     *
     *      @param {objcet} config.handlers map of event handlers. basic structure:
     *
     *          type : {
     *           INITIAL : {
     *                TYPE : {
     *                   CAPTURING : fn(ev,_ev){}, //optional
     *                   BUBBLING : fn(ev,_ev){} //optional
     *                }
     *           },
     *           ACTIVE : {
     *                TYPE : {
     *                    CAPTURING : fn(ev,_ev){}, //optional
     *                    BUBBLING : fn(ev,_ev){} //optional
     *                }
     *           }
     *         }
     */
    IClick.addDevice = function addDevice(name, config) {
        IClick.start_events[config.start_event] = name;
        IClick.eventHandlers[name] = config.handlers;
        extend(IClick.event_map, config.event_map);
    };


    IClick.start_events = {};
    IClick.eventHandlers = {};
    IClick.event_map = {};

    IClick.prototype = {
        constructor: IClick,

        /**
         * @property event_name
         * @type {string}
         * @static
         *
         * this is the name of the event that will be fired when an immediate click is triggered
         */
        EVENT_NAME : 'iclick',

        /**
         * whether or not to always prevent the real click event from firing
         * @property prevent_click
         * @public
         * @type {boolean}
         */
        prevent_click : false,
        /**
         * use this property within a driver to prevent the event from triggering
         * @property IClickPrevented
         * @protected
         * @type {Boolean}
         */
        IClickPrevented : false,

        /**
         * This property should be used by drivers to switch into the "active" stack
         * @property state
         * @protected
         * @type {String}
         */
        state : "INITIAL",

        moved : false,
        absDistX : 0,
        absDistY : 0,
        prevPageX : 0,
        prevPageY : 0,
        fired : false,

        max_move : 5,

        /**
         * attaches IClick to the root element
         * @method attach
         * @public
         * @chainable
         */
        attach : function(){
            var name;

            for (name in IClick.start_events) {
                this.rootElement.addEventListener(name, this, true);
            }

            return this;
        },

        /**
         * detaches IClick from the root element
         * @method detach
         * @public
         * @chainable
         */
        detach : function(){
            var name;

            for (name in IClick.start_events) {
                this.rootElement.removeEventListener(name, this, true);
            }

            this.removeEvents();

            return this;
        },


        // --- Event Handler Helpers --- //

        /**
         * check if user moved indicator more than allowed
         * @method isMoved
         * @protected
         *
         * @return {boolean}
         */
        isMoved: function(_event) {

            // Check if already moved to bypass calculations
            if (this.moved) {
                return true;
            }

            this.absDistX += Math.abs(_event.pageX - this.prevPageX);
            this.absDistY += Math.abs(_event.pageY - this.prevPageY);
            this.prevPageX = _event.pageX;
            this.prevPageY = _event.pageY;

            if (this.absDistX > this.max_move || this.absDistY > this.max_move) {
                this.moved = true;
            }

            return this.moved;
        },

        /**
         * fires the IClick event
         * @method fireIClick
         * @protected
         * @chainable
         */
        fireIClick: function() {
            var event = this.event,
                _event = event.changedTouches ? event.changedTouches[0] : event,
                target = _event.target,
                IClickEvent;

            if (this.moved && this.IClickPrevented) return;

            // Find the last touched element
            while (target.nodeType !== 1) {
                target = target.parentNode;
            }

            IClickEvent = document.createEvent('MouseEvents');
            IClickEvent.initMouseEvent(this.event_name, true, true, event.view, 1,
                _event.screenX, _event.screenY, _event.clientX, _event.clientY,
                event.ctrlKey, event.altKey, event.shiftKey, event.metaKey,
                0, null);

            target.dispatchEvent(IClickEvent);

            if (IClickEvent.defaultPrevented || this.prevent_click) {
                event.preventDefault();
            }

            this.$fired = true;
            setTimeout(this.resetFiredFlag, 300);

            return this;
        },

        /**
         * reset IClick checks. remove all events handlers. Must be called on canceling states.
         * @method reset
         * @protected
         * @chainable
         */
        reset : function(){
            this.state = "INITIAL";
            this.removeEvents();
            this.started = false;
            this.IClickPrevented = false;

            return this;
        },

        // === private methods === //

        handleEvent: function(event) {
            var self = this,
                _event = event.changedTouches ? event.changedTouches[0] : event,
                phase,
                ignore_start = this.state == 'INITIAL' && this.$fired,
                eventType;

            phase = event.eventPhase === Event.CAPTURING_PHASE ?
                "CAPTURING" :
                (event.eventPhase === Event.BUBBLING_PHASE ? "BUBBLING" : event.eventPhase);

            eventType = IClick.event_map[event.type];

            if (eventType == 'START_EVENT') {
                if (!ignore_start && !this.started) {
                    this.init(event.type);
                }else{
                    return;
                }
            }

            if (phase === "CAPTURING") {
                event.preventIClick = function() {
                    self.IClickPrevented = true;
                };
                event.IClickPrevented = function() {
                    return self.IClickPrevented;
                };
                event.isMoved = function() {
                    return self.moved;
                };
            }

            this.event = _event;

            if (this.fireHandler(eventType, phase, event, _event) && this.state == 'INITIAL') {
                this.addEvents();
                this.initMoveCheck(_event);
                this.state = 'ACTIVE';
            }

            this.event = null;
        },

        fireHandler : function(type, phase, event, _event) {
            var handler = find(this.handlers, this.state, type, phase),
                result = handler && handler.apply(this,[event,_event]);

            return result !== false;
        },

        init : function(type){
            if (!(type in IClick.start_events)) throw new Error("IClick- unknow start event: " + type);

            this.input_type = IClick.start_events[type];

            this.handlers = this.eventHandlers[this.input_type];

            this.started = true;
        },

        addEvents: function() {
            var name;

            for (name in IClick.event_map[this.input_type]) {
                if (name == this.start_events[this.input_type]) continue;

                this.rootElement.addEventListener(name,this, true);
                this.rootElement.addEventListener(name,this, false);
            }
        },

        removeEvents: function() {
            var name;

            for (name in IClick.names[this.input_type]) {
                if (name == this.start_events[this.input_type]) continue;

                this.rootElement.removeEventListener(name,this, true);
                this.rootElement.removeEventListener(name,this, false);
            }
        },

        initMoveCheck: function(_event) {
            this.moved = false;
            this.absDistX = 0;
            this.absDistY = 0;
            this.prevPageX = _event.pageX;
            this.prevPageY = _event.pageY;
        },

        resetFiredFlag : function(){
            this.$fired = false;
        }
    };

    return IClick;
}));

define('devices/mouse.js',['../IClick'], function(IClick){
    IClick.addDevice('mouse' , {
        start_event : 'mousedown',
        event_map : {
            'mousedown'  : 'START_EVENT',
            'mouseup'    : 'M_END_EVENT',
            'mousemove'  : 'MOVE_EVENT'
        },
        handlers :  {
            "INITIAL": {
                "START_EVENT": {
                    "CAPTURING": function(event, _event) {
                        // Do not process non left mouse clicks
                        if (typeof event.button === "number" && event.button !== 0) return false;

                        this.firstClickTarget = _event.target;
                    }
                }
            },
            "ACTIVE": {
                "START_EVENT": {
                    "CAPTURING": function(event, _event) {
                        // Apparently, user moved mouse out of window then
                        // moved it into the window again and clicked
                        this.firstClickTarget = _event.target;
                        this.initMoveCheck(_event);
                    }
                },
                "M_MOVE_EVENT": {
                    "CAPTURING": function(event, _event) {
                        event.IClickMoved = this.isMoved(_event);
                    }
                },
                "M_END_EVENT": {
                    "BUBBLING": function(event, _event) {
                        this.state = "INITIAL";
                        this.reset();
                        if (this.firstClickTarget === _event.target) {
                            this.fireIClick();
                        }
                    }
                }
            }
        }
    });

});

define('devices/pointer.js',['../IClick'], function(IClick){

    IClick.addDevice('pointer', {
        start_event : 'pointerdown',
        event_map : {
            'pointerdown' : 'START_EVENT',
            'pointerup'   : 'P_END_EVENT',
            'pointermove'  : 'P_MOVE_EVENT',
            'pointercancel': 'P_CANCEL_EVENT'
        },
        handlers : {
            "ACTIVE": {
                "START_EVENT": {
                    "CAPTURING": function() {
                        // Another finger touched the screen, do not fire IClick.
                        this.IClickPrevented = true;
                    }
                },
                "P_MOVE_EVENT": {
                    "CAPTURING": function(event, _event) {
                        event.IClickMoved = this.isMoved(_event);
                    }
                },
                "P_END_EVENT": {
                    "BUBBLING": function(event, _event) {
                        this.reset();
                        this.fireIClick();
                    }
                },
                "P_CANCEL_EVENT" : {
                    "CAPTURING" : function() {
                        this.reset();
                    }
                }
            }
        }
    });

    IClick.addDevice('MSPointer', {
        start_event : 'mspointerdown',
        event_map : {
            'mspointerdown' : 'START_EVENT',
            'mspointerup'   : 'MS_P_END_EVENT',
            'mspointermove'  : 'MS_P_MOVE_EVENT',
            'mspointercancel': 'MS_P_CANCEL_EVENT'
        },
        handlers : {
            "ACTIVE": {
                "START_EVENT": {
                    "CAPTURING": function() {
                        // Another finger touched the screen, do not fire IClick.
                        this.IClickPrevented = true;
                    }
                },
                "MS_P_MOVE_EVENT": {
                    "CAPTURING": function(event, _event) {
                        this.isMoved(_event);
                    }
                },
                "MS_P_END_EVENT": {
                    "BUBBLING": function(event, _event) {
                        this.reset();
                        this.fireIClick();
                    }
                },
                "MS_P_CANCEL_EVENT" : {
                    "CAPTURING" : function() {
                        this.reset();
                    }
                }
            }
        }
    });});

define('devices/touch.js',['../IClick'], function(IClick){
    IClick.addDevice('touch', {
        start_event : 'touchstart',
        event_map : {
            'touchstart' : 'START_EVENT',
            'touchend'   : 'T_END_EVENT',
            'touchmove'  : 'T_MOVE_EVENT',
            'touchcancel': 'T_CANCEL_EVENT'
        },
        handlers : {
            "INITIAL": {
                "START_EVENT": {
                    "CAPTURING": function(event, _event) {
                        this.state = "TOUCHED";
                        // If there are more than two fingers touched
                        // the screen, do not fire IClick.
                        if (event.touches.length > 1) {
                            this.IClickPrevented = true;
                        }
                        this.firstTouchIdentifier = _event.identifier;
                        this.firstTouchTarget = _event.target;
                    }
                }
            },
            "ACTIVE": {
                "START_EVENT": {
                    "CAPTURING": function() {
                        // Another finger touched the screen, do not fire IClick.
                        this.IClickPrevented = true;
                    }
                },
                "T_MOVE_EVENT": {
                    "CAPTURING": function(event, _event) {
                        if (this.firstTouchIdentifier === _event.identifier) {
                            event.IClickMoved = this.isMoved(_event);
                        }
                    }
                },
                "T_END_EVENT": {
                    "BUBBLING": function(event, _event) {
                        if (event.touches.length === 0) {
                            this.reset();
                            if (this.firstTouchTarget === _event.target) {
                                this.fireIClick();
                            }
                        }
                    }
                },
                "T_CANCEL_EVENT" : {
                    "CAPTURING" : function() {
                        this.reset();
                    }
                }
            }
        }
    });
});

require(['IClick','devices/mouse.js','devices/pointer.js','devices/touch.js'],function(IClick){return IClick;});
define("Combined", function(){});
