'use strict';

var express = require('express');
var controller = require('./notification.controller');

var router = express.Router();

router.post('/create', controller.create);
router.post('/delete', controller.create);

module.exports = router;
