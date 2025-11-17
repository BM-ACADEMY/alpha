// routes/blog.routes.js
import express from 'express';
import { getBlogs, createBlog, updateBlog, deleteBlog} from '../controller/blogController.js';
import upload from '../middleware/upload.js';   // <-- import

const router = express.Router();

router.get('/fetch-all-blog', getBlogs);
router.post('/create-blog', upload.array('images', 5), createBlog); // <-- apply
router.put('/:id', upload.array('images', 5), updateBlog);
router.delete('/:id', deleteBlog);
export default router;