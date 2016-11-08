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
var Album = require('./album.model');
var Notification = require('../notification/notification.model');
var User = require('../user/user.model');
var clients = require('./../../config/clients');
var LikeAlbum = require('../like_album/like_album.model');
var Photo = require('../photo/photo.model');
var Avatar = require('../avatar/avatar.model');
var Cover = require('../cover/cover.model');
var Subscription = require('../subscription/subscription.model');
var EventAlbum = require('../event_album/event_album.model');

exports.create = function (req, res) {
    User.findById(req.body.user._id, function (err, user) {
        if (err) {
            return res.json(500, err);
        }
        if (!user) {
            return res.json(200, {code: 404, message: 'User not found'});
        }
        var dataEvent = {
            user: req.body.user._id,
            content: req.body.content,
            name: req.body.name
        }
        let album = new Album(dataEvent);
        if (!album) {
            return res.json(200, {code: 401, message: 'Params error'});
        }

        album.save(function (err, newAlbum) {
            if (err) {
                return res.json(500, err);
            }
            Subscription.create({object:newAlbum._id, owner:user._id, kind:4});
            return res.json(200, {code: 200, message: 'Album created', data:newAlbum});
        });

    });
}

exports.list = function (req, res) {
    var offset = req.body.offset;
    var limit = req.body.limit;
    Album.find({user: req.body.user._id})
        .lean()
        .skip(offset)
        .limit(limit)
        .exec(function (err, albums) {
            if (err) {
                return res.json(500, err);
            }

            if (albums && albums.length) {
                let numberOfThumbnail = 0;
                for (let i = 0; i < albums.length; i++) {
                    if (albums[i].numberOfPhoto > 0) {
                        if (albums[i].kind < 2) {
                            Photo.findOne({album: albums[i]._id})
                                .lean()
                                .exec(function (err, photo) {
                                    numberOfThumbnail++;
                                    if (!err && photo) {
                                        albums[i].thumbnail = photo;
                                    }
                                    if (numberOfThumbnail == albums.length) {
                                        let data = {
                                            code: 200,
                                            message: 'Successful',
                                            data: albums

                                        }
                                        return res.json(200, data);
                                    }
                                });
                        } else if (albums[i].kind == 2) {
                            Avatar.findOne({album: albums[i]._id})
                                .lean()
                                .exec(function (err, photo) {
                                    numberOfThumbnail++;
                                    if (!err && photo) {
                                        albums[i].thumbnail = photo;
                                    }
                                    if (numberOfThumbnail == albums.length) {
                                        let data = {
                                            code: 200,
                                            message: 'Successful',
                                            data: albums

                                        }
                                        return res.json(200, data);
                                    }
                                });
                        } else if (albums[i].kind == 3) {
                            Cover.findOne({album: albums[i]._id})
                                .lean()
                                .exec(function (err, photo) {
                                    numberOfThumbnail++;
                                    if (!err && photo) {
                                        albums[i].thumbnail = photo;
                                    }
                                    if (numberOfThumbnail == albums.length) {
                                        let data = {
                                            code: 200,
                                            message: 'Successful',
                                            data: albums
                                        }
                                        return res.json(200, data);
                                    }
                                });
                        }
                    } else {
                        numberOfThumbnail++;
                        if (numberOfThumbnail == albums.length) {
                            let data = {
                                code: 200,
                                message: 'Successful',
                                data: albums
                            }
                            return res.json(200, data);
                        }
                    }
                }
            } else {
                let data = {
                    code: 200,
                    message: 'Successful',
                    data: []
                }
                return res.json(200, data);
            }
        });
}

exports.info = function (req, res) {
    var albumId = req.body.album._id;
    Album.findById(albumId)
        .lean()
        .populate('user')
        .exec(function (err, album) {
            if (err) {
                return res.json(500, err);
            }
            if (!album) {
                return res.json(200, {code: 404, message: 'Album not found'});
            } else {
                var completion1 = function(album) {
                    if (album.numberOfLike > 0) {
                        LikeAlbum.findOne({
                            album: album._id,
                            user: req.body.user._id
                        }, function (err, like) {
                            if (!err) {
                                if (like) {
                                    album.like = {liked: true, data: like};
                                } else {
                                    album.like = {liked: false};
                                }
                                completion2(album);
                            }
                        });
                    } else {
                        album.like = {liked: false};
                        completion2(album);
                    }
                }

                //var completion2 = function(album) {
                //    if (album.numberOfPhoto > 0) {
                //        Photo.find({album: album._id})
                //            .lean()
                //            .limit(album.numberOfPhoto)
                //            .exec(function (err, photos) {
                //                if (err) {
                //                    return res.json(500, err);
                //                }
                //                album.photos = photos;
                //                completion3(album);
                //            });
                //    } else {
                //        album.photos = [];
                //        completion3(album);
                //    }
                //}
                var completion2 = function(album) {
                    Subscription.findOne({object:album._id, owner:req.body.user._id}, function(err, sub){
                        if (!err && sub) {
                            album.sub = sub;
                        }
                        completion3(album);
                    })
                }
                var completion3 = function(album) {
                    let data = {
                        code: 200,
                        message: 'Successful',
                        data: album
                    }
                    return res.json(200, data);
                }

                completion1(album);
            }
        });
}

exports.update = function (req, res) {
    var albumId = req.body._id;
    Album.findById(albumId)
        .exec(function (err, album) {
            if (err) {
                return res.json(500, err);
            }
            if (!album) {
                return res.json(200, {code: 404, message: 'Album not found'});
            } else {
                album.content = req.body.content;
                album.name = req.body.name;
                album.save(function (err, updatedAlbum) {
                    if (err) {
                        return res.json(500, err);
                    }
                    if (updatedAlbum) {
                        return res.json(200, {code: 200, message: 'Successful'});
                    }
                });
            }
        });
}

exports.delete = function (req, res) {
    var albumId = req.body._id;
    Album.findById(albumId)
        .exec(function (err, album) {
            if (err) {
                return res.json(500, err);
            }
            if (!album) {
                return res.json(200, {code: 404, message: 'Album not found'});
            } else {
                album.remove(function (err) {
                    if (err) {
                        return res.json(500, err);
                    }
                    return res.json(200, {code: 200, message: 'Delete album successful'});
                });
            }
        });
}