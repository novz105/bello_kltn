'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;
var User = require('../user/user.model');
var Photo = require('../photo/photo.model');
var LikePost = require('../like_post/like_post.model');
var CommentPost = require('../comment_post/comment_post.model');
var Event = require('../event/event.model');
var Subscription = require('../subscription/subscription.model');
var Notification = require('../notification/notification.model');
var options = {discriminatorKey: 'kind'};

var PostSchema = new Schema({
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
    }
},options);

PostSchema.post('remove', function () {
    if (this.numberOfLike > 0) {
        LikePost.find({event: this._id})
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
        CommentPost.find({event: this._id})
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

module.exports = Event.discriminator('EPost', PostSchema);