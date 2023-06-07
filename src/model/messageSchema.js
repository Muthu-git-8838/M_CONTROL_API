const mongoose = require("mongoose");

const messageSchema = mongoose.Schema(
  {
    // sender: { type: mongoose.Schema.Types.ObjectId, ref: "mcontrol" },
    sender: { type: String },

    content: { type: String, trim: true },
    // chat: { type: mongoose.Schema.Types.ObjectId, ref: "Chat" },
    // readBy: { type: mongoose.Schema.Types.ObjectId, ref: "mcontrol" },
  },
  { timestamps: true }
);

const Messages = mongoose.model("Message", messageSchema);

module.exports = Messages;
