'use strict';

var _ = require('lodash');
var EventPost = require('./event_post.model');
var Notification = require('../notification/notification.model');
var Subscription = require('../subscription/subscription.model');
var Photo = require('../photo/photo.model');
var Album = require('../album/album.model');
var User = require('../user/user.model');
var Subscription = require('../subscription/subscription.model');
var CommentPost = require('../comment_post/comment_post.model');
var CommentPhoto = require('../comment_photo/comment_photo.model');
var LikePost = require('../like_post/like_post.model');
var LikePhoto = require('../like_photo/like_photo.model');
var clients = require('./../../config/clients');
var Push = require('./../../config/push')(null);
var _ = require('lodash');

exports.create = function (req, res) {
    User.findById(req.body.event.user._id, function (err, user) {
        if (err) {
            return res.json(500, err);
        }
        if (!user) {
            return res.json(200, {code: 404, message: 'User not found'});
        }
        var dataEvent = {
            user: req.body.event.user._id,
            content: req.body.event.content,
            timeline: req.body.event.timeline._id,
            numberOfPhoto: (req.body.photos) ? req.body.photos.length : 0
        }
        if (!req.body.photos || req.body.photos.length == 0) { // normal status
            let event = new EventPost(dataEvent);
            if (!event) {
                return res.json(200, {code: 401, message: 'Params error'});
            }
            event.save(function (err, newEvent) {
                if (err || !newEvent) {
                    return res.json(500, err);
                }
                Subscription.create({object: newEvent._id, owner: user._id, kind: 0});
                if (user._id.toString() != newEvent.timeline.toString()) {
                    Subscription.create({object: newEvent._id, owner: newEvent.timeline, kind: 15});
                    Notification.create({
                        owner: user._id,
                        receiver: newEvent.timeline,
                        object: newEvent._id,
                        kind: 17,
                        action: 2
                    }, function (err, newNoti) {
                        if (!err && newNoti) {
                            Push.sendPush(newNoti);
                        }
                    });
                }
                return res.json(200, {message: 'Event created', code: 200, data: newEvent});
            });
        } else {
            var createEvent = function (album) {
                let event = new EventPost(dataEvent);
                if (!event) {
                    return res.json(200, {code: 401, message: 'Params error'});
                }
                event.save(function (err, newEvent) {
                    if (err) {
                        return res.json(500, err);
                    }
                    let photos = req.body.photos;
                    let savedPhotos = [];
                    let numberOfSuccess = 0;
                    for (let i = 0; i < photos.length; i++) {
                        photos[i].event = newEvent._id;
                        photos[i].album = album._id;
                        let photo = new Photo(photos[i]);
                        if (!photo) {
                            for (let j = 0; j < savedPhotos.length; j++) {
                                savedPhotos[j].remove();
                            }
                            newEvent.remove();
                            return res.json(200, {code: 401, message: 'Photo params process error'});
                            break;
                        }
                        photo.save(function (err, newPhoto) {
                            numberOfSuccess++;
                            if (!err && newPhoto) {

                                savedPhotos.push(newPhoto);
                            }
                            if (numberOfSuccess == photos.length) {
                                if (numberOfSuccess == savedPhotos.length) {
                                    album.numberOfPhoto = album.numberOfPhoto + photos.length;
                                    album.save(function (err) {
                                        if (err) {
                                            return res.json(500, err);
                                        }
                                        for (let s = 0; s < savedPhotos.length; s++) {
                                            Subscription.create({object: savedPhotos[s]._id, owner: user._id, kind: 1});
                                            if (user._id.toString() != newEvent.timeline.toString()) {
                                                Subscription.create({
                                                    object: savedPhotos[s]._id,
                                                    owner: newEvent.timeline,
                                                    kind: 16
                                                });
                                            }
                                        }
                                        Subscription.create({object: newEvent._id, owner: user._id, kind: 0});
                                        if (user._id.toString() != newEvent.timeline.toString()) {
                                            Subscription.create({
                                                object: newEvent._id,
                                                owner: newEvent.timeline,
                                                kind: 15
                                            });
                                            Notification.create({
                                                owner: user._id,
                                                receiver: newEvent.timeline,
                                                object: newEvent._id,
                                                kind: 17,
                                                action: 2
                                            }, function (err, newNoti) {
                                                if (!err && newNoti) {
                                                    Push.sendPush(newNoti);
                                                }
                                            });
                                        }
                                        return res.json(200, {code: 200, message: 'Successful'});
                                    });
                                } else {
                                    for (let j = 0; j < savedPhotos.length; j++) {
                                        savedPhotos[j].remove();
                                    }
                                    newEvent.remove();
                                    return res.json(200, {code: 401, message: 'Photo saving process error'});
                                }
                            }
                        });
                    }
                });
            }
            if (user._id.toString == dataEvent.timeline.toString()) {
                Album.findOne({user: user._id, kind: 1}, function (err, album) {
                    if (err) {
                        return res.json(500, err);
                    }
                    if (album) {
                        createEvent(album);
                    } else {
                        let timelineAlbum = new Album({user: user._id, kind: 1});
                        timelineAlbum.save(function (err, newAlbum) {
                            if (err) {
                                return res.json(500, err);
                            }
                            createEvent(newAlbum);
                        });
                    }
                });
            } else {
                Album.findOne({user: dataEvent.timeline, kind: 1}, function (err, album) {
                    if (err) {
                        return res.json(500, err);
                    }
                    if (album) {
                        createEvent(album);
                    } else {
                        let timelineAlbum = new Album({user: dataEvent.timeline, kind: 1});
                        timelineAlbum.save(function (err, newAlbum) {
                            if (err) {
                                return res.json(500, err);
                            }
                            createEvent(newAlbum);
                        });
                    }
                });
            }
        }
    });
}

