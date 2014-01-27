(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(function () {
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
        this.eventHandlers = IClick.eventHandlers;
        this.start_events = IClick.start_events;
        this.event_map = IClick.event_map;

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
        IClick.event_map[name] = config.event_map;
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
        event_name : 'iclick',

        /**
         * whether or not to always prevent the real click event from firing
         * @property prevent_click
         * @public
         * @type {boolean}
         */
        prevent_click : false,
        /**
         * use this property within a driver to prevent the event from triggering
         * @property iclickPrevented
         * @protected
         * @type {Boolean}
         */
        iclickPrevented : false,

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

            for (name in this.start_events) {
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

            for (name in this.start_events) {
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
        fireIClick: function(e) {
            if (!this.event) this.event = e;
            
            var event = this.event,
                _event = event.changedTouches ? event.changedTouches[0] : event,
                target = _event.target,
                IClickEvent;

            if (this.moved || this.iclickPrevented) return;

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
            clearTimeout(this.handle);
            this.handle = setTimeout(this.resetFiredFlag, 500);

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
            this.iclickPrevented = false;

            return this;
        },

        // === private methods === //

        getType : function(ev) {
            var type = ev.type;

            if (type in this.start_events) return 'START_EVENT';
            else return this.event_map[this.input_type][type];
        },

        handleEvent: function(event) {
            var self = this,
                _event = event.changedTouches ? event.changedTouches[0] : event,
                phase,
                eventType;

            phase = event.eventPhase === Event.CAPTURING_PHASE ?
                "CAPTURING" :
                (event.eventPhase === Event.BUBBLING_PHASE ? "BUBBLING" : event.eventPhase);

            eventType = this.getType(event);

            if (eventType == 'START_EVENT') {
                if (!this.$fired && !this.started) {
                    this.init(event.type);
                }else{
                    return;
                }
            }

            if (phase === "CAPTURING") {
                event.preventIClick = function() {
                    self.iclickPrevented = true;
                };

                event.isIClickPrevented = function() {
                    return self.iclickPrevented;
                };

                event.hasIClickMoved = function() {
                    return self.moved;
                };
            }

            this.event = event;

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
            if (!(type in this.start_events)) throw new Error("IClick- unknow start event: " + type);
            this.reset();
            this.input_type = this.start_events[type];

            this.handlers = this.eventHandlers[this.input_type];

            this.started = true;
        },

        addEvents: function() {
            var name;

            for (name in this.event_map[this.input_type]) {
                this.rootElement.addEventListener(name,this, true);
                this.rootElement.addEventListener(name,this, false);
            }
        },

        removeEvents: function() {
            var name;

            for (name in this.event_map[this.input_type]) {
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
