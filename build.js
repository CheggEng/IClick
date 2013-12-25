var fs = require('fs');
var Stack = require('./lib/Stack').Stack;
var exec = require('child_process').exec;

var drivers = [];
var template = "require(['IClick','{driver-list}'],function(IClick){return IClick;});";

var stack = new Stack(
    function collectDrivers(){
        fs.readdir('./src/devices', function(err, list){
            var i,file;
            for (i=0; file=list[i];i++) {
                if (file.indexOf('.js')==-1) continue;
                drivers.push('devices/'+file);
            }
            this.next();
        }.bind(this));
    },
    function createAppFile(){
        fs.open('./src/Combined.js', 'a+', this.next);
    },
    function writeConfFile(err, fd){
        var str=template.replace('{driver-list}', drivers.join("','"));
        fs.writeFile('./src/Combined.js',str, this.next);
    }
);

stack.run();