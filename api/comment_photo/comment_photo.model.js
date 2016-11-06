'use strict';

var mongoose = require('mongoose'),
	Schema = mongoose.Schema;
var User = require('../user/user.model');

var CommentPhotoSchema = new Schema({
    photo: {
        type: Schema.Types.ObjectId,
        ref: 'Photo'
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
	content: String
});

CommentPhotoSchema.index({object: 1});

module.exports = mongoose.model('CommentPhoto', CommentPhotoSchema, 'comment_photo');