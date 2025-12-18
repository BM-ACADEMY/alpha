import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Search, Wallet, Copy, Check } from 'lucide-react';
import axiosInstance from '@/modules/common/lib/axios';

// Reusable Copy Component for Transaction ID
const CopyField = ({ value }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }).catch(() => {
      // Optional: show toast error if needed
    });
  };

  if (!value || value === 'N/A') return null;

  return (
    <button
      onClick={handleCopy}
      className="ml-2 flex items-center text-gray-500 hover:text-gray-700 transition-colors"
      title="Copy Transaction ID"
    >
      {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
    </button>
  );
};

const WalletManagement = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [walletSearchQuery, setWalletSearchQuery] = useState('');
  const [transactionIdFilter, setTransactionIdFilter] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [subscriptions, setSubscriptions] = useState([]);
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [amount, setAmount] = useState('');
  const [profitPercentage, setProfitPercentage] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [wallets, setWallets] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [planStatusFilter, setPlanStatusFilter] = useState('all');
  const [amountTypeFilter, setAmountTypeFilter] = useState('all');
  const debounceTimer = useRef(null);

  // Debounce search for user subscriptions
  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      if (e.target.value.trim()) {
        axiosInstance
          .get(`/wallet-point/search-subscriptions?query=${e.target.value}`)
          .then((res) => {
            setSelectedUser(res.data.user);
            setSubscriptions(res.data.subscriptions);
            setSelectedSubscription(null);
            setAmount('');
            setProfitPercentage('');
            setStatusMessage('');
          })
          .catch((error) => {
            console.error('Search subscriptions error:', error);
            setSelectedUser(null);
            setSubscriptions([]);
            setSelectedSubscription(null);
            setAmount('');
            setProfitPercentage('');
            setStatusMessage(error.response?.data?.message || 'User or subscriptions not found');
          });
      } else {
        setSelectedUser(null);
        setSubscriptions([]);
        setSelectedSubscription(null);
        setAmount('');
        setProfitPercentage('');
        setStatusMessage('');
      }
    }, 1000);
  };

  // Debounce wallet search (username/email/phone)
  const handleWalletSearch = (e) => {
    setWalletSearchQuery(e.target.value);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setCurrentPage(1);
      fetchWallets(1, e.target.value, planStatusFilter, amountTypeFilter, transactionIdFilter);
    }, 1000);
  };

  // Handle Transaction ID filter
  const handleTransactionIdFilter = (e) => {
    const value = e.target.value;
    setTransactionIdFilter(value);
    setCurrentPage(1);
    fetchWallets(1, walletSearchQuery, planStatusFilter, amountTypeFilter, value);
  };

  // Handle subscription selection
  const handleSubscriptionSelect = (subscription) => {
    setSelectedSubscription(subscription);
    setAmount(subscription.amount.toString());
    setProfitPercentage(subscription.profit_percentage?.$numberDecimal || subscription.profit_percentage);
  };

  // Add points to wallet
  const handleAddPoints = async () => {
    if (!selectedUser || !selectedSubscription) {
      setStatusMessage('Please select a valid subscription');
      return;
    }
    setIsLoading(true);
    try {
      const res = await axiosInstance.post('/wallet-point/add-points', {
        user_id: selectedUser._id,
        subscription_id: selectedSubscription._id,
        amount: Number(amount),
        profit_percentage: Number(profitPercentage),
        plan_name: selectedSubscription.plan_id?.plan_name || 'N/A',
        amount_type: selectedSubscription.plan_id?.amount_type || 'N/A',
      });
      setStatusMessage(res.data.message || 'Points added successfully');
      setSubscriptions((prev) =>
        prev.map((sub) =>
          sub._id === selectedSubscription._id ? { ...sub, pointsAdded: true } : sub
        )
      );
      setSelectedSubscription(null);
      setAmount('');
      setProfitPercentage('');
      fetchWallets(currentPage, walletSearchQuery, planStatusFilter, amountTypeFilter, transactionIdFilter);
    } catch (error) {
      setStatusMessage(error.response?.data?.message || 'Failed to add points');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch wallets with all filters
  const fetchWallets = async (page, search = '', status = 'all', amountType = 'all', transactionId = '') => {
    try {
      let url = `/wallet-point/wallets?page=${page}&limit=10`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (status !== 'all') url += `&planStatus=${status}`;
      if (amountType !== 'all') url += `&amountType=${amountType}`;
      if (transactionId) url += `&transaction_id=${encodeURIComponent(transactionId)}`;

      const res = await axiosInstance.get(url);
      setWallets(res.data.wallets || []);
      setTotalPages(res.data.totalPages || 1);
      setCurrentPage(res.data.currentPage || 1);
    } catch (error) {
      console.error('Fetch wallets error:', error);
      setStatusMessage('Failed to load wallets');
      setWallets([]);
    }
  };

  // Filter handlers
  const handlePlanStatusFilter = (status) => {
    setPlanStatusFilter(status);
    setCurrentPage(1);
    fetchWallets(1, walletSearchQuery, status, amountTypeFilter, transactionIdFilter);
  };

  const handleAmountTypeFilter = (type) => {
    setAmountTypeFilter(type);
    setCurrentPage(1);
    fetchWallets(1, walletSearchQuery, planStatusFilter, type, transactionIdFilter);
  };

  // Initial load and page change
  useEffect(() => {
    fetchWallets(currentPage, walletSearchQuery, planStatusFilter, amountTypeFilter, transactionIdFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="p-6 space-y-8">
      {/* Search User Section */}
      <Card>
        <CardHeader className="text-[#d09d42] font-bold bg-[#0f1c3f] rounded-t-lg">
          <CardTitle>Search User</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2">
            <Input
              placeholder="Email, Phone Number, or Customer ID"
              value={searchQuery}
              onChange={handleSearch}
            />
            <Search className="h-5 w-5 text-muted-foreground" />
          </div>
          {selectedUser && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="font-semibold text-lg">{selectedUser.username}</p>
              <p className="text-sm text-gray-600">
                {selectedUser.email} | {selectedUser.phone_number}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active Subscriptions */}
      {subscriptions.length > 0 && (
        <Card>
          <CardHeader className="text-[#d09d42] font-bold bg-[#0f1c3f] rounded-t-lg">
            <CardTitle>Active Subscriptions</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plan Name</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Amount Type</TableHead>
                  <TableHead>Profit %</TableHead>
                  <TableHead>Expires At</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscriptions.map((sub) => (
                  <TableRow key={sub._id}>
                    <TableCell>{sub.plan_id?.plan_name || 'N/A'}</TableCell>
                    <TableCell>{sub.amount?.toFixed(2) || 'N/A'}</TableCell>
                    <TableCell>{sub.plan_id?.amount_type || 'N/A'}</TableCell>
                    <TableCell>{sub.profit_percentage?.$numberDecimal || sub.profit_percentage || '0'}%</TableCell>
                    <TableCell>{sub.expires_at ? new Date(sub.expires_at).toLocaleDateString() : 'N/A'}</TableCell>
                    <TableCell>{sub.planStatus || 'N/A'}</TableCell>
                    <TableCell>
                      <Button
                        onClick={() => handleSubscriptionSelect(sub)}
                        variant="outline"
                        size="sm"
                        disabled={sub.pointsAdded || sub.planStatus !== 'Active'}
                      >
                        {sub.pointsAdded ? 'Points Added' : 'Select'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Add Points Form */}
      {selectedSubscription && (
        <Card>
          <CardHeader className="text-[#d09d42] font-bold bg-[#0f1c3f] rounded-t-lg">
            <CardTitle>Add Points to Wallet</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Plan Name</label>
              <Input value={selectedSubscription.plan_id?.plan_name || 'N/A'} readOnly className="bg-gray-100" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Amount Type</label>
              <Input value={selectedSubscription.plan_id?.amount_type || 'N/A'} readOnly className="bg-gray-100" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Capital Amount</label>
              <Input type="number" value={amount} readOnly className="bg-gray-100" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Profit Percentage (%)</label>
              <Input type="number" value={profitPercentage} readOnly className="bg-gray-100" />
            </div>
            <Button
              onClick={handleAddPoints}
              disabled={isLoading}
              className="bg-[#d09d42] hover:bg-[#0f1c3f] text-white"
            >
              <Wallet className="mr-2 h-4 w-4" />
              {isLoading ? 'Adding...' : 'Add Points'}
            </Button>
            {statusMessage && (
              <p className={`font-medium ${statusMessage.includes('success') || statusMessage.includes('added') ? 'text-green-600' : 'text-red-600'}`}>
                {statusMessage}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Wallet Information Table */}
      <Card>
        <CardHeader className="text-[#d09d42] font-bold bg-[#0f1c3f] rounded-t-lg">
          <CardTitle>Wallet Information</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-6 items-end">
            <div className="flex items-center space-x-2">
              <Input
                placeholder="Search by username, email, phone"
                value={walletSearchQuery}
                onChange={handleWalletSearch}
                className="w-64"
              />
              <Search className="h-5 w-5 text-muted-foreground" />
            </div>

            <div>
              <Input
                placeholder="Filter by Transaction ID"
                value={transactionIdFilter}
                onChange={handleTransactionIdFilter}
                className="w-64"
              />
            </div>

            <div>
              <select
                value={planStatusFilter}
                onChange={(e) => handlePlanStatusFilter(e.target.value)}
                className="border rounded-md px-3 py-2 text-sm"
              >
                <option value="all">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            <div>
              <select
                value={amountTypeFilter}
                onChange={(e) => handleAmountTypeFilter(e.target.value)}
                className="border rounded-md px-3 py-2 text-sm"
              >
                <option value="all">All Types</option>
                <option value="INR">INR</option>
                <option value="USDT">USDT</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Transaction ID</TableHead>
                <TableHead>Capital Amount</TableHead>
                <TableHead>Daily Profit</TableHead>
                <TableHead>Referral Earnings</TableHead>
                <TableHead>Total Wallet Points</TableHead>
                <TableHead>Plan Status</TableHead>
                <TableHead>Amount Type</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {wallets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    No wallets found matching the criteria.
                  </TableCell>
                </TableRow>
              ) : (
                wallets.map((wallet) => (
                  <TableRow key={wallet._id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{wallet.user_id?.username || 'N/A'}</div>
                        <div className="text-sm text-gray-500">{wallet.user_id?.email || 'N/A'}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center font-mono text-sm">
                        <span>{wallet.transaction_id || 'N/A'}</span>
                        <CopyField value={wallet.transaction_id} />
                      </div>
                    </TableCell>
                    <TableCell>{wallet.userPlanCapitalAmount?.toFixed(2) || '0.00'}</TableCell>
                    <TableCell>{wallet.dailyProfitAmount?.toFixed(2) || '0.00'}</TableCell>
                    <TableCell>{wallet.referral_amount?.toFixed(2) || '0.00'}</TableCell>
                    <TableCell className="font-semibold text-green-600">
                      {wallet.totalWalletPoint?.toFixed(2) || '0.00'}
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        wallet.planStatus === 'Active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {wallet.planStatus || 'N/A'}
                      </span>
                    </TableCell>
                    <TableCell>{wallet.amount_type || 'N/A'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination className="mt-6">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={(e) => {
                      e.preventDefault();
                      handlePageChange(currentPage - 1);
                    }}
                    className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
                {[...Array(totalPages)].map((_, i) => (
                  <PaginationItem key={i}>
                    <PaginationLink
                      onClick={(e) => {
                        e.preventDefault();
                        handlePageChange(i + 1);
                      }}
                      isActive={currentPage === i + 1}
                      className="cursor-pointer"
                    >
                      {i + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    onClick={(e) => {
                      e.preventDefault();
                      handlePageChange(currentPage + 1);
                    }}
                    className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default WalletManagement;
