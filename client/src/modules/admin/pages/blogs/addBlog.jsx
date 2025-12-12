'use client';

import React, { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getImageUrl } from '@/utils/ImageHelper';

export default function AddBlogModal({ open, onOpenChange, onAdd, initialBlog }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [publish, setPublish] = useState(false);
  const [status, setStatus] = useState('website');
  const [imageFiles, setImageFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setPublish(false);
    setStatus('website');
    setImageFiles([]);
    setPreviews([]);
    setExistingImages([]);
  };

  useEffect(() => {
    if (!open) {
      resetForm();
      return;
    }

    if (initialBlog) {
      setTitle(initialBlog.title || '');
      setDescription(initialBlog.description || '');
      setPublish(!!initialBlog.publish);
      setStatus(initialBlog.status || 'website');
      setExistingImages(initialBlog.images ? [...initialBlog.images] : []);
      setPreviews(
        initialBlog.images ? initialBlog.images?.map(getImageUrl) : []
      );
      setImageFiles([]);
    } else {
      resetForm();
    }
  }, [open, initialBlog]);

  // Cleanup blob URLs
  useEffect(() => {
    return () => {
      previews.forEach((url) => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [previews]);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const totalImages = imageFiles.length + existingImages.length + files.length;

    if (totalImages > 5) {
      alert(`Maximum 5 images allowed. You can add ${5 - (imageFiles.length + existingImages.length)} more.`);
      return;
    }

    const newPreviews = files?.map((file) => URL.createObjectURL(file));
    setPreviews((prev) => [...prev, ...newPreviews]);
    setImageFiles((prev) => [...prev, ...files]);
  };

  const removeExisting = (index) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const removeNew = (index) => {
    const realIndex = index - existingImages.length;
    const urlToRevoke = previews[index];
    if (urlToRevoke.startsWith('blob:')) {
      URL.revokeObjectURL(urlToRevoke);
    }
    setPreviews((prev) => prev.filter((_, i) => i !== index));
    setImageFiles((prev) => prev.filter((_, i) => i !== realIndex));
  };

  const handleSubmit = async () => {
    if (submitting) return;

    if (!title.trim()) {
      alert('Title is required.');
      return;
    }
    if (!description.trim()) {
      alert('Description is required.');
      return;
    }
    if (imageFiles.length + existingImages.length === 0) {
      alert('At least one image is required.');
      return;
    }

    setSubmitting(true);
    const form = new FormData();
    form.append('title', title.trim());
    form.append('description', description.trim());
    form.append('publish', publish);
    form.append('status', status);

    existingImages.forEach((path) => form.append('existingImages', path));
    imageFiles.forEach((file) => form.append('images', file));

    try {
      const isEdit = !!initialBlog;
      const url = isEdit ? `${import.meta.env.VITE_BASE_URL}/blogs/${initialBlog._id}` : `${import.meta.env.VITE_BASE_URL}/blogs/create-blog`;
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        body: form,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to save blog');
      }

      const savedBlog = await res.json();
      onAdd(savedBlog);
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      alert(err.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const totalImages = existingImages.length + imageFiles.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-screen overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialBlog ? 'Edit Blog' : 'Add New Blog'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Title */}
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter blog title"
              className="mt-1"
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="desc">Description</Label>
            <Textarea
              id="desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter blog description"
              rows={4}
              className="mt-1"
            />
          </div>

          {/* Publish Toggle */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="publish"
              checked={publish}
              onChange={(e) => setPublish(e.target.checked)}
              className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
            <Label htmlFor="publish" className="cursor-pointer select-none">
              Publish this blog
            </Label>
          </div>

          {/* Visibility Status */}
          <div>
            <Label htmlFor="status">Visibility</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select visibility" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="website">Website Only (Public)</SelectItem>
                <SelectItem value="user">Users Only (Logged-in)</SelectItem>
                <SelectItem value="both">Both (Public + Users)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Existing Images */}
          {existingImages.length > 0 && (
            <div>
              <Label>Current Images ({existingImages.length})</Label>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {existingImages?.map((path, i) => (
                  <div key={i} className="relative group">
                    <img
                      src={getImageUrl(path)}
                      alt={`existing-${i}`}
                      className="w-full h-24 object-cover rounded"
                    />
                    <button
                      type="button"
                      onClick={() => removeExisting(i)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload New Images */}
          <div>
            <Label>
              Add Images (up to {5 - totalImages})
            </Label>
            <div className="mt-2">
              <Input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                className="hidden"
                id="image-upload"
                disabled={totalImages >= 5}
              />
              <label
                htmlFor="image-upload"
                className={`flex items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition ${
                  totalImages >= 5
                    ? 'border-gray-300 bg-gray-50 cursor-not-allowed'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="text-center">
                  <Plus className="mx-auto h-8 w-8 text-gray-400" />
                  <p className="text-sm text-gray-500 mt-1">
                    {totalImages >= 5 ? 'Max 5 images' : 'Click to upload'}
                  </p>
                </div>
              </label>
            </div>

            {/* New Image Previews */}
            {imageFiles.length > 0 && (
              <div className="mt-4 grid grid-cols-3 gap-2">
                {imageFiles?.map((_, i) => {
                  const previewIndex = existingImages.length + i;
                  return (
                    <div key={previewIndex} className="relative group">
                      <img
                        src={previews[previewIndex]}
                        alt={`new-${i}`}
                        className="w-full h-24 object-cover rounded"
                      />
                      <button
                        type="button"
                        onClick={() => removeNew(previewIndex)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            <p className="text-sm text-gray-500 mt-2">
              {totalImages}/5 images
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting
              ? 'Saving...'
              : initialBlog
              ? 'Update Blog'
              : 'Add Blog'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
