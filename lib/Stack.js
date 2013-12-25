(function (root, factory) {
    if (typeof exports === 'object') {
        module.exports.Stack = factory();
    } else if (typeof define === 'function' && define.amd) {
        define(function () {
            return factory();
        });
    } else {
        root.Stack = factory();
    }
}(this, function (){
    function Stack() {
        function next(){
            if (this.is_reset) return;

            var fn = this.$stack[this.$index++];
            return fn && fn.apply(this, arguments);
        }

        function current(){
            if (this.is_reset) return;

            var fn = this.$index === 0 ? this.$stack[this.$index] : this.$stack[this.$index -1];
            return fn && fn.apply(this, arguments);
        }

        function prev(){
            var fn;

            if (this.is_reset) return;

            this.$index-=1;
            if (this.$index < 1) this.$index = 1;

            fn = this.$stack[this.$index-1];

            return fn && fn.apply(this, arguments);
        }


        this.$stack = Array.prototype.splice.call(arguments,0);
        if (this.$stack[0] instanceof Array) this.$stack = this.$stack[0];

        this.$index = 0;

        this.next = next.bind(this);
        this.current = current.bind(this);
        this.prev = prev.bind(this);

        this.reset = function(){
            this.$index = 0;
            this.is_reset = true;
            return this;
        };

        this.run = function(){
            this.reset();
            this.is_reset = false;
            this.next.apply(this, arguments);
        };

        this.$index = 0;

        if (!this.as_object) this.run();
    }

    Stack.prototype.as_object=true;

    return Stack;
}));