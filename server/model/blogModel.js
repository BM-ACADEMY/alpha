// model/blogModel.js
import mongoose from 'mongoose';

const blogSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    images: [{ type: String }], // e.g. "/Uploads/filename.jpg"
    publish: { type: Boolean, default: false },
    
    // NEW: Visibility status
    status: {
      type: String,
      enum: ['website', 'user', 'both'],
      default: 'website',
      required: true
    }
  },
  { timestamps: true }
);

export default mongoose.model('Blog', blogSchema);