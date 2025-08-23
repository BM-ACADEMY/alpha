import React, { useState, useEffect, useRef, useContext } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, Tag, DollarSign, Percent, Lock, Clock, TrendingUp, Wallet, FileText, ArrowRightCircle, Upload } from "lucide-react";
import axiosInstance from "@/modules/common/lib/axios";
import { AuthContext } from "@/modules/common/context/AuthContext";

const PlanPurchase = () => {
  const { user } = useContext(AuthContext);
  const role_id = user?.role_id?._id;
  const [plans, setPlans] = useState([]);
  const [statusMessage, setStatusMessage] = useState("");
  const [profitCalculations, setProfitCalculations] = useState({});
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);
  const [subscriptionId, setSubscriptionId] = useState(null);
  const [file, setFile] = useState(null);
  const debounceTimer = useRef(null);

  // Validate role_id
  useEffect(() => {
    if (!role_id) {
      console.error("Role ID is undefined");
      setStatusMessage("User role is not defined");
    }
  }, [role_id]);

  // Fetch plans
  useEffect(() => {
    let isMounted = true;
    axiosInstance
      .get("/user-subscription-plan/plans")
      .then((res) => {
        if (isMounted) {
          setPlans(res.data);
          const calculations = {};
          res.data.forEach((plan) => {
            const minInvestment = parseFloat(plan.min_investment?.$numberDecimal || 0);
            const profitPercentage = parseFloat(plan.profit_percentage?.$numberDecimal || 0);
            const capitalLockin = plan.capital_lockin || 30;
            const profitWithdrawal = plan.profit_withdrawal || "daily";

            const totalProfit = (minInvestment * profitPercentage) / 100;
            const dailyProfit = totalProfit / capitalLockin;

            let profitAmount = 0;
            if (profitWithdrawal === "daily") {
              profitAmount = dailyProfit;
            } else if (profitWithdrawal === "weekly") {
              profitAmount = dailyProfit * 7;
            } else if (profitWithdrawal === "monthly") {
              const now = new Date();
              const nextMonth = new Date(now);
              nextMonth.setMonth(nextMonth.getMonth() + 1);
              const diffTime = Math.abs(nextMonth - now);
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              profitAmount = dailyProfit * diffDays;
            }

            const totalReturn = minInvestment + totalProfit;

            calculations[plan._id] = {
              profitAmount: profitAmount.toFixed(2),
              totalReturn: totalReturn.toFixed(2),
            };
          });
          setProfitCalculations(calculations);
        }
      })
      .catch((error) => {
        if (isMounted) {
          console.error("Fetch plans error:", error.message, error.response?.data);
          setStatusMessage("Failed to fetch plans");
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Handle opening of dialogs
  const handleOpenPurchaseDialog = (plan) => {
    setSelectedPlan(plan);
    setSubscriptionId(null); // Reset subscription ID
    setFile(null); // Reset file
    setShowPurchaseDialog(true);
  };

  // Handle Proceed Payment button click
 const handleProceedPayment = async () => {
  if (!selectedPlan || !user) {
    setStatusMessage("User or plan not selected");
    return;
  }

  console.log("Proceeding with payment - User ID:", user._id, "Plan ID:", selectedPlan._id);

  try {
    const response = await axiosInstance.post("/user-subscription-plan/subscribe", {
      user_id: user._id,
      plan_id: selectedPlan._id,
      username: user.username,
      amount: parseFloat(selectedPlan.min_investment.$numberDecimal),
    });

    if (response.status === 201) {
      setSubscriptionId(response.data.subscription._id);
      setStatusMessage("Subscription created successfully! Please upload your payment screenshot.");
    }
  } catch (error) {
    console.error("Create subscription error:", error.message, error.response?.data);
    setStatusMessage(error.response?.data?.message || "Failed to create subscription");
  }
};

  // Handle file selection
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  // Handle screenshot upload
  const handleUploadScreenshot = async () => {
    if (!file || !subscriptionId) {
      setStatusMessage("No file selected or subscription not created");
      return;
    }

    const formData = new FormData();
    formData.append("screenshot", file);
    formData.append("subscription_id", subscriptionId);

    try {
      const response = await axiosInstance.post("/user-subscription-plan/upload-screenshot", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.status === 200) {
        setStatusMessage("Screenshot uploaded successfully!");
        setShowPurchaseDialog(false); // Close dialog after successful upload
        setFile(null);
        setSubscriptionId(null);
      }
    } catch (error) {
      console.error("Upload screenshot error:", error.message, error.response?.data);
      setStatusMessage(error.response?.data?.message || "Failed to upload screenshot");
    }
  };

  return (
    <div className="p-6 space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Available Plans</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Min Investment</TableHead>
                <TableHead>Profit %</TableHead>
                <TableHead>Validity (Days)</TableHead>
                <TableHead>Profit Amount</TableHead>
                <TableHead>Total Return</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans.map((plan) => (
                <TableRow key={plan?._id}>
                  <TableCell>{plan?.plan_name}</TableCell>
                  <TableCell>
                    {plan?.min_investment?.$numberDecimal} {plan?.amount_type}
                  </TableCell>
                  <TableCell>{plan?.profit_percentage?.$numberDecimal}%</TableCell>
                  <TableCell>{plan?.capital_lockin || "N/A"}</TableCell>
                  <TableCell>
                    {profitCalculations[plan._id]?.profitAmount} {plan?.amount_type}
                  </TableCell>
                  <TableCell>
                    {profitCalculations[plan._id]?.totalReturn} {plan?.amount_type}
                  </TableCell>
                  <TableCell>
                    <Dialog open={showPurchaseDialog && selectedPlan?._id === plan._id} onOpenChange={setShowPurchaseDialog}>
                      <DialogTrigger asChild>
                        <Button
                          onClick={() => handleOpenPurchaseDialog(plan)}
                          variant="outline"
                        >
                          <CreditCard className="mr-2 h-4 w-4" /> Purchase
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>{plan?.plan_name} Details</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          {!subscriptionId ? (
                            <>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="flex items-center">
                                  <Tag className="mr-2 h-4 w-4 text-gray-500" />
                                  <span><strong>Plan Name:</strong> {plan?.plan_name}</span>
                                </div>
                                <div className="flex items-center">
                                  <DollarSign className="mr-2 h-4 w-4 text-gray-500" />
                                  <span><strong>Minimum Investment:</strong> {plan?.min_investment?.$numberDecimal} {plan?.amount_type}</span>
                                </div>
                                <div className="flex items-center">
                                  <Percent className="mr-2 h-4 w-4 text-gray-500" />
                                  <span><strong>Profit Percentage:</strong> {plan?.profit_percentage?.$numberDecimal}%</span>
                                </div>
                                <div className="flex items-center">
                                  <Lock className="mr-2 h-4 w-4 text-gray-500" />
                                  <span><strong>Capital Lock-in Period:</strong> {plan?.capital_lockin || "N/A"} days</span>
                                </div>
                                <div className="flex items-center">
                                  <Clock className="mr-2 h-4 w-4 text-gray-500" />
                                  <span><strong>Profit Withdrawal:</strong> {plan?.profit_withdrawal || "daily"}</span>
                                </div>
                                <div className="flex items-center">
                                  <TrendingUp className="mr-2 h-4 w-4 text-gray-500" />
                                  <span><strong>Estimated Profit:</strong> {profitCalculations[plan._id]?.profitAmount} {plan?.amount_type} ({plan?.profit_withdrawal || "daily"})</span>
                                </div>
                                <div className="flex items-center">
                                  <Wallet className="mr-2 h-4 w-4 text-gray-500" />
                                  <span><strong>Total Return:</strong> {profitCalculations[plan._id]?.totalReturn} {plan?.amount_type}</span>
                                </div>
                                {plan?.notes && (
                                  <div className="col-span-2 flex items-start">
                                    <FileText className="mr-2 h-4 w-4 text-gray-500 mt-1" />
                                    <span><strong>Notes:</strong> {plan?.notes}</span>
                                  </div>
                                )}
                              </div>
                              <Button onClick={handleProceedPayment} className="w-full">
                                <ArrowRightCircle className="mr-2 h-4 w-4" />
                                Proceed to Payment
                              </Button>
                            </>
                          ) : (
                            <>
                              <div className="text-green-600">
                                Subscription created successfully! Please upload your payment screenshot.
                              </div>
                              <div className="flex flex-col space-y-4">
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={handleFileChange}
                                  className="border p-2 rounded"
                                />
                                <Button onClick={handleUploadScreenshot} disabled={!file} className="w-full">
                                  <Upload className="mr-2 h-4 w-4" />
                                  Upload Screenshot
                                </Button>
                              </div>
                            </>
                          )}
                          {statusMessage && (
                            <div className={statusMessage.includes("Failed") ? "text-red-600" : "text-green-600"}>
                              {statusMessage}
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {statusMessage && (
            <div className={statusMessage.includes("Failed") ? "text-red-600" : "text-green-600"}>
              {statusMessage}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PlanPurchase;