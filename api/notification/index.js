'use strict';

var express = require('express');
var controller = require('./notification.controller');

var router = express.Router();

router.post('/list', controller.list);
router.post('/delete', controller.delete);
router.post('/read', controller.read);
router.post('/tap', controller.tap);

module.exports = router;
