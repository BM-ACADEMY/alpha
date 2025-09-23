// // import React, { useState, useEffect, useRef } from 'react';
// // import { Input } from '@/components/ui/input';
// // import { Button } from '@/components/ui/button';
// // import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// // import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
// // import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
// // import { Search, Wallet } from 'lucide-react';
// // import axiosInstance from '@/modules/common/lib/axios';

// // const WalletManagement = () => {
// //   const [searchQuery, setSearchQuery] = useState('');
// //   const [selectedUser, setSelectedUser] = useState(null);
// //   const [subscriptions, setSubscriptions] = useState([]);
// //   const [selectedSubscription, setSelectedSubscription] = useState(null);
// //   const [amount, setAmount] = useState('');
// //   const [profitPercentage, setProfitPercentage] = useState('');
// //   const [statusMessage, setStatusMessage] = useState('');
// //   const [wallets, setWallets] = useState([]);
// //   const [currentPage, setCurrentPage] = useState(1);
// //   const [totalPages, setTotalPages] = useState(1);
// //   const [isLoading, setIsLoading] = useState(false);
// //   const debounceTimer = useRef(null);

// //   // Debounce search
// //   const handleSearch = (e) => {
// //     setSearchQuery(e.target.value);
// //     if (debounceTimer.current) clearTimeout(debounceTimer.current);
// //     debounceTimer.current = setTimeout(() => {
// //       if (e.target.value) {
// //         axiosInstance
// //           .get(`/wallet-point/search-subscriptions?query=${e.target.value}`)
// //           .then((res) => {
// //             setSelectedUser(res.data.user);
// //             setSubscriptions(res.data.subscriptions);
// //             setSelectedSubscription(null);
// //             setAmount('');
// //             setProfitPercentage('');
// //             setStatusMessage('');
// //           })
// //           .catch((error) => {
// //             console.error('Search subscriptions error:', error.message, error.response?.data);
// //             setSelectedUser(null);
// //             setSubscriptions([]);
// //             setSelectedSubscription(null);
// //             setAmount('');
// //             setProfitPercentage('');
// //             setStatusMessage(error.response?.data?.message || 'Failed to find user or subscriptions');
// //           });
// //       } else {
// //         setSelectedUser(null);
// //         setSubscriptions([]);
// //         setSelectedSubscription(null);
// //         setAmount('');
// //         setProfitPercentage('');
// //       }
// //     }, 1000);
// //   };

// //   // Handle subscription selection
// //   const handleSubscriptionSelect = (subscription) => {
// //     setSelectedSubscription(subscription);
// //     setAmount(subscription.amount.toString());
// //     setProfitPercentage(subscription.profit_percentage.$numberDecimal);
// //   };

// //   // Add points to wallet
// //   const handleAddPoints = async () => {
// //     if (!selectedUser || !selectedSubscription || !amount || !profitPercentage) {
// //       setStatusMessage('Please select a user, subscription, and ensure all fields are filled');
// //       return;
// //     }
// //     setIsLoading(true);
// //     try {
// //       const res = await axiosInstance.post('/wallet-point/add-points', {
// //         user_id: selectedUser._id,
// //         subscription_id: selectedSubscription._id,
// //         amount: Number(amount),
// //         profit_percentage: Number(profitPercentage),
// //       });
// //       console.log('Points added:', res.data);
// //       setStatusMessage(res.data.message);
// //       fetchWallets(currentPage);
// //     } catch (error) {
// //       console.error('Add points error:', error.message, error.response?.data);
// //       setStatusMessage(error.response?.data?.message || 'Failed to add points to wallet');
// //     } finally {
// //       setIsLoading(false);
// //     }
// //   };

// //   // Fetch all wallets
// //   const fetchWallets = async (page) => {
// //     try {
// //       const res = await axiosInstance.get(`/wallet-point/wallets?page=${page}&limit=10`);
// //       setWallets(res.data.wallets);
// //       console.log(res.data,"wallere");
      
// //       setTotalPages(res.data.totalPages);
// //     } catch (error) {
// //       console.error('Fetch wallets error:', error.message, error.response?.data);
// //       setStatusMessage('Failed to fetch wallet information');
// //     }
// //   };

// //   // Fetch wallets on mount and page change
// //   useEffect(() => {
// //     fetchWallets(currentPage);
// //   }, [currentPage]);

// //   // Pagination handlers
// //   const handlePageChange = (page) => {
// //     setCurrentPage(page);
// //   };

