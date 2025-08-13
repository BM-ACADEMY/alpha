const mongoose = require("mongoose");
const Counter = require("./counterModel");

const RoleSchema = new mongoose.Schema(
  {
    role_id: {
      type: Number,
      unique: true,
    },
    role_name: {
      type: String,
      enum: ["admin", "user"],
      default: "user",
      required: true,
    },
  },
  { timestamps: true }
);

// Auto-increment role_id before saving
RoleSchema.pre("save", async function (next) {
  if (this.isNew) {
    const counter = await Counter.findOneAndUpdate(
      { id: "role_id" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    this.role_id = counter.seq;
  }
  next();
});

module.exports = mongoose.model("Role", RoleSchema);
