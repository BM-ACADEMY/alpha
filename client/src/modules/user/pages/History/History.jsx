import React, { useState, useEffect, useContext } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle } from 'lucide-react';
import axiosInstance from '@/modules/common/lib/axios';
import { showToast } from '@/modules/common/toast/customToast';
import { AuthContext } from '@/modules/common/context/AuthContext';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const HistoryPage = () => {
  const { user } = useContext(AuthContext);
  const userId = user?.id;
  const [redeemRequests, setRedeemRequests] = useState([]);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  // Fetch wallet and redeem requests
  useEffect(() => {
    if (!userId) {
      showToast('error', 'User not logged in');
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch wallet data
        const walletResponse = await axiosInstance.get(`/redeem/wallet/${userId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setWallet(walletResponse.data);

        // Fetch redeem requests
        const redeemResponse = await axiosInstance.get(`/redeem/user-requests/${userId}`, {
          params: { page, limit },
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setRedeemRequests(redeemResponse.data.redeemRequests);
        setTotalPages(Math.ceil(redeemResponse.data.total / limit));
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.response?.data?.message || 'Failed to fetch history data');
        showToast('error', err.response?.data?.message || 'Failed to fetch history data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId, page]);

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6">
        <Loader2 className="h-6 w-6 text-blue-500 mr-2 animate-spin" />
        <p>Loading history data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-6">
        <AlertCircle className="h-6 w-6 text-red-500 mr-2" />
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 flex items-center">
        <Label className="text-blue-600">Transaction History</Label>
      </h2>

      {/* Wallet Summary */}
      {wallet && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Wallet Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label className="text-sm text-gray-500">Capital Amount</Label>
                <p className="text-lg font-semibold">{wallet.userPlanCapitalAmount.toFixed(2)} INR</p>
              </div>
              <div>
                <Label className="text-sm text-gray-500">Daily Profit</Label>
                <p className="text-lg font-semibold">{wallet.dailyProfitAmount.toFixed(2)} INR</p>
              </div>
              <div>
                <Label className="text-sm text-gray-500">Total Wallet Points</Label>
                <p className="text-lg font-semibold">{wallet.totalWalletPoint.toFixed(2)} INR</p>
              </div>
            </div>
            <p className="text-sm text-gray-700 mt-4">
              <strong>Redeemable Amount:</strong>{' '}
              {(wallet.totalWalletPoint - wallet.userPlanCapitalAmount).toFixed(2)} INR
            </p>
          </CardContent>
        </Card>
      )}

      {/* Withdrawals */}
      <Card>
        <CardHeader>
          <CardTitle>Withdrawals</CardTitle>
        </CardHeader>
        <CardContent>
          {redeemRequests.length === 0 ? (
            <p className="text-gray-500">No withdrawal requests found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Account Type</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {redeemRequests.map((request) => (
                  <TableRow key={request._id}>
                    <TableCell>{new Date(request.created_at).toLocaleString()}</TableCell>
                    <TableCell>
                      {request.redeem_amount.toFixed(2)} {request.account_type}
                    </TableCell>
                    <TableCell>{request.account_type}</TableCell>
                    <TableCell
                      className={`capitalize ${
                        request.status === 'approved'
                          ? 'text-green-600'
                          : request.status === 'rejected'
                          ? 'text-red-600'
                          : 'text-yellow-600'
                      }`}
                    >
                      {request.status}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-6">
          <Button
            disabled={page === 1}
            onClick={() => handlePageChange(page - 1)}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
          >
            Previous
          </Button>
          <p>
            Page {page} of {totalPages}
          </p>
          <Button
            disabled={page === totalPages}
            onClick={() => handlePageChange(page + 1)}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};

export default HistoryPage;