// //   return (
// //     <div className="p-6 space-y-8">
// //       {/* Search User */}
// //       <Card>
// //         <CardHeader className="text-[#d09d42] font-bold bg-[#0f1c3f] p-1 rounded">
// //           <CardTitle>Search User</CardTitle>
// //         </CardHeader>
// //         <CardContent>
// //           <div className="flex items-center space-x-2">
// //             <Input
// //               placeholder="Email, Phone Number, or Customer ID"
// //               value={searchQuery}
// //               onChange={handleSearch}
// //             />
// //             <Search className="h-5 w-5 text-muted-foreground" />
// //           </div>
// //           {selectedUser && (
// //             <div className="mt-4">
// //               <p className="font-semibold">{selectedUser.username}</p>
// //               <p className="text-sm text-muted-foreground">
// //                 {selectedUser.email} | {selectedUser.phone_number}
// //               </p>
// //             </div>
// //           )}
// //         </CardContent>
// //       </Card>

// //       {/* Subscriptions Table */}
// //       {subscriptions.length > 0 && (
// //         <Card>
// //           <CardHeader className="text-[#d09d42] font-bold bg-[#0f1c3f] p-1 rounded">
// //             <CardTitle>Active Subscriptions</CardTitle>
// //           </CardHeader>
// //           <CardContent>
// //             <Table>
// //               <TableHeader>
// //                 <TableRow>
// //                   <TableHead>Plan Name</TableHead>
// //                   <TableHead>Amount</TableHead>
// //                   <TableHead>Profit %</TableHead>
// //                   <TableHead>Expires At</TableHead>
// //                   <TableHead>Action</TableHead>
// //                 </TableRow>
// //               </TableHeader>
// //               <TableBody>
// //                 {subscriptions.map((sub) => (
// //                   <TableRow key={sub._id}>
// //                     <TableCell>{sub.plan_id.plan_name}</TableCell>
// //                     <TableCell>{sub.amount}</TableCell>
// //                     <TableCell>{sub.profit_percentage.$numberDecimal}%</TableCell>
// //                     <TableCell>{new Date(sub.expires_at).toLocaleDateString()}</TableCell>
// //                     <TableCell>
// //                       <Button
// //                         onClick={() => handleSubscriptionSelect(sub)}
// //                         variant="outline"
// //                         size="sm"
// //                         className="cursor-pointer"
// //                       >
// //                         Select
// //                       </Button>
// //                     </TableCell>
// //                   </TableRow>
// //                 ))}
// //               </TableBody>
// //             </Table>
// //           </CardContent>
// //         </Card>
// //       )}

// //       {/* Add Points Form */}
// //       {selectedSubscription && (
// //         <Card>
// //           <CardHeader className="text-[#d09d42] font-bold bg-[#0f1c3f] p-1 rounded">
// //             <CardTitle>Add Points to Wallet</CardTitle>
// //           </CardHeader>
// //           <CardContent>
// //             <div className="space-y-4">
// //               <div>
// //                 <label>Capital Amount</label>
// //                 <Input
// //                   type="number"
// //                   value={amount}
// //                   readOnly
// //                 />
// //               </div>
// //               <div>
// //                 <label>Profit Percentage (%)</label>
// //                 <Input
// //                   type="number"
// //                   value={profitPercentage}
// //                   readOnly
// //                 />
// //               </div>
// //               <Button onClick={handleAddPoints} disabled={isLoading}    className="mb-4 bg-[#d09d42] text-white hover:bg-[#0f1c3f] cursor-pointer">
// //                 <Wallet className="mr-2 h-4 w-4" /> Add Points
// //               </Button>
// //               {statusMessage && (
// //                 <p className={statusMessage.includes('Failed') ? 'text-red-600' : 'text-green-600'}>
// //                   {statusMessage}
// //                 </p>
// //               )}
// //             </div>
// //           </CardContent>
// //         </Card>
// //       )}