exports.update = function (req, res) {
    EventPost.findById(req.body.event._id, function (err, event) {
        if (err) {
            return res.json(500, err);
        }
        if (!event) {
            return res.json(200, {code: 404, message: 'Event not found'});
        }
        if (!event.numberOfPhoto || event.numberOfPhoto == 0) {
            event.content = req.body.event.content;
            let photos = req.body.photos;
            if (photos && photos.length > 0) {
                let createPhotos = function (album) {
                    let savedPhotos = [];
                    let numberOfSuccess = 0;
                    for (let i = 0; i < photos.length; i++) {
                        photos[i].event = event;
                        let photo = new Photo(photos[i]);
                        photo.album = album._id;
                        if (!photo) {
                            for (let j = 0; j < savedPhotos.length; j++) {
                                savedPhotos[j].remove();
                            }
                            return res.json(200, {code: 401, message: 'Photo params error'});
                            break;
                        }
                        photo.save(function (err, newPhoto) {
                            numberOfSuccess++;
                            if (!err && newPhoto) {
                                savedPhotos.push(newPhoto);
                            }
                            if (numberOfSuccess == photos.length) {
                                if (numberOfSuccess == savedPhotos.length) {
                                    event.numberOfPhoto = numberOfSuccess;
                                    event.save(function (err) {
                                        if (err) {
                                            for (let j = 0; j < savedPhotos.length; j++) {
                                                savedPhotos[j].remove();
                                            }
                                            return res.json(500, err);
                                        }
                                        album.numberOfPhoto = album.numberOfPhoto + savedPhotos.length;
                                        album.save(function (err, updatedAlbum) {
                                            for (let s = 0; s < savedPhotos.length; s++) {
                                                Subscription.create({
                                                    object: savedPhotos[s]._id,
                                                    owner: event.user,
                                                    kind: 1
                                                });
                                            }
                                            return res.json(200, {code: 200, message: 'Successful'});
                                        });

                                    });
                                } else {
                                    for (let j = 0; j < savedPhotos.length; j++) {
                                        savedPhotos[j].remove();
                                    }
                                    return res.json(200, {code: 401, message: 'Photo saving process error'});
                                }
                            }
                        });
                    }
                }
                Album.findOne({user: event.timeline, kind: 1}, function (err, album) {
                    if (!err) {
                        if (!album) {
                            Album.create({user: event.timeline, kind: 1}, function (err, newAlbum) {
                                if (!err && newAlbum) {
                                    createPhotos(newAlbum);
                                }
                            });
                        } else {
                            createPhotos(album);
                        }
                    } else {
                        res.json(500, err);
                    }
                });
            } else {
                event.save(function (err) {
                    if (err) {
                        return res.json(500, err);
                    }
                    return res.json(200, {code: 200, message: 'Successful'});
                });
            }
        } else {
            event.content = req.body.event.content;
            if (req.body.photos == undefined || req.body.photos == null || req.body.photos.length == 0) {
                event.numberOfPhoto = 0;
                event.save(function (err, updatedEvent) {
                    if (err) {
                        return res.json(500, err);
                    }
                    Photo.find({event: updatedEvent._id}, function (err, photos) {
                        if (!err && photos && photos.length > 0) {
                            let albums = {};
                            let numberToRemove = 0;
                            for (let i = 0; i < photos.length; i++) {
                                let albumId = photos[i].album;
                                albums[albumId] = 0;
                                photos[i].remove(function (err) {
                                    if (!err) {
                                        albums[albumId] = albums[albumId] + 1;
                                    }
                                    numberToRemove++;
                                    if (numberToRemove == photos.length) {
                                        for (let albumKeyId in albums) {
                                            Album.findById(albumKeyId, function (err, album) {
                                                if (!err && album) {
                                                    album.numberOfPhoto = album.numberOfPhoto - albums[albumKeyId];
                                                    album.save();
                                                }
                                            })
                                        }
                                    }
                                });
                            }
                        }
                    });
                    return res.json(200, {code: 200, message: 'Successful'});
                });
            } else {
                Photo.find({event: event._id})
                    .limit(event.numberOfPhoto)
                    .exec(function (err, photos) {
                        if (err) {
                            return res.json(500, err);
                        }
                        var photosToRemove = [];
                        var photosToEdit = [];
                        var photosToCreate = [];
                        for (let i = 0; i < req.body.photos.length; i++) {
                            let photoIdMe = req.body.photos[i]._id;
                            let caption = req.body.photos[i].caption;
                            if (photoIdMe != undefined && photoIdMe != null && photoIdMe.length > 0) {
                                for (let i = 0; i < photos.length; i++) {
                                    let photoId = photos[i]._id;
                                    if (photoId.toString() == photoIdMe.toString()) {
                                        photos[i].caption = caption;
                                        photosToEdit.push(photos[i]);
                                        break;
                                    }
                                }
                            } else {
                                req.body.photos[i].event = event._id;
                                let photo = new Photo(req.body.photos[i]);
                                if (!photo) {
                                    return res.json(200, {code: 401, message: 'Photo params error'});
                                }
                                photosToCreate.push(photo);
                            }
                        }
                        for (let i = 0; i < photos.length; i++) {
                            let photoId = photos[i]._id;
                            let contain = false;
                            for (let j = 0; j < req.body.photos.length; j++) {
                                let photoIdMe = req.body.photos[j]._id;
                                if (photoIdMe != undefined && photoIdMe != null && photoIdMe.length > 0) {
                                    if (photoId.toString() == photoIdMe.toString()) {
                                        contain = true;
                                        break;
                                    }
                                }
                            }
                            if (contain == false) {
                                photosToRemove.push(photos[i]);
                            }
                        }

                        var completionSuccess = function () {
                            event.numberOfPhoto = req.body.photos.length;
                            event.save(function (err, updatedPhoto) {
                                if (err) {
                                    return res.json(500, err);
                                }
                                if (updatedPhoto) {
                                    return res.json(200, {code: 200, message: 'Successful'});
                                }
                            });
                        }

                        var completionEdit = function () {
                            if (photosToEdit.length > 0) {
                                let numberToEdit = 0;
                                for (let i = 0; i < photosToEdit.length; i++) {
                                    photosToEdit[i].save(function (err, updatedPhoto) {
                                        numberToEdit++;
                                        if (numberToEdit == photosToEdit.length) {
                                            completionSuccess();
                                        }
                                    });
                                }
                            } else {
                                completionSuccess();
                            }
                        }

                        var completionRemove = function () {
                            if (photosToRemove.length > 0) {
                                let numberToRemove = 0;
                                let albums = {};
                                for (let i = 0; i < photosToRemove.length; i++) {
                                    let albumId = photosToRemove[i].album;
                                    albums[albumId] = 0;
                                    photosToRemove[i].remove(function (err) {
                                        if (!err) {
                                            albums[albumId] = albums[albumId] + 1;
                                        }
                                        numberToRemove++;
                                        if (numberToRemove == photosToRemove.length) {
                                            let keys = Object.keys(albums);
                                            let keyLength = keys.length;
                                            if (keyLength > 0) {
                                                Album.find({'_id': {$in: keys}}, function (err, albumsToSave) {
                                                    if (!err && albumsToSave && albumsToSave.length > 0) {
                                                        let numberOfSaveAlbum = 0
                                                        for (let a = 0; a < albumsToSave.length; a++) {
                                                            albumsToSave[a].numberOfPhoto = albumsToSave[a].numberOfPhoto - albums[albumsToSave[a]._id];
                                                            albumsToSave[a].save(function (err, savedAlbum) {
                                                                numberOfSaveAlbum++;
                                                                if (numberOfSaveAlbum == albumsToSave.length) {
                                                                    completionEdit();
                                                                }
                                                            });
                                                        }
                                                    } else {
                                                        completionEdit();
                                                    }

                                                })
                                            } else {
                                                completionEdit();
                                            }
                                        }
                                    });
                                }
                            } else {
                                completionEdit();
                            }
                        }

                        if (photosToCreate.length > 0) {
                            Album.findOne({user: event.timeline, kind: 1}, function (err, album) {
                                if (!err) {
                                    let createPhotos = function (album) {
                                        let numberToCreate = 0;
                                        for (let i = 0; i < photosToCreate.length; i++) {
                                            photosToCreate[i].album = album._id;
                                            photosToCreate[i].save(function (err, newPhoto) {
                                                Subscription.create({object: newPhoto._id, owner: event.user, kind: 1});
                                                numberToCreate++;
                                                if (numberToCreate == photosToCreate.length) {
                                                    album.numberOfPhoto = album.numberOfPhoto + photosToCreate.length;
                                                    album.save(function (err, updatedAlbum) {

                                                        completionRemove();
                                                    });
                                                }
                                            });
                                        }
                                    }
                                    if (!album) {
                                        Album.create({user: event.timeline, kind: 1}, function (err, newAlbum) {
                                            if (!err && newAlbum) {
                                                createPhotos(newAlbum);
                                            }
                                        });
                                    } else {
                                        createPhotos(album);
                                    }
                                } else {
                                    res.json(500, err);
                                }
                            });
                        } else {

                            completionRemove();
                        }
                    });
            }
        }
    });
}

