'use strict';

var _ = require('lodash');
var User = require('./../user/user.model');
var LikeAvatar = require('./../like_avatar/like_avatar.model');
var Avatar = require('./../avatar/avatar.model');
var clients = require('./../../config/clients');
var Notification = require('./../notification/notification.model');
var Subscription = require('./../subscription/subscription.model');
var Push = require('./../../config/push')(null);

exports.create = function (req, res) {
    if (!req.body.user || !req.body.user._id || !req.body.avatar || !req.body.avatar._id) {
        return res.json(200, {code: 401, message: 'Params error'});
    }
    var dataLike = {
        user: req.body.user._id,
        avatar: req.body.avatar._id
    }
    User.findById(req.body.user._id, function (err, user) {
        if (err) {
            return res.json(500, err);
        }
        if (!user) {
            return res.json(200, {code: 404, message: 'User not found'});
        }
        LikeAvatar.findOne(dataLike, function (err, like) {
            if (err) {
                return res.json(500, err);
            }
            if (!like) {
                Avatar.findById(req.body.avatar._id, function (err, avatar) {
                    if (err) {
                        return res.json(500, err);
                    }
                    if (!avatar) {
                        return res.json(200, {code: 404, message: 'Avatar not found'});
                    }
                    var like = new LikeAvatar(dataLike);
                    if (!like) {
                        return res.json(200, {code: 401, message: 'Params error'});
                    }
                    like.save(function (err, newLike) {
                        if (err) {
                            return res.json(500, err);
                        }
                        if (newLike) {
                            avatar.numberOfLike = avatar.numberOfLike + 1;
                            avatar.save(function (err, updatedAvatar) {
                                if (err) {
                                    return res.json(500, err);
                                }
                                if (updatedAvatar) {
                                    if (updatedAvatar.user.toString() != req.body.user._id.toString()) {
                                        Subscription.findOne({
                                            object: updatedAvatar._id,
                                            owner: updatedAvatar.user
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
    var avatarId = req.body.avatar._id;
    var limit = req.body.limit;
    var offset = req.body.offset;
    LikeAvatar.find({avatar: avatarId})
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
    LikeAvatar.findById(likeId, function (err, like) {
        if (err) {
            return res.json(500, err);
        }
        if (!like) {
            return res.json(200, {code: 404, message: 'Like not found'});
        } else {
            var avatarId = like.avatar;
            like.remove(function (err) {
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
                    avatar.numberOfLike = avatar.numberOfLike - 1;
                    avatar.save(function (err, updatedAvatar) {
                        if (err) {
                            return res.json(500, err);
                        }
                        if (updatedAvatar) {
                            return res.json(200, {code: 200, message: 'Delete like success'});
                        }
                    });
                });
            });
        }
    });
}