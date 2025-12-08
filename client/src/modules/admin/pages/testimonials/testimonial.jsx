import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Star, Check, X, RefreshCw } from "lucide-react";
import axiosInstance from "@/modules/common/lib/axios";

const ReadOnlyHalfStarRating = ({ value }) => {
  const rating = Number(value) || 0;

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = rating >= star;
        const half = rating >= star - 0.5 && rating < star;

        return (
          <Star
            key={star}
            size={20}
            className={`${
              filled
                ? "fill-yellow-400 text-yellow-400"
                : half
                ? "fill-yellow-400/50 text-yellow-400"
                : "text-gray-300"
            }`}
          />
        );
      })}
      <span className="ml-2 text-sm font-medium text-gray-700">
        {rating.toFixed(1)}
      </span>
    </div>
  );
};

const StatusBadge = ({ verified }) => {
  if (verified === true)
    return (
      <Badge className="bg-green-100 text-green-800 font-medium">
        <Check className="w-3 h-3 mr-1" />
        Approved
      </Badge>
    );
  if (verified === false)
    return (
      <Badge className="bg-red-100 text-red-800 font-medium">
        <X className="w-3 h-3 mr-1" />
        Rejected
      </Badge>
    );
  return (
    <Badge className="bg-orange-100 text-orange-800 font-medium">
      Pending Review
    </Badge>
  );
};

export default function AdminTestimonials() {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchAllTestimonials = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("/testimonials/all");
      setTestimonials(response.data || []);
    } catch (err) {
      console.error("Failed to load testimonials:", err);
      alert("Failed to load testimonials. Make sure you're logged in as admin.");
      setTestimonials([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllTestimonials();
  }, []);

  const updateStatus = async (id, approved) => {
    setUpdatingId(id);
    try {
      await axiosInstance.patch(`/testimonials/${id}/status`, {
        verified_by_admin: approved,
      });

      setTestimonials((prev) =>
        prev.map((t) =>
          t._id === id ? { ...t, verified_by_admin: approved } : t
        )
      );
    } catch (err) {
      alert("Update failed: " + (err.response?.data?.message || err.message));
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-10 text-center text-gray-500">
        Loading testimonials...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Admin - Manage Testimonials
          </h1>
          <p className="text-gray-600 mt-1">
            Review, approve, or reject user-submitted testimonials
          </p>
        </div>
        <Button onClick={fetchAllTestimonials} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {testimonials.length === 0 ? (
        <Card>
          <CardContent className="text-center py-16">
            <p className="text-xl text-gray-500">
              No testimonials submitted yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .map((t) => {
              const isApproved = t.verified_by_admin === true;
              const isRejected = t.verified_by_admin === false;

              return (
                <Card key={t._id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">
                          {t.user_id?.name || "Anonymous"}
                        </CardTitle>
                        <CardDescription>
                          {t.user_id?.email || "No email"}
                        </CardDescription>
                      </div>
                      <StatusBadge verified={t.verified_by_admin} />
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <ReadOnlyHalfStarRating value={t.rating} />

                    <p className="text-gray-700 text-sm italic leading-relaxed">
                      "{t.comments || "No comment provided"}"
                    </p>

                    <Separator />

                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Submitted</span>
                      <span>
                        {new Date(t.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </CardContent>

                  <CardFooter className="flex gap-3">
                    <Button
                      size="sm"
                      variant={isApproved ? "default" : "outline"}
                      disabled={updatingId === t._id || isApproved}
                      onClick={() => updateStatus(t._id, true)}
                      className="flex-1"
                    >
                      {updatingId === t._id ? "..." : isApproved ? "Approved" : "Approve"}
                    </Button>

                    <Button
                      size="sm"
                      variant={isRejected ? "destructive" : "outline"}
                      disabled={updatingId === t._id || isRejected}
                      onClick={() => updateStatus(t._id, false)}
                      className="flex-1"
                    >
                      {updatingId === t._id ? "..." : isRejected ? "Rejected" : "Reject"}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
        </div>
      )}
    </div>
  );
}