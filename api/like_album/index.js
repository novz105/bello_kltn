var express = require('express');
var controller = require('./like_album.controller');

var router = express.Router();

router.post('/create', controller.create);
router.post('/delete', controller.delete);
router.post('/list', controller.list);

module.exports = router;