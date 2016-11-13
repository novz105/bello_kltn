'use strict';

var _ = require('lodash');
var User = require('./../user/user.model');
var LikePost = require('./../like_post/like_post.model');
var EventPost = require('./../event_post/event_post.model');
var clients = require('./../../config/clients');
var Notification = require('./../notification/notification.model');
var Subscription = require('./../subscription/subscription.model');
var Push = require('./../../config/push')(null);

exports.create = function (req, res) {
    if (!req.body.user || !req.body.user._id || !req.body.event || !req.body.event._id) {
        return res.json(200, {code: 401, message: 'Params error'});
    }
    var dataLike = {
        user: req.body.user._id,
        event: req.body.event._id
    }
    User.findById(req.body.user._id, function (err, user) {
        if (err) {
            return res.json(500, err);
        }
        if (!user) {
            return res.json(200, {code: 404, message: 'User not found'});
        }
        LikePost.findOne(dataLike, function (err, like) {
            if (err) {
                return res.json(500, err);
            }
            if (!like) {
                EventPost.findById(req.body.event._id, function (err, event) {
                    if (err) {
                        return res.json(500, err);
                    }
                    if (!event) {
                        return res.json(200, {code: 404, message: 'Event not found'});
                    }
                    var like = new LikePost(dataLike);
                    if (!like) {
                        return res.json(200, {code: 401, message: 'Params error'});
                    }
                    like.save(function (err, newLike) {
                        if (err) {
                            return res.json(500, err);
                        }
                        if (newLike) {
                            event.numberOfLike = event.numberOfLike + 1;
                            event.save(function (err, updatedEvent) {
                                if (err) {
                                    return res.json(500, err);
                                }
                                if (updatedEvent) {
                                    let receivers = {};
                                    receivers[updatedEvent.user.toString()] = false;
                                    receivers[updatedEvent.timeline.toString()] = false;

                                    for (let userId in receivers) {
                                        if (userId != req.body.user._id.toString()) {
                                            Subscription.findOne({
                                                object: updatedEvent._id,
                                                owner: userId
                                            }, function (err, sub) {
                                                if (!err && sub) {
                                                    Notification.create({
                                                        owner: req.body.user._id,
                                                        receiver: sub.owner,
                                                        object: sub.object,
                                                        kind: sub.kind,
                                                        action: 0
                                                    }, function (err, newNoti) {
                                                        if (!err && newNoti) {
                                                            Push.sendPush(newNoti);
                                                        }
                                                    });
                                                }
                                            });
                                        }
                                    }
                                    return res.json(200, {code: 200, message: 'Like success', data: newLike});
                                }
                            });
                        }
                    });
                });
            } else {
                return res.json(200, {code: 200, message: 'Like success', data: like});
            }
        });
    });
}

exports.list = function (req, res) {
    var eventId = req.body.event._id;
    var limit = req.body.limit;
    var offset = req.body.offset;
    LikePost.find({event: eventId})
        .skip(offset)
        .limit(limit)
        .sort({"_id": -1})
        .populate('user')
        .exec(function (err, likes) {
            if (err) {
                return res.json(500, err);
            }
            return res.json(200, {code: 200, message: 'Successful', data: likes});
        });
}

exports.delete = function (req, res) {
    var likeId = req.body._id;
    LikePost.findById(likeId, function (err, like) {
        if (err) {
            return res.json(500, err);
        }
        if (!like) {
            return res.json(200, {code: 404, message:'Like not found'});
        } else {
            var eventId = like.event;
            like.remove(function (err) {
                if (err) {
                    return res.json(500, err);
                }
                EventPost.findById(eventId, function (err, event) {
                    if (err) {
                        return res.json(500, err);
                    }
                    if (!event) {
                        return res.json(200, {code: 404, message: 'Event not found'});
                    }
                    event.numberOfLike = event.numberOfLike - 1;
                    event.save(function (err, updatedPhoto) {
                        if (err) {
                            return res.json(500, err);
                        }
                        if (updatedPhoto) {
                            return res.json(200, {code: 200, message: 'Delete like success'});
                        }
                    });
                });
            });
        }
    });
}