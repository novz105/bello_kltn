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
var Photo = require('./photo.model');
var Notification = require('../notification/notification.model');
var clients = require('./../../config/clients');
var LikePhoto = require('../like_photo/like_photo.model');
var Event = require('../event/event.model');
var Album = require('../album/album.model');
var CommentPhoto = require('../comment_photo/comment_photo.model');

exports.info = function (req, res) {
    var photoId = req.body.photo._id;
    Photo.findById(photoId)
        .lean()
        .populate('user')
        .exec(function (err, photo) {
            if (err) {
                return res.json(500, err);
            }
            if (!photo) {
                return res.json(200, {code: 404, message: 'Photo not found'});
            } else {
                if (photo.numberOfLike > 0) {
                    LikePhoto.findOne({
                        photo: photo._id,
                        user: req.body.user._id
                    }, function (err, like) {
                        if (!err) {
                            if (like) {
                                photo.like = {liked: true, data: like};
                            } else {
                                photo.like = {liked: false};
                            }
                        }
                        let data = {
                            code: 200,
                            message: 'Successful',
                            data: photo
                        }
                        return res.json(200, data);
                    });
                } else {
                    photo.like = {liked: false};
                    let data = {
                        code: 200,
                        message: 'Successful',
                        data: photo
                    }
                    return res.json(200, data);
                }
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
                    Photo.find({album: album._id})
                        .skip(offset)
                        .limit(limit)
                        .sort({"_id":-1})
                        .exec(function (err, photos) {
                            if (err) {
                                return res.json(500, err);
                            } else {
                                if (photos && photos.length > 0) {
                                    return res.json(200, {code: 200, message: 'Successful', data:photos});
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
    Photo.findById(photoId)
        .exec(function (err, photo) {
            if (err) {
                return res.json(500, err);
            }
            if (!photo) {
                return res.json(200, {code: 404, message: 'Photo not found'});
            } else {
                photo.caption = req.body.caption;
                photo.save(function (err, updatedPhoto) {
                    if (err) {
                        return res.json(500, err);
                    }
                    if (updatedPhoto) {
                        return res.json(200, {code: 200, message: 'Successful'});
                    }
                });
            }
        });
}

exports.delete = function (req, res) {
    var photoId = req.body._id;
    Photo.findById(photoId)
        .exec(function (err, photo) {
            if (err) {
                return res.json(500, err);
            }
            if (!photo) {
                return res.json(200, {code: 404, message: 'Photo not found'});
            } else {
                Event.findById(photo.event)
                    .exec(function (err, event) {
                        if (err) {
                            return res.json(500, err);
                        }
                        if (!event) {
                            return res.json(200, {code: 404, message: 'Event not found'});
                        } else {
                            if (event.kind == 'EPost') {
                                event.numberOfPhoto = event.numberOfPhoto - 1;
                                event.save(function(err) {
                                    if (err) {
                                        return res.json(500, err);
                                    }
                                    photo.remove(function (err) {
                                        if (err) {
                                            return res.json(500, err);
                                        }
                                        return res.json(200, {code: 200, message: 'Delete photo successful'});
                                    });
                                });
                            } else if (event.kind == 'EAlbum') {
                                event.numberOfPhoto = event.numberOfPhoto - 1;
                                event.save(function (err, updatedEvent) {
                                    if (err) {
                                        return res.json(500, err);
                                    }
                                    if (updatedEvent.numberOfPhoto == 0) {
                                        updatedEvent.remove();
                                    }
                                    Album.findById(photo.album, function (err, album) {
                                        if (!err && album) {
                                            album.numberOfPhoto = album.numberOfPhoto - 1;
                                            album.save();
                                        }
                                    });
                                    photo.remove(function (err) {
                                        if (err) {
                                            return res.json(500, err);
                                        }
                                        return res.json(200, {code: 200, message: 'Delete photo successful'});
                                    });
                                });
                            } else {
                                return res.json(500);
                            }
                        }
                    });
            }
        });
}