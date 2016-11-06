'use strict';

var express = require('express');
var controller = require('./message.controller');

var router = express.Router();

router.post('/create', controller.create);
router.post('/read', controller.read);
router.post('/list', controller.list);

module.exports = router;
