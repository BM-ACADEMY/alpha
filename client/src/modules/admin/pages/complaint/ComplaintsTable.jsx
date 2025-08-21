import React, { useState, useEffect } from 'react';
import axiosInstance from '@/modules/common/lib/axios';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Eye, Mail, CheckCircle, Trash,Send } from 'lucide-react';
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { showToast } from '@/modules/common/toast/customToast';
import ConfirmationDialog from '@/modules/common/reusable/ConfirmationDialog';

import LightGallery from 'lightgallery/react';
import 'lightgallery/css/lightgallery.css';
import 'lightgallery/css/lg-zoom.css';
import 'lightgallery/css/lg-thumbnail.css';
import lgThumbnail from 'lightgallery/plugins/thumbnail';
import lgZoom from 'lightgallery/plugins/zoom';


const ComplaintsTable = () => {
  const [complaints, setComplaints] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [dialogMode, setDialogMode] = useState(null); // 'view' or 'reply'
  const [replyData, setReplyData] = useState({ email: '', username: '', phone: '', message: '' });
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [complaintToDelete, setComplaintToDelete] = useState(null);

  useEffect(() => {
    fetchComplaints();
  }, [page]);

  const fetchComplaints = async () => {
    try {
      const res = await axiosInstance.get(`/complaints/fetch-all-complaints?page=${page}&limit=${limit}`);
      setComplaints(res.data.complaints);
      setTotal(res.data.total);
    } catch (err) {
      console.error('Failed to fetch complaints:', err);
      showToast('error', 'Failed to fetch complaints');
    }
  };

  const handleMarkRead = async (e, id) => {
    e.stopPropagation();
    try {
      await axiosInstance.patch(`/complaints/mark-as-read/${id}`);
      fetchComplaints();
      showToast('success', 'Complaint marked as read');
    } catch (err) {
      console.error('Failed to mark as read:', err);
      showToast('error', 'Failed to mark as read');
    }
  };

  const handleViewDetails = (e, complaint) => {
    e.stopPropagation();
    setSelectedComplaint(complaint);
    setDialogMode('view');
  };

  const handleOpenReply = (e, complaint) => {
    e.stopPropagation();
    setReplyData({
      email: complaint.user_id.email,
      username: complaint.user_id.username,
      phone: complaint.user_id.phone_number,
      message: '',
    });
    setSelectedComplaint(complaint);
    setDialogMode('reply');
  };

  const handleSendReply = async (e) => {
    e.stopPropagation();
    try {
      await axiosInstance.post(`/complaints/reply-to-customer/${selectedComplaint._id}/reply`, { message: replyData.message });
      showToast('success', 'Reply sent successfully');
      setReplyData({ email: '', username: '', phone: '', message: '' });
      setSelectedComplaint(null);
      setDialogMode(null);
    } catch (err) {
      console.error('Failed to send reply:', err);
      showToast('error', 'Failed to send reply');
    }
  };

  const handleDelete = (e, id) => {
    e.stopPropagation();
    setComplaintToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await axiosInstance.delete(`/complaints/delete-complaint/${complaintToDelete}`);
      fetchComplaints();
      showToast('success', 'Complaint deleted successfully');
    } catch (err) {
      console.error('Failed to delete complaint:', err);
      showToast('error', 'Failed to delete complaint');
    }
  };

  const totalPages = Math.ceil(total / limit);
const colors = [
  "bg-red-500", "bg-blue-500", "bg-green-500", "bg-yellow-500",
  "bg-purple-500", "bg-pink-500", "bg-orange-500", "bg-teal-500"
]

