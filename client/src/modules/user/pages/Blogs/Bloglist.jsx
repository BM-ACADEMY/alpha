// src/components/BlogList.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { getImageUrl } from '@/utils/ImageHelper'; // ← Import shared helper
import Zoom from 'react-medium-image-zoom';


function BlogList() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await axios.get('/api/blogs/fetch-published-blog');
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

  // Loading Skeleton
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <h2 className="text-3xl font-bold text-gray-800 mb-8">Blog List</h2>
        <div className="space-y-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm p-6 animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              <div className="flex gap-2 mt-4">
                <div className="w-32 h-32 bg-gray-200 rounded-lg"></div>
                <div className="w-32 h-32 bg-gray-200 rounded-lg"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg inline-block">
          <p className="font-medium">Warning: {error}</p>
          <button
            onClick={fetchBlogs}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <header className="mb-10 text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
          Blog List
        </h1>
        <p className="mt-2 text-gray-600">Discover insightful stories and ideas</p>
      </header>

      {blogs.length === 0 ? (
        <div className="text-center py-16">
          <div className="bg-gray-100 border-2 border-dashed rounded-xl w-32 h-32 mx-auto mb-6 flex items-center justify-center">
            <span className="text-5xl">Document</span>
          </div>
          <h3 className="text-xl font-semibold text-gray-700">No blogs yet</h3>
          <p className="text-gray-500 mt-2">Check back later for approved content!</p>
        </div>
      ) : (
        <div className="grid gap-8 md:grid-cols-1 lg:grid-cols-1">
          {blogs.map((blog) => (
            <article
              key={blog._id}
              className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden"
            >
              <div className="p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-3 line-clamp-2">
                  {blog.title}
                </h3>
                <p className="text-gray-600 mb-5 line-clamp-3 leading-relaxed">
                  {blog.description}
                </p>

                {/* Image Gallery with Zoom */}
                {blog.images?.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-5 -mx-2">
                    {blog.images.slice(0, 4).map((src, i) => (
                      <div
                        key={i}
                        className="relative group overflow-hidden rounded-lg shadow-sm cursor-pointer"
                      >
                        <Zoom
                          overlayBgColorStart="rgba(0, 0, 0, 0)"
                          overlayBgColorEnd="rgba(0, 0, 0, 0.9)"
                          zoomMargin={40}
                        >
                          <img
                            src={getImageUrl(src)}
                            alt={`Blog image ${i + 1}`}
                            className="w-full h-32 object-cover transition-transform duration-300 group-hover:scale-110"
                            onError={(e) => {
                              e.target.src = '/api/placeholder/600/400';
                            }}
                          />
                        </Zoom>
                        {i === 3 && blog.images.length > 4 && (
                          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center text-white font-bold text-lg">
                            +{blog.images.length - 4}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Meta */}
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <time dateTime={blog.createdAt} className="flex items-center">
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    {new Date(blog.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </time>
                  <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">
                    Published
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export default BlogList;