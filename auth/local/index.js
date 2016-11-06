'use strict';

var express = require('express');
var passport = require('passport');
var auth = require('../auth.service');
var User = require('../../api/user/user.model');
var Friend = require('../../api/friend/friend.model');
var router = express.Router();

function removeUserProperties(user) {
    user.hashedPassword = undefined;
    user.salt = undefined;
    user.role = undefined;
    user.__v = undefined;
    user.provider = undefined;
};

function removeFriendProperties(user) {
    user.hashedPassword = undefined;
    user.salt = undefined;
    user.__v = undefined;
    user.provider = undefined;
    user.role = undefined;
    user.friends = undefined;
    user.friendRequests = undefined;
};

router.post('/', function (req, res, next) {
    console.log('----' + req);
    passport.authenticate('local', function (err, user, info) {
        var error = err || info;
        if (error) return res.json(401, {
            code: 401,
            message: error.message
        });
        if (!user)
            return res.json(200,
                {
                    code: 404,
                    message: 'Authentication failed. Wrong password.'
                });

        /*if (user.role != 'admin') return res.json(404,
         {

         message: 'Authentication failed. Wrong role.'
         }
         );*/
        var token = auth.signToken(user._id, user.role);

        //var userId = user._id;

        //Friend.find({$or: [{userA: userId}, {userB: userId}]})
        //    .exec(function (err, friends) {
        //        if (err) {
        //            return res.json(500, err);
        //        }
        //        var resultData = [];
        //        if (friends && friends.length > 0) {
        //            for (let i = 0; i < friends.length; i++) {
        //                var friendId = (friends[i].userA == userId) ? friends[i].userB : friends[i].userA;
        //                resultData.push(friendId);
        //            }
        //        }
        //
        //    });
        return res.json({
                code: 200,
                message: 'Enjoy your token!',
                data: {
                    token: token,
                    user: user
                }
            }
        );
    })(req, res, next)
});

module.exports = router;