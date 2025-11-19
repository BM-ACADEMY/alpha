"use client";

import React, { useState, useEffect } from "react";
import { Search, Plus, Edit2, Trash2, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import AddBlogModal from "./addBlog";
import { getImageUrl } from "@/utils/ImageHelper"; // Import here

export default function BlogList() {
  const [searchQuery, setSearchQuery] = useState("");
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBlog, setEditingBlog] = useState(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState("");
  const [expanded, setExpanded] = useState({}); // { blogId: true }

  // ---------- Helpers ----------
  const getImageUrl = (path) => {
    if (!path) return "/api/placeholder/600/400";
    const base = (
      import.meta.env.VITE_BASE_URL || "http://localhost:5000/api"
    ).replace("/api", "");
    return `${base}${path.startsWith("/") ? "" : "/"}${path}`;
  };

  // ---------- Fetch ----------
  const fetchBlogs = async (query = "") => {
    setLoading(true);
    try {
      const url = query
        ? `/api/blogs/fetch-all-blog?search=${encodeURIComponent(query)}`
        : "/api/blogs/fetch-all-blog";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setBlogs(data);
    } catch (err) {
      console.error(err);
      alert("Could not load blogs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => fetchBlogs(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // ---------- Add / Edit ----------
  const handleAddBlog = (newBlog) => {
    setBlogs((prev) => [newBlog, ...prev]);
    setModalOpen(false);
  };

  const handleEditBlog = (updatedBlog) => {
    setBlogs((prev) =>
      prev.map((b) => (b._id === updatedBlog._id ? updatedBlog : b))
    );
    setEditingBlog(null);
    setModalOpen(false);
  };

  const openEditModal = (blog) => {
    setEditingBlog(blog);
    setModalOpen(true);
  };

  // ---------- Delete ----------
  const deleteBlog = async (id) => {
    if (!confirm("Delete this blog?")) return;
    try {
      const res = await fetch(`/api/blogs/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      setBlogs((prev) => prev.filter((b) => b._id !== id));
    } catch (err) {
      console.error(err);
      alert("Could not delete");
    }
  };

  // ---------- Lightbox ----------
  const openLightbox = (imgPath) => {
    setLightboxImage(getImageUrl(imgPath));
    setLightboxOpen(true);
  };

  // ---------- Expand ----------
  const toggleExpand = (id) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // ---------- Render ----------
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="Search blogs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Button
          onClick={() => {
            setEditingBlog(null);
            setModalOpen(true);
          }}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Blog
        </Button>
      </div>

      {/* Blog Cards */}
      <div className="max-w-7xl mx-auto space-y-8">
        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : blogs.length > 0 ? (
          blogs.map((blog, index) => {
            const imageOnLeft = index % 2 === 0;
            const isExpanded = expanded[blog._id];

            return (
              <Card key={blog._id} className="overflow-hidden relative">
                {/* Action Icons */}
                <div className="absolute top-2 right-2 z-10 flex gap-1 bg-white rounded-full shadow-md p-1">
                  <button
                    onClick={() => openEditModal(blog)}
                    className="p-1.5 hover:bg-gray-100 rounded-full transition"
                    title="Edit"
                  >
                    <Edit2 className="h-4 w-4 text-blue-600" />
                  </button>
                  <button
                    onClick={() => deleteBlog(blog._id)}
                    className="p-1.5 hover:bg-gray-100 rounded-full transition"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </button>
                </div>

                <CardContent className="p-0">
                  <div
                    className={`flex flex-col md:flex-row ${
                      imageOnLeft ? "" : "md:flex-row-reverse"
                    }`}
                  >
                    {/* Thumbnails – Square */}
                    <div className="md:w-1/2 p-4 bg-gray-50">
                      {blog.images && blog.images.length > 0 ? (
                        <div className="grid grid-cols-3 gap-2">
                          {blog.images.map((img, i) => (
                            <div
                              key={i}
                              className="relative cursor-pointer overflow-hidden rounded-lg aspect-square"
                              onClick={() => openLightbox(img)}
                            >
                              <img
                                src={getImageUrl(img)}
                                alt={`${blog.title} ${i + 1}`}
                                className="w-full h-full object-cover transition-transform hover:scale-105"
                              />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-32 bg-gray-200 rounded-lg">
                          <p className="text-gray-500">No images</p>
                        </div>
                      )}
                    </div>

                    {/* Text Content */}
                    <div className="md:w-1/2 p-6 flex flex-col justify-center">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2 flex items-center gap-3">
                        {blog.title}
                        <span
                          className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                            blog.status === "website"
                              ? "bg-green-100 text-green-800"
                              : blog.status === "user"
                              ? "bg-purple-100 text-purple-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {blog.status === "website"
                            ? "Website"
                            : blog.status === "user"
                            ? "Users Only"
                            : "Both"}
                        </span>
                        {!blog.publish && (
                          <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
                            Draft
                          </span>
                        )}
                      </h3>
                      {/* Description – 2 lines + Read more */}
                      <div className="text-gray-600">
                        <p
                          className={`${
                            isExpanded ? "" : "line-clamp-2"
                          } transition-all duration-300`}
                        >
                          {blog.description}
                        </p>

                        {/* Show Read more / Show less only when needed */}
                        {blog.description.length > 120 && (
                          <button
                            onClick={() => toggleExpand(blog._id)}
                            className="mt-1 text-sm font-medium text-blue-600 hover:text-blue-800"
                          >
                            {isExpanded ? "Show less" : "Read more"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">
              {searchQuery ? "No blogs match your search." : "No blogs yet."}
            </p>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      <AddBlogModal
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) setEditingBlog(null);
        }}
        onAdd={editingBlog ? handleEditBlog : handleAddBlog}
        initialBlog={editingBlog}
      />

      {/* Lightbox Modal */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black">
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 z-10 bg-white rounded-full p-2 hover:bg-gray-200 transition"
          >
            <X className="h-5 w-5" />
          </button>
          <img
            src={lightboxImage}
            alt="Full size"
            className="w-full h-auto max-h-screen object-contain"
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
