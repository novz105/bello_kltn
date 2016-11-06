'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;
var User = require('../user/user.model');
var Album = require('../album/album.model');
var LikeAvatar = require('../like_avatar/like_avatar.model');
var CommentAvatar = require('../comment_avatar/comment_avatar.model');
var EventAvatar = require('../event_avatar/event_avatar.model');
var Subscription = require('../subscription/subscription.model');
var Notification = require('../notification/notification.model');

var AvatarSchema = new Schema({
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
        ref: 'EventAvatar'
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

AvatarSchema.post('remove', function () {
    var avatarId = this._id;
    var userId = this.user;

    if (this.numberOfLike > 0) {
        LikeAvatar.find({avatar: this._id})
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
        CommentAvatar.find({avatar: this._id})
            .limit(this.numberOfComment)
            .exec(function (err, comments) {
                if (!err && comments && comments.length > 0) {
                    for (let i = 0; i < comments.length; i++) {
                        comments[i].remove();
                    }
                }
            });
    }
    Subscription.find({object:avatarId}, function (err, subs){
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
    User.findById(userId, function(err, user) {
        if (!err && user) {
            if (user.avatar.avatar.toString() == avatarId.toString()) {
                user.avatar = undefined;
            }
            user.save();
        }
    });
});

module.exports = mongoose.model('Avatar', AvatarSchema, 'avatar');