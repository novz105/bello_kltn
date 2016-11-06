'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;
//var User = require('../user/user.model');
//var Subscription = require('../subscription/subscription.model');

/*
 * action
 * 0: liked
 * 1: commented
 * 2: share post
 */

/*
 * kind
 * 0: post owner
 * 1: photo owner
 * 2: avatar owner
 * 3: cover owner
 * 4: album owner
 * 5: post commented
 * 6: photo commented
 * 7: avatar commented
 * 8: cover commented
 * 9: album commented
 * 10: post subcribed
 * 11: photo subscribed
 * 12: avatar subscribed
 * 13: cover subscribed
 * 14: album subscribed
 * 15: post commented on timeline
 * 16: photo commented on timeline
 * 17: post to timeline
 * 18: birthday reminder
 * 19: accept request
 */

var NotificationSchema = new Schema({
    owner: {type: Schema.Types.ObjectId, ref: 'User'},
    receiver: {type: Schema.Types.ObjectId, ref: 'User'},
    object: {type: Schema.Types.ObjectId},
    action: Number,
    kind: Number, // subscription kind
    read: {
        type: Boolean,
        default: false
    },
    tap: {
        type: Boolean,
        default : false
    }
});


module.exports = mongoose.model('Notification', NotificationSchema, 'notification');