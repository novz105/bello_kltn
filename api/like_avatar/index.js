var express = require('express');
var controller = require('./like_avatar.controller');

var router = express.Router();

router.post('/create', controller.create);
router.post('/delete', controller.delete);

module.exports = router;