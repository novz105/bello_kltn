'use strict';

var _ = require('lodash');
var Subscription = require('./subscription.model');
var User = require('../user/user.model');
var EventPost = require('../event_post/event_post.model');
var Photo = require('../photo/photo.model');
var Avatar = require('../avatar/avatar.model');
var Cover = require('../cover/cover.model');
var Album = require('../album/album.model');

exports.create = function (req, res) {
    if (req.body.owner != undefined &&
        req.body.kind != undefined &&
        req.body.kind >= 10 && req.body.kind <= 14) {
        var createSub = function(dataSub) {
            Subscription.create(dataSub, function (err, sub) {
                if (err) {
                    return res.json(500, err);
                }
                return res.json(200, {code: 200, message: 'Successful', data: sub});
            });
        }
        if (req.body.kind == 10) {
            EventPost.findById(req.body.object,function(err, event){
                if (err) {
                    return res.json(500, err);
                }
                if (!event) {
                    return res.json(200, {code: 404, message: 'Event not found'});
                } else {
                    Subscription.findOne({object: event._id, owner: req.body.owner}, function (err, sub) {
                        if (err) {
                            return res.json(500, err);
                        }
                        if (!sub) {
                            let dataSub = {
                                object: event._id,
                                owner: req.body.owner,
                                kind: event.user.toString() != req.body.owner.toString() ? req.body.kind : 0
                            }
                            return createSub(dataSub);
                        } else {
                            return res.json(200, {code: 200, message:'Already subscribed', data:sub});
                        }
                    });
                }
            });
        } else if (req.body.kind == 11) {
            Photo.findById(req.body.object,function(err, photo){
                if (err) {
                    return res.json(500, err);
                }
                if (!event) {
                    return res.json(200, {code: 404, message: 'Photo not found'});
                } else {
                    Subscription.findOne({object: photo._id, owner: req.body.owner}, function (err, sub) {
                        if (err) {
                            return res.json(500, err);
                        }
                        if (!sub) {
                            let dataSub = {
                                object: photo._id,
                                owner: req.body.owner,
                                kind: photo.user.toString() != req.body.owner.toString() ? req.body.kind : 1
                            }
                            return createSub(dataSub);
                        } else {
                            return res.json(200, {code: 200, message:'Already subscribed', data:sub});
                        }
                    });
                }
            });
        } else if (req.body.kind == 12) {
            Avatar.findById(req.body.object,function(err, avatar) {
                if (err) {
                    return res.json(500, err);
                }
                if (!event) {
                    return res.json(200, {code: 404, message: 'Avatar not found'});
                } else {
                    Subscription.findOne({object: avatar._id, owner: req.body.owner}, function (err, sub) {
                        if (err) {
                            return res.json(500, err);
                        }
                        if (!sub) {
                            let dataSub = {
                                object: avatar._id,
                                owner: req.body.owner,
                                kind: avatar.user.toString() != req.body.owner.toString() ? req.body.kind : 2
                            }
                            return createSub(dataSub);
                        } else {
                            return res.json(200, {code: 200, message:'Already subscribed', data:sub});
                        }
                    });
                }
            });
        } else if (req.body.kind == 13) {
            Cover.findById(req.body.object,function(err, cover){
                if (err) {
                    return res.json(500, err);
                }
                if (!event) {
                    return res.json(200, {code: 404, message: 'Cover not found'});
                } else {
                    Subscription.findOne({object: cover._id, owner: req.body.owner}, function (err, sub) {
                        if (err) {
                            return res.json(500, err);
                        }
                        if (!sub) {
                            let dataSub = {
                                object: cover._id,
                                owner: req.body.owner,
                                kind: cover.user.toString() != req.body.owner.toString() ? req.body.kind : 3
                            }
                            return createSub(dataSub);
                        } else {
                            return res.json(200, {code: 200, message:'Already subscribed', data:sub});
                        }
                    });
                }
            });
        } else if (req.body.kind == 14) {
            Album.findById(req.body.object,function(err, album){
                if (err) {
                    return res.json(500, err);
                }
                if (!event) {
                    return res.json(200, {code: 404, message: 'Album not found'});
                } else {
                    Subscription.findOne({object: album._id, owner: req.body.owner}, function (err, sub) {
                        if (err) {
                            return res.json(500, err);
                        }
                        if (!sub) {
                            let dataSub = {
                                object: album._id,
                                owner: req.body.owner,
                                kind: album.user.toString() != req.body.owner.toString() ? req.body.kind : 4
                            }
                            return createSub(dataSub);
                        } else {
                            return res.json(200, {code: 200, message:'Already subscribed', data:sub});
                        }
                    });
                }
            });
        }
    } else {
        return res.json(200, {code: 401, message: 'Params error'});
    }
};

exports.delete = function (req, res) {

    Subscription.findById(req.body._id, function (err, subs) {
        if (err) {
            return res.json(500, err);
        }
        if (!subs) {
            return res.json(200, {code: 404, message: 'Subscription not found'});
        }
        Subscription.remove(function (err) {
            if (err) {
                return res.json(500, err);
            }
            return res.json(200, {code: 200, message: 'Successful'});
        });
    });
};
