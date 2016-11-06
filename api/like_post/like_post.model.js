'use strict';

var mongoose = require('mongoose'),
	Schema = mongoose.Schema;
var User = require('../user/user.model');

var LikePostSchema = new Schema({
    event: {
        type: Schema.Types.ObjectId,
        ref: 'Event'
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    }
});

module.exports = mongoose.model('LikePost', LikePostSchema, 'like_post');