import React, { useState, useEffect, useContext } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  User,
  Wallet,
  Package,
  DollarSign,
  Users as ReferralIcon,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { showToast } from "@/modules/common/toast/customToast";
import axiosInstance from "@/modules/common/lib/axios"; // Adjust path to your axiosInstance
import { AuthContext } from "@/modules/common/context/AuthContext";

const Dashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const {user}=useContext(AuthContext);
  const userId=user?.id;
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await axiosInstance.get(`/dashboard-route/user-dashboard/${userId}`);
        setData(response.data);
        showToast("success","Dashboard data loaded successfully!");
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching user dashboard data:", error);
        showToast("error",
          `${error.response?.data?.message} || Failed to load dashboard data`,
         
        );
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-[#d09d42] font-bold bg-[#0f1c3f] p-1 rounded">
        Your Dashboard
      </h1>

      {/* Profile, Wallet, and Referral Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <>
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </>
        ) : (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Your Profile</CardTitle>
                <User className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-sm">
                  <p>
                    <strong>ID:</strong> {data?.profile?.customerId || "N/A"}
                  </p>
                  <p>
                    <strong>Username:</strong> {data?.profile?.username || "N/A"}
                  </p>
                  <p>
                    <strong>Email:</strong> {data?.profile?.email || "N/A"}
                  </p>
                  <p>
                    <strong>Referral Code:</strong>{" "}
                    {data?.profile?.referralCode || "N/A"}
                  </p>
                  <p>
                    <strong>Referred By:</strong>{" "}
                    {data?.profile?.referredBy || "None"}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Wallet</CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-sm">
                  <p>
                    <strong>Capital Amount:</strong> $
                    {data?.wallet?.userPlanCapitalAmount?.toLocaleString() || 0}
                  </p>
                  <p>
                    <strong>Daily Profit:</strong> $
                    {data?.wallet?.dailyProfitAmount?.toLocaleString() || 0}
                  </p>
                  <p>
                    <strong>Total Points:</strong>{" "}
                    {data?.wallet?.totalWalletPoint?.toLocaleString() || 0}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Referral Stats
                </CardTitle>
                <ReferralIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data?.referralCount || 0}
                </div>
                <p className="text-sm text-muted-foreground">Users referred</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Active Plans */}
      <Card>
        <CardHeader>
          <CardTitle>Your Active Plans</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <div className="space-y-4">
              {data?.activePlans?.length ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {data.activePlans.map((plan, index) => (
                    <div key={index} className="border p-4 rounded-md">
                      <p>
                        <strong>Plan:</strong> {plan.planName}
                      </p>
                      <p>
                        <strong>Amount:</strong> {plan.amountType}{" "}
                        {plan.amount.toLocaleString()}
                      </p>
                      <p>
                        <strong>Profit %:</strong> {plan.profitPercentage}%
                      </p>
                      <p>
                        <strong>Purchased:</strong>{" "}
                        {new Date(plan.purchasedAt).toLocaleDateString()}
                      </p>
                      <p>
                        <strong>Expires:</strong>{" "}
                        {new Date(plan.expiresAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No active plans found.</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Profit Over Time Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Profit Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart
                data={data?.profitOverTime || []}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="profit"
                  stroke="#8884d8"
                  fill="#8884d8"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;