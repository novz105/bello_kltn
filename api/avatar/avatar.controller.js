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
var Avatar = require('./avatar.model');
var User = require('../user/user.model');
var Subscription = require('../subscription/subscription.model');
var Album = require('../album/album.model');
var Notification = require('../notification/notification.model');
var clients = require('./../../config/clients');
var LikeAvatar = require('../like_avatar/like_avatar.model');
var EventAvatar = require('../event_avatar/event_avatar.model');

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
            let event = new EventAvatar(dataEvent);
            if (!event) {
                return res.json(200, {code: 401, message: 'Params error'});
            }
            let avatar = new Avatar(req.body);
            if (!avatar) {
                return res.json(200, {code: 401, message: 'Params error'});
            }
            event.avatar = avatar;
            avatar.event = event;
            avatar.album = album._id;
            event.save(function (err, newEvent) {
                if (err) {
                    return res.json(500, err);
                }
                avatar.save(function (err, newAvatar) {
                    if (err) {
                        newEvent.remove();
                        return res.json(500, err);
                    }
                    user.avatar = {
                        avatar: newAvatar,
                        url: newAvatar.url
                    }
                    user.save(function (err) {
                        if (err) {
                            newEvent.remove();
                            newAvatar.remove();
                            return res.json(500, err);
                        }
                        album.numberOfPhoto = album.numberOfPhoto + 1;
                        album.save(function(err){
                            if (err) {
                                user.avatar = undefined;
                                user.save();
                                newEvent.remove();
                                newAvatar.remove();
                                return res.json(500, err);
                            }
                            Subscription.create({object:newAvatar._id, owner:user._id, kind:2});
                            return res.json(200, {code: 200, message: 'Successful'});
                        });
                    });
                });
            });
        };
        Album.findOne({user:user._id, kind:2}, function(err, album) {
            if (err) {
                return res.json(500, err);
            }
            if (album) {
                createEvent(album);
            } else {
                let avatarAlbum = new Album({user: user._id, kind: 2});
                avatarAlbum.save(function (err, newAlbum) {
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
    var photoId = req.body.avatar._id;
    Avatar.findById(photoId)
        .lean()
        .populate('user')
        .exec(function (err, avatar) {
            if (err) {
                return res.json(500, err);
            }
            if (!avatar) {
                return res.json(200, {code: 404, message: 'Avatar not found'});
            } else {
                if (avatar.numberOfLike > 0) {
                    LikeAvatar.findOne({
                        avatar: avatar._id,
                        user: req.body.user._id
                    }, function (err, like) {
                        if (!err) {
                            if (like) {
                                avatar.like = {liked: true, data: like};
                            } else {
                                avatar.like = {liked: false};
                            }
                        }
                        let data = {
                            code: 200,
                            message: 'Successful',
                            data: avatar
                        }
                        return res.json(200, data);
                    });
                } else {
                    avatar.like = {liked: false};
                    let data = {
                        code: 200,
                        message: 'Successful',
                        data: avatar
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
        console.log(req.body);
        Album.findById(albumId)
            .exec(function (err, album) {
                if (err) {
                    return res.json(500, err);
                }
                if (!album) {
                    return res.json(200, {code: 404, message: 'Album not found'});
                } else {
                    Avatar.find({album: album._id})
                        .skip(offset)
                        .limit(limit)
                        .exec(function (err, avatars) {
                            if (err) {
                                return res.json(500, err);
                            } else {
                                if (avatars && avatars.length > 0) {
                                    return res.json(200, {code: 200, message: 'Successful', data:avatars});
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
    Avatar.findById(photoId)
        .exec(function (err, avatar) {
            if (err) {
                return res.json(500, err);
            }
            if (!avatar) {
                return res.json(200, {code: 404, message: 'Avatar not found'});
            } else {
                avatar.caption = req.body.caption;
                avatar.save(function (err, updatedAvatar) {
                    if (err) {
                        return res.json(500, err);
                    }
                    if (updatedAvatar) {
                        return res.json(200, {code: 200, message: 'Successful'});
                    }
                });
            }
        });
}

exports.delete = function (req, res) {
    var avatarId = req.body._id;
    Avatar.findById(avatarId)
        .exec(function (err, avatar) {
            if (err) {
                return res.json(500, err);
            }
            if (!avatar) {
                return res.json(200, {code: 404, message: 'Avatar not found'});
            } else {
                Album.findById(avatar.album, function(err, album){
                    if (err) {
                        return res.json(500, err);
                    }
                    if (album) {
                        EventAvatar.findById(avatar.event)
                            .exec(function (err, event) {
                                if (err) {
                                    return res.json(500, err);
                                }
                                if (event) {
                                    event.remove(function (err) {
                                        if (err) {
                                            return res.json(500, err);
                                        }
                                        avatar.remove(function (err) {
                                            if (err) {
                                                return res.json(500, err);
                                            }
                                            album.numberOfPhoto = album.numberOfPhoto - 1;
                                            album.save();
                                            return res.json(200, {code: 200, message: 'Delete avatar successful'});
                                        });
                                    });
                                } else {
                                    avatar.remove(function (err) {
                                        if (err) {
                                            return res.json(500, err);
                                        }
                                        album.numberOfPhoto = album.numberOfPhoto - 1;
                                        album.save();
                                        return res.json(200, {code: 200, message: 'Delete avatar successful'});
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