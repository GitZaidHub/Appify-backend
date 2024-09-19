const { Schema, model } = require("mongoose");

const UserSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  bio: { type: String, maxlength: 250 },
  avatar: { type: String },
  posts: { type: Number, default: 0 },
  isVerified: { type: Boolean, default: false }, // New field for email verification status
});

module.exports = model("User", UserSchema);
