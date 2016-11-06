'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;
var User = require('../user/user.model');
var Photo = require('../photo/photo.model');
var Event = require('../event/event.model');
var LikeAlbum = require('../like_album/like_album.model');
var CommentAlbum = require('../comment_album/comment_album.model');
var Subscription = require('../subscription/subscription.model');
var Notification = require('../notification/notification.model');

var AlbumSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    name: String,
    content: String,
    numberOfPhoto: {
        type: Number,
        default: 0
    },
    numberOfLike: {
        type: Number,
        default: 0
    },
    numberOfComment: {
        type: Number,
        default: 0
    },
    kind: {
        type: Number,
        default: 0
    }
});

AlbumSchema.post('remove', function () {
    if (this.numberOfLike > 0) {
        LikeAlbum.find({album: this._id})
            .limit(this.numberOfLike)
            .exec(function (err, likes) {
                if (!err && likes && likes.length > 0) {
                    for (let i = 0; i < likes.length; i++) {
                        likes[i].remove();
                    }
                }
            });
    }
    if (this.numberOfComment > 0) {
        CommentAlbum.find({album: this._id})
            .limit(this.numberOfComment)
            .exec(function (err, comments) {
                if (!err && comments && comments.length > 0) {
                    for (let i = 0; i < comments.length; i++) {
                        comments[i].remove();
                    }
                }
            });
    }
    Subscription.find({object:this._id}, function (err, subs){
        if (!err && subs && subs.length > 0) {
            for (let i = 0; i < subs.length; i++) {
                subs[i].remove();
            }
        }
    });
    Notification.find({object:this._id}, function (err, notis){
        if (!err && notis && notis.length > 0) {
            for (let i = 0; i < notis.length; i++) {
                notis[i].remove();
            }
        }
    });
    if (this.numberOfPhoto > 0) {
        Photo.find({album: this._id})
            .limit(this.numberOfPhoto)
            .exec(function (err, photos) {
                if (!err && photos && photos.length > 0) {
                    let events = [];
                    let finalEvents = {};
                    for (let i = 0; i < photos.length; i++) {
                        let photo = photos[i];
                        photo.remove();
                        let eventId = photos[i].event.toString();
                        events.push(eventId);
                        finalEvents[eventId] = 0;
                    }
                    for (let i = 0; i < events.length; i++) {
                        finalEvents[events[i]] = finalEvents[events[i]]+1;
                    }

                    for (let key in finalEvents) {
                        Event.findById(key, function(err, event) {
                            if (!err && event) {
                                if (event.kind == 'EPost') {
                                    event.numberOfPhoto = event.numberOfPhoto - finalEvents[key];
                                    event.save();
                                } else if (event.kind == 'EAlbum') {
                                    event.numberOfPhoto = event.numberOfPhoto - finalEvents[key];
                                    event.save(function(err, updatedEvent){
                                        if (!err && updatedEvent) {
                                            if (updatedEvent.numberOfPhoto == 0) {
                                                updatedEvent.remove();
                                            }
                                        }
                                    });

                                }
                            }
                        });
                    }
                }
            });
    }
});

module.exports = mongoose.model('Album', AlbumSchema, 'album');