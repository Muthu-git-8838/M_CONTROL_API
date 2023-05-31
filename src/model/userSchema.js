const mongoose = require("mongoose");

const User = new mongoose.Schema({
  userName: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
});

const Users = mongoose.model("accounts", User);
module.exports = Users;
