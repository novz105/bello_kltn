'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var crypto = require('crypto');
var Album = require('../album/album.model');

var UserSchema = new Schema({
    name: String,
    email: {
        type: String,
        lowercase: true,
        unique : true,
        required : true,
        index: true
    },
    gender: {
        type: Number,
        default: 0
    },
    avatar: {
        avatar: {
            type: Schema.Types.ObjectId,
            ref: 'Avatar'
        },
        url : String
    },
    cover: {
        cover: {
            type: Schema.Types.ObjectId,
            ref: 'Cover'
        },
        url : String
    },
    notification: {
        type: Number,
        default: 0
    },
    message: {
        type: Number,
        default: 0
    },
    request: {
        type: Number,
        default: 0
    },
    bio: String,
    birthday: {
        type: Date,
        default: new Date("Jan 1, 1990 11:59:59")
    },
    lastActivation: Date,
    hashedPassword: String,
    deviceToken: String,
    salt: String,
    timelineEnable: {
        type: Boolean,
        default: true
    },
    timelineWritten: {
        type: Boolean,
        default: true
    },
    notiPush: {
        type: Boolean,
        default: true
    },
    msgPush: {
        type: Boolean,
        default: true
    },
    birthdayReminder: {
        type: Boolean,
        default: true
    },
    role: {
        type: String,
        default: 'user'
    }
});

UserSchema.index({name: 'text', email: 'text'});

UserSchema.post('create', function() {
    //let avatar = {
    //    user: this._id,
    //    kind: 2
    //};
    //
    //let cover = {
    //    user: this._id,
    //    kind: 3
    //};
    //
    //let timeline = {
    //    user: this._id,
    //    kind: 1
    //};
    //
    //let albumAvatar = new Album(avatar);
    //let albumCover = new Album(cover);
    //let albumTimeline = new Album(timeline);
    //
    //albumAvatar.save();
    //albumCover.save();
    //albumTimeline.save();
    //
    //this.avatarAlbum = albumAvatar._id;
    //this.coverAlbum = albumCover._id;
    //this.timelineAlbum = albumTimeline._id;
    //
    //this.save();
});

/**
 * Virtuals
 */
UserSchema
    .virtual('password')
    .set(function (password) {
        this._password = password;
        this.salt = this.makeSalt();
        this.hashedPassword = this.encryptPassword(password);
    })
    .get(function () {
        return this._password;
    });

// Public profile information
UserSchema
    .virtual('profile')
    .get(function () {
        return {
            'name': this.name,
            'role': this.role
        };
    });

// Non-sensitive info we'll be putting in the token
UserSchema
    .virtual('token')
    .get(function () {
        return {
            '_id': this._id,
            'role': this.role
        };
    });

/**
 * Validations
 */

// Validate empty email
UserSchema
    .path('email')
    .validate(function (email) {
        return email.length;
    }, 'Email cannot be blank');

// Validate empty password
UserSchema
    .path('hashedPassword')
    .validate(function (hashedPassword) {
        return hashedPassword.length;
    }, 'Password cannot be blank');

// Validate email is not taken
UserSchema
    .path('email')
    .validate(function (value, respond) {
        var self = this;
        this.constructor.findOne({
            email: value
        }, function (err, user) {
            if (err) throw err;
            if (user) {
                if (self.id === user.id) {
                    return respond(true);
                } else {
                    return respond(false);
                }
            } else {
                return respond(true);
            }
        });
    }, 'The specified email address is already in use.');

var validatePresenceOf = function (value) {
    return value && value.length;
};

/**
 * Pre-save hook
 */
UserSchema
    .pre('save', function (next) {
        if (!this.isNew) return next();

        if (!validatePresenceOf(this.hashedPassword))
            next(new Error('Invalid password'));
        else
            next();
    });

/**
 * Methods
 */
UserSchema.methods = {
    /**
     * Authenticate - check if the passwords are the same
     *
     * @param {String} plainText
     * @return {Boolean}
     * @api public
     */
    authenticate: function (plainText) {
        return this.encryptPassword(plainText) === this.hashedPassword;
    },

    /**
     * Make salt
     *
     * @return {String}
     * @api public
     */
    makeSalt: function () {
        return crypto.randomBytes(16).toString('base64');
    },

    /**
     * Encrypt password
     *
     * @param {String} password
     * @return {String}
     * @api public
     */
    encryptPassword: function (password) {
        if (!password || !this.salt) return '';
        var salt = new Buffer(this.salt, 'base64');
        return crypto.pbkdf2Sync(password, salt, 10000, 64).toString('base64');
    },

    publicProperties: function () {
        return '_id avatar birthday cover bio email gender name';
    }
};


module.exports = mongoose.model('User', UserSchema, 'user');