// //       {/* Wallets Table */}
// //       <Card>
// //         <CardHeader className="text-[#d09d42] font-bold bg-[#0f1c3f] p-1 rounded"> 
// //           <CardTitle>Wallet Information</CardTitle>
// //         </CardHeader>
// //         <CardContent>
// //           <Table>
// //             <TableHeader>
// //               <TableRow>
// //                 <TableHead>User</TableHead>
// //                 <TableHead>Capital Amount</TableHead>
// //                 <TableHead>Daily Profit</TableHead>
// //                 <TableHead>Total Wallet Points</TableHead>
// //               </TableRow>
// //             </TableHeader>
// //             <TableBody>
// //               {wallets.map((wallet) => (
// //                 <TableRow key={wallet._id}>
// //                   <TableCell>
// //                     {wallet?.user_id?.username} ({wallet?.user_id?.email})
// //                   </TableCell>
// //                   <TableCell>{wallet.userPlanCapitalAmount}</TableCell>
// //                   <TableCell>{wallet.dailyProfitAmount.toFixed(2)}</TableCell>
// //                   <TableCell>{wallet.totalWalletPoint.toFixed(2)}</TableCell>
// //                 </TableRow>
// //               ))}
// //             </TableBody>
// //           </Table>
// //           <Pagination className="mt-4">
// //             <PaginationContent>
// //               <PaginationItem>
// //                 <PaginationPrevious
// //                   href="#"
// //                   onClick={() => handlePageChange(currentPage > 1 ? currentPage - 1 : 1)}
// //                   disabled={currentPage === 1}
// //                 />
// //               </PaginationItem>
// //               {[...Array(totalPages)].map((_, i) => (
// //                 <PaginationItem key={i}>
// //                   <PaginationLink
// //                     href="#"
// //                     onClick={() => handlePageChange(i + 1)}
// //                     isActive={currentPage === i + 1}
// //                   >
// //                     {i + 1}
// //                   </PaginationLink>
// //                 </PaginationItem>
// //               ))}
// //               <PaginationItem>
// //                 <PaginationNext
// //                   href="#"
// //                   onClick={() => handlePageChange(currentPage < totalPages ? currentPage + 1 : totalPages)}
// //                   disabled={currentPage === totalPages}
// //                 />
// //               </PaginationItem>
// //             </PaginationContent>
// //           </Pagination>
// //         </CardContent>
// //       </Card>
// //     </div>
// //   );
// // };

// // export default WalletManagement;

// import React, { useState, useEffect, useRef } from 'react';
// import { Input } from '@/components/ui/input';
// import { Button } from '@/components/ui/button';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
// import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
// import { Search, Wallet, Filter } from 'lucide-react';
// import axiosInstance from '@/modules/common/lib/axios';

// const WalletManagement = () => {
//   const [searchQuery, setSearchQuery] = useState('');
//   const [walletSearchQuery, setWalletSearchQuery] = useState('');
//   const [selectedUser, setSelectedUser] = useState(null);
//   const [subscriptions, setSubscriptions] = useState([]);
//   const [selectedSubscription, setSelectedSubscription] = useState(null);
//   const [amount, setAmount] = useState('');
//   const [profitPercentage, setProfitPercentage] = useState('');
//   const [statusMessage, setStatusMessage] = useState('');
//   const [wallets, setWallets] = useState([]);
//   const [currentPage, setCurrentPage] = useState(1);
//   const [totalPages, setTotalPages] = useState(1);
//   const [isLoading, setIsLoading] = useState(false);
//   const [planStatusFilter, setPlanStatusFilter] = useState('all');
//   const debounceTimer = useRef(null);

//   // Debounce search for user subscriptions
//   const handleSearch = (e) => {
//     setSearchQuery(e.target.value);
//     if (debounceTimer.current) clearTimeout(debounceTimer.current);
//     debounceTimer.current = setTimeout(() => {
//       if (e.target.value) {
//         axiosInstance
//           .get(`/wallet-point/search-subscriptions?query=${e.target.value}`)
//           .then((res) => {
//             setSelectedUser(res.data.user);
//             setSubscriptions(res.data.subscriptions);
//             setSelectedSubscription(null);
//             setAmount('');
//             setProfitPercentage('');
//             setStatusMessage('');
//           })
//           .catch((error) => {
//             console.error('Search subscriptions error:', error.message, error.response?.data);
//             setSelectedUser(null);
//             setSubscriptions([]);
//             setSelectedSubscription(null);
//             setAmount('');
//             setProfitPercentage('');
//             setStatusMessage(error.response?.data?.message || 'Failed to find user or subscriptions');
//           });
//       } else {
//         setSelectedUser(null);
//         setSubscriptions([]);
//         setSelectedSubscription(null);
//         setAmount('');
//         setProfitPercentage('');
//       }
//     }, 1000);
//   };

