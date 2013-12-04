
/**
 * Module dependencies.
 */

var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var fs = require('fs');
var path = require('path');
//add your api items here - see app.get below
var sample = require('./api/sample')(io);

// all environments
app.set('port', process.env.PORT || 8443);
//app.set('views', __dirname + '/views');
//app.set('view engine', 'jshtml');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.cookieParser('your secret here'));
//app.use(express.session());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

//app.engine('jshtml', require('jshtml-express'));
//app.set('view engine', 'jshtml');

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', function(req, res) {
    fs.readFile(__dirname + '/public/index.html', 'utf8', function(err, text){
        res.send(text);
    });
});

app.get('/api/sample', sample.get);


server.listen(app.get('port'), function(){
    console.log('Express server listening on port ' + app.get('port'));
});


var Client = function (socket) {
    this.socket = socket;
};

var clients = [];
var pairingPool = [];
var pairs = {};
var numberOfClients = 0;

io.sockets.on('connection', function (socket) {
    var client = new Client(socket);
    clients.push(client);
    socket.emit('connected');
    io.sockets.emit('clientCountUpdated', {"clientCount": clients.length});

    socket.on('disconnect', function () {
        if (client.inRoom) {
            var pair = pairs[client.roomName];
            pair.forEach(function (pairClient) {
                if (pairClient != client) {
                    pairClient.socket.emit('nexted');
                }
                pairClient.inRoom = false;
                pairClient.roomName = '';
            });
            delete pairs[client.roomName];
        }

        clients.forEach(function (client, iterator) {
            if (client.socket === socket) {
                clients.splice(iterator, 1);
            }
        });
        socket.broadcast.emit('clientCountUpdated', {"clientCount": clients.length});
    });

    socket.on('getPairing', function (socket) {
        if (client.isSearcing) {
            return;
        }
        // if the client already is in a pool, destroy the pairing
        if (client.inRoom) {
            var pair = pairs[client.roomName];
            pair.forEach(function (pairClient) {
                if (pairClient != client) {
                    pairClient.socket.emit('nexted');
                }
                pairClient.roomName = '';
                pairClient.inRoom = false;
            });
            delete pairs[client.roomName];
        }

        // put client in pool
        pairingPool.push(client);
        client.isSearching = true;

        var attemptPairing = function () {


            if (pairingPool.length >= 2) {
                var getRoomName = function () {
                    var name = '';
                    var alphabet = 'qwertyuiopasdfghjklzxcvbnm';
                    for (var i=0; i<40; i++) {
                        name += alphabet[Math.round(Math.random()*alphabet.length)];
                    }
                    return 'https//appear.in/' + name + '?lite';
                }
                var roomName = getRoomName();


                var pairing = [];
                var client1, client2;

                client1 = pairingPool.splice(Math.round(Math.random()*pairingPool.length-1), 1);
                client2 = pairingPool.splice(Math.round(Math.random()*pairingPool.length-1), 1);

                client1.inRoom = true;
                client1.roomName = roomName;
                client1.isSearching = false;
                client1.socket.emit('paired', {'roomName'. roomName});

                client2.inRoom = true;
                client2.roomName = roomName;
                client2.isSearching = false;
                client2.socket.emit('paired', {'roomName'. roomName});

                pairing.push(client1, client2);

                pairs[roomName] = pairing;
            }
            else {
                setTimeout(attemptPairing, 1000);
            }
        }
        attemptPairing();
    });
});
