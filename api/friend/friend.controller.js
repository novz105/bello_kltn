'use strict';

var _ = require('lodash');
var User = require('./../user/user.model');
var Friend = require('./../friend/friend.model');
var Notification = require('./../notification/notification.model');
var clients = require('./../../config/clients');
var Push = require('./../../config/push')(null);

exports.friendList = function (req, res) {
    var userId = req.body.user._id;
    var offset = req.body.offset;
    var limit = req.body.limit;

    Friend.find({
        $and: [
            {$or: [{userA: userId}, {userB: userId}]},
            {areFriend: true}
        ]
    })
        .skip(offset)
        .limit(limit)
        .exec(function (err, friends) {
            if (err) {
                return res.json(500, err);
            }
            var numberOfFriend = friends.length;
            if (numberOfFriend == 0) {
                var data = {
                    code: 200,
                    message: 'No records found',
                    data: []
                }
                return res.json(200, data);
            }
            var numberOfPopulatedFriend = 0;
            var resultData = [];
            for (let i = 0; i < numberOfFriend; i++) {
                var friendId = (friends[i].userA == userId) ? friends[i].userB : friends[i].userA
                User.findById(friendId)
                    .exec(function (err, user) {
                        numberOfPopulatedFriend++;
                        if (!err && user) {
                            resultData.push(user);
                        }
                        if (numberOfPopulatedFriend == numberOfFriend) {
                            if (resultData.length == numberOfFriend) {
                                var data = {
                                    code: 200,
                                    message: 'Successful',
                                    data: resultData
                                }
                                return res.json(200, data);
                            } else {
                                return res.json(500);
                            }
                        }
                    });
            }
        });
};

exports.requestList = function (req, res) {
    var userId = req.body.friend.userB._id;
    var offset = req.body.offset;
    var limit = req.body.limit;

    Friend.find({
        $and: [
            {userB: userId},
            {areFriend: false}
        ]
    })
        .lean()
        .skip(offset)
        .limit(limit)
        .populate('userA')
        .exec(function (err, friends) {
            if (err) {
                return res.json(500, err);
            }
            let numberOfFriend = friends.length;
            if (numberOfFriend == 0) {
                let data = {
                    code: 200,
                    message: 'No records found',
                    data: []
                }
                return res.json(200, data);
            } else {
                let data = {
                    code: 200,
                    message: 'Successful',
                    data: friends
                }
                return res.json(200, data);
            }
        });
};

exports.read = function (req, res) {
    var requests = req.body.requests;
    var userId = req.body.user._id;
    if (requests && requests.length > 0) {
        User.findById(userId, function (err, user) {
            if (err) {
                return res.json(500, err);
            }
            if (!user) {
                return res.json(200, {code: 404, message: 'User not found'});
            } else {
                Friend.find({
                    '_id': { $in: requests }
                })
                    .exec(function(err, unreadRequests) {
                        if (err) {
                            return res.json(500, err);
                        }
                        if (unreadRequests && unreadRequests.length > 0) {
                            let count = 0;
                            for (let i = 0; i < unreadRequests.length; i++) {
                                if (unreadRequests[i].read == false) {
                                    unreadRequests[i].read = true;
                                    unreadRequests[i].save();
                                    count++;
                                }
                            }
                            user.request = user.request - count;
                            user.save(function (err, updatedUser) {
                                if (err) {
                                    return res.json(500, err);
                                } else {
                                    return res.json(200, {code: 200, message: 'Nothing found', data:updatedUser.request});
                                }
                            });
                        } else {
                            return res.json(200, {code: 200, message: 'Nothing found', data:user.request});
                        }

                    });
            }
        });
    } else {
        return res.json(200, {code: 401, message: 'Params error'});
    }
};

exports.create = function (req, res) {
    User.findById(req.body.userB, function(err, userB) {
        if (err) {
            return res.json(500, err);
        }
        if (!userB) {
            return res.json(200, {code: 404, message: 'User not found'});
        } else {
            var dataFriend = {
                userA: req.body.userA,
                userB: req.body.userB
            };
            var friend = new Friend(dataFriend);

            friend.save(function (err, newFriend) {
                if (err) {
                    return res.json(500, err);
                }
                userB.request = userB.request + 1;
                userB.save(function(err, updatedUserB) {
                    if (err) {
                        newFriend.remove();
                        return res.json(500, err);
                    }
                    Push.sendRequest(newFriend, updatedUserB);
                    var data = {
                        message: 'Friend request sent',
                        code: 200,
                        data: newFriend
                    }
                    return res.json(200, data);
                });
            });
        }
    });
}

exports.accept = function (req, res) {
    var friendId = req.body._id;
    Friend.findById(friendId, function (err, friend) {
        if (err) {
            return res.json(500, err);
        }
        if (!friend) {
            return res.json(200, {code: 404, message:'There is no friend request to you from this person'});
        }

        if (friend.areFriend == true) {
            var data = {
                message: 'They are friend before',
                code: 200,
                data: friend
            }
            return res.json(200, data);
        } else {
            friend.areFriend = true;
            friend.save(function (err, newFriend) {
                if (err) {
                    return res.json(500, err);
                }

                let completion = function () {
                    Notification.create({
                        owner: newFriend.userB,
                        receiver: newFriend.userA,
                        object: newFriend.userB,
                        kind: 19,
                        action: 3
                    }, function (err, newNoti) {
                        if (!err && newNoti) {
                            Push.sendPush(newNoti);
                        }
                    });
                    var data = {
                        message: 'Friend request accepted',
                        code: 200,
                        data: newFriend
                    }
                    return res.json(200, data);
                }
                if (newFriend.read == true) {
                    completion();
                } else {
                    User.findById(newFriend.userB, function(err, user) {
                        if (err) {
                            return res.json(500, err);
                        }
                        if (!user) {
                            return res.json(200, {code: 404, message: 'User not found'});
                        } else {
                            user.request = user.request - 1;
                            user.save(function (err, updatedUser){
                                if (err) {
                                    return res.json(500, err);
                                }
                                newFriend.read = false;
                                newFriend.save();
                                completion();
                            });

                        }
                    });
                }
            });
        }
    });
}

exports.unfriend = function (req, res) {
    var friendId = req.body._id;
    Friend.findById(friendId, function (err, friend) {
        if (err) {
            return res.json(500, err);
        }
        var data = {
            message: 'Unfriend success',
            code: 200
        }
        if (!friend) {
            return res.json(200,data);
        }

        friend.remove(function (err) {
            if (err) {
                return res.json(500, err);
            }
            return res.json(200,data);
        });
    });
}

exports.cancel = function (req, res) {
    var friendId = req.body._id;
    Friend.findById(friendId, function (err, friend) {
        if (err) {
            return res.json(500, err);
        }
        var data = {
            message: 'Delete Request Success',
            code: 200
        }
        if (!friend) {
            return res.json(200,data);
        }
        if (friend.read == false) {
            User.findById(friend.userB, function(err, userB){
                if (err) {
                    return res.json(500, err);
                }
                userB.request = userB.request - 1;
                userB.save(function(err, updatedUserB){
                    if (err) {
                        return res.json(500, err);
                    }
                    friend.remove(function (err) {
                        if (err) {
                            return res.json(500, err);
                        }
                        data.data = updatedUserB.request;
                        return res.json(200, data);
                    });
                })
            });
        } else {
            friend.remove(function (err) {
                if (err) {
                    return res.json(500, err);
                }
                return res.json(200, data);
            });
        }
    });
}