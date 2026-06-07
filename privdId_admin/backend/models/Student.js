import mongoose from "mongoose";

const studentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    rollNo: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    programme: {
      type: String,
      required: true,
      trim: true,
    },
    contactNo: {
      type: String,
      required: true,
      trim: true,
    },
    dob: {
      type: String,
      required: false,
      trim: true,
    },
    hashedData: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    emailSent: {
      type: Boolean,
      default: false,
    },
    emailSentAt: {
      type: Date,
      default: null,
    },
    ipfsCID: {
      type: String,
      default: null,
    },
    onChainTxHash: {
      type: String,
      default: null,
    },
    onChainBlock: {
      type: Number,
      default: null,
    },
    revoked: {
      type: Boolean,
      default: false,
    },
    revokedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

const Student = mongoose.model("Student", studentSchema);

export default Student;