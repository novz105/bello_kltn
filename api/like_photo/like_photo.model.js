'use strict';

var mongoose = require('mongoose'),
	Schema = mongoose.Schema;
var User = require('../user/user.model');

var LikePhotoSchema = new Schema({
    photo: {
        type: Schema.Types.ObjectId,
        ref: 'Photo'
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    }
});

LikePhotoSchema.index({photo: 1});

module.exports = mongoose.model('LikePhoto', LikePhotoSchema, 'like_photo');