const mongoose = require("mongoose");

const matchSchema = new mongoose.Schema(
  {
    donor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    donorProfile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DonorProfile",
      required: true,
    },
    recipientRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RecipientRequest",
      required: true,
    },
    organ: {
      type: String,
      enum: ["kidney", "liver", "cornea", "heart", "lungs", "pancreas"],
      required: true,
    },
    hospital: {
      type: String,
      required: true,
    },
    matchedBy: {
      type: String,
      enum: ["system", "admin"],
      default: "system",
    },
    status: {
      type: String,
      enum: ["proposed", "confirmed", "completed", "cancelled"],
      default: "proposed",
    },
    notes: {
      type: String,
      default: "",
    },
    matchedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Match", matchSchema);