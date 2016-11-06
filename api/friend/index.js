var express = require('express');
var controller = require('./friend.controller');

var router = express.Router();

router.post('/friendList', controller.friendList);
router.post('/requestList', controller.requestList);
router.post('/create', controller.create);
router.post('/accept', controller.accept);
router.post('/unfriend', controller.unfriend);
router.post('/cancel', controller.cancel);
router.post('/read', controller.read);

module.exports = router;