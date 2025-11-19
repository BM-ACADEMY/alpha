import Blog from '../model/blogModel.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// GET all blogs (admin) - with optional search
export const getBlogs = async (req, res) => {
  try {
    const { search } = req.query;
    const query = search
      ? {
          $or: [
            { title: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } },
          ],
        }
      : {};

    const blogs = await Blog.find(query).sort({ createdAt: -1 });
    res.json(blogs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET only published blogs (public or user-facing)
export const getPublishedBlogs = async (req, res) => {
  try {
    const { search } = req.query;

    const searchQuery = search
      ? {
          $or: [
            { title: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } },
          ],
        }
      : {};

    const finalQuery = {
      ...searchQuery,
      publish: true,
    };

    const blogs = await Blog.find(finalQuery)
      .select('title description images status createdAt')
      .sort({ createdAt: -1 });

    res.json(blogs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/blogs/create-blog
export const createBlog = async (req, res) => {
  const { title, description, publish, status } = req.body;

  if (!title?.trim() || !description?.trim()) {
    return res.status(400).json({ message: 'Title and description are required' });
  }

  try {
    const images = req.files?.map((file) => `/Uploads/${file.filename}`) || [];

    const blog = new Blog({
      title: title.trim(),
      description: description.trim(),
      images,
      publish: publish === 'true' || publish === true,
      status: ['website', 'user', 'both'].includes(status) ? status : 'website',
    });

    await blog.save();
    res.status(201).json(blog);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/blogs/:id
export const updateBlog = async (req, res) => {
  const { id } = req.params;
  const { title, description, existingImages = [], publish, status } = req.body;

  if (!title?.trim() || !description?.trim()) {
    return res.status(400).json({ message: 'Title and description required' });
  }

  try {
    // Handle removed images (optional: you can send removed paths in future)
    // For now, just keep existing + new

    const newImages = req.files?.map((f) => `/Uploads/${f.filename}`) || [];
    const images = [...existingImages.filter(Boolean), ...newImages];

    const blog = await Blog.findByIdAndUpdate(
      id,
      {
        title: title.trim(),
        description: description.trim(),
        images,
        publish: publish === 'true' || publish === true,
        status: ['website', 'user', 'both'].includes(status) ? status : 'website',
      },
      { new: true }
    );

    if (!blog) return res.status(404).json({ message: 'Blog not found' });
    res.json(blog);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /api/blogs/:id
export const deleteBlog = async (req, res) => {
  const { id } = req.params;
  try {
    const blog = await Blog.findById(id);
    if (!blog) return res.status(404).json({ message: 'Not found' });

    // Delete all associated images from filesystem
    if (blog.images && blog.images.length > 0) {
      blog.images.forEach((imgPath) => {
        try {
          const fullPath = path.join(__dirname, '..', imgPath);
          if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
            console.log(`Deleted file: ${fullPath}`);
          }
        } catch (err) {
          console.warn(`Failed to delete image: ${imgPath}`, err);
        }
      });
    }

    await Blog.findByIdAndDelete(id);
    res.json({ message: 'Blog and images deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};