
import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import axiosInstance from '@/modules/common/lib/axios';
import { showToast } from '@/modules/common/toast/customToast';

const AdminRedeemRequests = () => {
  const [redeemRequests, setRedeemRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState({});

  // Fetch all redeem requests
  useEffect(() => {
    const fetchRedeemRequests = async () => {
      setLoading(true);
      try {
        const response = await axiosInstance.get('/redeem/get-all-request', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          params: { page: 1, limit: 20 }, // Adjust limit as needed
        });
        setRedeemRequests(response.data.redeemRequests);
      } catch (error) {
        showToast('error', 'Failed to fetch redeem requests');
      } finally {
        setLoading(false);
      }
    };
    fetchRedeemRequests();
  }, []);

  // Handle status update
  const handleStatusUpdate = async (id, status) => {
    setActionLoading((prev) => ({ ...prev, [id]: true }));
    try {
      const response = await axiosInstance.put(
        `/redeem/update-status/${id}`,
        { status },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setRedeemRequests((prev) =>
        prev.map((request) =>
          request._id === id
            ? { ...request, status, amount_send: status === 'approved' }
            : request
        )
      );
      showToast('success', `Redeem request ${status} successfully`);
    } catch (error) {
      showToast('error', error.response?.data?.message || `Failed to ${status} redeem request`);
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: false }));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6">
        <Loader2 className="h-6 w-6 text-blue-600 animate-spin mr-2" />
        <p>Loading redeem requests...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 flex items-center">
        <CheckCircle className="h-6 w-6 mr-2 text-blue-600" />
        Redeem Requests
      </h2>
      {redeemRequests.length === 0 ? (
        <div className="flex items-center justify-center p-6">
          <AlertCircle className="h-6 w-6 text-gray-500 mr-2" />
          <p>No redeem requests found</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Account Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Submitted At</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {redeemRequests.map((request) => (
              <TableRow key={request._id}>
                <TableCell>
                  {request.user_id?.username || 'N/A'} ({request.user_id?.email || 'N/A'})
                </TableCell>
                <TableCell>{request.redeem_amount.toFixed(2)} {request.account_type}</TableCell>
                <TableCell>{request.account_type}</TableCell>
                <TableCell className="capitalize">
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      request.status === 'approved'
                        ? 'bg-green-100 text-green-800'
                        : request.status === 'rejected'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {request.status}
                  </span>
                </TableCell>
                <TableCell>{new Date(request.created_at).toLocaleString()}</TableCell>
                <TableCell>
                  {request.status === 'pending' && (
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        onClick={() => handleStatusUpdate(request._id, 'approved')}
                        disabled={actionLoading[request._id]}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {actionLoading[request._id] ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle className="h-4 w-4 mr-1" />
                        )}
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleStatusUpdate(request._id, 'rejected')}
                        disabled={actionLoading[request._id]}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        {actionLoading[request._id] ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <XCircle className="h-4 w-4 mr-1" />
                        )}
                        Reject
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
};

export default AdminRedeemRequests;
