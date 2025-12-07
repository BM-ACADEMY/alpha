"use client";

import React, { useState, useEffect } from "react";
import { Search, Plus, Edit2, Trash2, X, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import AddBlogModal from "./addBlog";
import { createPortal } from "react-dom";

// Lightbox Component using createPortal (fixes the destroy error)
function Lightbox({ isOpen, imageUrl, onClose }) {
  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 p-4"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-6 right-6 z-50 rounded-full bg-white/90 p-3 shadow-2xl hover:bg-white transition"
      >
        <X className="h-8 w-8 text-gray-900" />
      </button>

      <img
        src={imageUrl}
        alt="Enlarged view"
        className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
        onClick={(e) => e.stopPropagation()} // Don't close when clicking the image
      />
    </div>,
    document.body
  );
}

export default function BlogList() {
  const [searchQuery, setSearchQuery] = useState("");
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBlog, setEditingBlog] = useState(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState("");
  const [expandedIds, setExpandedIds] = useState(new Set());

  const toggleExpand = (id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const getImageUrl = (path) => {
    if (!path) return "/api/placeholder/600/400";
    const base = (import.meta.env.VITE_BASE_URL || "http://localhost:5000/api").replace("/api", "");
    return `${base}${path.startsWith("/") ? "" : "/"}${path}`;
  };

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

  useEffect(() => {
    const timer = setTimeout(() => fetchBlogs(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

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

  const deleteBlog = async (id) => {
    if (!confirm("Are you sure you want to delete this blog?")) return;

    try {
      const res = await fetch(`/api/blogs/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setBlogs((prev) => prev.filter((b) => b._id !== id));
    } catch (err) {
      alert("Could not delete blog");
    }
  };

  const openLightbox = (imgPath) => {
    setLightboxImage(getImageUrl(imgPath));
    setLightboxOpen(true);
  };

  const needsReadMore = (desc) => {
    const lines = desc.split("\n").filter((l) => l.trim());
    return lines.length > 3 || desc.length > 280;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h- h-5 w-5" />
          <Input
            placeholder="Search blogs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-11 h-12 text-base"
          />
        </div>
        <Button
          onClick={() => {
            setEditingBlog(null);
            setModalOpen(true);
          }}
          size="lg"
        >
          <Plus className="h-5 w-5 mr-2" /> Add Blog
        </Button>
      </div>

      {/* Blog Cards */}
      <div className="max-w-7xl mx-auto space-y-12">
        {loading ? (
          <div className="text-center py-20 text-gray-500 text-lg">Loading blogs...</div>
        ) : blogs.length === 0 ? (
          <div className="text-center py-20 text-gray-500 text-lg">
            {searchQuery ? "No blogs found." : "No blogs yet. Create your first one!"}
          </div>
        ) : (
          blogs.map((blog) => {
            const isExpanded = expandedIds.has(blog._id);
            const paragraphs = blog.description.split("\n");
            const previewLines = paragraphs.slice(0, 3);

            return (
              <Card key={blog._id} className="overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300">
                {/* Action Buttons */}
                <div className="absolute top-4 right-4 z-20 flex gap-2 bg-white/95 backdrop-blur rounded-full shadow-xl p-2">
                  <button
                    onClick={() => openEditModal(blog)}
                    className="p-2.5 hover:bg-gray-100 rounded-full transition"
                  >
                    <Edit2 className="h-5 w-5 text-blue-600" />
                  </button>
                  <button
                    onClick={() => deleteBlog(blog._id)}
                    className="p-2.5 hover:bg-red-100 rounded-full transition"
                  >
                    <Trash2 className="h-5 w-5 text-red-600" />
                  </button>
                </div>

                <CardContent className="p-0">
                  {isExpanded ? (
                    /* EXPANDED VIEW */
                    <div className="flex flex-col">
                      <div className="p-8 bg-gradient-to-b from-gray-100 to-white">
                        {blog.images?.length > 0 ? (
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {blog.images.map((img, i) => (
                              <div
                                key={i}
                                onClick={() => openLightbox(img)}
                                className="aspect-square rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl cursor-zoom-in transition-all hover:scale-105"
                              >
                                <img
                                  src={getImageUrl(img)}
                                  alt={`Blog image ${i + 1}`}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="h-64 bg-gray-200 border-2 border-dashed rounded-2xl flex items-center justify-center text-gray-500">
                            No images uploaded
                          </div>
                        )}
                      </div>

                      <div className="p-10 bg-white">
                        <div className="flex items-center justify-between mb-6">
                          <h3 className="text-3xl font-bold text-gray-900">{blog.title}</h3>
                          <div className="flex gap-3">
                            <span
                              className={`px-4 py-2 rounded-full text-sm font-medium ${
                                blog.status === "website"
                                  ? "bg-green-100 text-green-800"
                                  : blog.status === "user"
                                  ? "bg-purple-100 text-purple-800"
                                  : "bg-blue-100 text-blue-800"
                              }`}
                            >
                              {blog.status === "website" ? "Website" : blog.status === "user" ? "Users Only" : "Both"}
                            </span>
                            {!blog.publish && (
                              <span className="px-4 py-2 rounded-full text-sm bg-gray-200 text-gray-600">
                                Draft
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="text-gray-700 text-lg leading-relaxed space-y-6">
                          {paragraphs.map((para, i) => {
                            if (!para.trim()) return <div key={i} className="h-5" />;
                            return <p key={i}>{para}</p>;
                          })}
                        </div>

                        <button
                          onClick={() => toggleExpand(blog._id)}
                          className="mt-10 flex items-center gap-2 text-blue-600 font-bold text-lg hover:text-blue-800"
                        >
                          Show less <ChevronUp className="h-6 w-6" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* COLLAPSED VIEW */
                    <div className="flex flex-col lg:flex-row">
                      <div className="lg:w-1/2 p-8 bg-gray-50">
                        {blog.images?.length > 0 ? (
                          <div className="grid grid-cols-3 gap-4">
                            {blog.images.slice(0, 9).map((img, i) => (
                              <div
                                key={i}
                                onClick={() => openLightbox(img)}
                                className="aspect-square rounded-xl overflow-hidden shadow hover:shadow-lg cursor-zoom-in transition hover:scale-105"
                              >
                                <img
                                  src={getImageUrl(img)}
                                  alt={`Preview ${i + 1}`}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="h-48 bg-gray-200 border-2 border-dashed rounded-xl flex items-center justify-center text-gray-500">
                            No images
                          </div>
                        )}
                      </div>

                      <div className="lg:w-1/2 p-10 flex flex-col justify-center">
                        <div className="flex items-center justify-between mb-5">
                          <h3 className="text-2xl font-bold text-gray-900">{blog.title}</h3>
                          <div className="flex gap-2">
                            <span
                              className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                                blog.status === "website"
                                  ? "bg-green-100 text-green-800"
                                  : blog.status === "user"
                                  ? "bg-purple-100 text-purple-800"
                                  : "bg-blue-100 text-blue-800"
                              }`}
                            >
                              {blog.status.charAt(0).toUpperCase() + blog.status.slice(1)}
                            </span>
                            {!blog.publish && (
                              <span className="text-xs px-3 py-1.5 bg-gray-200 text-gray-600 rounded-full">
                                Draft
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="text-gray-700 leading-relaxed text-base space-y-4">
                          {previewLines.map((para, i) => {
                            if (!para.trim()) return <div key={i} className="h-3" />;
                            return (
                              <p key={i} className={i === 2 ? "line-clamp-3" : ""}>
                                {para}
                              </p>
                            );
                          })}
                        </div>

                        {needsReadMore(blog.description) && (
                          <button
                            onClick={() => toggleExpand(blog._id)}
                            className="mt-8 flex items-center gap-2 text-blue-600 font-bold text-lg hover:text-blue-800"
                          >
                            Read more <ChevronDown className="h-6 w-6" />
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Add/Edit Blog Modal */}
      <AddBlogModal
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) setEditingBlog(null);
        }}
        onAdd={editingBlog ? handleEditBlog : handleAddBlog}
        initialBlog={editingBlog}
      />

      {/* Fixed Lightbox using Portal */}
      <Lightbox
        isOpen={lightboxOpen}
        imageUrl={lightboxImage}
        onClose={() => setLightboxOpen(false)}
      />
    </div>
  );
}
