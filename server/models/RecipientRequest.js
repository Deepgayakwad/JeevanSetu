const mongoose = require("mongoose");

const recipientRequestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    organNeeded: {
      type: String,
      enum: ["kidney", "liver", "cornea", "heart", "lungs", "pancreas"],
      required: true,
    },
    bloodGroup: {
      type: String,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
      required: true,
    },
    urgencyLevel: {
      type: String,
      enum: ["critical", "urgent", "normal"],
      default: "normal",
    },
    hospital: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },
    doctorNote: {
      type: String,
      default: "",
    },
    medicalReport: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["waiting", "matched", "transplanted", "closed"],
      default: "waiting",
    },
    additionalInfo: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("RecipientRequest", recipientRequestSchema);