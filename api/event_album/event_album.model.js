'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;
var Album = require('../album/album.model');
var Event = require('../event/event.model');
var Photo = require('../photo/photo.model');

var options = {discriminatorKey: 'kind'};

var EventAlbumSchema = new Schema({
    numberOfPhoto: {
        type : Number,
        default : 0
    }
}, options);

EventAlbumSchema.post('remove', function () {
    //if (this.numberOfPhoto > 0) {
    //    Photo.find({event: this._id})
    //        .limit(this.numberOfPhoto)
    //        .exec(function (err, photos) {
    //            if (!err && photos && photos.length > 0) {
    //                let albums = {};
    //                let albumIds = [];
    //                for (let i = 0; i < photos.length; i++) {
    //                    let albumId = photos[i].album.toString();
    //                    albums[albumId] = 0;
    //                    albumIds.push(albumId);
    //                    photos[i].remove();
    //                }
    //                for (let i = 0; i < albumIds.length; i++) {
    //                    albums[albumIds[i]] = albums[albumIds[i]] + 1;
    //                }
    //                for (let key in albums) {
    //                    Album.findById(key, function (err, album) {
    //                        if (!err && album) {
    //                            album.numberOfPhoto = album.numberOfPhoto - albums[key];
    //                            album.save();
    //                        }
    //                    });
    //                }
    //            }
    //        });
    //}
});

module.exports = Event.discriminator('EAlbum', EventAlbumSchema);