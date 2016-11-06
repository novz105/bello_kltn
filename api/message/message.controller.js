'use strict';

var _ = require('lodash');
var Message = require('./message.model');
var Conversation = require('./../conversation/conversation.model');
var User = require('./../user/user.model');
var clients = require('./../../config/clients');
var Push = require('./../../config/push')(null);

exports.create = function (req, res) {
    let c = req.body.c;
    let t = req.body.t;
    let u = req.body.u;
    if (c != undefined && t != undefined && u != undefined) {
        User.findById(u, function(err, sender){
            if (err) {
                return res.json(500, err);
            }
            if (!sender) {
                return res.json(200, {code: 404, message: 'User not found'});
            }
            Conversation.findById(c, function (err, conver) {
                if (err) {
                    return res.json(500, err);
                }
                if (!conver) {
                    return res.json(200, {code: 404, message: 'Conversation not found'});
                }
                let completion = function (conver) {
                    let receiverId;
                    if (conver.a == u) {
                        receiverId = conver.b;
                        conver.bR = conver.bR + 1;
                    } else {
                        receiverId = conver.a;
                        conver.aR = conver.aR + 1;
                    }
                    User.findById(receiverId)
                        .exec(function (err, receiver) {
                            if (err) {
                                return res.json(500, err);
                            }
                            if (!receiver) {
                                return res.json(200, {code: 404, message: 'Chat friend not found'});
                            }
                            Message.create({c: conver._id, t: t, u: u}, function (err, m) {
                                if (err) {
                                    return res.json(500, err);
                                }
                                receiver.message = receiver.message + 1;
                                sender.lastActivation = new Date();
                                sender.save();
                                conver.t = new Date();
                                conver.m = m;
                                conver.e = true;
                                receiver.save(function (err, updatedReceiver) {
                                    if (err) {
                                        return res.json(500, err);
                                    }
                                    conver.save(function(err, updatedConver) {
                                        if (err) {
                                            return res.json(500, err);
                                        }
                                        let data = m.toObject();
                                        data.badge = updatedReceiver.message;
                                        if (updatedReceiver._id in clients) {
                                            clients[updatedReceiver._id].emit('msg', JSON.stringify(data));
                                        } else {
                                            if (receiver.notiPush == true) {
                                                Push.sendMessage(m, updatedReceiver);
                                            }
                                        }
                                    });
                                    return res.json(200, {code: 200, message: 'OK', data:m});
                                });
                            });
                        });
                }
                completion(conver);
            });
        });

    } else {
        return res.json(200, {code: 401, message: 'Params error'});
    }
}

exports.list = function (req, res) {
    var offset = req.body.offset;
    var limit = req.body.limit;
    Message.find({c:req.body.conversation._id})
        .limit(limit)
        .skip(offset)
        .sort({"_id": -1})
        .exec(function (err, msgs) {
            if (err) {
                return res.json(500, err);
            }
            return res.json(200, {code: 200, message: 'Successful', data:msgs});
        });
}

exports.read = function (req, res) {
    var msgs = req.body.msgs;
    var userId = req.body.user._id;
    var converId = req.body.conversation._id;
    if (userId != undefined && converId != undefined && msgs != undefined && msgs.length > 0) {
        User.findById(userId, function (err, user) {
            if (err) {
                return res.json(500, err);
            }
            if (!user) {
                return res.json(200, {code: 404, message: 'User not found'});
            } else {
                Conversation.findById(converId, function(err, conver){
                    if (err) {
                        return res.json(500, err);
                    }
                    if (!conver) {
                        return res.json(200, {code: 404, message: 'Conversation not found'});
                    } else {
                        let friendId = userId == conver.a ? conver.b : conver.a;
                        Message.find({
                            '_id': {$in: msgs}
                        })
                            .where('u').equals(friendId)
                            .exec(function (err, messages) {
                                if (err) {
                                    return res.json(500, err);
                                }
                                if (messages && messages.length > 0) {
                                    let count = 0;
                                    for (let i = 0; i < messages.length; i++) {
                                        if (messages[i].r == false) {
                                            messages[i].r = true;
                                            messages[i].save();
                                            count++;
                                        }
                                    }
                                    if (conver.a == userId) {
                                        conver.aR = conver.aR - count;
                                    } else {
                                        conver.bR = conver.bR - count;
                                    }
                                    conver.save(function(err, updateConver) {
                                        if (err) {
                                            return res.json(500, err);
                                        } else {
                                            user.message = user.message - count;
                                            user.save(function (err, updatedUser) {
                                                if (err) {
                                                    return res.json(500, err);
                                                } else {
                                                    return res.json(200, {
                                                        code: 200,
                                                        message: 'Successful',
                                                        data: updatedUser.message
                                                    });
                                                }
                                            });
                                        }
                                    });
                                } else {
                                    return res.json(200, {code: 200, message: 'Nothing found', data: user.message});
                                }

                            });
                    }
                });

            }
        });
    } else {
        return res.json(200, {code: 401, message: 'Params error'});
    }
}