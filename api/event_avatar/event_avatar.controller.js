/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /Posts              ->  index
 * POST    /Posts              ->  create
 * GET     /Posts/:id          ->  show
 * PUT     /Posts/:id          ->  update
 * DELETE  /Posts/:id          ->  destroy
 */

'use strict';

var _ = require('lodash');
var EventAvatar = require('./event_avatar.model');
var Notification = require('../notification/notification.model');
var Avatar = require('../avatar/avatar.model');
var User = require('../user/user.model');
var clients = require('./../../config/clients');
var _ = require('lodash');
