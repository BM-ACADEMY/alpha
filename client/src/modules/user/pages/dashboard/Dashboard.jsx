import React, { useState, useEffect, useContext } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  User,
  Wallet,
  Users as ReferralIcon,
  AlertTriangle,
  DollarSign,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { showToast } from "@/modules/common/toast/customToast";
import axiosInstance from "@/modules/common/lib/axios";
import { AuthContext } from "@/modules/common/context/AuthContext";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const Dashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useContext(AuthContext);
  const userId = user?.id;
  const [data, setData] = useState(null);
  const [redeemRequests, setRedeemRequests] = useState([]);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [loadingSubscription, setLoadingSubscription] = useState(true);
  const [profitView, setProfitView] = useState("monthly"); // State for toggle: 'daily' or 'monthly'


  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Fetch dashboard data
        const dashboardResponse = await axiosInstance.get(
          `/dashboard-route/user-dashboard/${userId}`,
          { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
        );
        setData(dashboardResponse.data);

        // Fetch redeem requests
        const redeemResponse = await axiosInstance.get(
          `/redeem/user-requests/${userId}`,
          { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
        );
        setRedeemRequests(redeemResponse.data.redeemRequests || []);

        // Fetch subscription status
        const subscriptionResponse = await axiosInstance.get(
          "/user-subscription-plan/purchased-plans",
          {
            params: {
              page: 1,
              limit: 1,
              user_id: userId,
            },
            withCredentials: true,
          }
        );

        const subscriptions = subscriptionResponse.data.subscriptions;
        if (subscriptions.length > 0 && subscriptions[0].status === "verified") {
          setSubscriptionStatus("Active");
        } else {
          setSubscriptionStatus("Not Active");
        }

        showToast("success", "Dashboard data loaded successfully!");
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        showToast("error", error.response?.data?.message || "Failed to load dashboard data");
        setSubscriptionStatus("Not Active");
      } finally {
        setIsLoading(false);
        setLoadingSubscription(false);
      }
    };

    if (userId) fetchData();
  }, [userId]);

  // Toggle handler for Daily/Monthly view
  const handleToggleView = (view) => {
    setProfitView(view);
  };

  // Prepare chart data based on view
  const chartData = profitView === "monthly" ? data?.profitOverTime || [] : data?.dailyProfitOverTime || [];

  return (
    <div className="p-6 space-y-6">


      <h1 className="text-[#d09d42] font-bold bg-[#0f1c3f] p-1 rounded">Your Dashboard</h1>

      {/* Profile, Wallet, Referral */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          [...Array(3)]?.map((_, i) => <Skeleton key={i} className="h-32 w-full" />)
        ) : (
          <>
            {/* Profile */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Your Profile</CardTitle>
                <User className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p><strong>ID:</strong> {data?.profile?.customerId || "N/A"}</p>
                <p><strong>Username:</strong> {data?.profile?.username || "N/A"}</p>
                <p><strong>Email:</strong> {data?.profile?.email || "N/A"}</p>
                <p><strong>Referral Code:</strong> {data?.profile?.referralCode || "N/A"}</p>
                <p><strong>Referred By:</strong> {data?.profile?.referredBy || "None"}</p>
              </CardContent>
            </Card>

            {/* Wallet */}
            {/* <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Wallet</CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p><strong>Capital Amount:</strong> {data?.wallet?.userPlanCapitalAmount?.toLocaleString() || 0} INR</p>
                <p><strong>Daily Profit:</strong> {data?.wallet?.dailyProfitAmount?.toLocaleString() || 0} INR</p>
                <p><strong>Total Points:</strong> {data?.wallet?.totalWalletPoint?.toLocaleString() || 0} INR</p>
              </CardContent>
            </Card> */}

            {/* Referral */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Referral Stats</CardTitle>
                <ReferralIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data?.referralCount || 0}</div>
                <p className="text-sm text-muted-foreground">Users referred</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Active Plans */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Your Active Plans
            {loadingSubscription ? (
              <span className="text-gray-500 italic">Loading...</span>
            ) : (
              <Badge
                variant={subscriptionStatus === "Active" ? "success" : "destructive"}
                className={subscriptionStatus === "Active" ? "bg-green-500 text-white" : ""}
              >
                {subscriptionStatus}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? <Skeleton className="h-64 w-full" /> : (
            data?.activePlans?.length ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.activePlans?.map((plan, i) => (
                  <div key={i} className="border p-4 rounded-md bg-gray-50">
                    <p><strong>Plan:</strong> {plan.planName}</p>
                    <p><strong>Amount:</strong> {plan.amountType} {plan.amount.toLocaleString()}</p>
                    <p><strong>Profit %:</strong> {plan.profitPercentage}%</p>
                    <p><strong>Purchased:</strong> {new Date(plan.purchasedAt).toLocaleDateString()}</p>
                    <p><strong>Expires:</strong> {new Date(plan.expiresAt).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            ) : <p className="text-muted-foreground">No active plans found.</p>
          )}
        </CardContent>
      </Card>

      {/* Redeem Requests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <DollarSign className="h-5 w-5 mr-2 text-muted-foreground" />
            Your Redeem Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? <Skeleton className="h-64 w-full" /> : (
            redeemRequests.length ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {redeemRequests?.map(req => (
                  <div key={req._id} className="border p-4 rounded-md bg-gray-50">
                    <p><strong>Amount:</strong> {req.redeem_amount.toLocaleString()} {req.account_type}</p>
                    <p><strong>Status:</strong> {req.status.charAt(0).toUpperCase() + req.status.slice(1)}</p>
                    <p><strong>Submitted:</strong> {new Date(req.created_at).toLocaleDateString()}</p>
                    <p><strong>Updated:</strong> {new Date(req.updated_at).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            ) : <p className="text-muted-foreground">No redeem requests found.</p>
          )}
        </CardContent>
      </Card>

      {/* Profit Over Time */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Profit Over Time
            <div className="flex gap-2">
              <Button
                variant={profitView === "monthly" ? "default" : "outline"}
                onClick={() => handleToggleView("monthly")}
                className="text-sm"
              >
                Monthly
              </Button>
              <Button
                variant={profitView === "daily" ? "default" : "outline"}
                onClick={() => handleToggleView("daily")}
                className="text-sm"
              >
                Daily
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? <Skeleton className="h-64 w-full" /> : (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="profit" stroke="#8884d8" fill="#8884d8" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
