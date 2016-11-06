'use strict';

var express = require('express');
var controller = require('./user.controller');

var router = express.Router();

router.post('/create', controller.create);
router.post('/email', controller.email);
router.post('/friend', controller.friend);
router.post('/changePassword', controller.changePassword);
router.post('/update', controller.update);
router.post('/info', controller.info);
router.post('/chat_info', controller.chat_info);
router.post('/search', controller.search);


module.exports = router;
