var express = require('express');
var controller = require('./conversation.controller');

var router = express.Router();

router.post('/find', controller.find);
router.post('/info', controller.info);
router.post('/list', controller.list);

module.exports = router;