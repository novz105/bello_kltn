/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /Photos              ->  index
 * Photo    /Photos              ->  create
 * GET     /Photos/:id          ->  show
 * PUT     /Photos/:id          ->  update
 * DELETE  /Photos/:id          ->  destroy
 */

'use strict';

var _ = require('lodash');
var Cover = require('./cover.model');
var User = require('../user/user.model');
var Subscription = require('../subscription/subscription.model');
var Album = require('../album/album.model');
var Notification = require('../notification/notification.model');
var clients = require('./../../config/clients');
var LikeCover = require('../like_cover/like_cover.model');
var EventCover = require('../event_cover/event_cover.model');

exports.create = function (req, res) {
    User.findById(req.body.user, function (err, user) {
        if (err) {
            return res.json(500, err);
        }
        if (!user) {
            return res.json(200, {code: 404, message: 'User not found'});
        }
        var dataEvent = {
            user: req.body.user._id,
            timeline: req.body.user._id
        }
        var createEvent = function(album) {
            let event = new EventCover(dataEvent);
            if (!event) {
                return res.json(200, {code: 401, message: 'Params error'});
            }
            let cover = new Cover(req.body);
            if (!cover) {
                return res.json(200, {code: 401, message: 'Params error'});
            }
            event.cover = cover;
            cover.event = event;
            cover.album = album._id;
            event.save(function (err, newEvent) {
                if (err) {
                    return res.json(500, err);
                }
                cover.save(function (err, newCover) {
                    if (err) {
                        newEvent.remove();
                        return res.json(500, err);
                    }
                    user.cover = {
                        cover: newCover,
                        url: newCover.url
                    }
                    user.save(function (err) {
                        if (err) {
                            newEvent.remove();
                            newCover.remove();
                            return res.json(500, err);
                        }
                        album.numberOfPhoto = album.numberOfPhoto + 1;
                        album.save(function(err){
                            if (err) {
                                user.cover = undefined;
                                user.save();
                                newEvent.remove();
                                newCover.remove();
                                return res.json(500, err);
                            }
                            Subscription.create({object:newCover._id, owner:user._id, kind:3});
                            return res.json(200, {code: 200, message: 'Successful'});
                        });
                    });
                });
            });
        };
        Album.findOne({user:user._id, kind:3}, function(err, album) {
            if (err) {
                return res.json(500, err);
            }
            if (album) {
                createEvent(album);
            } else {
                let coverAlbum = new Album({user: user._id, kind: 3});
                coverAlbum.save(function (err, newAlbum) {
                    if (err) {
                        return res.json(500, err);
                    }
                    createEvent(newAlbum);
                });
            }
        });
    });
}

exports.info = function (req, res) {
    var photoId = req.body.cover._id;
    Cover.findById(photoId)
        .lean()
        .populate('user')
        .exec(function (err, cover) {
            if (err) {
                return res.json(500, err);
            }
            if (!cover) {
                return res.json(200, {code: 404, message: 'Cover not found'});
            } else {

                let likeCompletion = function(cover) {
                    if (cover.numberOfLike > 0) {
                        LikeCover.findOne({
                            cover: cover._id,
                            user: req.body.user._id
                        }, function (err, like) {
                            if (!err) {
                                if (like) {
                                    cover.like = {liked: true, data: like};
                                } else {
                                    cover.like = {liked: false};
                                }
                            }
                            let data = {
                                code: 200,
                                message: 'Successful',
                                data: cover
                            }
                            return res.json(200, data);
                        });
                    } else {
                        cover.like = {liked: false};
                        let data = {
                            code: 200,
                            message: 'Successful',
                            data: cover
                        }
                        return res.json(200, data);
                    }
                }
                Subscription.findOne({object:cover._id, owner:req.body.user._id}, function(err, sub){
                    if (err) {
                        return res.json(500, err);
                    }
                    if (sub) {
                        cover.sub = sub;
                    }
                    likeCompletion(cover);
                });
            }
        });
}

exports.list = function (req, res) {
    var albumId = req.body.album._id;
    var limit = req.body.limit;
    var offset = req.body.offset;
    if (albumId != undefined && limit != undefined && offset != undefined) {
        Album.findById(albumId)
            .exec(function (err, album) {
                if (err) {
                    return res.json(500, err);
                }
                if (!album) {
                    return res.json(200, {code: 404, message: 'Album not found'});
                } else {
                    Cover.find({album: album._id})
                        .skip(offset)
                        .limit(limit)
                        .exec(function (err, covers) {
                            if (err) {
                                return res.json(500, err);
                            } else {
                                if (covers && covers.length > 0) {
                                    return res.json(200, {code: 200, message: 'Successful', data:covers});
                                } else {
                                    return res.json(200, {code: 200, message: 'Successful', data:[]});
                                }
                            }
                        });
                }
            });
    } else {
        return res.json(200, {code: 401, message: 'Params error'});
    }
}

exports.update = function (req, res) {
    var photoId = req.body._id;
    Cover.findById(photoId)
        .exec(function (err, cover) {
            if (err) {
                return res.json(500, err);
            }
            if (!cover) {
                return res.json(200, {code: 404, message: 'Cover not found'});
            } else {
                cover.caption = req.body.caption;
                cover.save(function (err, updatedCover) {
                    if (err) {
                        return res.json(500, err);
                    }
                    if (updatedCover) {
                        return res.json(200, {code: 200, message: 'Successful'});
                    }
                });
            }
        });
}

exports.delete = function (req, res) {
    var coverId = req.body._id;
    Cover.findById(coverId)
        .exec(function (err, cover) {
            if (err) {
                return res.json(500, err);
            }
            if (!cover) {
                return res.json(200, {code: 404, message: 'Cover not found'});
            } else {
                Album.findById(cover.album, function(err, album){
                    if (err) {
                        return res.json(500, err);
                    }
                    if (album) {
                        EventCover.findById(cover.event)
                            .exec(function (err, event) {
                                if (err) {
                                    return res.json(500, err);
                                }
                                if (event) {
                                    event.remove(function (err) {
                                        if (err) {
                                            return res.json(500, err);
                                        }
                                        cover.remove(function (err) {
                                            if (err) {
                                                return res.json(500, err);
                                            }
                                            album.numberOfPhoto = album.numberOfPhoto - 1;
                                            album.save();
                                            return res.json(200, {code: 200, message: 'Delete cover successful'});
                                        });
                                    });
                                } else {
                                    cover.remove(function (err) {
                                        if (err) {
                                            return res.json(500, err);
                                        }
                                        album.numberOfPhoto = album.numberOfPhoto - 1;
                                        album.save();
                                        return res.json(200, {code: 200, message: 'Delete cover successful'});
                                    });
                                }
                            });
                    } else {
                        return res.json(200, {code: 404, message: 'Album not found'});
                    }
                });
            }
        });
}