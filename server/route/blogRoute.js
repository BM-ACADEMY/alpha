// routes/blog.routes.js
import express from 'express';
import { getBlogs, createBlog, updateBlog, deleteBlog, getPublishedBlogs, getWebsiteBlogs} from '../controller/blogController.js';
import upload from '../middleware/upload.js';   // <-- import

const router = express.Router();

router.get('/fetch-all-blog', getBlogs);
router.get('/fetch-published-blog', getPublishedBlogs);
router.post('/create-blog', upload.array('images', 5), createBlog); // <-- apply
router.put('/:id', upload.array('images', 5), updateBlog);
router.delete('/:id', deleteBlog);
// Add this new route to your blog.routes.js

router.get('/fetch-website-blogs', getWebsiteBlogs);
export default router;