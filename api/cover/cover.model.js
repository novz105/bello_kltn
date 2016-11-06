'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;
var User = require('../user/user.model');
var Album = require('../album/album.model');
var LikeCover = require('../like_cover/like_cover.model');
var CommentCover = require('../comment_cover/comment_cover.model');
var EventCover = require('../event_cover/event_cover.model');
var Subscription = require('../subscription/subscription.model');
var Notification = require('../notification/notification.model');

var CoverSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    album: {
        type: Schema.Types.ObjectId,
        ref: 'Album'
    },
    url: {
        type: String,
        default: ''
    },
    caption: String,
    event: {
        type: Schema.Types.ObjectId,
        ref: 'EventCover'
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

CoverSchema.post('remove', function () {
    var coverId = this._id;
    var userId = this.user;
    var eventId = this.event;

    if (this.numberOfLike > 0) {
        LikeCover.find({cover: this._id})
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
        CommentCover.find({cover: this._id})
            .limit(this.numberOfComment)
            .exec(function (err, comments) {
                if (!err && comments && comments.length > 0) {
                    for (let i = 0; i < comments.length; i++) {
                        comments[i].remove();
                    }
                }
            });
    }
    Subscription.find({object:coverId}, function (err, subs){
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
    User.findById(userId, function(err, user){
        if (!err && user) {
            if (user.cover.cover.toString() == coverId.toString()) {
                user.cover = undefined;
            }
            user.save();
        }
    });
});

module.exports = mongoose.model('Cover', CoverSchema, 'cover');