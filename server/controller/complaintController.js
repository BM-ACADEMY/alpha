const Complaint = require('../model/complaintModel');
const User = require('../model/usersModel');
const transporter = require('../utils/nodemailer');
const { processFile } = require('../utils/FileUpload');
const fs = require('fs');
const path = require('path');
const mime = require('mime-types');
const FOLDER_NAME = 'complaints';

// Generate a random 6-digit number
const generateRandomNumber = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Create Complaint
exports.createComplaint = async (req, res) => {
  try {
    const { user_id, complaint_type, description } = req.body;
    const files = req.files;

    const user = await User.findById(user_id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const image_urls = [];
    if (files && files.length > 0) {
      const userFolder = path.join(FOLDER_NAME, user_id); // Correct path: complaints/user_id
      for (const file of files) {
        const randomNum = generateRandomNumber();
        const newFilename = `${user.username}${randomNum}${path.extname(file.originalname)}`;
        const imageUrl = await processFile(file.buffer, newFilename, user_id, user.username, FOLDER_NAME);
        image_urls.push(imageUrl);
      }
    }

    const complaint = new Complaint({
      user_id,
      complaint_type,
      description,
      image_urls,
    });

    await complaint.save();

    res.status(201).json({ message: 'Complaint submitted successfully', complaint });
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

// Get All Complaints with Pagination
// Updated Backend Function (complaintController.js)
exports.getAllComplaints = async (req, res) => {
  try {
    const { user_id } = req.query; // ✅ Get user_id from query params
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Create a filter object, if user_id exists, add it to the filter
    const filter = {};
    if (user_id) {
        filter.user_id = user_id; // ✅ Filter by user_id
    }

    const complaints = await Complaint.find(filter) // ✅ Use the filter
      .populate('user_id', 'username email phone_number')
      .skip(skip)
      .limit(limit)
      .sort({ created_at: -1 });

    const total = await Complaint.countDocuments(filter); // ✅ Count documents with the same filter

    res.json({ complaints, total, page, limit });
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};
// Get Complaint By ID
exports.getComplaintById = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id).populate('user_id', 'name email phone');
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

    res.json(complaint);
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

// Mark as Read
exports.markAsRead = async (req, res) => {
  try {
    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      { is_read: true },
      { new: true }
    );
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

    res.json({ message: 'Complaint marked as read', complaint });
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

// Send Reply Email
exports.sendReply = async (req, res) => {
  try {
    const { message } = req.body;
    const complaint = await Complaint.findById(req.params.id).populate('user_id', 'username email');
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

    const user = complaint.user_id;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
        <div style="background: #1e293b; padding: 20px; text-align: center;">
          <h2 style="color: #ffffff; margin: 0;">Alpha R - Trading Platform</h2>
        </div>
        <div style="padding: 20px; color: #333;">
          <p>Dear <strong>${user.username}</strong>,</p>
          <p>Thank you for contacting our support team regarding your complaint.</p>
          <p><strong>Our Reply:</strong></p>
          <div style="background: #f9fafb; padding: 15px; border-left: 4px solid #1e40af; margin: 10px 0;">
            ${message}
          </div>
          <p>If you have any further questions, feel free to reply to this email.</p>
          <p>Best Regards, <br/> <strong>Alpha R Support Team</strong></p>
        </div>
        <div style="background: #f3f4f6; text-align: center; padding: 15px; font-size: 12px; color: #555;">
          &copy; ${new Date().getFullYear()} Alpha R. All rights reserved.<br/>
          This is an automated message, please do not reply directly.
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: `"Alpha R Support" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: 'Reply to Your Complaint - Alpha R',
      html: htmlContent,
    });

    res.json({ message: 'Reply sent successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

// Upload Image
exports.uploadImage = async (req, res) => {
  try {
    const { user_id } = req.body;
    const files = req.files;
    const user = await User.findById(user_id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const urls = [];
    const userFolder = path.join(FOLDER_NAME, user_id); // Correct path: complaints/user_id
    for (const file of files) {
      const randomNum = generateRandomNumber();
      const newFilename = `${user.username}${randomNum}${path.extname(file.originalname)}`;
      const url = await processFile(file.buffer, newFilename, user_id, user.username, FOLDER_NAME);
      urls.push(url);
    }
    res.json({ urls });
  } catch (err) {
    res.status(500).json({ message: 'Upload failed', error: err.message });
  }
};

// Delete Image
exports.deleteImage = async (req, res) => {
  try {
    const { id, filename } = req.params;
    const complaint = await Complaint.findById(id).populate('user_id', 'username');
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

    const imageUrl = complaint.image_urls.find(url => url.includes(filename));
    if (!imageUrl) return res.status(404).json({ message: 'Image not found' });

    const filePath = path.join(__dirname, '..', 'Uploads', FOLDER_NAME, complaint.user_id._id.toString(), filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    complaint.image_urls = complaint.image_urls.filter(url => !url.includes(filename));
    await complaint.save();

    res.json({ message: 'Image deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};


// exports.getComplaintImage = async (req, res) => {
//   const { user_id, filename } = req.params;
//   const complaint = await Complaint.findOne({ user_id, image_urls: { $elemMatch: { $regex: filename } } });
//   let filePath;

//   if (complaint && complaint.folder_prefix) {
//     filePath = path.join(__dirname, '../Uploads', 'complaints', `${complaint.folder_prefix}${user_id}`, filename);
//   } else {
//     filePath = path.join(__dirname, '../Uploads', 'complaints', user_id, filename);
//   }

//   console.log('getComplaintImage called:', { user_id, filename, filePath });

//   if (!fs.existsSync(filePath)) {
//     console.error('Image not found:', filePath);
//     return res.status(404).json({ message: 'Image not found' });
//   }

//   if (req.user && req.user.role !== 'admin' && req.user.id !== user_id) {
//     console.error('Unauthorized access:', { user: req.user, user_id });
//     return res.status(403).json({ message: 'Unauthorized' });
//   }

//   const mimeType = mime.lookup(filePath) || 'application/octet-stream';
//   res.setHeader('Content-Type', mimeType);
//   res.setHeader('Cache-Control', 'public, max-age=31536000');

//   res.sendFile(filePath, (err) => {
//     if (err) {
//       console.error('Error sending file:', err);
//       res.status(500).json({ message: 'Error serving file' });
//     }
//   });
// };
// Delete Complaint

// complaintController.js
exports.getComplaintImage = async (req, res) => {
  const { user_id, filename } = req.params;
  const filePath = path.join(__dirname, '../Uploads', FOLDER_NAME, user_id, filename);

  console.log('getComplaintImage called:', { user_id, filename, filePath });

  if (!fs.existsSync(filePath)) {
    console.error('Image not found:', filePath);
    return res.status(404).json({ message: 'Image not found' });
  }

  // Authorization check
  if (req.user && req.user.role !== 'admin' && req.user.id !== user_id) {
    console.error('Unauthorized access:', { user: req.user, user_id });
    return res.status(403).json({ message: 'Unauthorized' });
  }

  const mimeType = mime.lookup(filePath) || 'application/octet-stream';
  res.setHeader('Content-Type', mimeType);
  res.setHeader('Cache-Control', 'public, max-age=31536000');

  res.sendFile(filePath, (err) => {
    if (err) {
      console.error('Error sending file:', err);
      res.status(500).json({ message: 'Error serving file' });
    }
  });
};

// complaintController.js
exports.updateComplaintStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['Pending', 'Resolved', 'Rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!complaint) {
      return res.status(404).json({ message: 'Complaint not found' });
    }

    res.json({ message: 'Complaint status updated', complaint });
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

exports.deleteComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id).populate('user_id', '_id');
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

    if (complaint.image_urls && complaint.image_urls.length > 0) {
      for (const imageUrl of complaint.image_urls) {
        const filename = path.basename(imageUrl);
        const filePath = path.join(__dirname, '..', 'Uploads', FOLDER_NAME, complaint.user_id._id.toString(), filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    }

    await Complaint.findByIdAndDelete(req.params.id);
    res.json({ message: 'Complaint deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};