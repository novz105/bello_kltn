'use strict';

var _ = require('lodash');
var User = require('./../user/user.model');
var Notification = require('./../notification/notification.model');
var Subscription = require('./../subscription/subscription.model');
var CommentAvatar = require('./../comment_avatar/comment_avatar.model');
var Avatar = require('./../avatar/avatar.model');
var Friend = require('./../friend/friend.model');
var clients = require('./../../config/clients');
var Push = require('./../../config/push')(null);

exports.list = function (req, res) {
    var avatarId = req.body.avatar._id;
    var limit = req.body.limit;
    var offset = req.body.offset;
    Avatar.findById(avatarId)
        .exec(function (err, avatar) {
            if (err) {
                return res.json(500, err);
            }
            if (!avatar) {
                return res.json(200, {code: 404, message: 'Avatar not found'});
            }
            if (avatar.numberOfComment == 0) {
                return res.json(200, {code: 200, message: 'Successful', data: []});
            } else {
                CommentAvatar.find({avatar: avatarId})
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
    if (!req.body.user || !req.body.user._id || !req.body.avatar || !req.body.avatar._id || !req.body.content) {
        return res.json(200, {code: 401, message: 'Params error'});
    }
    var dataComment = {
        user: req.body.user._id,
        avatar: req.body.avatar._id,
        content: req.body.content
    }
    User.findById(req.body.user._id, function (err, user) {
        if (err) {
            return res.json(500, err);
        }
        if (!user) {
            return res.json(200, {code: 404, message: 'User not found'});
        }
        Avatar.findById(req.body.avatar._id, function (err, avatar) {
            if (err) {
                return res.json(500, err);
            }
            if (!avatar) {
                return res.json(200, {code: 404, message: 'Avatar not found'});
            }
            let comment = new CommentAvatar(dataComment);
            if (!comment) {
                return res.json(200, {code: 401, message: 'Params error'});
            }
            comment.save(function (err, newComment) {
                if (err) {
                    return res.json(500, err);
                }
                if (newComment) {
                    avatar.numberOfComment = avatar.numberOfComment + 1;
                    avatar.save(function (err, updatedAvatar) {
                        if (err) {
                            return res.json(500, err);
                        }
                        if (updatedAvatar) {
                            Friend.find({
                                $and: [
                                    {$or: [{userA: user._id}, {userB: user._id}]},
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
                                    receivers[updatedAvatar.user.toString()] = true;
                                    for (let userId in receivers) {
                                        if (userId != user._id.toString()) {
                                            Subscription.findOne({
                                                object: updatedAvatar._id,
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
                                object: updatedAvatar._id,
                                owner: req.body.user._id
                            }, function (err, sub) {
                                if (!err && !sub) {
                                    let dataSub = {
                                        object: updatedAvatar._id,
                                        owner: req.body.user._id,
                                        kind: 7
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
    CommentAvatar.findById(commentId, function (err, comment) {
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
    CommentAvatar.findById(commentId, function (err, comment) {
        if (err) {
            return res.json(500, err);
        }
        if (!comment) {
            return res.json(200, {code: 404, message: 'Comment not found'});
        } else {
            var avatarId = comment.avatar;
            comment.remove(function (err) {
                if (err) {
                    return res.json(500, err);
                }
                Avatar.findById(avatarId, function (err, avatar) {
                    if (err) {
                        return res.json(500, err);
                    }
                    if (!avatar) {
                        return res.json(200, {code: 404, message: 'Avatar not found'});
                    }
                    avatar.numberOfComment = avatar.numberOfComment - 1;
                    avatar.save(function (err, updatedPost) {
                        if (err) {
                            return res.json(500, err);
                        }
                        if (updatedPost) {
                            return res.json(200, {code: 200, message: 'Delete comment success'});
                        }
                    });
                });
            });
        }
    });
}