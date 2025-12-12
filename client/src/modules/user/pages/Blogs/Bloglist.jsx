// src/components/BlogList.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { getImageUrl } from '@/utils/ImageHelper';
import Zoom from 'react-medium-image-zoom';


function BlogList() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null); // Track which blog is expanded

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await axios.get(`${import.meta.env.VITE_BASE_URL}/blogs/fetch-published-blog`);
      setBlogs(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load blogs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id); // Toggle
  };

  // Loading State
  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <div className="space-y-8">
          {[1, 2, 3]?.map((i) => (
            <div key={i} className="bg-white rounded-2xl shadow-lg p-8 animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto p-6 text-center py-20">
        <p className="text-red-600 font-medium">{error}</p>
        <button
          onClick={fetchBlogs}
          className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <header className="mb-12 text-center">
        <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
          Blog Posts
        </h1>
        <p className="mt-3 text-lg text-gray-600">Click any post to read the full story</p>
      </header>

      {blogs.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-2xl text-gray-500">No published blogs yet.</p>
        </div>
      ) : (
        <div className="space-y-10">
          {blogs?.map((blog) => {
            const isExpanded = expandedId === blog._id;

            return (
              <article
                key={blog._id}
                className={`bg-white rounded-2xl shadow-lg overflow-hidden transition-all duration-500 ease-in-out ${
                  isExpanded ? 'ring-4 ring-blue-200 shadow-2xl' : 'hover:shadow-xl'
                }`}
              >
                {/* Preview Mode */}
                {!isExpanded ? (
                  <div className="p-8 cursor-pointer" onClick={() => toggleExpand(blog._id)}>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3 line-clamp-2">
                      {blog.title}
                    </h3>

                    <p className="text-gray-600 mb-6 line-clamp-3 leading-relaxed">
                      {blog.description}
                    </p>

                    {/* Preview Images */}
                    {blog.images?.length > 0 && (
                      <div className="grid grid-cols-4 gap-3 mb-6">
                        {blog.images.slice(0, 4)?.map((src, i) => (
                          <img
                            key={i}
                            src={getImageUrl(src)}
                            alt={`Preview ${i + 1}`}
                            className="w-full h-24 object-cover rounded-lg shadow-sm"
                            onError={(e) => (e.target.src = '/api/placeholder/400/300')}
                          />
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-blue-600 font-bold text-lg hover:underline">
                        Read More →
                      </span>
                      <time className="text-sm text-gray-500">
                        {new Date(blog.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </time>
                    </div>
                  </div>
                ) : (
                  /* Expanded Full View */
                  <div className="bg-white">
                    {/* Full Title & Close Button */}
                    <div className="px-8 pt-8 pb-4 flex justify-between items-start">
                      <h2 className="text-3xl font-extrabold text-gray-900 leading-tight">
                        {blog.title}
                      </h2>
                      <button
                        onClick={() => toggleExpand(blog._id)}
                        className="text-gray-400 hover:text-gray-700 text-3xl font-light"
                      >
                        ×
                      </button>
                    </div>

                    {/* Full Image Gallery at Top */}
                    {blog.images?.length > 0 && (
                      <div className="px-8 pb-6 bg-gray-50">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                          {blog.images?.map((src, i) => (
                            <Zoom key={i} zoomMargin={40}>
                              <img
                                src={getImageUrl(src)}
                                alt={`Blog image ${i + 1}`}
                                className="w-full h-80 object-cover rounded-xl shadow-lg cursor-pointer hover:shadow-2xl transition-shadow duration-300"
                                onError={(e) => (e.target.src = '/api/placeholder/800/600')}
                              />
                            </Zoom>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Full Content */}
                    <div className="px-8 pb-10 pt-6 prose prose-lg max-w-none">
                      <div className="text-gray-800 leading-relaxed whitespace-pre-wrap text-justify">
                        {blog.content || blog.description}
                      </div>

                      <div className="mt-10 pt-6 border-t flex justify-between items-center text-sm text-gray-500">
                        <span>
                          Published on{' '}
                          {new Date(blog.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </span>
                        <button
                          onClick={() => toggleExpand(blog._id)}
                          className="text-blue-600 font-medium hover:underline"
                        >
                          ← Collapse
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default BlogList;
