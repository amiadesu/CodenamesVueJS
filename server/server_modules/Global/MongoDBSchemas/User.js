const mongoose = require("mongoose");
const crypto = require("crypto");
const { makeID, makeColor } = require("../../../utils/extra");

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        default: () => `user_${makeID(5)}`
    },
    color : {
        type: String,
        required: true,
        default: () => makeColor()
    },
    sockets : {
        type: [String],
        required: true,
        default: []
    },
    codenamesID: {
        type: String,
        required: true,
        unique: true,
        default: crypto.randomUUID
    }
});

module.exports = userSchema;
