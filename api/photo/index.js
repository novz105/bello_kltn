'use strict';

var express = require('express');
var controller = require('./photo.controller');
var auth = require('../../auth/auth.service');

var router = express.Router();

router.post('/info', controller.info);
router.post('/update', controller.update);
router.post('/delete', controller.delete);
router.post('/list', controller.list);

module.exports = router;
