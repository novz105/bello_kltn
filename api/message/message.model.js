'use strict';

var mongoose = require('mongoose'),
	Schema = mongoose.Schema;
var User = require('../user/user.model');
var Conversation = require('../conversation/conversation.model');

var MessageSchema = new Schema({
	c: {
		type: Schema.Types.ObjectId,
		ref: 'Conversation'
	},
	u: {
		type: Schema.Types.ObjectId,
		ref: 'User'
	},
    r: {
        type: Boolean,
        default : false
    },
	t: String
});

module.exports = mongoose.model('Message', MessageSchema, 'message');