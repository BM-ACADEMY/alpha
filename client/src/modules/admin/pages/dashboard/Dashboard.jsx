import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  Package,
  DollarSign,
  UserPlus,
  Calendar,
  MoreVertical,
  Bell,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import axiosInstance from "@/modules/common/lib/axios";
import { showToast } from "@/modules/common/toast/customToast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const Dashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState(null);
  const [filter, setFilter] = useState("monthly");
  const [currencyFilter, setCurrencyFilter] = useState("both");
  const [notifications, setNotifications] = useState({
    pendingRedeem: 0,
    unverifiedUsers: 0,
  });

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [dashboardResponse, redeemResponse, usersResponse] = await Promise.all([
        axiosInstance.get(`/dashboard-route/dashboard?filter=${filter}`),
        axiosInstance.get('/redeem/get-all-request', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          params: { page: 1, limit: 20 },
        }),
        axiosInstance.get("/users/fetch-all-users-details", {
          withCredentials: true,
        }),
      ]);
      console.log("Dashboard data:", dashboardResponse.data);
      setData(dashboardResponse.data);
      setNotifications({
        pendingRedeem: redeemResponse.data.redeemRequests.filter(
          (req) => req.status === 'pending'
        ).length,
        unverifiedUsers: usersResponse.data.filter((u) => !u.verified_by_admin).length,
      });
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      showToast(
        "error",
        error.response?.data?.message || "Failed to load dashboard data"
      );
      setData(null);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filter]);

  // Fallback data
  const fallbackPlanUserCounts = [
    { name: "No Data", starter: 0, advanced: 0, premium: 0, elite: 0 },
  ];
  const fallbackCurrencyDistribution = [
    { name: "₹ INR", value: 0 },
    { name: "₮ USDT", value: 0 },
  ];

  // Filter logic for currency distribution
  const filteredCurrencyData = (
    data?.currencyDistribution?.length
      ? data.currencyDistribution
      : fallbackCurrencyDistribution
  ).filter((item) =>
    currencyFilter === "both"
      ? true
      : currencyFilter === "inr"
      ? item.name.includes("₹")
      : item.name.includes("₮")
  );

  const totalNotifications = notifications.pendingRedeem + notifications.unverifiedUsers;

  // Format referral amount for display
  const formatReferralAmount = (amount) => {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return "0.00";
    }
    return Number(amount).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-[#d09d42] font-bold bg-[#0f1c3f] p-1 rounded">
          Admin Dashboard Overview
        </h1>
        <div className="flex items-center gap-3">
          {/* Notification Bell */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="relative">
                <Bell className="h-4 w-4" />
                {totalNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {totalNotifications}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {notifications.pendingRedeem > 0 && (
                <DropdownMenuItem asChild>
                  <Link to="/admin-dashboard/redeem">
                    {notifications.pendingRedeem} Pending Redeem Request{notifications.pendingRedeem > 1 ? 's' : ''}
                  </Link>
                </DropdownMenuItem>
              )}
              {notifications.unverifiedUsers > 0 && (
                <DropdownMenuItem asChild>
                  <Link to="/admin-dashboard/user-verified">
                    {notifications.unverifiedUsers} Unverified User{notifications.unverifiedUsers > 1 ? 's' : ''}
                  </Link>
                </DropdownMenuItem>
              )}
              {totalNotifications === 0 && (
                <DropdownMenuItem disabled>No new notifications</DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Main Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setFilter("weekly")}>
                Weekly
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilter("monthly")}>
                Monthly
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilter("yearly")}>
                Yearly
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem asChild>
                <Link to="/admin-dashboard/plans">Add New Plan</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/admin-dashboard/payments">Pending KYC</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/admin-dashboard/redeem">Redeem Requests</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {isLoading ? (
          [...Array(8)].map((_, i) => <Skeleton key={i} className="h-32 w-full" />)
        ) : (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data?.totalUsers || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Plans</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data?.totalPlans || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Current Period (₹ INR)
                </CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ₹ {data?.currentMonthAmount?.INR?.toLocaleString() || 0}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Current Period (₮ USDT)
                </CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ₮ {data?.currentMonthAmount?.USDT?.toLocaleString() || 0}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Amount (₹ INR)
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ₹ {data?.totalAmount?.INR?.toLocaleString() || 0}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Amount (₮ USDT)
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ₮ {data?.totalAmount?.USDT?.toLocaleString() || 0}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">New Users Today</CardTitle>
                <UserPlus className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data?.newUsersToday || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Referral Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data?.referralUsers || 0}</div>
                <div className="text-sm text-gray-600 mt-1">
                  Total Referral Earnings: ₹ {formatReferralAmount(data?.totalReferralAmount)}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Plan-wise Users */}
        <Card>
          <CardHeader>
            <CardTitle>Plan-wise User Count ({filter})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart
                  data={
                    data?.planUserCounts?.length
                      ? data.planUserCounts
                      : fallbackPlanUserCounts
                  }
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="starter" stroke="#8884d8" strokeWidth={2} name="Starter" />
                  <Line type="monotone" dataKey="advanced" stroke="#82ca9d" strokeWidth={2} name="Advanced" />
                  <Line type="monotone" dataKey="premium" stroke="#ffc658" strokeWidth={2} name="Premium" />
                  <Line type="monotone" dataKey="elite" stroke="#ff7300" strokeWidth={2} name="Elite" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Currency Distribution */}
        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Currency Distribution</CardTitle>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  {currencyFilter === "both"
                    ? "Both"
                    : currencyFilter === "inr"
                    ? "₹ INR"
                    : "₮ USDT"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setCurrencyFilter("both")}>
                  Both
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setCurrencyFilter("inr")}>
                  ₹ INR
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setCurrencyFilter("usdt")}>
                  ₮ USDT
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={filteredCurrencyData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label
                  >
                    {filteredCurrencyData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={index === 0 ? "#0088FE" : "#00C49F"}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Referred Users List */}
      <Card>
        <CardHeader className="text-[#d09d42] font-bold bg-[#0f1c3f] p-1 rounded">
          <CardTitle>Total Referred Users List</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Referred By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.referredUsersList?.length > 0 ? (
                  data.referredUsersList.map((user) => (
                    <TableRow key={user.user_id}>
                      <TableCell>{user.username || 'N/A'}</TableCell>
                      <TableCell>{user.email || 'N/A'}</TableCell>
                      <TableCell>{user.referred_by_username || 'N/A'}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center">
                      No referred users found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Referral Earnings by User */}
      <Card>
        <CardHeader className="text-[#d09d42] font-bold bg-[#0f1c3f] p-1 rounded">
          <CardTitle>Referral Earnings by User</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Referral Earnings (₹)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.referralEarningsByUser?.length > 0 ? (
                  data.referralEarningsByUser.map((user) => (
                    <TableRow key={user.user_id}>
                      <TableCell>{user.username || 'N/A'}</TableCell>
                      <TableCell>{formatReferralAmount(user.referral_amount)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center">
                      No referral earnings found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;