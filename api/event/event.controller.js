/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /Posts              ->  index
 * POST    /Posts              ->  create
 * GET     /Posts/:id          ->  show
 * PUT     /Posts/:id          ->  update
 * DELETE  /Posts/:id          ->  destroy
 */

'use strict';

var _ = require('lodash');
var Event = require('./event.model');
var Notification = require('../notification/notification.model');
var Photo = require('../photo/photo.model');
var Avatar = require('../avatar/avatar.model');
var Cover = require('../cover/cover.model');
var Album = require('../album/album.model');
var User = require('../user/user.model');
var Friend = require('../friend/friend.model');
var CommentPost = require('../comment_post/comment_post.model');
var CommentPhoto = require('../comment_photo/comment_photo.model');
var LikePost = require('../like_post/like_post.model');
var LikePhoto = require('../like_photo/like_photo.model');
var LikeAvatar = require('../like_avatar/like_avatar.model');
var LikeCover = require('../like_cover/like_cover.model');
var LikeAlbum = require('../like_album/like_album.model');
var clients = require('./../../config/clients');
var _ = require('lodash');

exports.timeline = function (req, res) {
    var offset = req.body.offset;
    var limit = req.body.limit;
    Event.find({timeline: req.body.timeline._id})
        .lean()
        .skip(offset)
        .limit(limit)
        .populate('user')
        .populate('timeline')
        .sort({"_id": -1})
        .exec(function (err, docs) {
            if (err) {
                return res.json(500, err);
            }
            if (docs && docs.length > 0) {
                var completion1 = function (events) {
                    let numberOfPopulated1 = 0;
                    for (let i = 0; i < events.length; i++) {
                        if (events[i].kind == 'EPost') {
                            if (events[i].numberOfLike > 0) {
                                LikePost.findOne({
                                    event: events[i]._id,
                                    user: req.body.user._id
                                }, function (err, like) {
                                    if (!err) {
                                        if (like) {
                                            events[i].like = {liked: true, data: like};
                                        } else {
                                            events[i].like = {liked: false};
                                        }
                                    }
                                    numberOfPopulated1++;
                                    if (numberOfPopulated1 == events.length) {
                                        completion2(events);
                                    }
                                });
                            } else {
                                numberOfPopulated1++;
                                if (numberOfPopulated1 == events.length) {
                                    completion2(events);
                                }
                            }

                        } else if (events[i].kind == 'EAvatar') {
                            Avatar.findById(events[i].avatar)
                                .lean()
                                .exec(function (err, avatar) {
                                    numberOfPopulated1++;
                                    if (!err && avatar) {
                                        events[i].avatar = avatar;
                                    }
                                    if (numberOfPopulated1 == events.length) {
                                        completion2(events);
                                    }
                                });
                        } else if (events[i].kind == 'ECover') {
                            Cover.findById(events[i].cover)
                                .lean()
                                .exec(function (err, cover) {
                                    numberOfPopulated1++;
                                    if (!err && cover) {
                                        events[i].cover = cover;
                                    }
                                    if (numberOfPopulated1 == events.length) {
                                        completion2(events);
                                    }
                                });
                        } else if (events[i].kind == 'EAlbum') {
                            if (events[i].numberOfPhoto) {
                                Photo.find({event: events[i]._id})
                                    .lean()
                                    .limit()
                                    .exec(function (err, photos) {
                                        if (!err && photos) {
                                            events[i].photos = photos;
                                        }
                                        numberOfPopulated1++;
                                        if (numberOfPopulated1 == events.length) {
                                            completion2(events);
                                        }
                                    });
                            } else {
                                numberOfPopulated1++;
                                if (numberOfPopulated1 == events.length) {
                                    completion2(events);
                                }
                            }
                        }
                    }
                }

                var completion2 = function (events) {
                    let numberOfPopulated2 = 0;
                    for (let i = 0; i < events.length; i++) {
                        if (events[i].kind == 'EPost') {
                            if (events[i].numberOfPhoto > 0) {
                                Photo.find({event: events[i]._id})
                                    .limit(events[i].numberOfPhoto)
                                    .lean()
                                    .exec(function (err, photos) {
                                        numberOfPopulated2++;
                                        if (!err && photos) {
                                            events[i].photos = photos;
                                        }
                                        if (numberOfPopulated2 == events.length) {
                                            completion3(events);
                                        }
                                    });
                            } else {
                                events[i].photos = [];
                                numberOfPopulated2++;
                                if (numberOfPopulated2 == events.length) {
                                    completion3(events);
                                }
                            }
                        } else if (events[i].kind == 'EAvatar') {
                            if (events[i].avatar != undefined) {
                                if (events[i].avatar.numberOfLike > 0) {
                                    LikeAvatar.findOne({avatar: events[i].avatar._id, user: req.body.user._id})
                                        .exec(function (err, like) {
                                            numberOfPopulated2++;
                                            if (!err) {
                                                if (like) {
                                                    events[i].avatar.like = {liked: true, data: like};
                                                } else {
                                                    events[i].avatar.like = {liked: false};
                                                }
                                            }
                                            if (numberOfPopulated2 == events.length) {
                                                completion3(events);
                                            }
                                        });
                                } else {
                                    events[i].avatar.like = {liked: false};
                                    numberOfPopulated2++;
                                    if (numberOfPopulated2 == events.length) {
                                        completion3(events);
                                    }
                                }
                            } else {
                                numberOfPopulated2++;
                                if (numberOfPopulated2 == events.length) {
                                    completion3(events);
                                }
                            }
                        } else if (events[i].kind == 'ECover') {
                            if (events[i].cover != undefined) {
                                if (events[i].cover.numberOfLike > 0) {
                                    LikeCover.findOne({cover: events[i].cover._id, user: req.body.user._id})
                                        .exec(function (err, like) {
                                            numberOfPopulated2++;
                                            if (!err) {
                                                if (like) {
                                                    events[i].cover.like = {liked: true, data: like};
                                                } else {
                                                    events[i].cover.like = {liked: false};
                                                }
                                            }
                                            if (numberOfPopulated2 == events.length) {
                                                completion3(events);
                                            }
                                        });
                                } else {
                                    events[i].cover.like = {liked: false};
                                    numberOfPopulated2++;
                                    if (numberOfPopulated2 == events.length) {
                                        completion3(events);
                                    }
                                }
                            } else {
                                numberOfPopulated2++;
                                if (numberOfPopulated2 == events.length) {
                                    completion3(events);
                                }
                            }
                        } else if (events[i].kind == 'EAlbum') {
                            if (events[i].photos.length > 0) {
                                let albumIds = [];
                                let isAlbumEvent = true;
                                for (let j = 0; j < events[i].photos.length; j++) {
                                    let photo = events[i].photos[j];
                                    if (photo.album != undefined && photo.album != null) {
                                        albumIds.push(photo.album);
                                    } else {
                                        isAlbumEvent = false;
                                        break;
                                    }
                                }
                                if (isAlbumEvent && albumIds.length > 0) {
                                    let exAlbumId = albumIds[0];
                                    for (let j = 0; j < albumIds.length; j++) {
                                        let albumId = albumIds[j];
                                        if (albumId.toString() != exAlbumId.toString()) {
                                            isAlbumEvent = false;
                                            break;
                                        }
                                    }
                                } else {
                                    isAlbumEvent = false;
                                }

                                if (isAlbumEvent) {
                                    Album.findById(albumIds[0])
                                        .lean()
                                        .exec(function (err, album) {
                                            if (!err && album) {
                                                events[i].album = album;
                                            }
                                            numberOfPopulated2++;
                                            if (numberOfPopulated2 == events.length) {
                                                completion3(events);
                                            }
                                        });
                                } else {
                                    numberOfPopulated2++;
                                    if (numberOfPopulated2 == events.length) {
                                        completion3(events);
                                    }
                                }
                            } else {
                                numberOfPopulated2++;
                                if (numberOfPopulated2 == events.length) {
                                    completion3(events);
                                }
                            }
                        }

                    }
                }

                var completion3 = function (events) {
                    let numberOfPopulated3 = 0;
                    for (let i = 0; i < events.length; i++) {
                        if (events[i].kind == 'EPost') {
                            numberOfPopulated3++;
                            if (numberOfPopulated3 == events.length) {
                                completion4(events);
                            }
                        } else if (events[i].kind == 'EAlbum') {
                            if (events[i].album != undefined && events[i].album != null) {
                                if (events[i].album.numberOfLike > 0) {
                                    LikeAlbum.findOne({album: events[i].album._id})
                                        .lean()
                                        .exec(function (err, like) {
                                            if (!err && like) {
                                                events[i].album.like = {liked: true, data: like};
                                            } else {
                                                events[i].album.like = {liked: false};
                                            }
                                            numberOfPopulated3++;
                                            if (numberOfPopulated3 == events.length) {
                                                completion4(events);
                                            }
                                        });

                                } else {
                                    events[i].album.like = {liked: false};
                                    numberOfPopulated3++;
                                    if (numberOfPopulated3 == events.length) {
                                        completion4(events);
                                    }
                                }
                            } else {
                                numberOfPopulated3++;
                                if (numberOfPopulated3 == events.length) {
                                    completion4(events);
                                }
                            }
                        } else {
                            numberOfPopulated3++;
                            if (numberOfPopulated3 == events.length) {
                                completion4(events);
                            }
                        }

                    }
                }

                var completion4 = function (events) {
                    let data = {
                        code: 200,
                        message: 'Successful',
                        data: events
                    }
                    return res.json(200, data);
                }

                completion1(docs);

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

exports.newsfeed = function (req, res) {
    var offset = req.body.offset;
    var limit = req.body.limit;
    var userId = req.body.user._id;

    Friend.find({
        $and: [
            {$or: [{userA: userId}, {userB: userId}]},
            {areFriend: true}
        ]
    }).exec(function (err, friends) {
        if (err) {
            return res.json(500, err);
        } else {
            var users = [];
            users.push(userId);
            for (let i = 0; i < friends.length; i++) {
                let friendId = friends[i].userA.toString() != userId.toString() ? friends[i].userA : friends[i].userB;
                users.push(friendId);
            }


            Event.find({user: {$in: users}})
                .lean()
                .skip(offset)
                .limit(limit)
                .populate('user')
                .populate('timeline')
                .sort({"_id": -1})
                .exec(function (err, docs) {
                    if (err) {
                        return res.json(500, err);
                    }
                    if (docs && docs.length > 0) {
                        var completion1 = function (events) {
                            let numberOfPopulated1 = 0;
                            for (let i = 0; i < events.length; i++) {
                                if (events[i].kind == 'EPost') {
                                    if (events[i].numberOfLike > 0) {
                                        LikePost.findOne({
                                            event: events[i]._id,
                                            user: req.body.user._id
                                        }, function (err, like) {
                                            if (!err) {
                                                if (like) {
                                                    events[i].like = {liked: true, data: like};
                                                } else {
                                                    events[i].like = {liked: false};
                                                }
                                            }
                                            numberOfPopulated1++;
                                            if (numberOfPopulated1 == events.length) {
                                                completion2(events);
                                            }
                                        });
                                    } else {
                                        numberOfPopulated1++;
                                        if (numberOfPopulated1 == events.length) {
                                            completion2(events);
                                        }
                                    }

                                } else if (events[i].kind == 'EAvatar') {
                                    Avatar.findById(events[i].avatar)
                                        .lean()
                                        .exec(function (err, avatar) {
                                            numberOfPopulated1++;
                                            if (!err && avatar) {
                                                events[i].avatar = avatar;
                                            }
                                            if (numberOfPopulated1 == events.length) {
                                                completion2(events);
                                            }
                                        });
                                } else if (events[i].kind == 'ECover') {
                                    Cover.findById(events[i].cover)
                                        .lean()
                                        .exec(function (err, cover) {
                                            numberOfPopulated1++;
                                            if (!err && cover) {
                                                events[i].cover = cover;
                                            }
                                            if (numberOfPopulated1 == events.length) {
                                                completion2(events);
                                            }
                                        });
                                } else if (events[i].kind == 'EAlbum') {
                                    console.log('vao day');
                                    if (events[i].numberOfPhoto) {
                                        Photo.find({event: events[i]._id})
                                            .lean()
                                            .limit()
                                            .exec(function (err, photos) {
                                                if (!err && photos) {
                                                    events[i].photos = photos;
                                                }
                                                numberOfPopulated1++;
                                                if (numberOfPopulated1 == events.length) {
                                                    completion2(events);
                                                }
                                            });
                                    } else {
                                        numberOfPopulated1++;
                                        if (numberOfPopulated1 == events.length) {
                                            completion2(events);
                                        }
                                    }
                                }
                            }
                        }

                        var completion2 = function (events) {
                            let numberOfPopulated2 = 0;
                            for (let i = 0; i < events.length; i++) {
                                if (events[i].kind == 'EPost') {
                                    if (events[i].numberOfPhoto > 0) {
                                        Photo.find({event: events[i]._id})
                                            .limit(events[i].numberOfPhoto)
                                            .lean()
                                            .exec(function (err, photos) {
                                                numberOfPopulated2++;
                                                if (!err && photos) {
                                                    events[i].photos = photos;
                                                }
                                                if (numberOfPopulated2 == events.length) {
                                                    completion3(events);
                                                }
                                            });
                                    } else {
                                        events[i].photos = [];
                                        numberOfPopulated2++;
                                        if (numberOfPopulated2 == events.length) {
                                            completion3(events);
                                        }
                                    }
                                } else if (events[i].kind == 'EAvatar') {
                                    if (events[i].avatar != undefined) {
                                        if (events[i].avatar.numberOfLike > 0) {
                                            LikeAvatar.findOne({avatar: events[i].avatar._id, user: req.body.user._id})
                                                .exec(function (err, like) {
                                                    numberOfPopulated2++;
                                                    if (!err) {
                                                        if (like) {
                                                            events[i].avatar.like = {liked: true, data: like};
                                                        } else {
                                                            events[i].avatar.like = {liked: false};
                                                        }
                                                    }
                                                    if (numberOfPopulated2 == events.length) {
                                                        completion3(events);
                                                    }
                                                });
                                        } else {
                                            events[i].avatar.like = {liked: false};
                                            numberOfPopulated2++;
                                            if (numberOfPopulated2 == events.length) {
                                                completion3(events);
                                            }
                                        }
                                    } else {
                                        numberOfPopulated2++;
                                        if (numberOfPopulated2 == events.length) {
                                            completion3(events);
                                        }
                                    }
                                } else if (events[i].kind == 'ECover') {
                                    if (events[i].cover != undefined) {
                                        if (events[i].cover.numberOfLike > 0) {
                                            LikeCover.findOne({cover: events[i].cover._id, user: req.body.user._id})
                                                .exec(function (err, like) {
                                                    numberOfPopulated2++;
                                                    if (!err) {
                                                        if (like) {
                                                            events[i].cover.like = {liked: true, data: like};
                                                        } else {
                                                            events[i].cover.like = {liked: false};
                                                        }
                                                    }
                                                    if (numberOfPopulated2 == events.length) {
                                                        completion3(events);
                                                    }
                                                });
                                        } else {
                                            events[i].cover.like = {liked: false};
                                            numberOfPopulated2++;
                                            if (numberOfPopulated2 == events.length) {
                                                completion3(events);
                                            }
                                        }
                                    } else {
                                        numberOfPopulated2++;
                                        if (numberOfPopulated2 == events.length) {
                                            completion3(events);
                                        }
                                    }
                                } else if (events[i].kind == 'EAlbum') {
                                    if (events[i].photos.length > 0) {
                                        let albumIds = [];
                                        let isAlbumEvent = true;
                                        for (let j = 0; j < events[i].photos.length; j++) {
                                            let photo = events[i].photos[j];
                                            if (photo.album != undefined && photo.album != null) {
                                                albumIds.push(photo.album);
                                            } else {
                                                isAlbumEvent = false;
                                                break;
                                            }
                                        }
                                        if (isAlbumEvent && albumIds.length > 0) {
                                            let exAlbumId = albumIds[0];
                                            for (let j = 0; j < albumIds.length; j++) {
                                                let albumId = albumIds[j];
                                                if (albumId.toString() != exAlbumId.toString()) {
                                                    isAlbumEvent = false;
                                                    break;
                                                }
                                            }
                                        } else {
                                            isAlbumEvent = false;
                                        }

                                        if (isAlbumEvent) {
                                            Album.findById(albumIds[0])
                                                .lean()
                                                .exec(function (err, album) {
                                                    if (!err && album) {
                                                        events[i].album = album;
                                                    }
                                                    numberOfPopulated2++;
                                                    if (numberOfPopulated2 == events.length) {
                                                        completion3(events);
                                                    }
                                                });
                                        } else {
                                            numberOfPopulated2++;
                                            if (numberOfPopulated2 == events.length) {
                                                completion3(events);
                                            }
                                        }
                                    } else {
                                        numberOfPopulated2++;
                                        if (numberOfPopulated2 == events.length) {
                                            completion3(events);
                                        }
                                    }
                                }

                            }
                        }

                        var completion3 = function (events) {
                            let numberOfPopulated3 = 0;
                            for (let i = 0; i < events.length; i++) {
                                if (events[i].kind == 'EPost') {
                                    numberOfPopulated3++;
                                    if (numberOfPopulated3 == events.length) {
                                        completion4(events);
                                    }
                                } else if (events[i].kind == 'EAlbum') {
                                    if (events[i].album != undefined && events[i].album != null) {
                                        if (events[i].album.numberOfLike > 0) {
                                            LikeAlbum.findOne({album: events[i].album._id})
                                                .lean()
                                                .exec(function (err, like) {
                                                    if (!err && like) {
                                                        events[i].album.like = {liked: true, data: like};
                                                    } else {
                                                        events[i].album.like = {liked: false};
                                                    }
                                                    numberOfPopulated3++;
                                                    if (numberOfPopulated3 == events.length) {
                                                        completion4(events);
                                                    }
                                                });

                                        } else {
                                            events[i].album.like = {liked: false};
                                            numberOfPopulated3++;
                                            if (numberOfPopulated3 == events.length) {
                                                completion4(events);
                                            }
                                        }
                                    } else {
                                        numberOfPopulated3++;
                                        if (numberOfPopulated3 == events.length) {
                                            completion4(events);
                                        }
                                    }
                                } else {
                                    numberOfPopulated3++;
                                    if (numberOfPopulated3 == events.length) {
                                        completion4(events);
                                    }
                                }

                            }
                        }

                        var completion4 = function (events) {
                            let data = {
                                code: 200,
                                message: 'Successful',
                                data: events
                            }
                            return res.json(200, data);
                        }

                        completion1(docs);

                    } else {
                        console.log('vao day 6');
                        let data = {
                            code: 200,
                            message: 'Successful',
                            data: []
                        }
                        return res.json(200, data);
                    }
                });
        }
    });

}
