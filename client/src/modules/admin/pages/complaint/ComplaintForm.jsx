import React, { useState } from 'react';
import axiosInstance from '@/utils/axiosInstance';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { X } from 'lucide-react';

const ComplaintForm = ({ userId }) => {
  const [formData, setFormData] = useState({
    complaint_type: '',
    description: '',
  });
  const [images, setImages] = useState([]);
  const [imageUrls, setImageUrls] = useState([]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = async (e) => {
    const newFiles = Array.from(e.target.files);
    if (newFiles.length + images.length > 5) {
      alert('Maximum 5 images allowed');
      return;
    }

    const formDataUpload = new FormData();
    newFiles.forEach(file => formDataUpload.append('images', file));

    try {
      const res = await axiosInstance.post('/complaints/upload/image', formDataUpload);
      setImages([...images, ...newFiles]);
      setImageUrls([...imageUrls, ...res.data.urls]);
    } catch (err) {
      console.error('Image upload failed:', err);
      alert('Failed to upload images');
    }
  };

  const handleDeleteImage = async (index) => {
    const url = imageUrls[index];
    const filename = url.split('/').pop();
    try {
      await axiosInstance.delete(`/complaints/images/${filename}`);
      const newImages = images.filter((_, i) => i !== index);
      const newImageUrls = imageUrls.filter((_, i) => i !== index);
      setImages(newImages);
      setImageUrls(newImageUrls);
    } catch (err) {
      console.error('Image deletion failed:', err);
      alert('Failed to delete image');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.post('/complaints', {
        user_id:userId,
        complaint_type: formData.complaint_type,
        description: formData.description,
        image_urls: imageUrls,
      });
      alert('Complaint submitted successfully');
      setFormData({ complaint_type: '', description: '' });
      setImages([]);
      setImageUrls([]);
    } catch (err) {
      console.error('Complaint submission failed:', err);
      alert('Failed to submit complaint');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl mx-auto">
      <Select onValueChange={(value) => setFormData({ ...formData, complaint_type: value })}>
        <SelectTrigger>
          <SelectValue placeholder="Select Complaint Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="Technical Issue">Technical Issue</SelectItem>
          <SelectItem value="Billing Issue">Billing Issue</SelectItem>
          <SelectItem value="Service Issue">Service Issue</SelectItem>
          <SelectItem value="Other">Other</SelectItem>
        </SelectContent>
      </Select>
      <Textarea
        name="description"
        value={formData.description}
        onChange={handleChange}
        placeholder="Describe your complaint"
        rows={5}
      />
      <Input
        type="file"
        multiple
        accept="image/*"
        onChange={handleImageChange}
      />
      <div className="grid grid-cols-3 gap-4">
        {imageUrls?.map((url, idx) => (
          <div key={idx} className="relative">
            <img src={url} alt="preview" className="w-full h-32 object-cover rounded" />
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-1 right-1"
              onClick={() => handleDeleteImage(idx)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
      <Button type="submit" className="w-full">Submit Complaint</Button>
    </form>
  );
};

export default ComplaintForm;