exports.info = function (req, res) {
    EventPost.findById(req.body.event._id)
        .lean()
        .populate('user')
        .populate('timeline')
        .exec(function (err, event) {
            if (err) {
                return res.json(500, err);
            }
            if (!event) {
                return res.json(200, {code: 404, message: 'Event not found'});
            }
            let likeFunction = function (event, completion) {
                if (event.numberOfLike > 0) {
                    LikePost.findOne({event: event._id, user: req.body.user._id}, function (err, like) {
                        if (err) {
                            completion(err, event);
                        } else {
                            if (!like) {
                                event.like = {liked: false};
                            } else {
                                event.like = {liked: true, data: like};
                            }
                            completion(null, event);
                        }
                    });
                } else {
                    event.like = {like: false};
                    completion(null, event);
                }
            }

            let subFuntion = function (event, completion) {
                likeFunction(event, function (err, event) {
                    if (!err) {
                        Subscription.findOne({object: event._id, owner: req.body.user._id}, function (err, sub) {
                            if (err) {
                                completion(err, event);
                            } else {
                                if (sub) {
                                    event.sub = sub;
                                }
                                completion(null, event);
                            }
                        });
                    } else {
                        completion(err, event);
                    }
                });
            }

            let photoFunction = function (event, completion) {
                subFuntion(event, function (err, event) {
                    if (!err) {
                        if (event.numberOfPhoto > 0) {
                            Photo.find({event: event._id})
                                .limit(event.numberOfPhoto)
                                .lean()
                                .exec(function (err, photos) {
                                    if (err) {
                                        completion(err, event);
                                    } else {
                                        if (photos && photos.length) {
                                            let numberOfPopulatedLikePhoto = 0;
                                            let error = null;
                                            event.photos = photos;
                                            for (let i = 0; i < event.photos.length; i++) {
                                                if (event.photos[i].numberOfLike > 0) {
                                                    LikePhoto.findOne({
                                                        photo: event.photos[i]._id,
                                                        user: req.body.user._id
                                                    })
                                                        .lean()
                                                        .exec(function (err, like) {
                                                            numberOfPopulatedLikePhoto++;
                                                            if (!err) {
                                                                if (like) {
                                                                    event.photos[i].like = {liked: true, data: like};
                                                                } else {
                                                                    event.photos[i].like = {liked: false};
                                                                }

                                                            } else {
                                                                error = err;
                                                            }
                                                            if (numberOfPopulatedLikePhoto == event.photos.length) {
                                                                completion(error, event);
                                                            }
                                                        });
                                                } else {
                                                    event.photos[i].like = {liked: false};
                                                    numberOfPopulatedLikePhoto++;
                                                    if (numberOfPopulatedLikePhoto == event.photos.length) {
                                                        completion(null, event);
                                                    }
                                                }
                                            }
                                        } else {
                                            completion(null, event);
                                        }
                                    }
                                });
                        } else {
                            completion(null, event);
                        }
                    } else {
                        completion(err, event);
                    }
                })
            };
            photoFunction(event, function (err, data) {
                if (err) {
                    return res.json(500, err);
                }
                return res.json(200, {code: 200, message: 'Successful', data: data});
            });

        });
}

