/**
 * Main application routes
 */

'use strict';

module.exports = function(app) {
    app.use('/auth', require('./auth'));
    app.use('/api/user', require('./api/user'));
    app.use('/api/event', require('./api/event'));
    app.use('/api/event_post', require('./api/event_post'));
    app.use('/api/event_avatar', require('./api/event_avatar'));
    app.use('/api/event_album', require('./api/event_album'));
    app.use('/api/event_cover', require('./api/event_cover'));

    app.use('/api/album', require('./api/album'));
    app.use('/api/photo', require('./api/photo'));
    app.use('/api/avatar', require('./api/avatar'));
    app.use('/api/cover', require('./api/cover'));

    app.use('/api/comment_post', require('./api/comment_post'));
    app.use('/api/comment_photo', require('./api/comment_photo'));
    app.use('/api/comment_avatar', require('./api/comment_avatar'));
    app.use('/api/comment_cover', require('./api/comment_cover'));
    app.use('/api/comment_album', require('./api/comment_album'));

    app.use('/api/like_post', require('./api/like_post'));
    app.use('/api/like_photo', require('./api/like_photo'));
    app.use('/api/like_avatar', require('./api/like_avatar'));
    app.use('/api/like_cover', require('./api/like_cover'));
    app.use('/api/like_album', require('./api/like_album'));


    app.use('/api/message', require('./api/message'));
    app.use('/api/conversation', require('./api/conversation'));
    app.use('/api/friend', require('./api/friend'));
    app.use('/api/notification', require('./api/notification'));
    //app.use('/api/things', require('./api/thing'));

    app.route('/:url(api|auth)/*')
        .get(function (req, res) {
            res.json({
                message: 'Hello man!!!'
            })
        });

    app.route('/*')
        .get(function( req, res) {
            res.json({
                message: 'Hello man!!!'
            })
        });
};
