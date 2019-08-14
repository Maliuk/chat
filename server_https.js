var https = require('https');
var fs = require('fs');
var static = require('node-static');
var file = new (static.Server)();

var hskey = fs.readFileSync('sslcert/key.pem');
var hscert = fs.readFileSync('sslcert/cert.pem');

var options = {
    key: hskey,
    cert: hscert
};

var app = https.createServer(options, function (req, res) {
    file.serve(req, res);
}).listen(1234);


var io = require('socket.io').listen(app);
//io.emit("server reload");

var users = [];

io.sockets.on('connection', function (socket) {
    //users.push(socket.id);

    console.log("Socket id: " + socket.id + " is connected to server");

    function log() {
        var array = [">>> "];
        for (var i = 0; i < arguments.length; i++) {
            array.push(arguments[i]);
        }
        socket.emit('log', array);
    }


    socket.on('message', function (message) {
        //console.log('Got message: ', message);
        socket.broadcast.emit('message', message); // should be room only
    });


    socket.on('login', function (message) {
        //socket.broadcast.emit('message', message);
        let success = true;

        if (users.length > 0)
            success = users.find(user => user.username === message.username) ? false : true;

        console.log(success);

        socket.emit('onlogin', {
            "users": users,
            "success": success
        });

        if (success) {
            users.push(message);

            console.log(new Date().toLocaleString() + " || " + socket.id + " " + message.username + " - connected user");
            console.log("Total users: " + users.length);

            socket.broadcast.emit('new user', message);
        }

        //io.emit("update users", users);
    });


    socket.on('chat message', function (msg) {
        console.log('chat message: ' + msg);
        //io.emit('chat message', msg);
        socket.broadcast.emit('chat message', msg);
    });


    socket.on('create or join', function (room) {
        var numClients = io.sockets.clients(room).length;

        console.log('Room ' + room + ' has ' + numClients + ' client(s)');
        console.log('Request to create or join room', room);

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


    socket.on('disconnect', function () {
        try {
            //var i = users.indexOf(socket.id);
            let user = users.find(user => user.socket == socket.id);

            console.log(user);

            if (user) {
                let search = (key, inputArray) => {
                    for (let n = 0; n < inputArray.length; n++) {
                        if (inputArray[n].username === key) {
                            return n;
                        }
                    }
                }

                var i = search(user.username, users);

                console.log(i);

                let uname = user.username;

                users.splice(i, 1);

                console.log(new Date().toLocaleString() + " || " + socket.id + " " + uname + " - disconected");
                console.log("Total users: " + users.length);

                io.emit("remove user", uname);
            }
        }
        catch (error) {
            console.log(error);
        }
    });
});