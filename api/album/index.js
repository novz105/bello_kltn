'use strict';

var express = require('express');
var controller = require('./album.controller');
var auth = require('../../auth/auth.service');

var router = express.Router();

router.post('/info', controller.info);
router.post('/list', controller.list);
router.post('/create', controller.create);
router.post('/update', controller.update);
router.post('/delete', controller.delete);

module.exports = router;
