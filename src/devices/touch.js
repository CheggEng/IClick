define(['../IClick'], function(IClick){
    IClick.addDevice('touch', {
        start_event : 'touchstart',
        event_map : {
            'touchend'   : 'T_END_EVENT',
            'touchmove'  : 'T_MOVE_EVENT',
            'touchcancel': 'T_CANCEL_EVENT'
        },
        handlers : {
            "INITIAL": {
                "START_EVENT": {
                    "CAPTURING": function(event, _event) {
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
                            if (this.firstTouchTarget === _event.target) {
                                this.fireIClick();
                            }
                            this.reset();
                            this.firstTouchTarget = null;
                            this.firstTouchIdentifier = null;
                        }
                    }
                },
                "T_CANCEL_EVENT" : {
                    "CAPTURING" : function() {
                        this.reset();
                        this.firstTouchTarget = null;
                        this.firstTouchIdentifier = null;
                    }
                }
            }
        }
    });
});
