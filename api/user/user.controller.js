'use strict';

var User = require('./user.model');
var Friend = require('./../friend/friend.model');
var passport = require('passport');
var config = require('../../config/config.js');
var jwt = require('jsonwebtoken');
var _ = require('lodash');
var clients = require('./../../config/clients');
var push = require('./../../config/push');

exports.friend = function (req, res) {
    var userId = req.body.user._id;
    var friendId = req.body.friend._id;

    User.findById(friendId, function (err, user) {
        if (err) {
            return res.json(500, err);
        }
        if (!user) {
            return res.json(404, {code: 404, message: 'User not found'});
        }
        Friend.findOne({
            $or: [
                {
                    userA: userId,
                    userB: friendId
                },
                {
                    userA: friendId,
                    userB: userId
                }
            ]
        })
            .exec(function (err, friend) {
                if (err) {
                    return res.json(500, err);
                }
                if (!friend) {
                    return res.json(200,{code: 200, message:'Successful',data:{user:user}});
                } else {
                    return res.json(200,{code: 200, message:'Successful',data:{user:user,friend:friend}});
                }
            });
    });
};

exports.update = function (req, res) {
    User.findById(req.body._id, function (err, user) {
        if (err) {
            return res.json(500, err);
        }
        if (!user) {
            return res.json(200, {code: 404, message: 'User not found'});
        }
        var updated = _.merge(user, req.body);
        updated.save(function (err, updatedUser) {
            if (err) {
                return res.json(500, err);
            }
            return res.json(200, {message:'User profile updated', code: 200, data: updatedUser});
        });
    });
}

/**
 * Creates a new user
 */
exports.create = function (req, res) {
    var email = req.body.email;
    var password = req.body.password;
    var name = req.body.name;
    if (!email || !email.length) {
        return res.json(200, {code: 401, message: 'Email cannot be blank'});
    }

    if (!password || !password.length) {
        return res.json(200, {code: 401, message: 'Password cannot be blank'});
    }

    if (!name || !name.length) {
        return res.json(200, {code: 401, message: 'Nick name cannot be blank'});
    }

    User.findOne({email: email}, function (err, existUser) {
        if (err) {
            return res.json(500, err);
        }
        if (!existUser) {
            User.create(req.body, function(err, user){
                if (err) {
                    return res.json(500, err);
                }
                if (user) {
                    var token = jwt.sign({
                        _id: user._id
                    }, config.secret, {
                        expiresInMinutes: 60 * 5
                    });

                    return res.json(200, {
                        code: 200,
                        message: 'Enjoy your token',
                        data: {
                            token: token,
                            user : user
                        }
                    });
                }
            });
        } else {
            return res.json(200, {
                code: 409,
                message: 'This email is already in use'
            });
        }
    });
};

/**
 * Get a single user by email
 */
exports.email = function (req, res) {
    var email = req.body.email;
    User.findOne({email: email}, function (err, user) {
        if (err) {
            return res.json(500, err);
        }
        if (!user) {
            return res.json(200, {code: 404, message: 'User not found'});
        }
        return res.json(200, {code: 200, message: 'Successful', data: user});
    });
};

exports.search = function (req, res) {
    let text = req.body.text;
    let offset = req.body.offset;
    let limit = req.body.limit;
    if (text != undefined && offset != undefined && limit != undefined) {
        User.find({$text: {$search:text}})
            .skip(offset)
            .limit(limit)
            .exec(function (err, users) {
                if (err) {
                    return res.json(500, err);
                }
                return res.json(200, {code: 200, message: 'Successful', data: users});
            });
    } else {
        return res.json(200, {code: 401, message: 'Params error'});
    }
}

exports.info = function (req, res) {
    //push.send();
    var userId = req.body._id;
    User.findById(userId, function (err, user) {
        if (err) {
            return res.json(500, err);
        }
        if (!user) {
            return res.json(200, {code: 404, message:'User not found'});
        }
        user.lastActivation = new Date();
        user.save();
        return res.json(200, {code: 200, message:'Successful', data:user});
    });
}

exports.chat_info = function (req, res) {
    //push.send();
    var userId = req.body._id;
    User.findById(userId, function (err, user) {
        if (err) {
            return res.json(500, err);
        }
        if (!user) {
            return res.json(200, {code: 404, message:'User not found'});
        }
        return res.json(200, {code: 200, message:'Successful', data:user});
    });
}

/**
 * Change a users password
 */
exports.changePassword = function (req, res) {
    var userId = req.body.user._id;
    var oldPass = String(req.body.oldPassword);
    var newPass = String(req.body.newPassword);

    User.findById(userId, function (err, user) {
        if (err) {
            return res.json(500, err);
        }
        if (!user) {
            return res.json(200, {code: 404, message: 'User not found'});
        }

        if (user.authenticate(oldPass)) {
            user.password = newPass;
            user.save(function (err) {
                if (err) {
                    return res.json(500, err);
                }
                res.json(200, {code: 200, message: 'Your password just changed'});
            });
        } else {
            res.json(200, {code: 404, message: 'Your old password is not correct'});
        }
    });
};
