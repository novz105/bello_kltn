/**
 * Socket.io configuration
 */

'use strict';

var User = require('../api/user/user.model');
var Notification = require('../api/notification/notification.model');
var Conversation = require('../api/conversation/conversation.model');
var Message = require('../api/message/message.model');
var clients = require('./clients');
// When the user disconnects.. perform this
function onDisconnect(socket) {
    if (!socket.clientId) return;
    delete clients[socket.clientId];

}

// When the user connects.. perform this
function onConnect(socket) {
    // When the client emits 'info', this listens and executes

    socket.on('info', function (data) {
        console.info('[%s] %s', socket.address, JSON.stringify(data, null, 2));
    });

    socket.on('id', function (data) {
        User.findById(data, function (err, user) {
            if (!err && user) {
                user.lastActivation = new Date();
                user.save();
                socket.clientId = data;
                console.info('[%s] CLIENT ID', socket.clientId);
                clients[socket.clientId] = socket;
            }
        });
    });


    // Insert sockets below
    // require('../api/thing/thing.socket').register(socket);
    // require('../api/post/post.socket').register(socket);
    // require('../api/room/room.socket').register(socket);
    // require('../api/chat/chat.socket').register(socket);
    // require('../api/friend_request/friend_request.socket').register(socket);
    // require('../api/user/user.socket').register(socket);
    // require('../api/post/post.user.socket').register(socket);
    // require('../api/notification/notification.socket').register(socket);
}


module.exports = function (socketio, clients) {
    // socket.io (v1.x.x) is powered by debug.
    // In order to see all the debug output, set DEBUG (in server/config/local.env.js) to including the desired scope.
    //
    // ex: DEBUG: "http*,socket.io:socket"

    // We can authenticate socket.io users and access their token through socket.handshake.decoded_token
    //
    // 1. You will need to send the token in `client/components/socket/socket.service.js`
    //
    // 2. Require authentication here:
    // socketio.use(require('socketio-jwt').authorize({
    //   secret: config.secrets.session,
    //   handshake: true
    // }));

    socketio.on('connection', function (socket) {
        //console.log(socket);
        // Call onDisconnect.
        socket.on('disconnect', function () {
            onDisconnect(socket);
            console.info('[%s] DISCONNECTED', socket.id);
        });


        // Call onConnect.
        onConnect(socket);
        console.info('[%s] CONNECTED', socket.id);
    });
};