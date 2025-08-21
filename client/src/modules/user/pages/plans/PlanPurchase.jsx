import React, { useState, useEffect, useRef, useContext } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, Upload } from "lucide-react";
import axiosInstance from "@/modules/common/lib/axios";
import { Input } from "@/components/ui/input";
import { AuthContext } from "@/modules/common/context/AuthContext";

const AdminPurchasePlan = () => {
  const { user } = useContext(AuthContext);
  const role_id = user?.role_id?._id;
  const [plans, setPlans] = useState([]);
  const [adminAccount, setAdminAccount] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [subscriptionId, setSubscriptionId] = useState(null);
  const [paymentScreenshot, setPaymentScreenshot] = useState(null);
  const [amount, setAmount] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [profitCalculations, setProfitCalculations] = useState({});
  const [showProfitDialog, setShowProfitDialog] = useState(false);
  const debounceTimer = useRef(null);

  // Validate role_id
  useEffect(() => {
    if (!role_id) {
      console.error("Role ID is undefined");
      setStatusMessage("User role is not defined");
    }
  }, [role_id]);

  // Prevent navigation during upload
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isLoading) {
        e.preventDefault();
        e.returnValue = "An upload is in progress. Are you sure you want to leave?";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isLoading]);

  // Fetch plans
  useEffect(() => {
    let isMounted = true;
    axiosInstance
      .get("/user-subscription-plan/plans")
      .then((res) => {
        if (isMounted) {
          setPlans(res.data);
          // Calculate profit for each plan
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

  // Fetch admin account
  const fetchAdminAccount = () => {
    if (!role_id) {
      console.error("Cannot fetch admin account: role_id is undefined");
      setStatusMessage("Invalid role ID");
      return;
    }
    axiosInstance
      .get(`/user-subscription-plan/admin-account/${role_id}`)
      .then((res) => {
        console.log("Admin account fetched:", res.data);
        setAdminAccount(res.data);
      })
      .catch((error) => {
        console.error("Fetch admin account error:", error.message, error.response?.data);
        setStatusMessage("Failed to fetch admin account");
      });
  };

  // Initiate purchase
  const handlePurchase = (plan) => {
    if (!user) {
      setStatusMessage("User not logged in");
      return;
    }
    setSelectedPlan(plan);
    setAmount(plan?.min_investment?.$numberDecimal || "");
    setShowProfitDialog(true);
  };

  // Proceed with subscription
  const handleProceed = () => {
    if (!user || !selectedPlan) {
      setStatusMessage("Please ensure you are logged in and a plan is selected");
      return;
    }
    setIsLoading(true);
    axiosInstance
      .post("/user-subscription-plan/subscribe", {
        user_id: user._id,
        plan_id: selectedPlan._id,
        username: user.username,
        amount: Number(amount || 0),
      })
      .then((res) => {
        console.log("Subscription created:", res.data);
        setSubscriptionId(res.data.subscription._id);
        fetchAdminAccount();
        setStatusMessage("Subscription initiated");
        setShowProfitDialog(false);
      })
      .catch((error) => {
        console.error("Subscribe error:", error.message, error.response?.data);
        setStatusMessage(error.response?.data?.message || "Failed to create subscription");
        setShowProfitDialog(false);
      })
      .finally(() => setIsLoading(false));
  };

  // Handle file change
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      console.log("Selected file:", {
        name: file.name,
        size: file.size / 1024 / 1024,
        type: file.type,
      });
      if (file.size > 200 * 1024 * 1024) {
        setStatusMessage("File size exceeds 200MB limit");
        return;
      }
      setPaymentScreenshot(file);
      setStatusMessage("");
    }
  };

  // Submit screenshot
  const handleSubmit = async () => {
    if (!paymentScreenshot || !subscriptionId || !user?.username || !amount) {
      console.error("Missing required fields:", {
        hasPaymentScreenshot: !!paymentScreenshot,
        subscriptionId,
        username: user?.username,
        amount,
      });
      setStatusMessage("Please provide all required fields");
      return;
    }
    setIsLoading(true);
    setUploadProgress(0);
    const formData = new FormData();
    formData.append("payment_screenshot", paymentScreenshot);
    formData.append("subscription_id", subscriptionId);
    formData.append("username", user.username);
    formData.append("amount", amount);

    for (let [key, value] of formData.entries()) {
      console.log(`FormData: ${key}=${value instanceof File ? value.name : value}`);
    }

    try {
      const res = await axiosInstance.post("/user-subscription-plan/upload-screenshot", formData, {
        timeout: 300000,
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
          console.log(`Upload progress: ${percentCompleted}%`);
        },
      });
      console.log("Upload success:", res.data);
      setStatusMessage(res.data.message);
      setSelectedPlan(null);
      setPaymentScreenshot(null);
      setSubscriptionId(null);
      setAmount("");
      setUploadProgress(0);
    } catch (error) {
      console.error("Upload error:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        headers: error.response?.headers,
      });
      setStatusMessage(error.response?.data?.message || "Failed to upload screenshot");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-8">
      {/* Plans List */}
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
                    <Dialog open={showProfitDialog && selectedPlan?._id === plan._id} onOpenChange={setShowProfitDialog}>
                      <DialogTrigger asChild>
                        <Button
                          onClick={() => handlePurchase(plan)}
                          disabled={isLoading}
                          variant="outline"
                        >
                          <CreditCard className="mr-2 h-4 w-4" /> Purchase
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>
                            Confirm Purchase: {selectedPlan?.plan_name} for {user?.username}
                          </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <p><strong>Plan Name:</strong> {selectedPlan?.plan_name}</p>
                          <p><strong>Min Investment:</strong> {selectedPlan?.min_investment?.$numberDecimal} {selectedPlan?.amount_type}</p>
                          <p><strong>Profit Percentage:</strong> {selectedPlan?.profit_percentage?.$numberDecimal}%</p>
                          <p><strong>Validity:</strong> {selectedPlan?.capital_lockin} days</p>
                          <p><strong>Profit Amount ({selectedPlan?.profit_withdrawal}):</strong> {profitCalculations[selectedPlan?._id]?.profitAmount} {selectedPlan?.amount_type}</p>
                          <p><strong>Total Return:</strong> {profitCalculations[selectedPlan?._id]?.totalReturn} {selectedPlan?.amount_type}</p>
                          <Button onClick={handleProceed} disabled={isLoading}>
                            Proceed to Payment
                          </Button>
                          {statusMessage && (
                            <p className={statusMessage.includes("Failed") || statusMessage.includes("active subscription") ? "text-red-600" : "text-green-600"}>
                              {statusMessage}
                            </p>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          onClick={() => {
                            setSelectedPlan(plan);
                            setShowProfitDialog(false);
                          }}
                          disabled={isLoading}
                          variant="outline"
                          className="ml-2"
                        >
                          <Upload className="mr-2 h-4 w-4" /> Upload Payment
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>
                            Upload Payment for {selectedPlan?.plan_name}
                          </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <label>Amount</label>
                            <Input
                              type="number"
                              value={amount}
                              readOnly
                              placeholder="Amount"
                            />
                          </div>
                          {adminAccount ? (
                            <div>
                              <h3 className="font-semibold">Admin Payment Details</h3>
                              <p>Bank: {adminAccount.bank_name || "N/A"}</p>
                              <p>IFSC: {adminAccount.ifsc_code || "N/A"}</p>
                              <p>Account Holder: {adminAccount.account_holder_name || "N/A"}</p>
                              <p>Account Number: {adminAccount.account_number || "N/A"}</p>
                              <p>Linked Phone: {adminAccount.linked_phone_number || "N/A"}</p>
                              <p>UPI ID: {adminAccount.upi_id || "N/A"}</p>
                              <p>UPI Number: {adminAccount.upi_number || "N/A"}</p>
                              {adminAccount.qrcode && (
                                <img
                                  src={`${import.meta.env.VITE_BASE_URL}${adminAccount.qrcode}`}
                                  alt="QR Code"
                                  className="w-32 h-32"
                                />
                              )}
                              <p className="text-sm text-muted-foreground">
                                Pay manually using GPay (phone/UPI/QR) or bank transfer.
                              </p>
                            </div>
                          ) : (
                            <p className="text-red-600">Admin account details not available</p>
                          )}
                          <div className="space-y-2">
                            <label>Upload Payment Screenshot (Max 200MB, Any file type)</label>
                            <Input type="file" onChange={handleFileChange} />
                            <Button onClick={handleSubmit} disabled={!paymentScreenshot || isLoading}>
                              <Upload className="mr-2 h-4 w-4" />{" "}
                              {isLoading ? `Uploading (${uploadProgress}%)` : "Submit"}
                            </Button>
                            {uploadProgress > 0 && uploadProgress < 100 && (
                              <div className="w-full bg-gray-200 rounded-full h-2.5">
                                <div
                                  className="bg-blue-600 h-2.5 rounded-full"
                                  style={{ width: `${uploadProgress}%` }}
                                />
                              </div>
                            )}
                          </div>
                          {statusMessage && (
                            <p className={statusMessage.includes("Failed") ? "text-red-600" : "text-green-600"}>
                              {statusMessage}
                            </p>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPurchasePlan;