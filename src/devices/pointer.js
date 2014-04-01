define(['../IClick'], function(IClick){

    IClick.addDevice('pointer', {
        start_event : 'pointerdown',
        event_map : {
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

   /* Disabled at the moment because pointer{EVENT} is enough
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
    });*/
});
