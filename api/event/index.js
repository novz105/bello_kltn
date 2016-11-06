'use strict';

var express = require('express');
var controller = require('./event.controller');
var auth = require('../../auth/auth.service');

var router = express.Router();
router.post('/timeline', controller.timeline);
router.post('/newsfeed', controller.newsfeed);
module.exports = router;
