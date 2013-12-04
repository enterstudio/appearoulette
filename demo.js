
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
       client.isSearching = true;

        if (pairingPool.length > 0) {
            var pair = [];
            var randomClient = pairingPool.splice(Math.round(Math.random()*pairingPool.length-1))[0];

            pair.push(client, randomClient);

            var getRandomRoomName = function () {
                var name '';
                var alphabet = 'qwertyuiopasdfghjklzxcvbnm1234567890';
                for (var i=0; i<40; i++) {
                    name = name + alphabet[Math.round(Math.random()*alphabet.length-1)];
                }
                return 'https://appear.in/' + name + '?lite';
            }
            var roomName = getRandomRoomName();

            pair.forEach(function (cli) {
                cli.roomName = roomName;
                cli.inRoom = true;
                cli.isSearching = false;
                cli.socket.emit('paired', {"roomName": roomName});
            });

            pairs[roomName] = pair;
        }
        else {
            pairingPool.push(client);
        }
    });
});
