import mongoose from 'mongoose';

const blogSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    images: [{ type: String }], // public URLs, e.g. "/Uploads/123.jpg"

    // NEW FIELD
    publish: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model('Blog', blogSchema);