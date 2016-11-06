'use strict';

var mongoose = require('mongoose'),
	Schema = mongoose.Schema;
var User = require('../user/user.model');

var CommentCoverSchema = new Schema({
    cover: {
        type: Schema.Types.ObjectId,
        ref: 'Cover'
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
	content: String
});

module.exports = mongoose.model('CommentCover', CommentCoverSchema, 'comment_cover');