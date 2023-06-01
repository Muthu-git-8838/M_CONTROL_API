const mongoose = require("mongoose");
const validator = require("validator");
const User =new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: [true, "Email already exist"],
    validate(value) {
      if (!validator.isEmail(value)) {
        throw new Error();
      }
    },
  },
  userName: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  mobile: {
    type: Number,
    required: true,
    unique: true,
  },
});

const Users = new mongoose.model("mcontrol", User);
module.exports = Users;
