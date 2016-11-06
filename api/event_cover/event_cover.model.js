'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;
var Cover = require('../cover/cover.model');
var Event = require('../event/event.model');

var options = {discriminatorKey: 'kind'};

var EventCoverSchema = new Schema({
    cover: {
        type: Schema.Types.ObjectId,
        ref: 'Cover'
    }
}, options);

module.exports = Event.discriminator('ECover', EventCoverSchema);