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
