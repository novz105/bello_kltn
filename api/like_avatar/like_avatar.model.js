'use strict';

var mongoose = require('mongoose'),
	Schema = mongoose.Schema;
var User = require('./../user/user.model');

var LikeAvatarSchema = new Schema({
    avatar: {
        type: Schema.Types.ObjectId,
        ref: 'Avatar'
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    }
});

module.exports = mongoose.model('LikeAvatar', LikeAvatarSchema, 'like_avatar');