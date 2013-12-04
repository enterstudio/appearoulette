
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


var randomString = function (length, chars) {
    var result = '';
    for (var i = length; i > 0; --i) result += chars[Math.round(Math.random() * (chars.length - 1))];
    return result;
}

var getRoomName = function () {
    var rString = randomString(50, '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ');
    return 'https://appear.in/' + rString + '?lite';
};

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

        clients.forEach(function (cli, iterator) {
            if (cli.socket === socket) {
                clients.splice(iterator, 1);
            }
        });
        pairingPool.forEach(function (cli, iterator) {
            if (cli.socket === socket) {
                pairingPool.splice(iterator, 1);
            }
        });
        socket.broadcast.emit('clientCountUpdated', {"clientCount": clients.length, "pairingPool": pairingPool.length});
    });

    socket.on('getPairing', function (socket) {
        if (client.isSearcing) {
            return;
        }
        client.isSearching = true;
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


        var attemptPairing = function () {
            if (pairingPool.length > 0) {
                var roomName = getRoomName();

                var randomClient = pairingPool.splice(Math.round(Math.random()*(pairingPool.length-1)), 1)[0];
                var pairing = [client, randomClient];
                pairing.forEach(function (cli) {
                    cli.inRoom = true;
                    cli.roomName = roomName;
                    cli.isSearching = false;
                    cli.socket.emit('paired', {"roomName": roomName});
                });

                pairs[roomName] = pairing;
            }
            else {
                pairingPool.push(client);
            }
        }
        attemptPairing();
    });
});
