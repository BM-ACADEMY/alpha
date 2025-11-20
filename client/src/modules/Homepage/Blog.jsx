import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';
import Zoom from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";
import { getImageUrl } from '@/utils/ImageHelper';

function Blog() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedBlog, setSelectedBlog] = useState(null);
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
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Skeleton key={i} className="h-96 w-full rounded-xl bg-white/10" />
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
    <>
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
              {blogs.map(blog => {
                const isExpanded = expandedCards[blog._id];
                const shouldShowToggle = blog.description && blog.description.length > 180;

                return (
                  <Card
                    key={blog._id}
                    className="overflow-hidden bg-white/5 border border-white/10 backdrop-blur-sm 
                               cursor-pointer hover:bg-white/10 hover:shadow-2xl hover:scale-[1.02] 
                               transition-all duration-300 shadow-xl rounded-2xl"
                    onClick={() => setSelectedBlog(blog)}
                  >
                    {blog.images && blog.images[0] && (
                      <div className="relative h-60 overflow-hidden bg-black/20">
                        <img
                          src={getImageUrl(blog.images[0])}
                          alt={blog.title}
                          className="w-full h-full object-cover transition-transform duration-700 hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                      </div>
                    )}

                    <div className="p-6">
                      <div className="flex justify-between items-center mb-4">
                        <Badge className="bg-[#d29c44]/20 text-[#d29c44] border border-[#d29c44]/30 hover:bg-[#d29c44]/30">
                          {blog.status || 'Published'}
                        </Badge>
                        <span className="text-xs text-white/50">
                          {new Date(blog.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>

                      <h3 className="text-2xl font-bold mb-3 text-white line-clamp-2">
                        {blog.title}
                      </h3>

                      <p className={`text-white/75 text-sm leading-relaxed transition-all ${isExpanded ? '' : 'line-clamp-3'}`}>
                        {blog.description}
                      </p>

                      {shouldShowToggle && (
                        <button
                          onClick={(e) => toggleExpand(e, blog._id)}
                          className="mt-4 text-[#d29c44] text-sm font-semibold flex items-center gap-1.5 hover:gap-2 transition-all"
                        >
                          {isExpanded ? (
                            <>Show less <ChevronUp className="w-4 h-4" /></>
                          ) : (
                            <>See more <ChevronDown className="w-4 h-4" /></>
                          )}
                        </button>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Full Blog Modal */}
      <Dialog open={!!selectedBlog} onOpenChange={() => setSelectedBlog(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-[#121e52] text-white border border-white/10 rounded-2xl p-0">
          {selectedBlog && (
            <>
              <DialogHeader className="p-8 pb-4">
                <DialogTitle className="text-4xl font-bold leading-tight">
                  {selectedBlog.title}
                </DialogTitle>
              </DialogHeader>

              <div className="px-8">
                {selectedBlog.images && selectedBlog.images.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-8">
                    {selectedBlog.images.map((img, i) => (
                      <div key={i} className="relative group overflow-hidden rounded-xl shadow-2xl">
                        <Zoom>
                          <img
                            src={getImageUrl(img)}
                            alt={`${selectedBlog.title} - ${i + 1}`}
                            className="w-full h-auto rounded-xl object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        </Zoom>
                        {selectedBlog.images.length > 1 && (
                          <div className="absolute top-4 right-4 bg-black/60 text-white text-sm px-3 py-1 rounded-full backdrop-blur">
                            {i + 1} / {selectedBlog.images.length}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-8">
                  <p className="text-lg leading-8 text-white/90 whitespace-pre-wrap">
                    {selectedBlog.description}
                  </p>
                </div>

                <div className="mt-10 pt-6 border-t border-white/10 text-sm text-white/50">
                  Published on{' '}
                  {new Date(selectedBlog.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </div>
              </div>

              <div className="p-8">
                <Button
                  variant="outline"
                  className="w-full border-white/20 text-white hover:bg-white/10"
                  onClick={() => setSelectedBlog(null)}
                >
                  Close
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export default Blog;