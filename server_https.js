var https = require('https');
var fs = require('fs');
var static = require('node-static');
var file = new (static.Server)();

var hskey = fs.readFileSync('key.pem');
var hscert = fs.readFileSync('cert.pem');

var options = {
    key: hskey,
    cert: hscert
};

var app = https.createServer(options, function (req, res) {
    file.serve(req, res);
}).listen(443);


var io = require('socket.io').listen(app);

io.sockets.on('connection', function (socket) {
    function log() {
        var array = [">>> "];
        for (var i = 0; i < arguments.length; i++) {
            array.push(arguments[i]);
        }
        socket.emit('log', array);
    }

    socket.on('message', function (message) {
        log('Got message: ', message);
        socket.broadcast.emit('message', message); // should be room only
    });

    socket.on('chat message', function(msg){
        console.log('chat message: ' + msg);
        //io.emit('chat message', msg);
        socket.broadcast.emit('chat message', msg);
    });

    socket.on('create or join', function (room) {
        var numClients = io.sockets.clients(room).length;

        log('Room ' + room + ' has ' + numClients + ' client(s)');
        log('Request to create or join room', room);

        if (numClients == 0) {
            socket.join(room);
            socket.emit('created', room);
        }

        else if (numClients == 1) {
            io.sockets.in(room).emit('join', room);
            socket.join(room);
            socket.emit('joined', room);
        }

        else { // max two clients
            socket.emit('full', room);
        }

        socket.emit('emit(): client ' + socket.id + ' joined room ' + room);
        socket.broadcast.emit('broadcast(): client ' + socket.id + ' joined room ' + room);
    });
});