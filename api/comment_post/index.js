var express = require('express');
var controller = require('./comment_post.controller');

var router = express.Router();

router.post('/create', controller.create);
router.post('/list', controller.list);
router.post('/update', controller.update);
router.post('/delete', controller.delete);

module.exports = router;