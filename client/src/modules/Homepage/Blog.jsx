import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, Image as ImageIcon } from 'lucide-react';
import Zoom from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";
import { getImageUrl } from '@/utils/ImageHelper';

function Blog() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedCards, setExpandedCards] = useState({});

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const response = await fetch('/api/blogs/fetch-website-blogs');
        if (!response.ok) throw new Error('Failed to fetch blogs');
        const data = await response.json();
        setBlogs(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchBlogs();
  }, []);

  const toggleExpand = (e, id) => {
    e.stopPropagation();
    setExpandedCards(prev => ({ ...prev, [id]: !prev[id] }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#121e52] px-4 py-12">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6]?.map(i => (
              <Skeleton key={i} className="h-96 w-full rounded-2xl bg-white/10" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#121e52] flex items-center justify-center px-4">
        <p className="text-xl text-white/80">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121e52] text-white">
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-5xl font-bold text-center mb-4">Our Blog</h1>
        <p className="text-center text-white/70 mb-12 max-w-2xl mx-auto text-lg">
          Discover insights, stories, and updates from our world.
        </p>

        {blogs.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-xl text-white/60">No blogs published yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogs?.map(blog => {
              const isExpanded = expandedCards[blog._id];
              const hasImages = blog.images && blog.images.length > 0;
              const imageCount = blog.images?.length || 0;

              return (
                <article key={blog._id} className="group">
                  <Card className={`
                    overflow-hidden bg-white/5 border border-white/10 backdrop-blur-sm
                    shadow-xl rounded-2xl transition-all duration-500
                    ${isExpanded ? 'ring-4 ring-[#d29c44]/30' : 'hover:bg-white/10 hover:shadow-2xl'}
                    ${!isExpanded ? 'h-[480px]' : 'h-[680px]'}
                    flex flex-col
                  `}>
                    {/* TITLE ABOVE IMAGE - Full Bleed */}
                    <div className="px-6 pt-8 pb-4">
                      <div className="flex justify-between items-start mb-2">
                        <Badge className="bg-[#d29c44]/20 text-[#d29c44] border border-[#d29c44]/30 text-xs">
                          {blog.status || 'Published'}
                        </Badge>
                        <span className="text-xs text-white/50 ml-3">
                          {new Date(blog.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      <h3 className="text-2xl font-extrabold text-white leading-tight line-clamp-2 group-hover:text-[#d29c44] transition-colors">
                        {blog.title}
                      </h3>
                    </div>

                    {/* COLLAPSED VIEW */}
                    {!isExpanded ? (
                      <div
                        className="flex flex-col h-full cursor-pointer"
                        onClick={(e) => toggleExpand(e, blog._id)}
                      >
                        {/* Hero Image - Full width, no top gap */}
                        {hasImages ? (
                          <div className="relative flex-shrink-0">
                            <div className="aspect-square overflow-hidden bg-black/20">
                              <img
                                src={getImageUrl(blog.images[0])}
                                alt={blog.title}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                loading="lazy"
                              />
                            </div>
                            {imageCount > 1 && (
                              <div className="absolute bottom-4 right-4 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-2 text-xs font-medium z-10">
                                <ImageIcon className="w-4 h-4" />
                                +{imageCount - 1} more
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="aspect-square bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center">
                            <div className="text-white/30 text-6xl font-bold">?</div>
                          </div>
                        )}

                        {/* Description + Read More */}
                        <div className="p-6 pt-5 flex flex-col flex-grow">
                          <p className="text-white/70 text-sm leading-relaxed line-clamp-3 flex-grow">
                            {blog.description}
                          </p>
                          <button
                            onClick={(e) => toggleExpand(e, blog._id)}
                            className="mt-5 text-[#d29c44] font-bold text-sm flex items-center gap-2 hover:gap-3 transition-all"
                          >
                            Read more <ChevronDown className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* EXPANDED VIEW */
                      <div className="flex flex-col h-full">
                        {/* Close Button */}
                        <div className="px-6 pt-4 pb-2 flex justify-end">
                          <button
                            onClick={(e) => toggleExpand(e, blog._id)}
                            className="text-white/50 hover:text-white text-4xl leading-none"
                            aria-label="Close"
                          >
                            ×
                          </button>
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto px-6 pb-6 scrollbar-thin scrollbar-thumb-white/20">
                          {/* Image Gallery */}
                          {hasImages && (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8 -mx-6 px-6">
                              {blog.images?.map((img, i) => (
                                <div
                                  key={i}
                                  className="relative group overflow-hidden rounded-xl bg-black/30 shadow-2xl aspect-square cursor-zoom-in"
                                >
                                  <Zoom zoomMargin={40}>
                                    <img
                                      src={getImageUrl(img)}
                                      alt={`${blog.title} - ${i + 1}`}
                                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                      loading="lazy"
                                    />
                                  </Zoom>
                                  <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2.5 py-1 rounded-full backdrop-blur">
                                    {i + 1}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Full Content */}
                          <div className="text-white/90 text-base leading-8 whitespace-pre-wrap text-justify">
                            {blog.content || blog.description}
                          </div>
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-5 border-t border-white/10 flex justify-between items-center text-sm">
                          <span className="text-white/50">
                            {new Date(blog.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </span>
                          <button
                            onClick={(e) => toggleExpand(e, blog._id)}
                            className="text-[#d29c44] font-bold flex items-center gap-2 hover:gap-3 transition-all"
                          >
                            Show less <ChevronUp className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </Card>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default Blog;
