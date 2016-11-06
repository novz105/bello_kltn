'use strict';

var mongoose = require('mongoose'),
	Schema = mongoose.Schema;
var User = require('../user/user.model');

var CommentAvatarSchema = new Schema({
    avatar: {
        type: Schema.Types.ObjectId,
        ref: 'Avatar'
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
	content: String
});

CommentAvatarSchema.index({object: 1});

module.exports = mongoose.model('CommentAvatar', CommentAvatarSchema, 'comment_avatar');