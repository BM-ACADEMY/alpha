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

/* ------------------- Safe Rating Badge Color ------------------- */
const getRatingColor = (rating) => {
  const r = typeof rating === "number" ? rating : 0;
  if (r >= 4.5) return "bg-green-500 text-white";
  if (r >= 3) return "bg-yellow-500 text-white";
  if (r > 0) return "bg-red-500 text-white";
  return "bg-gray-200 text-gray-700";
};

/* ------------------- Read-Only Star Rating (Safe) ------------------- */
function ReadOnlyHalfStarRating({ value }) {
  const rating = typeof value === "number" && value >= 0 ? value : 0;

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

/* ------------------- Editable Half-Star Rating ------------------- */
function HalfStarRating({ value, onRate, disabled }) {
  const [hover, setHover] = useState(0);
  const displayValue = hover || value || 0;

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = displayValue >= star;
        const half = displayValue >= star - 0.5 && displayValue < star;

        return (
          <div key={star} className="relative">
            <button
              type="button"
              disabled={disabled}
              onClick={() => onRate(star - 0.5)}
              onMouseEnter={() => setHover(star - 0.5)}
              onMouseLeave={() => setHover(0)}
              className="absolute left-0 top-0 w-1/2 h-full z-10"
            />
            <button
              type="button"
              disabled={disabled}
              onClick={() => onRate(star)}
              onMouseEnter={() => setHover(star)}
              onMouseLeave={() => setHover(0)}
              className="absolute right-0 top-0 w-1/2 h-full z-10"
            />
            <Star
              size={36}
              className={`transition-colors ${
                filled
                  ? "fill-yellow-400 text-yellow-400"
                  : half
                  ? "fill-yellow-300 text-yellow-300"
                  : "fill-none text-gray-300"
              }`}
            />
          </div>
        );
      })}
      <div
        className={`ml-3 rounded-full px-3 py-1 text-xs font-medium shadow ${getRatingColor(
          value
        )}`}
      >
        {(value || 0).toFixed(1)} / 5
      </div>
    </div>
  );
}

/* ------------------- Main Component ------------------- */
export default function TestimonialForm() {
  const { user } = useContext(AuthContext);

  const [review, setReview] = useState(null);        // null = no review, object = has review
  const [isEditing, setIsEditing] = useState(false); // only true when editing
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");
  const [rating, setRating] = useState(0);
  const [comments, setComments] = useState("");

  /* ------------------- Fetch User's Review on Mount ------------------- */
  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const fetchMyReview = async () => {
      try {
        setIsLoading(true);
        const res = await axiosInstance.get("/testimonials/my-reviews");
        setReview(res.data);
        setRating(res.data?.rating || 0);
        setComments(res.data?.comments || "");
      } catch (err) {
        if (err.response?.status !== 404) {
          console.error("Error loading review:", err);
        }
        setReview(null); // No review found
      } finally {
        setIsLoading(false);
      }
    };

    fetchMyReview();
  }, [user]);

  /* ------------------- Submit (Create or Update) ------------------- */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user || !rating) {
      setError("Please select a rating.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const payload = { rating, comments: comments.trim() || null };

      let response;
      if (review) {
        // Update existing
        response = await axiosInstance.put(`/testimonials/${review.id}`, payload);
      } else {
        // Create new
        response = await axiosInstance.post("/testimonials", {
          ...payload,
          user_id: user.id,
        });
      }

      const updatedReview = response.data.testimonial || response.data;
      setReview(updatedReview);
      setIsEditing(false); // Exit edit mode
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save review.");
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ------------------- Delete Review ------------------- */
  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete your review?")) return;

    setIsDeleting(true);
    try {
      await axiosInstance.delete(`/testimonials/${review.id}`);
      setReview(null);
      setRating(0);
      setComments("");
    } catch (err) {
      alert("Failed to delete review.");
    } finally {
      setIsDeleting(false);
    }
  };

  /* ------------------- Loading State ------------------- */
  if (isLoading) {
    return (
      <Card className="max-w-md mx-auto mt-10">
        <CardContent className="py-12 text-center text-gray-500">
          Loading your review...
        </CardContent>
      </Card>
    );
  }

  /* ------------------- CASE 1: User HAS a review → Show only review + Edit/Delete ------------------- */
  if (review && !isEditing) {
    return (
      <Card className="max-w-2xl mx-auto mt-10 shadow-lg">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Your Review</CardTitle>
              <CardDescription>
                By <strong>{user?.name || user?.email}</strong>
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setRating(review.rating || 0);
                  setComments(review.comments || "");
                  setIsEditing(true);
                }}
              >
                <Edit2 className="w-4 h-4 mr-1" />
                Edit
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-red-600 border-red-300 hover:bg-red-50"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <ReadOnlyHalfStarRating value={review.rating} />
          {review.comments && (
            <p className="text-gray-700 whitespace-pre-wrap text-base leading-relaxed">
              {review.comments}
            </p>
          )}
          <div className="text-sm text-gray-500">
            Submitted on {new Date(review.created_at).toLocaleDateString()}
          </div>
        </CardContent>
      </Card>
    );
  }

  /* ------------------- CASE 2: Editing Existing Review ------------------- */
  if (isEditing && review) {
    return (
      <Card className="max-w-md mx-auto mt-10 shadow-lg">
        <CardHeader>
          <CardTitle>Edit Your Review</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Rating <span className="text-red-500">*</span>
              </label>
              <HalfStarRating value={rating} onRate={setRating} disabled={isSubmitting} />
            </div>

            <div className="space-y-2">
              <label htmlFor="edit-comments" className="text-sm font-medium">
                Your Review (optional)
              </label>
              <Textarea
                id="edit-comments"
                placeholder="Update your experience..."
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                disabled={isSubmitting}
                className="min-h-[120px] resize-none"
              />
            </div>

            <div className="flex gap-3">
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? "Saving..." : "Update Review"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditing(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </div>

            {error && <p className="text-sm text-red-600 text-center">{error}</p>}
          </form>
        </CardContent>
      </Card>
    );
  }

  /* ------------------- CASE 3: No Review → Show ONLY the form ------------------- */
  return (
    <Card className="max-w-md mx-auto mt-10 shadow-lg">
      <CardHeader>
        <CardTitle>Leave a Review</CardTitle>
        <CardDescription>
          {user
            ? `Hi ${user.name || user.email}, your feedback matters!`
            : "Please log in to leave a review."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Rating <span className="text-red-500">*</span>
            </label>
            <HalfStarRating value={rating} onRate={setRating} disabled={isSubmitting || !user} />
          </div>

          <div className="space-y-2">
            <label htmlFor="comments" className="text-sm font-medium">
              Your Review (optional)
            </label>
            <Textarea
              id="comments"
              placeholder="Tell us about your experience..."
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              disabled={isSubmitting || !user}
              className="min-h-[120px] resize-none"
            />
          </div>

          <Button
            type="submit"
            disabled={isSubmitting || !user || !rating}
            className="w-full"
          >
            {isSubmitting ? "Submitting..." : "Submit Review"}
          </Button>

          {error && <p className="text-sm text-red-600 text-center">{error}</p>}
        </form>
      </CardContent>
    </Card>
  );
}