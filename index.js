"use strict";

var express = require('express');
var app = express();
var morgan = require('morgan');
var mongoose = require('mongoose');
var config = require('./config/config');
var apn = require('apn');

var service = new apn.Provider({
    cert: "certificates/cert.pem",
    key: "certificates/key.pem"
});
require('./config/push')(service);


var port = process.env.PORT || 7000;


// Connect to database
mongoose.connect(config.database);

var server = require('http').createServer(app);

var socketio = require('socket.io')(server);
var clients = require('./config/clients');
// socketio.listen(server);
require('./config/socketio')(socketio, clients);



// use morgan to log requests to the console
app.use(morgan('dev'));
app.use('/static', express.static('uploads'));

require('./config/express')(app);
require('./routes')(app);

var ip = require('ip');
var peerPort = 8100;
var PeerServer = require('peer').PeerServer;
var serverPeer = new PeerServer({port: peerPort, allow_discovery: true});

serverPeer.on('connection', function (id) {
    console.log('new connection with id ' + id);
});

serverPeer.on('disconnect', function (id) {
    console.log('disconnect with id ' + id);
});

console.log('peer server running on ' + ip.address() + ':' + peerPort);


app.get('/', function(request, response) {
    response.send('Hello World!');
});


server.listen(port, function() {
	console.log('KLTN server listening on port: ', port);
});




