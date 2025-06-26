const mongoose = require('mongoose');

const wordPackSchema = new mongoose.Schema({
    packId: { 
        type: String, 
        required: true, 
        unique: true 
    },
    name: { 
        type: String, 
        required: true,
        default: "New word pack"
    },
    language: { 
        type: String, 
        required: true,
        default: "english"
    },
    description: { 
        type: String, 
        required: true ,
        default: "No description."
    },
    version: {
        type: String,
        required: true,
        default: "1.0.0"
    },
    type: {
        type: String,
        required: true,
        default: "text"
    },
    words: { 
        type: [String], 
        required: true,
        default: []
    }
});

module.exports = wordPackSchema;