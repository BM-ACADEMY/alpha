import React, { useState, useEffect, useContext } from "react";
import axiosInstance from "@/modules/common/lib/axios";
import { AuthContext } from "@/modules/common/context/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertCircle } from "lucide-react";
import { showToast } from "@/modules/common/toast/customToast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Zoom from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";

const Complaint = () => {
  const { user } = useContext(AuthContext);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState("All"); // New state for status filter
  const limit = 10;
  const [formData, setFormData] = useState({
    complaint_type: "",
    description: "",
  });
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchComplaints = async () => {
      try {
        setLoading(true);
        const params = { page, limit, user_id: user?.id };
        if (statusFilter !== "All") {
          params.status = statusFilter;
        }
        const response = await axiosInstance.get(
          "/complaints/fetch-all-complaints",
          {
            params,
            withCredentials: true,
          }
        );

        setComplaints(response.data.complaints);
        setTotal(response.data.total);
      } catch (err) {
        console.error("Error fetching complaints:", err);
        setError("Failed to fetch complaints");
        showToast(
          "error",
          err.response?.data?.message || "Failed to fetch complaints"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchComplaints();
  }, [user, page, statusFilter]); // Added statusFilter to dependencies

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(files);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.complaint_type || !formData.description) {
      showToast("error", "Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    const formDataToSend = new FormData();
    formDataToSend.append("user_id", user?.id);
    formDataToSend.append("complaint_type", formData.complaint_type);
    formDataToSend.append("description", formData.description);

    selectedFiles.forEach((file) => {
      formDataToSend.append("images", file);
    });

    try {
      const response = await axiosInstance.post("/complaints", formDataToSend, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      });

      setComplaints((prev) => [response.data.complaint, ...prev]);
      showToast("success", "Complaint submitted successfully");
      setFormData({ complaint_type: "", description: "" });
      setSelectedFiles([]);
      setIsModalOpen(false);
    } catch (err) {
      console.error("Error submitting complaint:", err);
      showToast(
        "error",
        err.response?.data?.message || "Failed to submit complaint"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewImages = (imageUrls) => {
    setSelectedImages(imageUrls || []);
    setIsImageModalOpen(true);
  };

  const handleViewReplies = (complaint) => {
    setSelectedComplaint(complaint);
    setIsReplyModalOpen(true);
  };

  const totalPages = Math.ceil(total / limit);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center p-6">
            <p className="text-gray-600 text-center">
              Please log in to view your complaints.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center p-6 text-red-500">
            <AlertCircle className="w-6 h-6 mr-2" />
            <p>{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl sm:text-2xl font-bold flex flex-col sm:flex-row justify-between items-center gap-4">
            My Complaints
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogTrigger asChild>
                <Button className="bg-[#0f1c3f] hover:bg-[#1a2b5c] text-white">
                  File New Complaint
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[95vw] sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>File a New Complaint</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <Label htmlFor="complaint_type" className="mb-2 block">
                      Complaint Type
                    </Label>
                    <Select
                      name="complaint_type"
                      value={formData.complaint_type}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, complaint_type: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select complaint type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Billing">Billing</SelectItem>
                        <SelectItem value="Deposit">Deposit</SelectItem>
                        <SelectItem value="Withdrawal">Withdrawal</SelectItem>
                        <SelectItem value="Others">Others</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="description" className="mb-2 block">
                      Description
                    </Label>
                    <Textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Describe your complaint"
                      required
                      className="min-h-[100px]"
                    />
                  </div>
                  <div>
                    <Label htmlFor="images" className="mb-2 block">
                      Upload Images
                    </Label>
                    <Input
                      id="images"
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                    {selectedFiles.length > 0 && (
                      <div className="mt-2">
                        <p>Selected files:</p>
                        <div className="flex flex-wrap gap-2">
                          {selectedFiles.map((file, index) => (
                            <Zoom key={index}>
                              <img
                                src={URL.createObjectURL(file)}
                                alt={file.name}
                                className="w-16 h-16 object-cover rounded"
                              />
                            </Zoom>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsModalOpen(false)}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-[#0f1c3f] hover:bg-[#1a2b5c] text-white flex items-center justify-center transition-all duration-300"
                    >
                      {isSubmitting ? (
                        <div className="flex items-center">
                          <Loader2 className="mr-2 h-5 w-5 animate-spin text-white" />
                          <span>Submitting...</span>
                        </div>
                      ) : (
                        <span>Submit Complaint</span>
                      )}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Resolved">Resolved</SelectItem>
                <SelectItem value="Rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {complaints.length === 0 ? (
            <p className="text-gray-600 text-center py-4">
              No complaints found.
            </p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[120px] sm:w-[150px]">
                        Complaint Type
                      </TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="w-[100px]">Status</TableHead>
                      <TableHead className="w-[100px]">Read</TableHead>
                      <TableHead className="w-[120px]">Created At</TableHead>
                      <TableHead className="w-[150px]">Images</TableHead>
                      <TableHead className="w-[150px]">Replies</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {complaints.map((complaint) => (
                      <TableRow key={complaint._id}>
                        <TableCell className="font-medium">
                          {complaint.complaint_type}
                        </TableCell>
                        <TableCell className="max-w-[200px] sm:max-w-[300px] truncate">
                          {complaint.description}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              complaint.status === "Resolved"
                                ? "bg-green-500 text-white"
                                : complaint.status === "Rejected"
                                ? "bg-red-500 text-white"
                                : "bg-[#e1ad43] text-white"
                            }
                          >
                            {complaint.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={complaint.is_read ? "success" : "warning"}
                          >
                            {complaint.is_read ? "Read" : "Unread"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(complaint.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {complaint.image_urls &&
                          complaint.image_urls.length > 0 ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewImages(complaint.image_urls)}
                            >
                              View Images
                            </Button>
                          ) : (
                            <span>-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {complaint.replies && complaint.replies.length > 0 ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewReplies(complaint)}
                            >
                              View Replies
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewReplies(complaint)}
                            >
                              View Replies
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-4">
                <Button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  Previous
                </Button>
                <span className="text-sm">
                  Page {page} of {totalPages}
                </span>
                <Button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === totalPages}
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  Next
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Image View Modal */}
      <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Complaint Images</DialogTitle>
          </DialogHeader>
          <div className="p-4">
            {selectedImages.length > 0 ? (
              <div className="flex flex-wrap gap-4">
                {selectedImages.map((url, index) => (
                  <Zoom key={index}>
                    <img
                      src={url}
                      alt={`Complaint image ${index + 1}`}
                      className="w-40 h-40 object-cover rounded"
                    />
                  </Zoom>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 text-center">No images available.</p>
            )}
          </div>
          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={() => setIsImageModalOpen(false)}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reply View Modal */}
      <Dialog open={isReplyModalOpen} onOpenChange={setIsReplyModalOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Admin Replies</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedComplaint?.replies?.length > 0 ? (
              selectedComplaint.replies.map((reply, index) => (
                <div key={index} className="border p-4 rounded">
                  <p className="text-sm text-gray-500">
                    {new Date(reply.created_at).toLocaleString()}
                  </p>
                  <p className="mt-2">{reply.message}</p>
                </div>
              ))
            ) : (
              <p className="text-gray-600 text-center">No replies yet.</p>
            )}
          </div>
          <div className="flex justify-end mt-4">
            <Button
              variant="outline"
              onClick={() => setIsReplyModalOpen(false)}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Complaint;