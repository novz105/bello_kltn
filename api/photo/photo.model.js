'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;
var User = require('../user/user.model');
var LikePhoto = require('../like_photo/like_photo.model');
var CommentPhoto = require('../comment_photo/comment_photo.model');
var Event = require('../event/event.model');
var Album = require('../album/album.model');
var Subscription = require('../subscription/subscription.model');
var Notification = require('../notification/notification.model');

var PhotoSchema = new Schema({
    url: {
        type: String,
        default: ''
    },
    caption: String,
    event: {
        type: Schema.Types.ObjectId,
        ref: 'Event'
    },
    album: {
        type: Schema.Types.ObjectId,
        ref: 'Album'
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    numberOfLike: {
        type: Number,
        default: 0
    },
    numberOfComment: {
        type: Number,
        default: 0
    }
});

PhotoSchema.post('remove', function () {
    if (this.numberOfLike > 0) {
        LikePhoto.find({photo: this._id})
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
        CommentPhoto.find({photo: this._id})
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
});

module.exports = mongoose.model('Photo', PhotoSchema, 'photo');