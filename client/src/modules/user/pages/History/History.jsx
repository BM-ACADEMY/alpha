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
  const [transactions, setTransactions] = useState([]);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  // Fetch wallet and transactions
  useEffect(() => {
    if (!userId) {
      console.error('No user ID found. User may not be logged in.');
      showToast('error', 'User not logged in');
      setError('User not logged in');
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
        console.log('Wallet Response:', walletResponse.data);
        setWallet(walletResponse.data);

        // Fetch transactions
        const transactionResponse = await axiosInstance.get(`/redeem/transactions/${userId}`, {
          params: { page, limit },
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        console.log('Transaction Response:', transactionResponse.data);

        // Validate response structure
        if (!transactionResponse.data.transactions || !Array.isArray(transactionResponse.data.transactions)) {
          throw new Error('Invalid transaction data format');
        }

        setTransactions(transactionResponse.data.transactions);
        setTotalPages(Math.ceil(transactionResponse.data.total / limit) || 1);
      } catch (err) {
        console.error('Error fetching data:', err);
        const errorMessage = err.response?.data?.message || 'Failed to fetch transaction history';
        setError(errorMessage);
        showToast('error', errorMessage);
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
        <p>Loading transaction history...</p>
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
      {wallet ? (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Wallet Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label className="text-sm text-gray-500">Capital Amount</Label>
                <p className="text-lg font-semibold">{wallet.userPlanCapitalAmount?.toFixed(2) || '0.00'} INR</p>
              </div>
              <div>
                <Label className="text-sm text-gray-500">Daily Profit</Label>
                <p className="text-lg font-semibold">{wallet.dailyProfitAmount?.toFixed(2) || '0.00'} INR</p>
              </div>
              <div>
                <Label className="text-sm text-gray-500">Total Wallet Points</Label>
                <p className="text-lg font-semibold">{wallet.totalWalletPoint?.toFixed(2) || '0.00'} INR</p>
              </div>
            </div>
            <p className="text-sm text-gray-700 mt-4">
              <strong>Redeemable Amount:</strong>{' '}
              {((wallet.totalWalletPoint || 0) - (wallet.userPlanCapitalAmount || 0)).toFixed(2)} INR
            </p>
          </CardContent>
        </Card>
      ) : (
        <p className="text-gray-500 mb-6">No wallet data available.</p>
      )}

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-gray-500">No transactions found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction, index) => (
                  <TableRow key={`${transaction.type}-${transaction.date}-${index}`}>
                    <TableCell>
                      {transaction.date ? new Date(transaction.date).toLocaleString() : 'Invalid Date'}
                    </TableCell>
                    <TableCell>{transaction.type || 'Unknown'}</TableCell>
                    <TableCell>
                      {transaction.amount?.toFixed(2) || '0.00'} {transaction.account_type || 'INR'}
                    </TableCell>
                    <TableCell
                      className={`capitalize ${
                        transaction.status === 'verified' ||
                        transaction.status === 'approved' ||
                        transaction.status === 'credited'
                          ? 'text-green-600'
                          : transaction.status === 'rejected'
                          ? 'text-red-600'
                          : 'text-yellow-600'
                      }`}
                    >
                      {transaction.status || 'pending'}
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