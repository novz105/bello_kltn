'use strict';

var mongoose = require('mongoose'),
	Schema = mongoose.Schema;
var User = require('../user/user.model');

var CommentPostSchema = new Schema({
    event: {
        type: Schema.Types.ObjectId,
        ref: 'Post'
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
	content: String
});

module.exports = mongoose.model('CommentPost', CommentPostSchema, 'comment_post');