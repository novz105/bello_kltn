'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;
var User = require('../user/user.model');
var Notification = require('../notification/notification.model');

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
 */

var SubscriptionSchema = new Schema({
    object: {type: Schema.Types.ObjectId},
    owner: {type: Schema.Types.ObjectId, ref:'User'},
    kind: Number
});

SubscriptionSchema.post('remove', function () {
    Notification.find({subscription:this._id}, function(err, notis){
        if (!err && notis && notis.length > 0) {
            for (let i = 0; i < notis.length; i++) {
                notis[i].remove();
            }
        }
    });
});

module.exports = mongoose.model('Subscription', SubscriptionSchema, 'subscription');