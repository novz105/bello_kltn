'use strict';

var mongoose = require('mongoose'),
	Schema = mongoose.Schema;
var User = require('../user/user.model');

var ConversationSchema = new Schema({
	a: {
		type: Schema.Types.ObjectId,
		ref: 'User'
	},
    b: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    t: {
        type: Date,
        index : true
    },
    e: {
        type: Boolean,
        default: false
    },
    m: {
        type: Schema.Types.ObjectId,
        ref: 'Message'
    },
    aR: {
        type: Number,
        default: 0
    },
    bR: {
        type: Number,
        default: 0
    }
});

module.exports = mongoose.model('Conversation', ConversationSchema, 'conversation');