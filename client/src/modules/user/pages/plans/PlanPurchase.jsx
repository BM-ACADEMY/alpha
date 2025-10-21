import React, { useState, useEffect, useRef, useContext, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Image as ImageIcon,
} from "lucide-react";
import axiosInstance from "@/modules/common/lib/axios";
import { AuthContext } from "@/modules/common/context/AuthContext";
import { showToast } from "@/modules/common/toast/customToast";
import { useNavigate } from "react-router-dom";

const PlanPurchase = () => {
  const { user } = useContext(AuthContext);
  const role_id = user?.role_id?._id;
  const [plans, setPlans] = useState([]);
  const [statusMessage, setStatusMessage] = useState("");
  const [profitCalculations, setProfitCalculations] = useState({});
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);
  const [showInstructionsDialog, setShowInstructionsDialog] = useState(true); // New state for instructions modal
  const [subscriptionId, setSubscriptionId] = useState(null);
  const [file, setFile] = useState(null);
  const [adminInfo, setAdminInfo] = useState(null);
  const [qrCodeErrors, setQrCodeErrors] = useState({});
  const [selectedAccountType, setSelectedAccountType] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const navigate = useNavigate();

  const cacheBusterRef = useRef(Date.now());

  // Validate role_id
  useEffect(() => {
    if (!role_id) {
      console.error("Role ID is undefined");
      setStatusMessage("User role is not defined");
      showToast("error", "User role is not defined");
    }
  }, [role_id]);

  // Fetch user profile to check KYC details and admin verification
  useEffect(() => {
    if (!user?.id) {
      setStatusMessage("User not logged in");
      showToast("error", "User not logged in");
      return;
    }

    const fetchProfile = async () => {
      try {
        const response = await axiosInstance.get(`/users/${user.id}`, {
          withCredentials: true,
        });
        setProfileData(response.data);
      } catch (error) {
        console.error("Failed to fetch profile:", error);
        setStatusMessage("Failed to load profile data");
        showToast("error", "Failed to load profile data");
      }
    };

    fetchProfile();
  }, [user]);

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
            const minInvestment = parseFloat(
              plan.min_investment?.$numberDecimal || 0
            );
            const profitPercentage = parseFloat(
              plan.profit_percentage?.$numberDecimal || 0
            );
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
          console.error(
            "Fetch plans error:",
            error.message,
            error.response?.data
          );
          setStatusMessage("Failed to fetch plans");
          showToast("error", "Failed to fetch plans");
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Handle opening of purchase dialog with KYC and admin verification check
  const handleOpenPurchaseDialog = (plan) => {
    // Check KYC details
    if (
      !profileData?.pan_number ||
      !profileData?.pan_image ||
      !profileData?.aadhar_number ||
      !profileData?.aadhar_image
    ) {
      showToast("error", "Please complete your KYC verification first");
      setTimeout(() => {
        navigate("/user-dashboard/profile");
      }, 2000);
      return;
    }

    // Check admin verification
    if (!profileData?.verified_by_admin) {
      showToast("error", "Account must be verified by admin. Wait 24-48 hrs.");
      return;
    }

    setSelectedPlan(plan);
    setSubscriptionId(null);
    setFile(null);
    setAdminInfo(null);
    setStatusMessage("");
    setQrCodeErrors({});
    setSelectedAccountType(null);
    setShowPurchaseDialog(true);
  };

  // Handle Proceed Payment button click
  const handleProceedPayment = async () => {
    if (!selectedPlan || !user) {
      setStatusMessage("User or plan not selected");
      showToast("error", "User or plan not selected");
      return;
    }

    try {
      const response = await axiosInstance.post(
        "/user-subscription-plan/subscribe",
        {
          user_id: user.id,
          plan_id: selectedPlan._id,
          username: user.username,
          amount: parseFloat(selectedPlan.min_investment.$numberDecimal),
        },
        { withCredentials: true }
      );

      if (response.status === 201) {
        setSubscriptionId(response.data.subscription._id);
        setStatusMessage(
          "Subscription created successfully! Please upload your payment screenshot."
        );

        // Fetch admin info
        try {
          const adminRes = await axiosInstance.get("/users/admin-info", {
            withCredentials: true,
          });
          console.log("Admin Info Response:", adminRes.data);
          setAdminInfo(adminRes.data);
          if (adminRes.data.accounts?.length > 0) {
            const inrAccount = adminRes.data.accounts.find(
              (acc) => acc.account_type === "INR"
            );
            setSelectedAccountType(inrAccount ? "INR" : "USDT");
          }
        } catch (err) {
          console.error(
            "Failed to fetch admin info:",
            err.message,
            err.response?.data
          );
          setStatusMessage("Failed to fetch admin account details");
          showToast("error", "Failed to fetch admin account details");
        }
      }
    } catch (error) {
      console.error(
        "Create subscription error:",
        error.message,
        error.response?.data
      );
      setStatusMessage(
        error.response?.data?.message || "Failed to create subscription"
      );
      showToast(
        "error",
        error.response?.data?.message || "Failed to create subscription"
      );
    }
  };

  // Retry fetching admin info
  const handleRetryFetchAdminInfo = async () => {
    setStatusMessage("");
    setQrCodeErrors({});
    try {
      const adminRes = await axiosInstance.get("/users/admin-info", {
        withCredentials: true,
      });
      console.log("Admin Info Response (Retry):", adminRes.data);
      setAdminInfo(adminRes.data);
      if (adminRes.data.accounts?.length > 0) {
        const inrAccount = adminRes.data.accounts.find(
          (acc) => acc.account_type === "INR"
        );
        setSelectedAccountType(inrAccount ? "INR" : "USDT");
      }
    } catch (err) {
      console.error(
        "Retry fetch admin info failed:",
        err.message,
        err.response?.data
      );
      setStatusMessage("Failed to fetch admin account details");
      showToast("error", "Failed to fetch admin account details");
    }
  };

  // Handle file selection
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const isImage = /\.(jpg|jpeg|png|gif|bmp|tiff)$/i.test(selectedFile.name);
      if (!isImage) {
        setStatusMessage("Only image files are allowed");
        showToast("error", "Only image files are allowed");
        setFile(null);
        return;
      }
      setFile(selectedFile);
      setStatusMessage("");
    }
  };

  // Handle screenshot upload
  const handleUploadScreenshot = async () => {
    if (!file || !subscriptionId || !user || !selectedPlan) {
      setStatusMessage(
        "Please select a file and ensure subscription is created"
      );
      showToast(
        "error",
        "Please select a file and ensure subscription is created"
      );
      return;
    }

    const formData = new FormData();
    formData.append("payment_screenshot", file);
    formData.append("subscription_id", subscriptionId);
    formData.append("username", user.username);
    formData.append(
      "amount",
      parseFloat(selectedPlan.min_investment.$numberDecimal)
    );

    try {
      const response = await axiosInstance.post(
        "/user-subscription-plan/upload-screenshot",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true,
        }
      );

      if (response.status === 200) {
        setStatusMessage(
          "Screenshot uploaded successfully! Awaiting verification."
        );
        showToast(
          "success",
          "Screenshot uploaded successfully! Awaiting verification."
        );
        setShowPurchaseDialog(false);
        setFile(null);
        setSubscriptionId(null);
        setSelectedPlan(null);
        setAdminInfo(null);
        setQrCodeErrors({});
        setSelectedAccountType(null);
      }
    } catch (error) {
      console.error(
        "Upload screenshot error:",
        error.message,
        error.response?.data
      );
      setStatusMessage(
        error.response?.data?.message || "Failed to upload screenshot"
      );
      showToast(
        "error",
        error.response?.data?.message || "Failed to upload screenshot"
      );
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setStatusMessage("Copied to clipboard!");
    showToast("success", "Copied to clipboard!");
  };

  // Memoize account details to prevent re-renders
  const renderAccountDetails = useMemo(
    () => (account) => {
      const isINR = account.account_type === "INR";
      const isUSDT = account.account_type === "USDT";
      const hasQrCodeError = qrCodeErrors[account._id];

      return (
        <div className="space-y-2" key={account._id}>
          <div className="flex items-center justify-between">
            <span>
              <strong>Type:</strong> {account.account_type}
            </span>
          </div>
          {isINR && (
            <>
              {account.bank_name && (
                <div className="flex items-center justify-between">
                  <span>
                    <strong>Bank Name:</strong> {account.bank_name}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleCopy(account.bank_name)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              )}
              {account.account_holder_name && (
                <div className="flex items-center justify-between">
                  <span>
                    <strong>Account Holder:</strong>{" "}
                    {account.account_holder_name}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleCopy(account.account_holder_name)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              )}
              {account.account_number && (
                <div className="flex items-center justify-between">
                  <span>
                    <strong>Account Number:</strong> {account.account_number}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleCopy(account.account_number)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              )}
              {account.ifsc_code && (
                <div className="flex items-center justify-between">
                  <span>
                    <strong>IFSC Code:</strong> {account.ifsc_code}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleCopy(account.ifsc_code)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              )}
              {account.upi_id && (
                <div className="flex items-center justify-between">
                  <span>
                    <strong>UPI ID:</strong> {account.upi_id}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleCopy(account.upi_id)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              )}
              {account.upi_number && (
                <div className="flex items-center justify-between">
                  <span>
                    <strong>UPI Number:</strong> {account.upi_number}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleCopy(account.upi_number)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              )}
              {account.linked_phone_number && (
                <div className="flex items-center justify-between">
                  <span>
                    <strong>Linked Phone:</strong> {account.linked_phone_number}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleCopy(account.linked_phone_number)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
          {isUSDT && (
            <>
              {account.usdt_account_number && (
                <div className="flex items-center justify-between">
                  <span>
                    <strong>USDT Address:</strong> {account.usdt_account_number}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleCopy(account.usdt_account_number)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
          {account.qrcode && (
            <div className="mt-2">
              <strong>QR Code:</strong>
              <div className="mt-1">
                {hasQrCodeError ? (
                  <div className="flex flex-col items-center">
                    <p className="text-red-600">
                      Failed to load QR code for {account.account_type} account
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => {
                        setQrCodeErrors((prev) => ({
                          ...prev,
                          [account._id]: false,
                        }));
                        cacheBusterRef.current = Date.now();
                      }}
                    >
                      Retry QR Code
                    </Button>
                  </div>
                ) : (
                  <img
                    src={`${account.qrcode}?t=${cacheBusterRef.current}`}
                    alt={`${account.account_type} QR Code`}
                    className="w-32 h-32 object-contain border rounded"
                    onError={() => {
                      setQrCodeErrors((prev) => ({
                        ...prev,
                        [account._id]: true,
                      }));
                      console.error(
                        `Failed to load QR code: ${account.qrcode}`
                      );
                    }}
                    onLoad={() =>
                      setQrCodeErrors((prev) => ({
                        ...prev,
                        [account._id]: false,
                      }))
                    }
                  />
                )}
              </div>
            </div>
          )}
        </div>
      );
    },
    [qrCodeErrors, handleCopy]
  );

  return (
    <div className="p-6 space-y-8">
      {/* Instructions Dialog */}
      <Dialog open={showInstructionsDialog} onOpenChange={setShowInstructionsDialog}>
  <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto p-6">
    <DialogHeader>
      <DialogTitle className="text-2xl font-bold text-center">
        Deposit Instructions
      </DialogTitle>
    </DialogHeader>

    <div className="space-y-6 mt-4 text-sm text-gray-700">
      {/* INR Deposits Section */}
      <div className="p-4 border rounded-lg bg-gray-50 shadow-sm">
        <h3 className="font-semibold text-lg text-indigo-600 mb-2">INR Deposits</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Method:</strong> Bank Transfer or UPI only.</li>
          <li><strong>Upload Required:</strong> Payment screenshot and Reference Number/UTR.</li>
          <li><strong>Limits:</strong> Minimum ₹5000 | Max No limit per transaction.</li>
          <li><strong>Requirements:</strong> Only KYC-verified accounts can deposit.</li>
          <li><strong>Important:</strong> Payments from third-party accounts will be rejected.</li>
        </ul>
      </div>

      {/* USDT Deposits Section */}
      <div className="p-4 border rounded-lg bg-gray-50 shadow-sm">
        <h3 className="font-semibold text-lg text-green-600 mb-2">USDT Deposits</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Method:</strong> Transfer to Admin’s official crypto wallet.</li>
          <li><strong>Upload Required:</strong> Transaction Hash (TxID). Screenshot optional.</li>
          <li><strong>Limits:</strong> Min USDT 50| Max No limit per transaction.</li>
          <li><strong>Network:</strong> TRC20 (default).</li>
          <li><strong>Requirements:</strong> Only KYC-verified accounts can deposit.</li>
        </ul>
      </div>

      {/* Verification Section */}
      <div className="p-4 border rounded-lg bg-gray-50 shadow-sm">
        <h3 className="font-semibold text-lg text-red-600 mb-2">Verification</h3>
        <p>All deposits will be verified by Admin within  <strong>24–48 hours</strong>.</p>
      </div>
    </div>

    <DialogFooter className="mt-6">
      <Button variant="default" className="w-full" onClick={() => setShowInstructionsDialog(false)}>
        Got it
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>


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
                  <TableCell>
                    {plan?.profit_percentage?.$numberDecimal}%
                  </TableCell>
                  <TableCell>{plan?.capital_lockin || "N/A"}</TableCell>
                  <TableCell>
                    {profitCalculations[plan._id]?.profitAmount}{" "}
                    {plan?.amount_type}
                  </TableCell>
                  <TableCell>
                    {profitCalculations[plan._id]?.totalReturn}{" "}
                    {plan?.amount_type}
                  </TableCell>
                  <TableCell>
                    <Dialog
                      open={
                        showPurchaseDialog && selectedPlan?._id === plan._id
                      }
                      onOpenChange={setShowPurchaseDialog}
                    >
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
                                  <span>
                                    <strong>Plan Name:</strong>{" "}
                                    {plan?.plan_name}
                                  </span>
                                </div>
                                <div className="flex items-center">
                                  <DollarSign className="mr-2 h-4 w-4 text-gray-500" />
                                  <span>
                                    <strong>Minimum Investment:</strong>{" "}
                                    {plan?.min_investment?.$numberDecimal}{" "}
                                    {plan?.amount_type}
                                  </span>
                                </div>
                                <div className="flex items-center">
                                  <Percent className="mr-2 h-4 w-4 text-gray-500" />
                                  <span>
                                    <strong>Profit Percentage:</strong>{" "}
                                    {plan?.profit_percentage?.$numberDecimal}%
                                  </span>
                                </div>
                                <div className="flex items-center">
                                  <Lock className="mr-2 h-4 w-4 text-gray-500" />
                                  <span>
                                    <strong>Capital Lock-in Period:</strong>{" "}
                                    {plan?.capital_lockin || "N/A"} days
                                  </span>
                                </div>
                                <div className="flex items-center">
                                  <Clock className="mr-2 h-4 w-4 text-gray-500" />
                                  <span>
                                    <strong>Profit Withdrawal:</strong>{" "}
                                    {plan?.profit_withdrawal || "daily"}
                                  </span>
                                </div>
                                <div className="flex items-center">
                                  <TrendingUp className="mr-2 h-4 w-4 text-gray-500" />
                                  <span>
                                    <strong>Estimated Profit:</strong>{" "}
                                    {profitCalculations[plan._id]?.profitAmount}{" "}
                                    {plan?.amount_type} (
                                    {plan?.profit_withdrawal || "daily"})
                                  </span>
                                </div>
                                <div className="flex items-center">
                                  <Wallet className="mr-2 h-4 w-4 text-gray-500" />
                                  <span>
                                    <strong>Total Return:</strong>{" "}
                                    {profitCalculations[plan._id]?.totalReturn}{" "}
                                    {plan?.amount_type}
                                  </span>
                                </div>
                                {plan?.notes && (
                                  <div className="col-span-2 flex items-start">
                                    <FileText className="mr-2 h-4 w-4 text-gray-500 mt-1" />
                                    <span>
                                      <strong>Notes:</strong> {plan?.notes}
                                    </span>
                                  </div>
                                )}
                              </div>
                              <Button
                                onClick={handleProceedPayment}
                                className="w-full"
                              >
                                <ArrowRightCircle className="mr-2 h-4 w-4" />
                                Proceed to Payment
                              </Button>
                            </>
                          ) : (
                            <>
                              <div className="text-green-600">
                                Subscription created successfully! Please upload
                                your payment screenshot.
                              </div>
                              {adminInfo ? (
                                <div className="p-3 border rounded bg-gray-50 text-sm text-left">
                                  <p>
                                    <strong>Admin Name:</strong>{" "}
                                    {adminInfo.admin?.username || "N/A"}
                                  </p>
                                  <p>
                                    <strong>Email:</strong>{" "}
                                    {adminInfo.admin?.email || "N/A"}
                                  </p>
                                  {adminInfo.accounts?.length > 0 ? (
                                    <div className="mt-2">
                                      <strong>Accounts:</strong>
                                      <div className="mt-2">
                                        <Select
                                          value={selectedAccountType}
                                          onValueChange={setSelectedAccountType}
                                        >
                                          <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select account type" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {adminInfo.accounts.map((acc) => (
                                              <SelectItem
                                                key={acc._id}
                                                value={acc.account_type}
                                              >
                                                {acc.account_type}
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                        {selectedAccountType && (
                                          <div className="mt-4">
                                            {adminInfo.accounts
                                              .filter(
                                                (acc) =>
                                                  acc.account_type ===
                                                  selectedAccountType
                                              )
                                              .map((acc) =>
                                                renderAccountDetails(acc)
                                              )}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ) : (
                                    <p className="text-red-600">
                                      No accounts found for admin.
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <p className="text-red-600">
                                  Loading admin account details...
                                </p>
                              )}
                              {statusMessage.includes(
                                "Failed to fetch admin account details"
                              ) && (
                                <Button
                                  onClick={handleRetryFetchAdminInfo}
                                  className="mt-4"
                                  variant="outline"
                                >
                                  Retry Fetching Admin Info
                                </Button>
                              )}
                              <div className="flex flex-col space-y-4 mt-4">
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={handleFileChange}
                                  className="border p-2 rounded"
                                />
                                <Button
                                  onClick={handleUploadScreenshot}
                                  disabled={!file}
                                  className="w-full"
                                >
                                  <Upload className="mr-2 h-4 w-4" />
                                  Upload Screenshot
                                </Button>
                              </div>
                            </>
                          )}
                          {statusMessage && (
                            <div
                              className={
                                statusMessage.includes("Failed") ||
                                statusMessage.includes("error")
                                  ? "text-red-600"
                                  : "text-green-600"
                              }
                            >
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
            <div
              className={
                statusMessage.includes("Failed") ||
                statusMessage.includes("error")
                  ? "text-red-600"
                  : "text-green-600"
              }
            >
              {statusMessage}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PlanPurchase;