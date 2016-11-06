'use strict';

var express = require('express');
var controller = require('./notification.controller');

var router = express.Router();

router.get('/', controller.index);
router.get('/user/:id', controller.user);
router.post('/', controller.create);
router.put('/read/:id', controller.read);
router.put('/:id', controller.update);
router.patch('/:id', controller.update);
router.delete('/:id', controller.destroy);

module.exports = router;
