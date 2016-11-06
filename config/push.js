'use strict';
var User = require('../api/user/user.model');
var apn = require('apn');
var Push = {
    sendPush: function (notification) {
        User.findById(notification.receiver, function (err, user) {
            if (!err && user) {
                user.notification = user.notification + 1;
                user.save(function (err, updatedUser) {
                    if (!err && updatedUser) {
                        if (updatedUser.deviceToken && updatedUser.deviceToken.length > 0 && updatedUser.notiPush == true) {
                            let tokens = [updatedUser.deviceToken];
                            let note = new apn.Notification();
                            let name = user.name;
                            let action;
                            if (notification.action == 0) {
                                action = 'likes';
                            } else if (notification.action == 1) {
                                action = 'just commented on';
                            } else if (notification.action == 2) {
                                action = 'just shared';
                            } else if (notification.action == 3) {
                                action = 'accepted';
                            }
                            let object;
                            if (notification.kind == 0) {
                                object = "your post";
                            } else if (notification.kind == 1) {
                                object = "your photo";
                            } else if (notification.kind == 2) {
                                object = "your avatar picture";
                            } else if (notification.kind == 3) {
                                object = "your cover picture";
                            } else if (notification.kind == 4) {
                                object = "your album";
                            } else if (notification.kind == 5) {
                                object = "a post that you're commented in";
                            } else if (notification.kind == 6) {
                                object = "a photo that you're commented in";
                            } else if (notification.kind == 7) {
                                object = "an avatar picture that you're commented in";
                            } else if (notification.kind == 8) {
                                object = "a cover picture that you're commented in";
                            } else if (notification.kind == 9) {
                                object = "an album that you're commented in";
                            } else if (notification.kind == 10) {
                                object = "a post that you're subscribed";
                            } else if (notification.kind == 11) {
                                object = "a photo that you're subscribed";
                            } else if (notification.kind == 12) {
                                object = "an avatar picture that you're subscribed";
                            } else if (notification.kind == 13) {
                                object = "a cover picture that you're subscribed";
                            } else if (notification.kind == 14) {
                                object = "an album that you're subscribed";
                            } else if (notification.kind == 15) {
                                object = "a post on your timeline";
                            } else if (notification.kind == 16) {
                                object = "a photo on your timeline";
                            } else if (notification.kind == 17) {
                                object = "a post on your timeline";
                            } else if (notification.kind == 19) {
                                object = "your friend request";
                            }
                            note.topic = "com.kltn.bellotest";
                            note.payload = {type: 'noti', noti:user.notification, msg:user.message, req:user.request};
                            note.badge = user.notification + user.message + user.request;
                            if (notification.kind != 18) {
                                note.alert = name + " " + action + " " + object;
                            } else {
                                note.alert = "To day is " + name + "'s" + " birthday";
                            }
                            console.log(`Sending: ${note.compile()} to ${tokens}`);
                            Push.service.send(note, tokens).then(result => {
                                console.log("sent:", result.sent.length);
                                console.log("failed:", result.failed.length);
                                console.log(result.failed);
                            });
                        }
                    }
                });
            }
        });
    },

    sendRequest: function (friend, user) {
        if (user.deviceToken && user.deviceToken.length > 0) {
            let tokens = [user.deviceToken];
            let note = new apn.Notification();
            note.topic = "com.kltn.bellotest";
            note.payload = {type: 'req', noti:user.notification, msg:user.message, req:user.request};
            note.badge = user.notification + user.message + user.request;
            note.alert = user.name + 'sent you a friend request';
            console.log(`Sending: ${note.compile()} to ${tokens}`);
            Push.service.send(note, tokens).then(result => {
                console.log("sent:", result.sent.length);
                console.log("failed:", result.failed.length);
                console.log(result.failed);
            });
        }
    },

    sendMessage: function (message, user) {
        if (user.deviceToken && user.deviceToken.length > 0) {
            let tokens = [user.deviceToken];
            let note = new apn.Notification();
            note.topic = "com.kltn.bellotest";
            note.payload = {type: 'msg', noti:user.notification, msg:user.message, req:user.request};
            note.badge = user.notification + user.message + user.request;
            note.alert = user.name + ': ' + message.t;
            console.log(`Sending: ${note.compile()} to ${tokens}`);
            Push.service.send(note, tokens).then(result => {
                console.log("sent:", result.sent.length);
                console.log("failed:", result.failed.length);
                console.log(result.failed);
            });
        }
    }
}

module.exports = function(service) {
    if (service) {
        Push.service = service;
        return Push;
    } else {
        return Push;
    }
//    let tokens = ["65822c996a6ab42b01e7b48be924b8d10a5884e887a94b2229230dfd08689ac6"];
//    let note = new apn.Notification({
//        alert:  "Breaking News: I just sent my first Push Notification"
//    });
//
//// The topic is usually the bundle identifier of your application.
//    note.topic = "com.kltn.bellotest";
//    note.payload = {'messageFrom': 'Hello picaso'};
//    note.alert = "\uD83D\uDCE7 \u2709 You have a new message";
//
//    console.log(`Sending: ${note.compile()} to ${tokens}`);
//    push.send(note, tokens).then( result => {
//        console.log("sent:", result.sent.length);
//        console.log("failed:", result.failed.length);
//        console.log(result.failed);
//    });
//    return push;
}