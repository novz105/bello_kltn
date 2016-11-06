'use strict';

var _ = require('lodash');
var Notification = require('./notification.model');
var User = require('../user/user.model');

exports.list = function (req, res) {
    var offset = req.body.offset;
    var limit = req.body.limit;
    Notification.find({receiver:req.body.user._id})
        .limit(limit)
        .skip(offset)
        .populate('owner')
        .sort({"_id": -1})
        .exec(function (err, notis) {
            if (err) {
                return res.json(500, err);
            }
            return res.json(200, {code: 200, message: 'Successful', data:notis});
        });
};

exports.read = function (req, res) {
    var notis = req.body.notis;
    var userId = req.body.user._id;
    if (notis && notis.length > 0) {
        User.findById(userId, function (err, user) {
            if (err) {
                return res.json(500, err);
            }
            if (!user) {
                return res.json(200, {code: 404, message: 'User not found'});
            } else {
                Notification.find({
                    '_id': { $in: notis }
                })
                    .exec(function(err, notifications) {
                        if (err) {
                            return res.json(500, err);
                        }
                        if (notifications && notifications.length > 0) {
                            let count = 0;
                            for (let i = 0; i < notifications.length; i++) {
                                if (notifications[i].read == false) {
                                    notifications[i].read = true;
                                    notifications[i].save();
                                    count++;
                                }
                            }
                            user.notification = user.notification - count;
                            user.save(function (err, updatedUser) {
                                if (err) {
                                    return res.json(500, err);
                                } else {
                                    return res.json(200, {code: 200, message: 'Successful', data:updatedUser.notification});
                                }
                            });
                        } else {
                            return res.json(200, {code: 200, message: 'Nothing found', data:user.notification});
                        }

                    });
            }
        });
    } else {
        return res.json(200, {code: 401, message: 'Params error'});
    }
};

exports.tap = function (req, res) {
    var noti = req.body._id;
    if (noti != undefined) {
        Notification.findById(noti)
            .exec(function(err, notification) {
                if (err) {
                    return res.json(500, err);
                }
                if (notification) {
                    notification.tap = true;
                    notification.save(function(err, updatedNoti){
                        if (err) {
                            return res.json(500, err);
                        } else {
                            return res.json(200, {code: 200, message: 'Successful'});
                        }
                    });
                } else {
                    return res.json(200, {code: 404, message: 'Nothing found'});
                }

            });
    } else {
        return res.json(200, {code: 401, message: 'Params error'});
    }
};

exports.delete = function (req, res) {
    Notification.findById(req.body._id, function (err, noti) {
        if (err) {
            return res.json(500, err);
        }
        if (!noti) {
            return res.json(200, {code: 404, message: 'Notification not found'});
        }
        Notification.remove(function (err) {
            if (err) {
                return res.json(500, err);
            }
            return res.json(200, {code: 200, message: 'Delete notification success'});
        });
    });
};