//   // Debounce search for wallets
//   const handleWalletSearch = (e) => {
//     setWalletSearchQuery(e.target.value);
//     if (debounceTimer.current) clearTimeout(debounceTimer.current);
//     debounceTimer.current = setTimeout(() => {
//       fetchWallets(currentPage, e.target.value, planStatusFilter);
//     }, 1000);
//   };

//   // Handle subscription selection
//   const handleSubscriptionSelect = (subscription) => {
//     setSelectedSubscription(subscription);
//     setAmount(subscription.amount.toString());
//     setProfitPercentage(subscription.profit_percentage.$numberDecimal);
//   };

//   // Add points to wallet
//   const handleAddPoints = async () => {
//     if (!selectedUser || !selectedSubscription || !amount || !profitPercentage) {
//       setStatusMessage('Please select a user, subscription, and ensure all fields are filled');
//       return;
//     }
//     setIsLoading(true);
//     try {
//       const res = await axiosInstance.post('/wallet-point/add-points', {
//         user_id: selectedUser._id,
//         subscription_id: selectedSubscription._id,
//         amount: Number(amount),
//         profit_percentage: Number(profitPercentage),
//       });
//       console.log('Points added:', res.data);
//       setStatusMessage(res.data.message);
//       fetchWallets(currentPage, walletSearchQuery, planStatusFilter);
//     } catch (error) {
//       console.error('Add points error:', error.message, error.response?.data);
//       setStatusMessage(error.response?.data?.message || 'Failed to add points to wallet');
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   // Fetch all wallets with search and filter
//   const fetchWallets = async (page, search = '', status = 'all') => {
//     try {
//       let url = `/wallet-point/wallets?page=${page}&limit=10`;
//       if (search) url += `&search=${encodeURIComponent(search)}`;
//       if (status !== 'all') url += `&planStatus=${status}`;
      
//       const res = await axiosInstance.get(url);
//       setWallets(res.data.wallets);
//       setTotalPages(res.data.totalPages);
//     } catch (error) {
//       console.error('Fetch wallets error:', error.message, error.response?.data);
//       setStatusMessage('Failed to fetch wallet information');
//     }
//   };

//   // Handle plan status filter change
//   const handlePlanStatusFilter = (status) => {
//     setPlanStatusFilter(status);
//     setCurrentPage(1);
//     fetchWallets(1, walletSearchQuery, status);
//   };

//   // Fetch wallets on mount and when page, search, or filter changes
//   useEffect(() => {
//     fetchWallets(currentPage, walletSearchQuery, planStatusFilter);
//   }, [currentPage, planStatusFilter]);

//   // Pagination handlers
//   const handlePageChange = (page) => {
//     setCurrentPage(page);
//   };

//   return (
//     <div className="p-6 space-y-8">
//       {/* Search User */}
//       <Card>
//         <CardHeader className="text-[#d09d42] font-bold bg-[#0f1c3f] p-1 rounded">
//           <CardTitle>Search User</CardTitle>
//         </CardHeader>
//         <CardContent>
//           <div className="flex items-center space-x-2">
//             <Input
//               placeholder="Email, Phone Number, or Customer ID"
//               value={searchQuery}
//               onChange={handleSearch}
//             />
//             <Search className="h-5 w-5 text-muted-foreground" />
//           </div>
//           {selectedUser && (
//             <div className="mt-4">
//               <p className="font-semibold">{selectedUser.username}</p>
//               <p className="text-sm text-muted-foreground">
//                 {selectedUser.email} | {selectedUser.phone_number}
//               </p>
//             </div>
//           )}
//         </CardContent>
//       </Card>

//       {/* Subscriptions Table */}
//       {subscriptions.length > 0 && (
//         <Card>
//           <CardHeader className="text-[#d09d42] font-bold bg-[#0f1c3f] p-1 rounded">
//             <CardTitle>Active Subscriptions</CardTitle>
//           </CardHeader>
//           <CardContent>
//             <Table>
//               <TableHeader>
//                 <TableRow>
//                   <TableHead>Plan Name</TableHead>
//                   <TableHead>Amount</TableHead>
//                   <TableHead>Profit %</TableHead>
//                   <TableHead>Expires At</TableHead>
//                   <TableHead>Status</TableHead>
//                   <TableHead>Action</TableHead>
//                 </TableRow>
//               </TableHeader>
//               <TableBody>
//                 {subscriptions.map((sub) => (
//                   <TableRow key={sub._id}>
//                     <TableCell>{sub.plan_id.plan_name}</TableCell>
//                     <TableCell>{sub.amount}</TableCell>
//                     <TableCell>{sub.profit_percentage.$numberDecimal}%</TableCell>
//                     <TableCell>{new Date(sub.expires_at).toLocaleDateString()}</TableCell>
//                     <TableCell>{sub.planStatus}</TableCell>
//                     <TableCell>
//                       <Button
//                         onClick={() => handleSubscriptionSelect(sub)}
//                         variant="outline"
//                         size="sm"
//                         className="cursor-pointer"
//                       >
//                         Select
//                       </Button>
//                     </TableCell>
//                   </TableRow>
//                 ))}
//               </TableBody>
//             </Table>
//           </CardContent>
//         </Card>
//       )}