exports.delete = function (req, res) {
    EventPost.findById(req.body._id, function (err, event) {
        if (err) {
            return res.json(500, err);
        }
        if (!event) {
            return res.json(404, {message: 'Event not found', code: 404});
        }
        if (event.numberOfPhoto > 0) {
            Photo.find({event: event._id})
                .limit(event.numberOfPhoto)
                .exec(function (err, photos) {
                    if (!err && photos && photos.length > 0) {
                        let albums = {};
                        let numberToRemove = 0;
                        for (let i = 0; i < photos.length; i++) {
                            let albumId = photos[i].album;
                            albums[albumId] = 0;
                            photos[i].remove(function (err) {
                                if (!err) {
                                    albums[albumId] = albums[albumId] + 1;
                                }
                                numberToRemove++;
                                if (numberToRemove == photos.length) {
                                    for (let albumKeyId in albums) {
                                        Album.findById(albumKeyId, function (err, album) {
                                            if (!err && album) {
                                                album.numberOfPhoto = album.numberOfPhoto - albums[albumKeyId];
                                                album.save();
                                            }
                                        })
                                    }
                                }
                            });
                        }
                    }
                });
        }

        event.remove(function (err) {
            if (err) {
                return res.json(500, err);
            }
            return res.json(200, {message: 'Event post deleted', code: 200});
        });
    });
}
