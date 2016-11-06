'use strict';

var _ = require('lodash');
var User = require('./../user/user.model');
var Notification = require('./../notification/notification.model');
var Subscription = require('./../subscription/subscription.model');
var CommentPost = require('./../comment_post/comment_post.model');
var EventPost = require('./../event_post/event_post.model');
var Friend = require('./../friend/friend.model');
var clients = require('./../../config/clients');
var Push = require('./../../config/push')(null);

exports.list = function (req, res) {
    var eventId = req.body.event._id;
    var limit = req.body.limit;
    var offset = req.body.offset;
    EventPost.findById(eventId)
        .exec(function (err, event) {
            if (err) {
                return res.json(500, err);
            }
            if (!event) {
                return res.json(200, {code: 404, message: 'Post not found'});
            }
            if (event.numberOfComment == 0) {
                return res.json(200, {code: 200, message: 'Successful', data: []});
            } else {
                CommentPost.find({event: event._id})
                    .skip(offset)
                    .limit(limit)
                    .sort({"_id": -1})
                    .populate('user')
                    .exec(function (err, comments) {
                        if (err) {
                            return res.json(500, err);
                        }
                        return res.json(200, {code: 200, message: 'Successful', data: comments});
                    });
            }
        });
}

exports.create = function (req, res) {
    if (!req.body.user || !req.body.user._id || !req.body.event || !req.body.event._id || !req.body.content) {
        return res.json(200, {code: 401, message: 'Params error'});
    }
    var dataComment = {
        user: req.body.user._id,
        event: req.body.event._id,
        content: req.body.content
    }
    User.findById(req.body.user._id, function (err, user) {
        if (err) {
            return res.json(500, err);
        }
        if (!user) {
            return res.json(200, {code: 404, message: 'User not found'});
        }
        EventPost.findById(req.body.event._id, function (err, event) {
            if (err) {
                return res.json(500, err);
            }
            if (!event) {
                return res.json(200, {code: 404, message: 'Post not found'});
            }
            let comment = new CommentPost(dataComment);
            if (!comment) {
                return res.json(200, {code: 401, message: 'Params error'});
            }
            comment.save(function (err, newComment) {
                if (err) {
                    return res.json(500, err);
                }
                if (newComment) {
                    event.numberOfComment = event.numberOfComment + 1;
                    event.save(function (err, updatedEvent) {
                        if (err) {
                            return res.json(500, err);
                        }
                        if (updatedEvent) {
                            Friend.find({
                                $and: [
                                    {$or: [{userA: req.body.user._id}, {userB: req.body.user._id}]},
                                    {areFriend: true}
                                ]
                            }).exec(function (err, friends) {
                                if (!err) {
                                    let receivers = {};
                                    if (friends) {
                                        for (let i = 0; i < friends.length; i++) {
                                            let friend = friends[i];
                                            let friendId = friend.userA.toString() == user._id.toString() ? friend.userB : friend.userA;
                                            receivers[friendId.toString()] = true;
                                        }
                                    }
                                    receivers[updatedEvent.user.toString()] = true;
                                    receivers[updatedEvent.timeline.toString()] = true;
                                    for (let userId in receivers) {
                                        if (userId != user._id.toString()) {
                                            Subscription.findOne({
                                                object: updatedEvent._id,
                                                owner: userId
                                            }, function (err, sub) {
                                                if (!err && sub) {
                                                    Notification.create({
                                                        owner: user._id,
                                                        receiver: sub.owner,
                                                        object: sub.object,
                                                        kind: sub.kind,
                                                        action: 1
                                                    }, function (err, newNoti) {
                                                        if (!err && newNoti) {
                                                            Push.sendPush(newNoti);
                                                        }
                                                    });
                                                }
                                            });
                                        }
                                    }
                                }
                            });

                            Subscription.findOne({
                                object: updatedEvent._id,
                                owner: req.body.user._id
                            }, function (err, sub) {
                                if (!err && !sub) {
                                    let dataSub = {
                                        object: updatedEvent._id,
                                        owner: req.body.user._id,
                                        kind: 5
                                    }
                                    Subscription.create(dataSub);
                                }
                            });
                            return res.json(200, {code: 200, message: 'Comment success', data: newComment});
                        }
                    });

                }
            });
        });
    });
}

exports.update = function (req, res) {
    var commentId = req.body._id;
    CommentPost.findById(commentId, function (err, comment) {
        if (err) {
            return res.json(500, err);
        }
        if (!comment) {
            return res.json(200, {code: 404, message: 'Comment not found'});
        } else {
            comment.content = req.body.content;
            comment.save(function (err, updatedComment) {
                if (err) {
                    return res.json(500, err);
                }
                if (updatedComment) {
                    return res.json(200, {code: 200, message: 'Successful'});
                }
            });
        }
    });
}

exports.delete = function (req, res) {
    var commentId = req.body._id;
    CommentPost.findById(commentId, function (err, comment) {
        if (err) {
            return res.json(500, err);
        }
        if (!comment) {
            return res.json(200, {code: 404, message: 'Comment not found'});
        } else {
            var eventId = comment.event;
            comment.remove(function (err) {
                if (err) {
                    return res.json(500, err);
                }
                EventPost.findById(eventId, function (err, event) {
                    if (err) {
                        return res.json(500, err);
                    }
                    if (!event) {
                        return res.json(200, {code: 404, message: 'Post not found'});
                    }
                    event.numberOfComment = event.numberOfComment - 1;
                    event.save(function (err, updatedevent) {
                        if (err) {
                            return res.json(500, err);
                        }
                        if (updatedevent) {
                            return res.json(200, {code: 200, message: 'Delete comment success'});
                        }
                    });
                });

            });
        }
    });
}