//       {/* Add Points Form */}
//       {selectedSubscription && (
//         <Card>
//           <CardHeader className="text-[#d09d42] font-bold bg-[#0f1c3f] p-1 rounded">
//             <CardTitle>Add Points to Wallet</CardTitle>
//           </CardHeader>
//           <CardContent>
//             <div className="space-y-4">
//               <div>
//                 <label>Capital Amount</label>
//                 <Input
//                   type="number"
//                   value={amount}
//                   readOnly
//                 />
//               </div>
//               <div>
//                 <label>Profit Percentage (%)</label>
//                 <Input
//                   type="number"
//                   value={profitPercentage}
//                   readOnly
//                 />
//               </div>
//               <Button onClick={handleAddPoints} disabled={isLoading} className="mb-4 bg-[#d09d42] text-white hover:bg-[#0f1c3f] cursor-pointer">
//                 <Wallet className="mr-2 h-4 w-4" /> Add Points
//               </Button>
//               {statusMessage && (
//                 <p className={statusMessage.includes('Failed') ? 'text-red-600' : 'text-green-600'}>
//                   {statusMessage}
//                 </p>
//               )}
//             </div>
//           </CardContent>
//         </Card>
//       )}

//       {/* Wallets Table */}
//       <Card>
//         <CardHeader className="text-[#d09d42] font-bold bg-[#0f1c3f] p-1 rounded">
//           <CardTitle>Wallet Information</CardTitle>
//         </CardHeader>
//         <CardContent>
//           <div className="flex items-center space-x-4 mb-4">
//             <div className="flex items-center space-x-2">
//               <Input
//                 placeholder="Search by username, email, or phone"
//                 value={walletSearchQuery}
//                 onChange={handleWalletSearch}
//               />
//               <Search className="h-5 w-5 text-muted-foreground" />
//             </div>
//             <div className="flex items-center space-x-2">
//               <Filter className="h-5 w-5 text-muted-foreground" />
//               <select
//                 value={planStatusFilter}
//                 onChange={(
//                 e) => handlePlanStatusFilter(e.target.value)}
//                 className="border rounded p-2"
//               >
//                 <option value="all">All</option>
//                 <option value="Active">Active</option>
//                 <option value="Inactive">Inactive</option>
//               </select>
//             </div>
//           </div>
//           <Table>
//             <TableHeader>
//               <TableRow>
//                 <TableHead>User</TableHead>
//                 <TableHead>Capital Amount</TableHead>
//                 <TableHead>Daily Profit</TableHead>
//                 <TableHead>Referral Earnings</TableHead>
//                 <TableHead>Total Wallet Points</TableHead>
//                 <TableHead>Plan Status</TableHead>
//               </TableRow>
//             </TableHeader>
//             <TableBody>
//               {wallets.map((wallet) => (
//                 <TableRow key={wallet._id}>
//                   <TableCell>
//                     {wallet?.user_id?.username} ({wallet?.user_id?.email})
//                   </TableCell>
//                   <TableCell>{wallet.userPlanCapitalAmount}</TableCell>
//                   <TableCell>{wallet.dailyProfitAmount.toFixed(2)}</TableCell>
//                   <TableCell>{wallet.referral_amount.toFixed(2)}</TableCell>
//                   <TableCell>{wallet.totalWalletPoint.toFixed(2)}</TableCell>
//                   <TableCell>{wallet.planStatus || 'N/A'}</TableCell>
//                 </TableRow>
//               ))}
//             </TableBody>
//           </Table>
//           <Pagination className="mt-4">
//             <PaginationContent>
//               <PaginationItem>
//                 <PaginationPrevious
//                   href="#"
//                   onClick={() => handlePageChange(currentPage > 1 ? currentPage - 1 : 1)}
//                   disabled={currentPage === 1}
//                 />
//               </PaginationItem>
//               {[...Array(totalPages)].map((_, i) => (
//                 <PaginationItem key={i}>
//                   <PaginationLink
//                     href="#"
//                     onClick={() => handlePageChange(i + 1)}
//                     isActive={currentPage === i + 1}
//                   >
//                     {i + 1}
//                   </PaginationLink>
//                 </PaginationItem>
//               ))}
//               <PaginationItem>
//                 <PaginationNext
//                   href="#"
//                   onClick={() => handlePageChange(currentPage < totalPages ? currentPage + 1 : totalPages)}
//                   disabled={currentPage === totalPages}
//                 />
//               </PaginationItem>
//             </PaginationContent>
//           </Pagination>
//         </CardContent>
//       </Card>
//     </div>
//   );
// };

