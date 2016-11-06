
'use strict';

var _ = require('lodash');
var Conversation = require('./conversation.model');
var User = require('./../user/user.model');
var Message = require('./../message/message.model');
var clients = require('./../../config/clients');

exports.find = function (req, res) {
    let a = req.body.a;
    let b = req.body.b;
    if (a != undefined && b != undefined) {
        Conversation.findOne({$or: [{a: a, b: b}, {a: b, b: a}]})
            .exec(function (err, c) {
                if (err) {
                    return res.json(500, err);
                }
                if (!c) {
                    Conversation.create({a: a, b: b}, function (err, nC) {
                        if (err) {
                            return res.json(500, err);
                        }
                        return res.json(200, {code: 200, message: 'Success', data: nC});
                    });
                } else {
                    return res.json(200, {code: 200, message: 'Success', data: c});
                }
            });
    } else {
        return res.json(200, {code: 401, message: 'Params error'});
    }
}

exports.list = function (req, res) {
    let userId = req.body.user._id;
    let offset = req.body.offset;
    let limit = req.body.limit;
    if (offset != undefined && userId != undefined && limit != undefined) {
        Conversation.find({$or: [{a: userId}, {b: userId}]})
            .lean()
            .skip(offset)
            .limit(limit)
            .where('e').equals(true)
            .sort({t:-1})
            .exec(function (err, convers) {
                if (err) {
                    return res.json(500, err);
                }
                if (convers && convers.length > 0) {
                    let numberOfMessage = 0;
                    for (let i = 0; i < convers.length; i++) {
                        Message.findById(convers[i].m)
                            .exec(function (err, msg) {
                                numberOfMessage++;
                                if (!err && msg) {
                                    convers[i].m = msg;
                                }
                                if (numberOfMessage == convers.length) {
                                    let numberOfFriend = 0;
                                    for (let j = 0; j < convers.length; j++) {
                                        let friendId;
                                        let uR;
                                        if (convers[j].a == userId) {
                                            friendId = convers[j].b;
                                            uR = convers[j].aR;
                                        } else {
                                            friendId = convers[j].a;
                                            uR = convers[j].bR;
                                        }
                                        User.findById(friendId, function(err, friend){
                                            if (!err && friend) {
                                                convers[j].u = friend;
                                                convers[j].a = undefined;
                                                convers[j].b = undefined;
                                                convers[j].uR = uR;
                                                convers[j].aR = undefined;
                                                convers[j].bR = undefined;
                                            }
                                            numberOfFriend++;
                                            if (numberOfFriend == convers.length) {
                                                return res.json(200, {code: 200, message: 'Successful', data: convers});
                                            }
                                        });
                                    }
                                }
                            });
                    }
                } else {
                    return res.json(200, {code: 200, message: 'Nothing found', data: []});
                }
            });
    }
}

exports.info = function (req, res) {
    let id = req.body._id;
    if (id != undefined) {
        Conversation.findById(id)
            .exec(function (err, c) {
                if (err) {
                    return res.json(500, err);
                }
                if (!c) {
                    return res.json(200, {code: 404, message: 'Conversation not found'});
                } else {
                    return res.json(200, {code: 200, message: 'Success', data: c});
                }
            });
    } else {
        return res.json(200, {code: 401, message: 'Params error'});
    }
}