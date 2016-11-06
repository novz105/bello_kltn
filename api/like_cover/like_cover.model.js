'use strict';

var mongoose = require('mongoose'),
	Schema = mongoose.Schema;
var User = require('../user/user.model');

var LikeCoverSchema = new Schema({
    cover: {
        type: Schema.Types.ObjectId,
        ref: 'Cover'
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    }
});

LikeCoverSchema.index({cover: 1});

module.exports = mongoose.model('LikeCover', LikeCoverSchema, 'like_cover');