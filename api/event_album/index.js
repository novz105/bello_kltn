'use strict';

var express = require('express');
var controller = require('./event_album.controller');
var auth = require('../../auth/auth.service');

var router = express.Router();
router.post('/create', controller.create);
router.post('/delete', controller.delete);
module.exports = router;
