import React, { useState, useEffect, useContext } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DollarSign, Tag, Percent, Clock, Wallet, FileText, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import axiosInstance from "@/modules/common/lib/axios";
import { AuthContext } from "@/modules/common/context/AuthContext";
import { showToast } from "@/modules/common/toast/customToast";

const Subscription = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [activePlans, setActivePlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [countdowns, setCountdowns] = useState({});

  // Fetch all active subscription plans
  useEffect(() => {
    const fetchActivePlans = async () => {
      if (!user?.id) {
        setError("User not logged in");
        setLoading(false);
        navigate("/login");
        return;
      }

      try {
        const response = await axiosInstance.get("/user-subscription-plan/purchased-plans", {
          params: {
            page: 1,
            limit: 100, // Increased limit to fetch all subscriptions
            user_id: user.id,
          },
          withCredentials: true,
        });

        const subscriptions = response.data.subscriptions;
        if (subscriptions.length > 0) {
          setActivePlans(subscriptions);
        } else {
          setError("No active subscriptions found");
        }
      } catch (error) {
        console.error("Fetch active plans error:", error.response?.data || error.message);
        setError(error.response?.data?.message || "Failed to fetch subscription details");
        showToast("error", error.response?.data?.message || "Failed to fetch subscription details");
      } finally {
        setLoading(false);
      }
    };

    fetchActivePlans();
  }, [user, navigate]);

  // Countdown timer for each subscription's capital lock-in period
  useEffect(() => {
    if (!activePlans || activePlans.length === 0) return;

    const calculateCountdown = () => {
      const newCountdowns = {};
      activePlans.forEach((plan) => {
        const now = new Date();
        const expiresAt = new Date(plan.expires_at);
        const timeDiff = expiresAt - now;

        if (timeDiff <= 0) {
          newCountdowns[plan._id] = { days: 0, hours: 0, minutes: 0, seconds: 0 };
        } else {
          const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
          const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
          newCountdowns[plan._id] = { days, hours, minutes, seconds };
        }
      });
      setCountdowns(newCountdowns);
    };

    calculateCountdown();
    const timer = setInterval(calculateCountdown, 1000);

    return () => clearInterval(timer);
  }, [activePlans]);

  // Handle navigation to plan purchase page
  const handlePurchasePlan = () => {
    navigate("/user-dashboard/plans");
  };

  // Render all active plan details
  const renderPlanDetails = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center py-8">
          <p className="text-gray-500 italic text-lg animate-pulse">Loading subscription details...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-8">
          <p className="text-red-600 italic text-lg mb-4">{error}</p>
          <Button
            onClick={handlePurchasePlan}
            className="bg-[#c7a453] hover:bg-[#af914a] text-white"
            aria-label="Purchase a new plan"
          >
            <ArrowRight className="mr-2 h-4 w-4" />
            Purchase a Plan
          </Button>
        </div>
      );
    }

    if (activePlans.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-500 text-lg mb-4">No active subscriptions found</p>
          <Button
            onClick={handlePurchasePlan}
            className="bg-blue-600 hover:bg-blue-700 text-white"
            aria-label="Purchase a new plan"
          >
            <ArrowRight className="mr-2 h-4 w-4" />
            Purchase a Plan
          </Button>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-100">
              <TableHead className="font-semibold">Plan Name</TableHead>
              <TableHead className="font-semibold">Amount</TableHead>
              <TableHead className="font-semibold">Profit %</TableHead>
              <TableHead className="font-semibold">Validity (Days)</TableHead>
              <TableHead className="font-semibold">Profit Amount</TableHead>
              <TableHead className="font-semibold">Total Return</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold">Expires At</TableHead>
              <TableHead className="font-semibold">Time Remaining</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {activePlans?.map((activePlan) => {
              const plan = activePlan.plan_id;
              const amount = Number(activePlan.amount) || 0;
              const profitPercentage = Number(activePlan.profit_percentage?.$numberDecimal || 0);
              const capitalLockin = plan.capital_lockin || 30;
              const totalProfit = (amount * profitPercentage) / 100;
              const dailyProfit = totalProfit / capitalLockin;
              const totalReturn = amount + totalProfit;

              return (
                <TableRow key={activePlan._id} className="hover:bg-gray-50 transition-colors">
                  <TableCell className="font-medium">{plan.plan_name}</TableCell>
                  <TableCell>
                    {amount.toFixed(2)} {plan.amount_type}
                  </TableCell>
                  <TableCell>{profitPercentage}%</TableCell>
                  <TableCell>{capitalLockin}</TableCell>
                  <TableCell>
                    {dailyProfit.toFixed(2)} {plan.amount_type} ({plan.profit_withdrawal || "daily"})
                  </TableCell>
                  <TableCell>
                    {totalReturn.toFixed(2)} {plan.amount_type}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-sm ${
                        activePlan.status === "verified"
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {activePlan.status}
                    </span>
                  </TableCell>
                  <TableCell>{new Date(activePlan.expires_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-800 font-mono">
                      {countdowns[activePlan._id]?.days || 0}d{" "}
                      {countdowns[activePlan._id]?.hours || 0}h{" "}
                      {countdowns[activePlan._id]?.minutes || 0}m{" "}
                      {countdowns[activePlan._id]?.seconds || 0}s
                    </span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-6">
      <Card className="max-w-5xl mx-auto shadow-lg">
        <CardHeader className="border-b">
          <CardTitle className="text-2xl font-bold text-gray-800">
            Your Active Subscriptions
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {activePlans?.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 animate-fade-in">
              {activePlans?.map((activePlan) => (
                <div key={activePlan._id} className="flex items-center p-4 bg-white rounded-lg shadow-sm">
                  <div>
                    <div className="flex items-center mb-2">
                      <Tag className="mr-3 h-5 w-5 text-blue-500" aria-hidden="true" />
                      <div>
                        <p className="text-sm text-gray-500">Plan Name</p>
                        <p className="font-semibold text-gray-800">{activePlan.plan_id.plan_name}</p>
                      </div>
                    </div>
                    <div className="flex items-center mb-2">
                      <DollarSign className="mr-3 h-5 w-5 text-blue-500" aria-hidden="true" />
                      <div>
                        <p className="text-sm text-gray-500">Amount</p>
                        <p className="font-semibold text-gray-800">
                          {Number(activePlan.amount).toFixed(2)} {activePlan.plan_id.amount_type}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center mb-2">
                      <Percent className="mr-3 h-5 w-5 text-blue-500" aria-hidden="true" />
                      <div>
                        <p className="text-sm text-gray-500">Profit Percentage</p>
                        <p className="font-semibold text-gray-800">
                          {Number(activePlan.profit_percentage?.$numberDecimal || 0)}%
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center mb-2">
                      <Clock className="mr-3 h-5 w-5 text-blue-500" aria-hidden="true" />
                      <div>
                        <p className="text-sm text-gray-500">Capital Lock-in</p>
                        <p className="font-semibold text-gray-800">
                          {activePlan.plan_id.capital_lockin || "N/A"} days
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center mb-2">
                      <Wallet className="mr-3 h-5 w-5 text-blue-500" aria-hidden="true" />
                      <div>
                        <p className="text-sm text-gray-500">Profit Withdrawal</p>
                        <p className="font-semibold text-gray-800">
                          {activePlan.plan_id.profit_withdrawal || "daily"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center mb-2">
                      <FileText className="mr-3 h-5 w-5 text-blue-500" aria-hidden="true" />
                      <div>
                        <p className="text-sm text-gray-500">Status</p>
                        <p
                          className={`font-semibold ${
                            activePlan.status === "verified" ? "text-green-600" : "text-yellow-600"
                          }`}
                        >
                          {activePlan.status}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Clock className="mr-3 h-5 w-5 text-blue-500" aria-hidden="true" />
                      <div>
                        <p className="text-sm text-gray-500">Time Remaining</p>
                        <p className="font-semibold text-gray-800 font-mono">
                          {countdowns[activePlan._id]?.days || 0}d{" "}
                          {countdowns[activePlan._id]?.hours || 0}h{" "}
                          {countdowns[activePlan._id]?.minutes || 0}m{" "}
                          {countdowns[activePlan._id]?.seconds || 0}s
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {renderPlanDetails()}
        </CardContent>
      </Card>
    </div>
  );
};

// Custom animation for fade-in effect
const styles = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .animate-fade-in {
    animation: fadeIn 0.5s ease-out;
  }
`;

export default Subscription;
