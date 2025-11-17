import Blog from '../model/blogModel.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Fix __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// GET /api/blogs?search=...
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

// // POST /api/blogs/create-blog
// export const createBlog = async (req, res) => {
//   const { title, description } = req.body;

//   if (!title?.trim() || !description?.trim()) {
//     return res.status(400).json({ message: 'Title and description are required' });
//   }

//   try {
//     const images = req.files?.map((file) => `/Uploads/${file.filename}`) || [];

//     const blog = new Blog({
//       title: title.trim(),
//       description: description.trim(),
//       images,
//     });

//     await blog.save();
//     res.status(201).json(blog);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: 'Server error' });
//   }
// };

// // PUT /api/blogs/:id
// export const updateBlog = async (req, res) => {
//   const { id } = req.params;
//   const { title, description, existingImages = [], removedImages = [] } = req.body;

//   if (!title?.trim() || !description?.trim()) {
//     return res.status(400).json({ message: 'Title and description required' });
//   }

//   try {
//     // Delete removed images from filesystem
//     if (removedImages.length > 0) {
//       removedImages.forEach((imgPath) => {
//         try {
//           const fullPath = path.join(__dirname, '..', imgPath);
//           if (fs.existsSync(fullPath)) {
//             fs.unlinkSync(fullPath);
//             console.log(`Deleted file: ${fullPath}`);
//           }
//         } catch (err) {
//           console.warn(`Failed to delete image: ${imgPath}`, err);
//         }
//       });
//     }

//     // Build new images array
//     const newImages = req.files?.map((f) => `/Uploads/${f.filename}`) || [];
//     const images = [...existingImages.filter(Boolean), ...newImages];

//     const blog = await Blog.findByIdAndUpdate(
//       id,
//       { title: title.trim(), description: description.trim(), images },
//       { new: true }
//     );

//     if (!blog) return res.status(404).json({ message: 'Blog not found' });
//     res.json(blog);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: 'Server error' });
//   }
// };

// DELETE /api/blogs/:id
export const deleteBlog = async (req, res) => {
  const { id } = req.params;
  try {
    const blog = await Blog.findById(id);
    if (!blog) return res.status(404).json({ message: 'Not found' });

    // Delete all associated images
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


// POST /api/blogs/create-blog
export const createBlog = async (req, res) => {
  const { title, description, publish } = req.body;   // <-- add publish

  if (!title?.trim() || !description?.trim()) {
    return res.status(400).json({ message: 'Title and description are required' });
  }

  try {
    const images = req.files?.map((file) => `/Uploads/${file.filename}`) || [];

    const blog = new Blog({
      title: title.trim(),
      description: description.trim(),
      images,
      publish: publish === 'true' || publish === true, // coerce string → bool
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
  const { title, description, existingImages = [], publish } = req.body; // <-- add

  if (!title?.trim() || !description?.trim()) {
    return res.status(400).json({ message: 'Title and description required' });
  }

  try {
    // … (image deletion logic unchanged) …

    const newImages = req.files?.map((f) => `/Uploads/${f.filename}`) || [];
    const images = [...existingImages.filter(Boolean), ...newImages];

    const blog = await Blog.findByIdAndUpdate(
      id,
      {
        title: title.trim(),
        description: description.trim(),
        images,
        publish: publish === 'true' || publish === true, // coerce
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

// controller/blogController.js
export const getPublishedBlogs = async (req, res) => {
  try {
    const { search } = req.query;

    // ──────────────────────────────────────────────────────
    // 1. Build the search part (unchanged)
    // ──────────────────────────────────────────────────────
    const searchQuery = search
      ? {
          $or: [
            { title: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } },
          ],
        }
      : {};

    // ──────────────────────────────────────────────────────
    // 2. **Always** add the “approved” filter
    // ──────────────────────────────────────────────────────
    const finalQuery = {
      ...searchQuery,
      publish: true,               // ← NEW
    };

    const blogs = await Blog.find(finalQuery).sort({ createdAt: -1 });
    res.json(blogs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};