function getRandomColor(username) {
  let hash = 0
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}
const onGalleryInit = () => {
    console.log('LightGallery has been initialized');
  };

  return (
    <div className="p-4">
     <Table>
      <TableHeader>
        <TableRow>
          <TableHead>User</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Created At</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-center">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {complaints.map((c) => (
          <TableRow key={c._id} className="hover:bg-muted/40">
            <TableCell className="flex items-center gap-3">
              <Avatar>
                <AvatarFallback className={`${getRandomColor(c.user_id.username)} text-white`}>
                  {c.user_id.username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="font-medium">{c.user_id.username}</span>
            </TableCell>

            <TableCell>
              <Badge variant="secondary">{c.complaint_type}</Badge>
            </TableCell>

            <TableCell className="max-w-xs truncate">
              {c.description}
            </TableCell>

            <TableCell>
              {new Date(c.created_at).toLocaleString()}
            </TableCell>

            <TableCell>
              {c.is_read ? (
                <Badge className="bg-green-500 hover:bg-green-600">Read</Badge>
              ) : (
                <Badge className="bg-red-500 hover:bg-red-600">Unread</Badge>
              )}
            </TableCell>

            <TableCell className="flex justify-center gap-2">
              {!c.is_read && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="hover:bg-green-100 cursor-pointer"
                  onClick={(e) => handleMarkRead(e, c._id)} 
                  title="Mark as Read"
                >
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </Button>
              )}

              <Button 
                variant="ghost" 
                size="icon"
                className="hover:bg-blue-100 cursor-pointer"
                onClick={(e) => handleViewDetails(e, c)} 
                title="View Details"
              >
                <Eye className="h-5 w-5 text-blue-600" />
              </Button>

              <Button 
                variant="ghost" 
                size="icon"
                className="hover:bg-yellow-100 cursor-pointer"
                onClick={(e) => handleOpenReply(e, c)} 
                title="Send Reply"
              >
                <Mail className="h-5 w-5 text-yellow-600" />
              </Button>

              <Button 
                variant="ghost" 
                size="icon"
                className="hover:bg-red-100 cursor-pointer"
                onClick={(e) => handleDelete(e, c._id)} 
                title="Delete"
              >
                <Trash className="h-5 w-5 text-red-600" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
      {selectedComplaint && dialogMode === 'view' && (
        <Dialog open={!!selectedComplaint && dialogMode === 'view'} onOpenChange={() => { setSelectedComplaint(null); setDialogMode(null); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Complaint Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell><strong>Name</strong></TableCell>
                    <TableCell>{selectedComplaint.user_id.username}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell><strong>Email</strong></TableCell>
                    <TableCell>{selectedComplaint.user_id.email}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell><strong>Phone</strong></TableCell>
                    <TableCell>{selectedComplaint.user_id.phone_number}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell><strong>Type</strong></TableCell>
                    <TableCell>{selectedComplaint.complaint_type}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell><strong>Description</strong></TableCell>
                    <TableCell>{selectedComplaint.description}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
             {selectedComplaint.image_urls.length > 0 && (
                <div>
                  <h3 className="font-bold">Images</h3>
                  <LightGallery
                    onInit={onGalleryInit}
                    speed={500}
                    plugins={[lgThumbnail, lgZoom]}
                    elementClassNames="mt-2"
                  >
                    {selectedComplaint.image_urls.map((url, idx) => (
                      <a key={idx} href={url}>
                        <img alt={`complaint-${idx}`} src={url} className="w-32 h-32 object-cover rounded mr-2" />
                      </a>
                    ))}
                  </LightGallery>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
      {selectedComplaint && dialogMode === 'reply' && (
        <Dialog open={!!selectedComplaint && dialogMode === 'reply'} onOpenChange={() => { setReplyData({ email: '', username: '', phone: '', message: '' }); setSelectedComplaint(null); setDialogMode(null); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send Reply</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input value={replyData.username} readOnly placeholder="Username" />
              <Input value={replyData.email} readOnly placeholder="Email" />
              <Input value={replyData.phone} readOnly placeholder="Phone" />
              <Textarea
                value={replyData.message}
                onChange={(e) => setReplyData({ ...replyData, message: e.target.value })}
                placeholder="Reply message"
                rows={5}
              />
              <Button onClick={handleSendReply}> <Send className='w-4 h-4' /> Send Reply</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
      <ConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        title="Confirm Deletion"
        message="Are you sure you want to delete this complaint? This action cannot be undone."
      />
      <Pagination className="mt-4">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              href="#"
              onClick={(e) => {
                e.preventDefault();
                if (page > 1) setPage(page - 1);
              }}
            />
          </PaginationItem>
          {[...Array(totalPages)].map((_, i) => (
            <PaginationItem key={i}>
              <PaginationLink
                href="#"
                isActive={page === i + 1}
                onClick={(e) => {
                  e.preventDefault();
                  setPage(i + 1);
                }}
              >
                {i + 1}
              </PaginationLink>
            </PaginationItem>
          ))}
          <PaginationItem>
            <PaginationNext
              href="#"
              onClick={(e) => {
                e.preventDefault();
                if (page < totalPages) setPage(page + 1);
              }}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
};

export default ComplaintsTable;