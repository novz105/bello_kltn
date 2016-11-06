'use strict';

var mongoose = require('mongoose'),
	Schema = mongoose.Schema;
var User = require('../user/user.model');

var Friend = new Schema({
	userA: {
		type: Schema.Types.ObjectId,
		ref: 'User'
	},
	userB: {
		type: Schema.Types.ObjectId,
		ref: 'User'
	},
    areFriend: {
        type: Boolean,
        default : false
    },
    read: {
        type: Boolean,
        default : false
    }
});

module.exports = mongoose.model('Friend', Friend, 'friend');