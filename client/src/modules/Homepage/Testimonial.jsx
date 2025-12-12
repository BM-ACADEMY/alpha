// src/components/TestimonialCarousel.jsx
import React, { useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { Star, ChevronLeft, ChevronRight, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import axios from "axios";

export default function TestimonialCarousel() {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: "center",
  });

  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Autoplay
  useEffect(() => {
    if (!emblaApi) return;

    const autoplay = setInterval(() => {
      emblaApi.scrollNext();
    }, 5000);

    const pauseOnInteraction = () => clearInterval(autoplay);
    emblaApi.on("pointerDown", pauseOnInteraction);

    return () => {
      clearInterval(autoplay);
      emblaApi.off("pointerDown", pauseOnInteraction);
    };
  }, [emblaApi]);

  useEffect(() => {
    fetchTestimonials();
  }, []);

  useEffect(() => {
    if (!emblaApi) return;

    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    onSelect();

    return () => emblaApi.off("select", onSelect);
  }, [emblaApi]);

  const fetchTestimonials = async () => {
    try {
      const res = await axios.get("/api/testimonials");
      setTestimonials(res.data);
    } catch (err) {
      console.error("Failed to load testimonials", err);
    } finally {
      setLoading(false);
    }
  };

  const scrollPrev = () => emblaApi?.scrollPrev();
  const scrollNext = () => emblaApi?.scrollNext();
  const scrollTo = (index) => emblaApi?.scrollTo(index);

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => {
      const filled = i < Math.floor(rating);
      const half = !filled && rating > i;

      return (
        <Star
          key={i}
          className={`w-5 h-5 ${
            filled
              ? "fill-yellow-400 text-yellow-400"
              : half
              ? "fill-yellow-400/50 text-yellow-400"
              : "text-gray-400"
          }`}
        />
      );
    });
  };

  // Avatar with initials fallback
  const UserAvatar = ({ user, size = "lg" }) => {
    const username = user?.username || "Anonymous";
    const initials = username
      .split(" ")
      ?.map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

    const hasImage = user?.profile_image;

    return (
      <div
        className={`relative flex items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold shadow-lg ring-4 ring-white/20 ${
          size === "lg" ? "w-16 h-16 text-xl" : "w-12 h-12 text-lg"
        }`}
      >
        {hasImage ? (
          <img
            src={user.profile_image}
            alt={username}
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          <span>{initials || <User className="w-6 h-6" />}</span>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="w-full py-20">
        <Skeleton className="h-80 max-w-4xl mx-auto rounded-2xl" />
      </div>
    );
  }

  if (testimonials.length === 0) {
    return (
      <section className="py-20 text-center bg-gradient-to-b from-[#0e1946] to-[#1a2a6c]">
        <p className="text-white text-lg">No testimonials yet. Be the first one!</p>
      </section>
    );
  }

  return (
    <section className="w-full bg-gradient-to-b from-[#0e1946] to-[#1a2a6c] py-16 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-4xl md:text-5xl font-bold text-white text-center mb-12">
          What Our Investors Say
        </h2>

        <div className="relative">
          <div className="overflow-hidden rounded-2xl" ref={emblaRef}>
            <div className="flex">
              {testimonials?.map((t) => (
                <div
                  key={t._id}
                  className="flex-none w-full px-4 md:px-12 lg:px-20"
                >
                  <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-2xl max-w-3xl mx-auto">
                    <CardContent className="p-10 text-center">
                      {/* Stars */}
                      <div className="flex justify-center gap-1 mb-6">
                        {renderStars(t.rating)}
                      </div>

                      {/* Testimonial Text */}
                      <p className="text-xl md:text-2xl font-medium text-white italic leading-relaxed mb-10">
                        "{t.comments || "Amazing experience! Highly recommended."}"
                      </p>

                      {/* User Info */}
                      <div className="flex flex-col items-center gap-4">
                        <UserAvatar user={t.user_id} size="lg" />
                        <div>
                          <p className="text-xl font-bold text-white">
                            {t.user_id?.username || "Anonymous Investor"}
                          </p>
                          <p className="text-sm text-white/70">
                            Verified Investor
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Arrows */}
          {testimonials.length > 1 && (
            <>
              <Button
                variant="outline"
                size="icon"
                onClick={scrollPrev}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 backdrop-blur border-white/30 text-white hover:bg-white/30"
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={scrollNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 backdrop-blur border-white/30 text-white hover:bg-white/30"
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </>
          )}

          {/* Dots Indicator */}
          {testimonials.length > 1 && (
            <div className="flex justify-center gap-3 mt-10">
              {testimonials?.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => scrollTo(idx)}
                  className={`transition-all rounded-full ${
                    idx === selectedIndex
                      ? "w-10 h-3 bg-white"
                      : "w-3 h-3 bg-white/40 hover:bg-white/70"
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
