const mongoose = require("mongoose");

const { Schema, model } = mongoose;

const userSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        minLength: 3,
    },
    email: {
        type: "String",
        required: true,
        unique: true
    },
    img: {
        type: "String",
      },
    password: {
        type: "String",
        required: true,
        minLength: 4,
    },
    isPremium: {
        type: "Boolean",
        default: false
    },
    payment_session_key: {
        type: "String"
    },
    resetToken: "String",
    tokenExpiration: Date
})

module.exports = model("User", userSchema);