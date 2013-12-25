define(['../IClick'], function(IClick){
    IClick.addDevice('mouse' , {
        start_event : 'mousedown',
        event_map : {
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
