'use strict';

var mongoose = require('mongoose'),
	Schema = mongoose.Schema;
var User = require('../user/user.model');

var LikeAlbumSchema = new Schema({
    album: {
        type: Schema.Types.ObjectId,
        ref: 'Album'
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    }
});

module.exports = mongoose.model('LikeAlbum', LikeAlbumSchema, 'like_album');