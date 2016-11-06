'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;
var Avatar = require('../avatar/avatar.model');
var Event = require('../event/event.model');

var options = {discriminatorKey: 'kind'};

var EventAvatarSchema = new Schema({
    avatar: {
        type: Schema.Types.ObjectId,
        ref: 'Avatar'
    }
}, options);

module.exports = Event.discriminator('EAvatar', EventAvatarSchema);