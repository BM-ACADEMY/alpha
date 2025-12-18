import React, { useState, useEffect, useRef, useContext, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  CreditCard,
  Tag,
  DollarSign,
  Percent,
  Lock,
  Clock,
  TrendingUp,
  Wallet,
  FileText,
  ArrowRightCircle,
  Upload,
  Copy,
} from "lucide-react";
import axiosInstance from "@/modules/common/lib/axios";
import { AuthContext } from "@/modules/common/context/AuthContext";
import { showToast } from "@/modules/common/toast/customToast";
import { useNavigate } from "react-router-dom";

const PlanPurchase = () => {
  const { user } = useContext(AuthContext);
  const [plans, setPlans] = useState([]);
  const [statusMessage, setStatusMessage] = useState("");
  const [profitCalculations, setProfitCalculations] = useState({});
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);
  const [showInstructionsDialog, setShowInstructionsDialog] = useState(true);
  const [subscriptionId, setSubscriptionId] = useState(null);
  const [file, setFile] = useState(null);
  const [transactionId, setTransactionId] = useState("");
  const [adminInfo, setAdminInfo] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [userAccounts, setUserAccounts] = useState([]);
  const navigate = useNavigate();

  // Fetch user profile and accounts
  useEffect(() => {
    if (!user?.id) return;

    const fetchProfile = async () => {
      try {
        const response = await axiosInstance.get(`/users/${user.id}`, {
          withCredentials: true,
        });
        setProfileData(response.data);
      } catch (error) {
        console.error("Failed to fetch profile:", error);
        showToast("error", "Failed to load profile data");
      }
    };

    const fetchUserAccounts = async () => {
      try {
        const response = await axiosInstance.get(`/accounts/user/${user.id}`, {
          withCredentials: true,
        });
        setUserAccounts(response.data);
      } catch (error) {
        console.error("Failed to fetch user accounts:", error);
        showToast("error", "Failed to load account details");
      }
    };

    fetchProfile();
    fetchUserAccounts();
  }, [user]);

  // Fetch all plans from database
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await axiosInstance.get("/plans"); // Your route: GET /plans
        const fetchedPlans = response.data;

        setPlans(fetchedPlans);

        // Calculate profit for display
        const calculations = {};
        fetchedPlans.forEach((plan) => {
          const minInvestment = parseFloat(plan.min_investment?.$numberDecimal || plan.min_investment || 0);
          const profitPercentage = parseFloat(plan.profit_percentage?.$numberDecimal || plan.profit_percentage || 0);
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
            const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
            const diffDays = Math.ceil((nextMonth - now) / (1000 * 60 * 60 * 24));
            profitAmount = dailyProfit * diffDays;
          }

          const totalReturn = minInvestment + totalProfit;

          calculations[plan._id] = {
            profitAmount: profitAmount.toFixed(2),
            totalReturn: totalReturn.toFixed(2),
          };
        });

        setProfitCalculations(calculations);
      } catch (error) {
        console.error("Failed to fetch plans:", error);
        setStatusMessage("Failed to load plans");
        showToast("error", "Failed to load available plans");
      }
    };

    fetchPlans();
  }, []);

  const handleOpenPurchaseDialog = (plan) => {
    // KYC Check
    if (
      !profileData?.pan_number ||
      !profileData?.pan_image ||
      !profileData?.aadhar_number ||
      !profileData?.aadhar_image
    ) {
      showToast("error", "Please complete your KYC verification first");
      setTimeout(() => navigate("/user-dashboard/profile"), 2000);
      return;
    }

    // Admin Verification Check
    if (!profileData?.verified_by_admin) {
      showToast("error", "Your account is pending admin verification (24-48 hrs)");
      return;
    }

    // Account Type Match Check
    const hasMatchingAccount = userAccounts.some(
      (acc) => acc.account_type === plan.amount_type
    );
    if (!hasMatchingAccount) {
      showToast(
        "error",
        `Please add a ${plan.amount_type} account in your profile to purchase this plan`
      );
      setTimeout(() => navigate("/user-dashboard/profile"), 2000);
      return;
    }

    setSelectedPlan(plan);
    setSubscriptionId(null);
    setFile(null);
    setTransactionId("");
    setAdminInfo(null);
    setStatusMessage("");
    setShowPurchaseDialog(true);
  };

  const handleProceedPayment = async () => {
    if (!selectedPlan || !user) return;

    try {
      const response = await axiosInstance.post(
        "/user-subscription-plan/subscribe",
        {
          user_id: user.id,
          plan_id: selectedPlan._id,
          username: user.username,
          amount: parseFloat(selectedPlan.min_investment.$numberDecimal || selectedPlan.min_investment),
        },
        { withCredentials: true }
      );

      if (response.status === 201) {
        setSubscriptionId(response.data.subscription._id);
        setStatusMessage("Subscription created! Upload payment proof below.");

        // Fetch admin payment details
        try {
          const adminRes = await axiosInstance.get("/users/admin-info", {
            withCredentials: true,
          });
          setAdminInfo(adminRes.data);
        } catch (err) {
          console.error("Failed to load admin info:", err);
          showToast("error", "Could not load payment details");
        }
      }
    } catch (error) {
      const msg = error.response?.data?.message || "Failed to create subscription";
      setStatusMessage(msg);
      showToast("error", msg);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    const isImage = /\.(jpg|jpeg|png|gif|bmp|tiff)$/i.test(selectedFile.name);
    if (!isImage) {
      showToast("error", "Only image files are allowed");
      setFile(null);
      return;
    }
    setFile(selectedFile);
  };

  const handleUploadScreenshot = async () => {
    if (!file || !subscriptionId || !selectedPlan || !transactionId.trim()) {
      showToast("error", "Please fill all required fields");
      return;
    }

    const formData = new FormData();
    formData.append("payment_screenshot", file);
    formData.append("subscription_id", subscriptionId);
    formData.append("username", user.username);
    formData.append("amount", parseFloat(selectedPlan.min_investment.$numberDecimal || selectedPlan.min_investment));
    formData.append("transaction_id", transactionId.trim());

    try {
      const response = await axiosInstance.post(
        "/user-subscription-plan/upload-screenshot",
        formData,
        { headers: { "Content-Type": "multipart/form-data" }, withCredentials: true }
      );

      if (response.status === 200) {
        showToast("success", "Payment proof submitted! Awaiting verification.");
        setShowPurchaseDialog(false);
        setFile(null);
        setTransactionId("");
        setSubscriptionId(null);
        setSelectedPlan(null);
        setAdminInfo(null);
      }
    } catch (error) {
      const msg = error.response?.data?.message || "Upload failed";
      showToast("error", msg);
    }
  };

  const renderAccountDetails = (account) => (
    <div className="space-y-2 text-sm" key={account._id}>
      <p><strong>Type:</strong> {account.account_type}</p>
      {account.account_type === "INR" && (
        <>
          {account.bank_name && <p><strong>Bank:</strong> {account.bank_name}</p>}
          {account.account_holder_name && <p><strong>Holder:</strong> {account.account_holder_name}</p>}
          {account.account_number && <p><strong>A/c No:</strong> {account.account_number}</p>}
          {account.ifsc_code && <p><strong>IFSC:</strong> {account.ifsc_code}</p>}
          {account.upi_id && <p><strong>UPI ID:</strong> {account.upi_id}</p>}
        </>
      )}
      {account.account_type === "USDT" && account.usdt_account_number && (
        <p><strong>USDT Address:</strong> {account.usdt_account_number}</p>
      )}
      {account.qrcode && (
        <div className="mt-3">
          <strong>QR Code:</strong>
          <img src={account.qrcode} alt="QR" className="w-40 h-40 mt-2 border rounded" />
        </div>
      )}
    </div>
  );

  return (
    <div className="p-6 space-y-8">
      {/* Instructions Dialog */}
      <Dialog open={showInstructionsDialog} onOpenChange={setShowInstructionsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl text-center">Deposit Instructions</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <div className="p-4 bg-blue-50 rounded">
              <h3 className="font-bold text-blue-800">INR Deposits</h3>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Bank Transfer or UPI only</li>
                <li>Required: Screenshot + UTR</li>
                <li>Min ₹5000 • No max limit</li>
              </ul>
            </div>
            <div className="p-4 bg-green-50 rounded">
              <h3 className="font-bold text-green-800">USDT Deposits</h3>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Send to admin wallet (TRC20)</li>
                <li>Required: TxID (screenshot optional)</li>
                <li>Min 50 USDT • No max limit</li>
              </ul>
            </div>
            <p className="text-center font-medium text-red-600">
              Verification within 24–48 hours
            </p>
          </div>
          <Button className="w-full" onClick={() => setShowInstructionsDialog(false)}>
            Got it
          </Button>
        </DialogContent>
      </Dialog>

      {/* Available Plans Table */}
      <Card>
        <CardHeader>
          <CardTitle>Available Investment Plans</CardTitle>
        </CardHeader>
        <CardContent>
          {plans.length === 0 ? (
            <p className="text-center text-gray-500 py-8">Loading plans...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plan Name</TableHead>
                  <TableHead>Min Investment</TableHead>
                  <TableHead>Profit %</TableHead>
                  <TableHead>Lock-in (Days)</TableHead>
                  <TableHead>Profit Payout</TableHead>
                  <TableHead>Est. Profit</TableHead>
                  <TableHead>Total Return</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans.map((plan) => (
                  <TableRow key={plan._id}>
                    <TableCell className="font-medium">{plan.plan_name}</TableCell>
                    <TableCell>
                      {parseFloat(plan.min_investment?.$numberDecimal || plan.min_investment).toLocaleString()} {plan.amount_type}
                    </TableCell>
                    <TableCell>{parseFloat(plan.profit_percentage?.$numberDecimal || plan.profit_percentage)}%</TableCell>
                    <TableCell>{plan.capital_lockin || "N/A"}</TableCell>
                    <TableCell className="capitalize">{plan.profit_withdrawal || "daily"}</TableCell>
                    <TableCell>
                      {profitCalculations[plan._id]?.profitAmount || "0.00"} {plan.amount_type}
                    </TableCell>
                    <TableCell className="font-semibold">
                      {profitCalculations[plan._id]?.totalReturn || "0.00"} {plan.amount_type}
                    </TableCell>
                    <TableCell>
                      <Dialog
                        open={showPurchaseDialog && selectedPlan?._id === plan._id}
                        onOpenChange={setShowPurchaseDialog}
                      >
                        <DialogTrigger asChild>
                          <Button
                            onClick={() => handleOpenPurchaseDialog(plan)}
                            variant="outline"
                            size="sm"
                          >
                            <CreditCard className="mr-2 h-4 w-4" />
                            Purchase
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>{plan.plan_name} - Purchase Confirmation</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-6">
                            {!subscriptionId ? (
                              <>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div><strong>Plan:</strong> {plan.plan_name}</div>
                                  <div><strong>Type:</strong> {plan.amount_type}</div>
                                  <div><strong>Min Investment:</strong> {parseFloat(plan.min_investment.$numberDecimal || plan.min_investment).toLocaleString()} {plan.amount_type}</div>
                                  <div><strong>Profit Rate:</strong> {parseFloat(plan.profit_percentage.$numberDecimal || plan.profit_percentage)}%</div>
                                  <div><strong>Lock-in:</strong> {plan.capital_lockin} days</div>
                                  <div><strong>Payout:</strong> {plan.profit_withdrawal}</div>
                                  <div><strong>Est. Profit:</strong> {profitCalculations[plan._id]?.profitAmount} {plan.amount_type}</div>
                                  <div><strong>Total Return:</strong> {profitCalculations[plan._id]?.totalReturn} {plan.amount_type}</div>
                                </div>
                                {plan.notes && <p className="text-sm italic">{plan.notes}</p>}
                                <Button onClick={handleProceedPayment} className="w-full">
                                  <ArrowRightCircle className="mr-2 h-4 w-4" />
                                  Proceed to Payment
                                </Button>
                              </>
                            ) : (
                              <>
                                <p className="text-green-600 font-bold text-center">
                                  Subscription Created Successfully!
                                </p>

                                {/* Admin Payment Details */}
                                {adminInfo ? (
                                  <div className="bg-gray-50 p-4 rounded-lg">
                                    <h3 className="font-bold mb-3">Send Payment To:</h3>
                                    {adminInfo.accounts
                                      .filter(a => a.account_type === selectedPlan.amount_type)
                                      .map(renderAccountDetails)}
                                  </div>
                                ) : (
                                  <p className="text-red-600">Loading payment details...</p>
                                )}

                                {/* Upload Section */}
                                <div className="space-y-4 mt-6">
                                  <div>
                                    <label className="block font-medium mb-1">
                                      Payment Screenshot <span className="text-red-600">*</span>
                                    </label>
                                    <input type="file" accept="image/*" onChange={handleFileChange} className="w-full" />
                                  </div>
                                  <div>
                                    <label className="block font-medium mb-1">
                                      Transaction ID / UTR / TxID <span className="text-red-600">*</span>
                                    </label>
                                    <input
                                      type="text"
                                      placeholder="Enter UTR or TxID"
                                      value={transactionId}
                                      onChange={(e) => setTransactionId(e.target.value)}
                                      className="w-full border rounded px-3 py-2"
                                    />
                                  </div>
                                  <Button
                                    onClick={handleUploadScreenshot}
                                    disabled={!file || !transactionId.trim()}
                                    className="w-full"
                                  >
                                    <Upload className="mr-2 h-4 w-4" />
                                    Submit Payment Proof
                                  </Button>
                                </div>
                              </>
                            )}

                            {statusMessage && (
                              <p className={`text-center font-medium ${statusMessage.includes("success") ? "text-green-600" : "text-red-600"}`}>
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
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PlanPurchase;