// export default WalletManagement;


import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Search, Wallet } from 'lucide-react';
import axiosInstance from '@/modules/common/lib/axios';

const WalletManagement = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [walletSearchQuery, setWalletSearchQuery] = useState('');
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
  const debounceTimer = useRef(null);

  // Debounce search for user subscriptions
  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      if (e.target.value) {
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
            console.error('Search subscriptions error:', error.message, error.response?.data);
            setSelectedUser(null);
            setSubscriptions([]);
            setSelectedSubscription(null);
            setAmount('');
            setProfitPercentage('');
            setStatusMessage(error.response?.data?.message || 'Failed to find user or subscriptions');
          });
      } else {
        setSelectedUser(null);
        setSubscriptions([]);
        setSelectedSubscription(null);
        setAmount('');
        setProfitPercentage('');
      }
    }, 1000);
  };

  // Debounce search for wallets
  const handleWalletSearch = (e) => {
    setWalletSearchQuery(e.target.value);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      fetchWallets(currentPage, e.target.value, planStatusFilter);
    }, 1000);
  };

  // Handle subscription selection
  const handleSubscriptionSelect = (subscription) => {
    setSelectedSubscription(subscription);
    setAmount(subscription.amount.toString());
    setProfitPercentage(subscription.profit_percentage.$numberDecimal);
  };

  // Add points to wallet
  const handleAddPoints = async () => {
    if (!selectedUser || !selectedSubscription || !amount || !profitPercentage) {
      setStatusMessage('Please select a user, subscription, and ensure all fields are filled');
      return;
    }
    setIsLoading(true);
    try {
      const res = await axiosInstance.post('/wallet-point/add-points', {
        user_id: selectedUser._id,
        subscription_id: selectedSubscription._id,
        amount: Number(amount),
        profit_percentage: Number(profitPercentage),
      });
      console.log('Points added:', res.data);
      setStatusMessage(res.data.message);
      fetchWallets(currentPage, walletSearchQuery, planStatusFilter);
    } catch (error) {
      console.error('Add points error:', error.message, error.response?.data);
      setStatusMessage(error.response?.data?.message || 'Failed to add points to wallet');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch all wallets with search and filter
  const fetchWallets = async (page, search = '', status = 'all') => {
    try {
      let url = `/wallet-point/wallets?page=${page}&limit=10`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (status !== 'all') url += `&planStatus=${status}`;
      
      const res = await axiosInstance.get(url);
      setWallets(res.data.wallets);
      setTotalPages(res.data.totalPages);
    } catch (error) {
      console.error('Fetch wallets error:', error.message, error.response?.data);
      setStatusMessage('Failed to fetch wallet information');
    }
  };

  // Handle plan status filter change
  const handlePlanStatusFilter = (status) => {
    setPlanStatusFilter(status);
    setCurrentPage(1);
    fetchWallets(1, walletSearchQuery, status);
  };

  // Fetch wallets on mount and when page, search, or filter changes
  useEffect(() => {
    fetchWallets(currentPage, walletSearchQuery, planStatusFilter);
  }, [currentPage, planStatusFilter]);

  // Pagination handlers
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  return (
    <div className="p-6 space-y-8">
      {/* Search User */}
      <Card>
        <CardHeader className="text-[#d09d42] font-bold bg-[#0f1c3f] p-1 rounded">
          <CardTitle>Search User</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Input
              placeholder="Email, Phone Number, or Customer ID"
              value={searchQuery}
              onChange={handleSearch}
            />
            <Search className="h-5 w-5 text-muted-foreground" />
          </div>
          {selectedUser && (
            <div className="mt-4">
              <p className="font-semibold">{selectedUser.username}</p>
              <p className="text-sm text-muted-foreground">
                {selectedUser.email} | {selectedUser.phone_number}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Subscriptions Table */}
      {subscriptions.length > 0 && (
        <Card>
          <CardHeader className="text-[#d09d42] font-bold bg-[#0f1c3f] p-1 rounded">
            <CardTitle>Active Subscriptions</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plan Name</TableHead>
                  <TableHead>Amount</TableHead>
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
                    <TableCell>{sub.amount || 'N/A'}</TableCell>
                    <TableCell>{sub.profit_percentage?.$numberDecimal || '0'}%</TableCell>
                    <TableCell>{sub.expires_at ? new Date(sub.expires_at).toLocaleDateString() : 'N/A'}</TableCell>
                    <TableCell>{sub.planStatus || 'N/A'}</TableCell>
                    <TableCell>
                      <Button
                        onClick={() => handleSubscriptionSelect(sub)}
                        variant="outline"
                        size="sm"
                        className="cursor-pointer"
                        disabled={!sub.planStatus || sub.planStatus !== 'Active'}
                      >
                        Select
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
          <CardHeader className="text-[#d09d42] font-bold bg-[#0f1c3f] p-1 rounded">
            <CardTitle>Add Points to Wallet</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label>Capital Amount</label>
                <Input
                  type="number"
                  value={amount}
                  readOnly
                />
              </div>
              <div>
                <label>Profit Percentage (%)</label>
                <Input
                  type="number"
                  value={profitPercentage}
                  readOnly
                />
              </div>
              <Button onClick={handleAddPoints} disabled={isLoading} className="mb-4 bg-[#d09d42] text-white hover:bg-[#0f1c3f] cursor-pointer">
                <Wallet className="mr-2 h-4 w-4" /> Add Points
              </Button>
              {statusMessage && (
                <p className={statusMessage.includes('Failed') ? 'text-red-600' : 'text-green-600'}>
                  {statusMessage}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Wallets Table */}
      <Card>
        <CardHeader className="text-[#d09d42] font-bold bg-[#0f1c3f] p-1 rounded">
          <CardTitle>Wallet Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 mb-4">
            <div className="flex items-center space-x-2">
              <Input
                placeholder="Search by username, email, or phone"
                value={walletSearchQuery}
                onChange={handleWalletSearch}
              />
              <Search className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex items-center space-x-2">
              {/* <Filter className="h-5 w-5 text-muted-foreground" /> */}
              <select
                value={planStatusFilter}
                onChange={(e) => handlePlanStatusFilter(e.target.value)}
                className="border rounded p-2"
              >
                <option value="all">All</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Capital Amount</TableHead>
                <TableHead>Daily Profit</TableHead>
                <TableHead>Referral Earnings</TableHead>
                <TableHead>Total Wallet Points</TableHead>
                <TableHead>Plan Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {wallets.map((wallet) => (
                <TableRow key={wallet._id}>
                  <TableCell>
                    {wallet?.user_id?.username || 'N/A'} ({wallet?.user_id?.email || 'N/A'})
                  </TableCell>
                  <TableCell>{wallet.userPlanCapitalAmount || '0'}</TableCell>
                  <TableCell>{wallet.dailyProfitAmount?.toFixed(2) || '0.00'}</TableCell>
                  <TableCell>{wallet.referral_amount?.toFixed(2) || '0.00'}</TableCell>
                  <TableCell>{wallet.totalWalletPoint?.toFixed(2) || '0.00'}</TableCell>
                  <TableCell>{wallet.planStatus || 'N/A'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Pagination className="mt-4">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={() => handlePageChange(currentPage > 1 ? currentPage - 1 : 1)}
                  disabled={currentPage === 1}
                />
              </PaginationItem>
              {[...Array(totalPages)].map((_, i) => (
                <PaginationItem key={i}>
                  <PaginationLink
                    href="#"
                    onClick={() => handlePageChange(i + 1)}
                    isActive={currentPage === i + 1}
                  >
                    {i + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={() => handlePageChange(currentPage < totalPages ? currentPage + 1 : totalPages)}
                  disabled={currentPage === totalPages}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </CardContent>
      </Card>
    </div>
  );
};

export default WalletManagement;