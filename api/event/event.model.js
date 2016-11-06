'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;
var User = require('../user/user.model');
var Photo = require('../photo/photo.model');

var options = {discriminatorKey: 'kind'};
var EventSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    timeline: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    }
}, options);

module.exports = mongoose.model('Event', EventSchema, 'event');