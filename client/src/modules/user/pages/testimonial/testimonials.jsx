// components/TestimonialForm.jsx
import React, { useContext, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Star, Edit2, Trash2 } from "lucide-react";
import { AuthContext } from "@/modules/common/context/AuthContext";
import axiosInstance from "@/modules/common/lib/axios";

const getRatingColor = (rating) => {
  if (rating >= 4.5) return "bg-green-500 text-white";
  if (rating >= 3.5) return "bg-yellow-500 text-white";
  if (rating >= 1) return "bg-red-500 text-white";
  return "bg-gray-200 text-gray-700";
};

function ReadOnlyHalfStarRating({ value }) {
  const rating = Number(value) || 0;

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = rating >= star;
        const half = rating >= star - 0.5 && rating < star;
        return (
          <Star
            key={star}
            size={28}
            className={`${
              filled
                ? "fill-yellow-400 text-yellow-400"
                : half
                ? "fill-yellow-300 text-yellow-300"
                : "fill-none text-gray-300"
            }`}
          />
        );
      })}
      <span
        className={`ml-2 rounded-full px-2.5 py-1 text-xs font-semibold ${getRatingColor(
          rating
        )}`}
      >
        {rating.toFixed(1)}
      </span>
    </div>
  );
}

function HalfStarRating({ value, onRate, disabled }) {
  const [hover, setHover] = useState(0);
  const displayValue = hover || value || 0;

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = displayValue >= star;
        const half = displayValue >= star - 0.5 && displayValue < star;

        return (
          <div key={star} className="relative cursor-pointer">
            {/* Left half (x.5) */}
            <button
              type="button"
              disabled={disabled}
              onClick={() => onRate(star - 0.5)}
              onMouseEnter={() => setHover(star - 0.5)}
              onMouseLeave={() => setHover(0)}
              className="absolute left-0 top-0 w-1/2 h-full z-10 opacity-0"
              aria-label={`${star - 0.5} stars`}
            />
            {/* Right half (whole star) */}
            <button
              type="button"
              disabled={disabled}
              onClick={() => onRate(star)}
              onMouseEnter={() => setHover(star)}
              onMouseLeave={() => setHover(0)}
              className="absolute right-0 top-0 w-1/2 h-full z-10 opacity-0"
              aria-label={`${star} stars`}
            />
            <Star
              size={36}
              className={`transition-colors ${
                filled
                  ? "fill-yellow-400 text-yellow-400"
                  : half
                  ? "half-filled-star fill-yellow-300 text-yellow-300"
                  : "fill-none text-gray-300"
              }`}
            />
          </div>
        );
      })}
      <span className="ml-3 text-sm font-medium text-gray-600">
        {value ? value.toFixed(1) : "0.0"} / 5.0
      </span>
    </div>
  );
}

export default function TestimonialForm() {
  const { user } = useContext(AuthContext);
  const [review, setReview] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");
  const [rating, setRating] = useState(0);
  const [comments, setComments] = useState("");

  // Fetch user's review on mount or when user changes
  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const fetchReview = async () => {
      try {
        setIsLoading(true);
        setError("");
        const res = await axiosInstance.get("/testimonials/my-review"); // Fixed endpoint
        setReview(res.data);
        setRating(res.data.rating);
        setComments(res.data.comments || "");
      } catch (err) {
        if (err.response?.status !== 404) {
          console.error("Error fetching review:", err);
          setError("Failed to load your review.");
        }
        // No review exists → clear state and show form
        setReview(null);
        setRating(0);
        setComments("");
      } finally {
        setIsLoading(false);
      }
    };

    fetchReview();
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      setError("You must be logged in.");
      return;
    }
    if (rating < 0.5) {
      setError("Please select a rating of at least 0.5 stars.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const payload = {
        rating,
        comments: comments.trim() || null,
      };

      let response;
      if (review) {
        response = await axiosInstance.put(`/testimonials/${review._id}`, payload);
      } else {
        response = await axiosInstance.post("/testimonials", payload);
      }

      const updatedReview = response.data.testimonial || response.data;
      setReview(updatedReview);
      setRating(updatedReview.rating);
      setComments(updatedReview.comments || "");
      setIsEditing(false);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save your review.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete your review permanently?")) return;

    setIsDeleting(true);
    try {
      await axiosInstance.delete(`/testimonials/${review._id}`);
      setReview(null);
      setRating(0);
      setComments("");
      setIsEditing(false);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete review.");
    } finally {
      setIsDeleting(false);
    }
  };

  const startEditing = () => {
    setRating(review.rating);
    setComments(review.comments || "");
    setError("");
    setIsEditing(true);
  };

  // Loading state
  if (isLoading) {
    return (
      <Card className="max-w-2xl mx-auto mt-10">
        <CardContent className="py-16 text-center text-gray-500">
          Loading your review...
        </CardContent>
      </Card>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <Card className="max-w-md mx-auto mt-10">
        <CardContent className="py-12 text-center">
          <p className="text-gray-600">Please log in to leave or view your review.</p>
        </CardContent>
      </Card>
    );
  }

  // User has a review and not editing → Show review
  if (review && !isEditing) {
    return (
      <Card className="max-w-2xl mx-auto mt-10 shadow-lg">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Your Review</CardTitle>
              <CardDescription>
                By <strong>{user.name || user.email}</strong>
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={startEditing}>
                <Edit2 className="w-4 h-4 mr-1" /> Edit
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-red-600 border-red-300 hover:bg-red-50"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                <Trash2 className="w-4 h-4" />
                {isDeleting && "..."}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <ReadOnlyHalfStarRating value={review.rating} />
          {review.comments && (
            <p className="text-gray-700 whitespace-pre-wrap text-base leading-relaxed">
              {review.comments}
            </p>
          )}
          <div className="text-sm text-gray-500">
            Submitted on {new Date(review.created_at).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
            {review.updated_at && new Date(review.updated_at) > new Date(review.created_at) && (
              <span className="ml-2 text-xs">(edited)</span>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show form: either creating new or editing existing
  return (
    <Card className="max-w-2xl mx-auto mt-10 shadow-lg">
      <CardHeader>
        <CardTitle>{review ? "Edit Your Review" : "Leave a Review"}</CardTitle>
        <CardDescription>
          Hi {user.name || user.email.split("@")[0]}, your feedback helps us improve!
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-3">
            <label className="text-sm font-medium flex items-center gap-1">
              Rating <span className="text-red-500">*</span>
            </label>
            <HalfStarRating value={rating} onRate={setRating} disabled={isSubmitting} />
          </div>

          <div className="space-y-3">
            <label htmlFor="comments" className="text-sm font-medium">
              Your Experience (optional)
            </label>
            <Textarea
              id="comments"
              placeholder="Share your thoughts, suggestions, or what you loved..."
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              disabled={isSubmitting}
              className="min-h-32 resize-none"
              maxLength={1000}
            />
            <p className="text-xs text-gray-500 text-right">
              {comments.length}/1000 characters
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={isSubmitting || rating < 0.5}
              className="flex-1"
            >
              {isSubmitting
                ? "Saving..."
                : review
                ? "Update Review"
                : "Submit Review"}
            </Button>
            {review && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditing(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            )}
          </div>

          {error && (
            <p className="text-sm text-red-600 text-center bg-red-50 py-2 px-4 rounded">
              {error}
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}