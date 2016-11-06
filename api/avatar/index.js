'use strict';

var express = require('express');
var controller = require('./avatar.controller');
var auth = require('../../auth/auth.service');

var router = express.Router();

router.post('/info', controller.info);
router.post('/create', controller.create);
router.post('/update', controller.update);
router.post('/delete', controller.delete);
router.post('/list', controller.list);

module.exports = router;
