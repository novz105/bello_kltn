'use strict';

var _ = require('lodash');
var User = require('./../user/user.model');
var LikeAlbum = require('./../like_album/like_album.model');
var Album = require('./../album/album.model');
var clients = require('./../../config/clients');
var Notification = require('./../notification/notification.model');
var Subscription = require('./../subscription/subscription.model');
var Push = require('./../../config/push')(null);

exports.create = function (req, res) {
    if (!req.body.user || !req.body.user._id || !req.body.album || !req.body.album._id) {
        return res.json(200, {code: 401, message: 'Params error'});
    }
    var dataLike = {
        user: req.body.user._id,
        album: req.body.album._id
    }
    User.findById(req.body.user._id, function (err, user) {
        if (err) {
            return res.json(500, err);
        }
        if (!user) {
            return res.json(200, {code: 404, message: 'User not found'});
        }
        LikeAlbum.findOne(dataLike, function (err, like) {
            if (err) {
                return res.json(500, err);
            }
            if (!like) {
                Album.findById(req.body.album._id, function (err, album) {
                    if (err) {
                        return res.json(500, err);
                    }
                    if (!album) {
                        return res.json(200, {code: 404, message: 'Album not found'});
                    }
                    var like = new LikeAlbum(dataLike);
                    if (!like) {
                        return res.json(200, {code: 401, message: 'Params error'});
                    }
                    like.save(function (err, newLike) {
                        if (err) {
                            return res.json(500, err);
                        }
                        if (newLike) {
                            album.numberOfLike = album.numberOfLike + 1;
                            album.save(function (err, updatedAlbum) {
                                if (err) {
                                    return res.json(500, err);
                                }
                                if (updatedAlbum) {
                                    if (updatedAlbum.user.toString() != req.body.user._id.toString()) {
                                        Subscription.findOne({
                                            object: updatedAlbum._id,
                                            owner: updatedAlbum.user
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
    var albumId = req.body.album._id;
    var limit = req.body.limit;
    var offset = req.body.offset;
    LikeAlbum.find({album: albumId})
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
    LikeAlbum.findById(likeId, function (err, like) {
        if (err) {
            return res.json(500, err);
        }
        if (!like) {
            return res.json(200, {code: 404, message: 'Like not found'});
        } else {
            var albumId = like.album;
            like.remove(function (err) {
                if (err) {
                    return res.json(500, err);
                }
                Album.findById(albumId, function (err, album) {
                    if (err) {
                        return res.json(500, err);
                    }
                    if (!album) {
                        return res.json(200, {code: 404, message: 'Album not found'});
                    }
                    album.numberOfLike = album.numberOfLike - 1;
                    album.save(function (err, updatedAlbum) {
                        if (err) {
                            return res.json(500, err);
                        }
                        if (updatedAlbum) {
                            return res.json(200, {code: 200, message: 'Delete like success'});
                        }
                    });
                });
            });
        }
    });
}