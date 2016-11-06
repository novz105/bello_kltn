'use strict';

var mongoose = require('mongoose'),
	Schema = mongoose.Schema;
var User = require('../user/user.model');

var CommentAlbumSchema = new Schema({
    album: {
        type: Schema.Types.ObjectId,
        ref: 'Album'
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
	content: String
});

module.exports = mongoose.model('CommentAlbum', CommentAlbumSchema, 'comment_album');