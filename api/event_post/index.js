'use strict';

var express = require('express');
var controller = require('./event_post.controller');
var auth = require('../../auth/auth.service');

var router = express.Router();
router.post('/create', controller.create);
router.post('/update', controller.update);
router.post('/delete', controller.delete);
router.post('/info', controller.info);
module.exports = router;
