'use strict';

var _ = require('lodash');
var User = require('./../user/user.model');
var LikeCover = require('./../like_cover/like_cover.model');
var Cover = require('./../cover/cover.model');
var clients = require('./../../config/clients');
var Notification = require('./../notification/notification.model');
var Subscription = require('./../subscription/subscription.model');
var Push = require('./../../config/push')(null);

exports.create = function (req, res) {
    if (!req.body.user || !req.body.user._id || !req.body.cover || !req.body.cover._id) {
        return res.json(200, {code: 401, message: 'Params error'});
    }
    var dataLike = {
        user: req.body.user._id,
        cover: req.body.cover._id
    }
    User.findById(req.body.user._id, function (err, user) {
        if (err) {
            return res.json(500, err);
        }
        if (!user) {
            return res.json(200, {code: 404, message: 'User not found'});
        }
        LikeCover.findOne(dataLike, function (err, like) {
            if (err) {
                return res.json(500, err);
            }
            if (!like) {
                Cover.findById(req.body.cover._id, function (err, cover) {
                    if (err) {
                        return res.json(500, err);
                    }
                    if (!cover) {
                        return res.json(200, {code: 404, message: 'Cover not found'});
                    }
                    var like = new LikeCover(dataLike);
                    if (!like) {
                        return res.json(200, {code: 401, message: 'Params error'});
                    }
                    like.save(function (err, newLike) {
                        if (err) {
                            return res.json(500, err);
                        }
                        if (newLike) {
                            cover.numberOfLike = cover.numberOfLike + 1;
                            cover.save(function (err, updatedCover) {
                                if (err) {
                                    return res.json(500, err);
                                }
                                if (updatedCover) {
                                    if (updatedCover.user.toString() != req.body.user._id.toString()) {
                                        Subscription.findOne({
                                            object: updatedCover._id,
                                            owner: updatedCover.user
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
    var coverId = req.body.cover._id;
    var limit = req.body.limit;
    var offset = req.body.offset;
    LikeCover.find({cover: coverId})
        .skip(offset)
        .limit(limit)
        .sort({"_id": -1})
        .populate('user')
        .exec(function (err, likes) {
            if (err) {
                return res.json(500, err);
            }
            var users = [];
            for (let i = 0; i < likes.length; i++) {
                users.push(likes[i].user);
            }
            return res.json(200, {code: 200, message: 'Successful', data: users});
        });
}

exports.delete = function (req, res) {
    var likeId = req.body._id;
    LikeCover.findById(likeId, function (err, like) {
        if (err) {
            return res.json(500, err);
        }
        if (!like) {
            return res.json(200, {code: 404, message: 'Like not found'});
        } else {
            var coverId = like.cover;
            like.remove(function (err) {
                if (err) {
                    return res.json(500, err);
                }
                Cover.findById(coverId, function (err, cover) {
                    if (err) {
                        return res.json(500, err);
                    }
                    if (!cover) {
                        return res.json(200, {code: 404, message: 'Cover not found'});
                    }
                    cover.numberOfLike = cover.numberOfLike - 1;
                    cover.save(function (err, updatedCover) {
                        if (err) {
                            return res.json(500, err);
                        }
                        if (updatedCover) {
                            return res.json(200, {code: 200, message: 'Delete like success'});
                        }
                    });
                });
            });
        }
    });
}