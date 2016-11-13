'use strict';

var _ = require('lodash');
var User = require('./../user/user.model');
var LikePhoto = require('./../like_photo/like_photo.model');
var Photo = require('./../photo/photo.model');
var clients = require('./../../config/clients');
var Notification = require('./../notification/notification.model');
var Subscription = require('./../subscription/subscription.model');
var Push = require('./../../config/push')(null);

exports.create = function (req, res) {
    if (!req.body.user || !req.body.user._id || !req.body.photo || !req.body.photo._id) {
        return res.json(200, {code: 401, message: 'Params error'});
    }
    var dataLike = {
        user: req.body.user._id,
        photo: req.body.photo._id
    }
    User.findById(req.body.user._id, function (err, user) {
        if (err) {
            return res.json(500, err);
        }
        if (!user) {
            return res.json(200, {code: 404, message: 'User not found'});
        }
        LikePhoto.findOne(dataLike, function (err, like) {
            if (err) {
                return res.json(500, err);
            }
            if (!like) {
                Photo.findById(req.body.photo._id, function (err, photo) {
                    if (err) {
                        return res.json(500, err);
                    }
                    if (!photo) {
                        return res.json(200, {code: 404, message: 'Photo not found'});
                    }
                    var like = new LikePhoto(dataLike);
                    if (!like) {
                        return res.json(200, {code: 401, message: 'Params error'});
                    }
                    like.save(function (err, newLike) {
                        if (err) {
                            return res.json(500, err);
                        }
                        if (newLike) {
                            photo.numberOfLike = photo.numberOfLike + 1;
                            photo.save(function (err, updatedPhoto) {
                                if (err) {
                                    return res.json(500, err);
                                }
                                if (updatedPhoto) {
                                    if (updatedPhoto.user.toString() != req.body.user._id.toString()) {
                                        Subscription.findOne({
                                            object: updatedPhoto._id,
                                            owner: updatedPhoto.user
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
    var photoId = req.body.photo._id;
    var limit = req.body.limit;
    var offset = req.body.offset;
    LikePhoto.find({photo: photoId})
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
    LikePhoto.findById(likeId, function (err, like) {
        if (err) {
            return res.json(500, err);
        }
        if (!like) {
            return res.json(200, {code: 404, message: 'Like not found'});
        } else {
            var photoId = like.photo;
            like.remove(function (err) {
                if (err) {
                    return res.json(500, err);
                }
                Photo.findById(photoId, function (err, photo) {
                    if (err) {
                        return res.json(500, err);
                    }
                    if (!photo) {
                        return res.json(200, {code: 404, message: 'Photo not found'});
                    }
                    photo.numberOfLike = photo.numberOfLike - 1;
                    photo.save(function (err, updatedPhoto) {
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