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
var EventAlbum = require('./event_album.model');
var Notification = require('../notification/notification.model');
var Photo = require('../photo/photo.model');
var Album = require('../album/album.model');
var User = require('../user/user.model');
var Subscription = require('../subscription/subscription.model');
var clients = require('./../../config/clients');
var _ = require('lodash');

exports.create = function (req, res) {
    User.findById(req.body.event.user, function (err, user) {
        if (err) {
            return res.json(500, err);
        }
        if (!user) {
            return res.json(200, {code: 404, message: 'User not found'});
        }
        Album.findById(req.body.event.album._id, function(err, album){
            if (err) {
                return res.json(500, err);
            }
            if (!album) {
                return res.json(200, {code: 404, message: 'Album not found'});
            }

            var dataEvent = {
                user: req.body.event.user,
                timeline: req.body.event.timeline,
                numberOfPhoto: (req.body.photos) ? req.body.photos.length : 0
            }
            if (!req.body.photos || req.body.photos.length == 0) {
                return res.json(200, {code: 401, message: 'Params error'});
            } else {
                let event = new EventAlbum(dataEvent);
                if (!event) {
                    return res.json(200, {code: 401, message: 'Params error'});
                }
                event.save(function (err, newEvent) {
                    if (err) {
                        return res.json(500);
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
                                    album.save(function(err, savedAlbum){
                                        if (err) {
                                            for (let j = 0; j < savedPhotos.length; j++) {
                                                savedPhotos[j].remove();
                                            }
                                            newEvent.remove();
                                        }
                                        for (let s = 0; s < savedPhotos.length; s++) {
                                            Subscription.create({object:savedPhotos[s]._id, owner:user._id, kind:1});
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
        });

    });
}

exports.delete = function (req, res) {
    EventAlbum.findById(req.body._id, function (err, event) {
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
                            photos[i].remove(function(err){
                                if (!err) {
                                    albums[albumId] = albums[albumId] + 1;
                                }
                                numberToRemove++;
                                if (numberToRemove == photos.length) {
                                    for (let albumKeyId in albums) {
                                        Album.findById(albumKeyId, function(err, album){
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


            return res.json(200, {message: 'Event album deleted', code: 200});
        });
    });
}
