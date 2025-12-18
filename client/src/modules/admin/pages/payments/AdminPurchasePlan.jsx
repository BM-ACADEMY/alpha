import React, { useState, useEffect, useRef, useContext } from "react";
import { Input } from "@/components/ui/input";
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
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Search,
  CreditCard,
  Upload,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Banknote,
  Hash,
  Wallet,
  QrCode,
  User,
  Phone,
} from "lucide-react";
import axiosInstance from "@/modules/common/lib/axios";
import { AuthContext } from "@/modules/common/context/AuthContext";
import { showToast } from "@/modules/common/toast/customToast";
import Zoom from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";

// Fallback for imageCache if Map is unavailable
const imageCache =
  typeof Map === "function"
    ? new Map()
    : {
        cache: {},
        set(key, value) {
          this.cache[key] = value;
        },
        get(key) {
          return this.cache[key];
        },
        has(key) {
          return key in this.cache;
        },
        clear() {
          this.cache = {};
        },
      };

// Log if Map is unavailable for debugging
if (typeof Map !== "function") {
  console.warn(
    "Map constructor is not available. Using fallback object for imageCache."
  );
}

const AdminPurchasePlan = () => {
  const { user } = useContext(AuthContext);
  const role_id = user?.role_id?._id;
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [plans, setPlans] = useState([]);
  const [adminAccount, setAdminAccount] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [subscriptionId, setSubscriptionId] = useState(null);
  const [paymentScreenshot, setPaymentScreenshot] = useState(null);
  const [amount, setAmount] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [purchasedPlans, setPurchasedPlans] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [rejectReason, setRejectReason] = useState("");
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [imageUrl, setImageUrl] = useState("");
  const [profitCalculations, setProfitCalculations] = useState({});
  const [showProfitDialog, setShowProfitDialog] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showAddPointsDialog, setShowAddPointsDialog] = useState(false);
  const [selectedSubscriptionForPoints, setSelectedSubscriptionForPoints] = useState(null);
  const [pointsAmount, setPointsAmount] = useState("");
  const [profitPercentage, setProfitPercentage] = useState("");
  const debounceTimer = useRef(null);

  // NEW: Search state for Transaction ID in table
  const [searchTransactionId, setSearchTransactionId] = useState("");

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
        e.returnValue =
          "An upload is in progress. Are you sure you want to leave?";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isLoading]);

  // Fetch plans from /plans endpoint
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await axiosInstance.get("/plans");
        const fetchedPlans = res.data;

        setPlans(fetchedPlans);

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
      } catch (error) {
        console.error("Failed to fetch plans:", error);
        setStatusMessage("Failed to load available plans");
        showToast("error", "Failed to load plans");
      }
    };

    fetchPlans();
  }, []);

  // Fetch purchased plans
  useEffect(() => {
    fetchPurchasedPlans(currentPage);
  }, [currentPage]);

  // Load image for selected subscription
  useEffect(() => {
    const loadImage = async () => {
      if (selectedSubscription?.payment_screenshot) {
        const url = await getImageUrl(selectedSubscription.payment_screenshot);
        setImageUrl(url);
      }
    };
    loadImage();
  }, [selectedSubscription]);

  const getImageUrl = async (filePath) => {
    if (!filePath) return "";
    const parts = filePath.split("/");
    const folder = parts[parts.length - 2];
    const filename = parts[parts.length - 1];
    try {
      const res = await axiosInstance.get(
        `/user-subscription-plan/images/${folder}/${filename}`,
        { responseType: "blob", withCredentials: true }
      );
      const blob = new Blob([res.data], { type: res.headers["content-type"] });
      return URL.createObjectURL(blob);
    } catch (err) {
      console.error("Image fetch failed:", err);
      return "";
    }
  };

  const getQrcodeImageUrl = async (filePath, entityType = "user") => {
    if (!filePath || !user?.id) {
      console.warn("getImageUrl: Missing filePath or user ID", {
        filePath,
        userId: user?.id,
      });
      return "/fallback-image.png";
    }

    if (imageCache.has(filePath)) {
      return imageCache.get(filePath);
    }

    const parts = filePath.split("/");
    const filename = parts[parts.length - 1];

    try {
      const response = await axiosInstance.get(
        `/profile-image/get-image/${entityType}/${user.id}/${encodeURIComponent(
          filename
        )}`,
        { responseType: "blob", withCredentials: true }
      );
      const blob = new Blob([response.data], {
        type: response.headers["content-type"],
      });
      const blobUrl = URL.createObjectURL(blob);
      imageCache.set(filePath, blobUrl);
      return blobUrl;
    } catch (error) {
      console.error("getImageUrl error:", {
        filePath,
        status: error.response?.status,
        message: error.message,
      });
      return "/fallback-image.png";
    }
  };

  // Debounce search
  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      if (e.target.value) {
        axiosInstance
          .get(`/user-subscription-plan/search-user?query=${e.target.value}`)
          .then((res) => setSelectedUser(res.data))
          .catch((error) => {
            console.error(
              "Search user error:",
              error.message,
              error.response?.data
            );
            setSelectedUser(null);
            setStatusMessage("User not found");
          });
      } else {
        setSelectedUser(null);
      }
    }, 1000);
  };

  const fetchAdminAccount = async () => {
    if (!role_id) {
      console.error("Cannot fetch admin account: role_id is undefined");
      setStatusMessage("Invalid role ID");
      return;
    }

    try {
      const res = await axiosInstance.get(
        `/user-subscription-plan/admin-account/${role_id}`
      );
      const account = res.data;

      const qrcodeUrl = account.qrcode
        ? await getQrcodeImageUrl(account.qrcode, "qr_code")
        : null;

      setAdminAccount({ ...account, qrcodeUrl });
      console.log("Admin account fetched:", { ...account, qrcodeUrl });
    } catch (error) {
      console.error(
        "Fetch admin account error:",
        error.message,
        error.response?.data
      );
      setStatusMessage("Failed to fetch admin account");
    }
  };

  // Initiate purchase
  const handlePurchase = (plan) => {
    if (!selectedUser) {
      setStatusMessage("Please select a user");
      return;
    }
    setSelectedPlan(plan);
    setAmount(parseFloat(plan.min_investment?.$numberDecimal || plan.min_investment || 0).toString());
    setShowProfitDialog(true);
  };

  // Proceed with subscription
  const handleProceed = () => {
    if (!selectedUser || !selectedPlan) {
      showToast("error", "Please select a user and plan");
      return;
    }
    setIsLoading(true);
    axiosInstance
      .post("/user-subscription-plan/subscribe", {
        user_id: selectedUser._id,
        plan_id: selectedPlan._id,
        username: selectedUser.username,
        amount: Number(amount || 0),
      })
      .then((res) => {
        console.log("Subscription created:", res.data);
        setSubscriptionId(res.data.subscription._id);
        fetchAdminAccount();
        showToast("success", "Subscription initiated successfully");
        setShowProfitDialog(false);
        setShowUploadDialog(true);
      })
      .catch((error) => {
        console.error("Subscribe error:", error.message, error.response?.data);
        showToast(
          "error",
          error.response?.data?.message || "Failed to create subscription"
        );
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
    console.log("Submitting FormData:", {
      paymentScreenshot,
      subscriptionId,
      username: selectedUser?.username,
      amount,
    });
    if (!paymentScreenshot || !subscriptionId || !selectedUser?.username || !amount) {
      console.error("Missing required fields:", {
        hasPaymentScreenshot: !!paymentScreenshot,
        subscriptionId,
        username: selectedUser?.username,
        amount,
      });
      showToast("error", "Please provide all required fields");
      return;
    }
    setIsLoading(true);
    setUploadProgress(0);
    const formData = new FormData();
    formData.append("payment_screenshot", paymentScreenshot);
    formData.append("subscription_id", subscriptionId);
    formData.append("username", selectedUser.username);
    formData.append("amount", amount);

    try {
      const res = await axiosInstance.post(
        "/user-subscription-plan/upload-screenshot",
        formData,
        {
          timeout: 300000,
          headers: {
            "Content-Type": "multipart/form-data",
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress(percentCompleted);
            console.log(`Upload progress: ${percentCompleted}%`);
          },
        }
      );
      console.log("Upload success:", res.data);
      showToast("success", res.data.message);
      setSelectedPlan(null);
      setPaymentScreenshot(null);
      setSubscriptionId(null);
      setAmount("");
      setUploadProgress(0);
      setShowUploadDialog(false);
      fetchPurchasedPlans(currentPage);
    } catch (error) {
      console.error("Upload error:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        headers: error.response?.headers,
      });
      showToast(
        "error",
        error.response?.data?.message || "Failed to upload screenshot"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Approve subscription and prepare for points dialog
  const handleApprove = async (subscriptionId) => {
    setIsLoading(true);
    console.log("Approving subscription:", subscriptionId);
    try {
      const res = await axiosInstance.patch(
        `/user-subscription-plan/verify/${subscriptionId}`
      );
      console.log("Subscription approved:", res.data);
      setStatusMessage(res.data.message);
      const approvedSubscription = purchasedPlans.find(
        (sub) => sub._id === subscriptionId
      );
      setSelectedSubscriptionForPoints({
        ...approvedSubscription,
        pointsAdded: false,
      });
      setPointsAmount(approvedSubscription.amount.toString());
      setProfitPercentage(
        approvedSubscription.profit_percentage?.$numberDecimal || "0"
      );
      setShowAddPointsDialog(true);
      console.log("Points dialog opened for subscription:", subscriptionId);
    } catch (error) {
      console.error(
        "Approve subscription error:",
        error.message,
        error.response?.data
      );
      setStatusMessage(
        error.response?.data?.message || "Failed to approve subscription"
      );
      showToast(
        "error",
        error.response?.data?.message || "Failed to approve subscription"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Add points to wallet
  const handleAddPoints = async () => {
    if (!selectedSubscriptionForPoints || !pointsAmount || !profitPercentage) {
      setStatusMessage("Please ensure all fields are filled");
      console.warn("Add points failed: Missing required fields", {
        selectedSubscriptionForPoints,
        pointsAmount,
        profitPercentage,
      });
      return;
    }
    setIsLoading(true);
    console.log("Adding points for subscription:", selectedSubscriptionForPoints._id);
    try {
      const res = await axiosInstance.post("/wallet-point/add-points", {
        user_id: selectedSubscriptionForPoints.user_id._id,
        subscription_id: selectedSubscriptionForPoints._id,
        amount: Number(pointsAmount),
        profit_percentage: Number(profitPercentage),
        plan_name: selectedSubscriptionForPoints.plan_id?.plan_name,
        amount_type: selectedSubscriptionForPoints.plan_id?.amount_type,
      });
      console.log("Points added:", res.data);
      setStatusMessage(res.data.message);
      setPurchasedPlans((prev) =>
        prev?.map((sub) =>
          sub._id === selectedSubscriptionForPoints._id
            ? { ...sub, pointsAdded: true }
            : sub
        )
      );
      setSelectedSubscriptionForPoints(null);
      setPointsAmount("");
      setProfitPercentage("");
      setShowAddPointsDialog(false);
      fetchPurchasedPlans(currentPage);
      showToast("success", "Points added successfully");
    } catch (error) {
      console.error("Add points error:", error.message, error.response?.data);
      setStatusMessage(
        error.response?.data?.message || "Failed to add points to wallet"
      );
      showToast(
        "error",
        error.response?.data?.message || "Failed to add points to wallet"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Reject subscription
  const handleReject = async (subscriptionId) => {
    if (!rejectReason) {
      setStatusMessage("Please provide a rejection reason");
      return;
    }
    setIsLoading(true);
    try {
      const res = await axiosInstance.patch(
        `/user-subscription-plan/reject/${subscriptionId}`,
        {
          rejected_reason: rejectReason,
        }
      );
      console.log("Subscription rejected:", res.data);
      setStatusMessage(res.data.message);
      setRejectReason("");
      fetchPurchasedPlans(currentPage);
    } catch (error) {
      console.error(
        "Reject subscription error:",
        error.message,
        error.response?.data
      );
      setStatusMessage(
        error.response?.data?.message || "Failed to reject subscription"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch purchased plans
  const fetchPurchasedPlans = (page) => {
    axiosInstance
      .get(`/user-subscription-plan/purchased-plans?page=${page}`)
      .then((res) => {
        setPurchasedPlans(res.data.subscriptions);
        setTotalPages(res.data.totalPages);
      })
      .catch((error) => {
        console.error(
          "Fetch purchased plans error:",
          error.message,
          error.response?.data
        );
        setStatusMessage("Failed to fetch purchased plans");
      });
  };

  // Pagination handlers
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Handle dialog close
  const handlePointsDialogClose = () => {
    console.log("Closing points dialog");
    setShowAddPointsDialog(false);
    setSelectedSubscriptionForPoints(null);
    setPointsAmount("");
    setProfitPercentage("");
    setStatusMessage("");
    fetchPurchasedPlans(currentPage);
  };

  // NEW: Filter purchased plans by transaction_id
  const filteredPurchasedPlans = purchasedPlans.filter((sub) =>
    !searchTransactionId
      ? true
      : sub.transaction_id?.toLowerCase().includes(searchTransactionId.toLowerCase())
  );

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
              placeholder="Email or Phone Number"
              value={searchQuery}
              onChange={handleSearch}
            />
            <Search className="h-5 w-5 text-muted-foreground" />
          </div>
          {selectedUser && (
            <div className="mt-4 flex items-center space-x-4">
              <Avatar>
                <AvatarFallback>{selectedUser.username[0]}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{selectedUser.username}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedUser.email} | {selectedUser.phone_number}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Plans List */}
      <Card>
        <CardHeader className="text-[#d09d42] font-bold bg-[#0f1c3f] p-1 rounded">
          <CardTitle>Available Plans</CardTitle>
        </CardHeader>
        <CardContent>
          {plans.length === 0 ? (
            <p className="text-center py-8 text-gray-500">Loading plans...</p>
          ) : (
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
                  <TableRow key={plan._id}>
                    <TableCell>{plan.plan_name}</TableCell>
                    <TableCell>
                      {parseFloat(plan.min_investment?.$numberDecimal || plan.min_investment || 0).toLocaleString()} {plan.amount_type}
                    </TableCell>
                    <TableCell>
                      {parseFloat(plan.profit_percentage?.$numberDecimal || plan.profit_percentage || 0)}%
                    </TableCell>
                    <TableCell>{plan.capital_lockin || "N/A"}</TableCell>
                    <TableCell>
                      {profitCalculations[plan._id]?.profitAmount || "0.00"} {plan.amount_type}
                    </TableCell>
                    <TableCell>
                      {profitCalculations[plan._id]?.totalReturn || "0.00"} {plan.amount_type}
                    </TableCell>
                    <TableCell>
                      <Dialog
                        open={showProfitDialog && selectedPlan?._id === plan._id}
                        onOpenChange={setShowProfitDialog}
                      >
                        <DialogTrigger asChild>
                          <Button
                            onClick={() => handlePurchase(plan)}
                            disabled={!selectedUser || isLoading}
                            variant="outline"
                          >
                            <CreditCard className="mr-2 h-4 w-4" /> Purchase
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>
                              Confirm Purchase: {selectedPlan?.plan_name} for{" "}
                              {selectedUser?.username}
                            </DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <p>
                              <strong>Plan Name:</strong>{" "}
                              {selectedPlan?.plan_name}
                            </p>
                            <p>
                              <strong>Min Investment:</strong>{" "}
                              {selectedPlan?.min_investment?.$numberDecimal || selectedPlan?.min_investment}{" "}
                              {selectedPlan?.amount_type}
                            </p>
                            <p>
                              <strong>Profit Percentage:</strong>{" "}
                              {selectedPlan?.profit_percentage?.$numberDecimal || selectedPlan?.profit_percentage}%
                            </p>
                            <p>
                              <strong>Validity:</strong>{" "}
                              {selectedPlan?.capital_lockin} days
                            </p>
                            <p>
                              <strong>
                                Profit Amount ({selectedPlan?.profit_withdrawal}):
                              </strong>{" "}
                              {profitCalculations[selectedPlan?._id]?.profitAmount}{" "}
                              {selectedPlan?.amount_type}
                            </p>
                            <p>
                              <strong>Total Return:</strong>{" "}
                              {profitCalculations[selectedPlan?._id]?.totalReturn}{" "}
                              {selectedPlan?.amount_type}
                            </p>
                            <Button onClick={handleProceed} disabled={isLoading}>
                              Proceed to Payment
                            </Button>
                            {statusMessage && (
                              <p
                                className={
                                  statusMessage.includes("Failed") ||
                                  statusMessage.includes("active subscription")
                                    ? "text-red-600"
                                    : "text-green-600"
                                }
                              >
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
          {/* Upload Payment Dialog */}
          <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
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
                    <h3 className="font-semibold mb-3">
                      Admin Payment Details
                    </h3>
                    <ul className="divide-y divide-gray-200 rounded-lg border bg-gray-50">
                      <li className="flex items-center gap-3 p-3">
                        <Banknote className="h-5 w-5 text-gray-600" />
                        <span className="text-sm">
                          Bank: {adminAccount.bank_name || "N/A"}
                        </span>
                      </li>
                      <li className="flex items-center gap-3 p-3">
                        <Hash className="h-5 w-5 text-gray-600" />
                        <span className="text-sm">
                          IFSC: {adminAccount.ifsc_code || "N/A"}
                        </span>
                      </li>
                      <li className="flex items-center gap-3 p-3">
                        <User className="h-5 w-5 text-gray-600" />
                        <span className="text-sm">
                          Account Holder:{" "}
                          {adminAccount.account_holder_name || "N/A"}
                        </span>
                      </li>
                      <li className="flex items-center gap-3 p-3">
                        <CreditCard className="h-5 w-5 text-gray-600" />
                        <span className="text-sm">
                          Account No: {adminAccount.account_number || "N/A"}
                        </span>
                      </li>
                      <li className="flex items-center gap-3 p-3">
                        <Phone className="h-5 w-5 text-gray-600" />
                        <span className="text-sm">
                          Linked Phone:{" "}
                          {adminAccount.linked_phone_number || "N/A"}
                        </span>
                      </li>
                      <li className="flex items-center gap-3 p-3">
                        <Wallet className="h-5 w-5 text-gray-600" />
                        <span className="text-sm">
                          UPI ID: {adminAccount.upi_id || "N/A"}
                        </span>
                      </li>
                      <li className="flex items-center gap-3 p-3">
                        <Wallet className="h-5 w-5 text-gray-600" />
                        <span className="text-sm">
                          UPI No: {adminAccount.upi_number || "N/A"}
                        </span>
                      </li>
                      {adminAccount.qrcodeUrl && (
                        <li className="flex flex-col gap-2 p-3">
                          <div className="flex items-center gap-3">
                            <QrCode className="h-5 w-5 text-gray-600" />
                            <span className="text-sm font-medium">QR Code</span>
                          </div>
                          <Zoom>
                            <img
                              src={adminAccount.qrcodeUrl}
                              alt="Admin QR Code"
                              className="w-[200px] h-[200px] object-contain border rounded-lg shadow cursor-pointer bg-white"
                              onError={(e) => {
                                console.error(
                                  "Failed to load admin qrcode:",
                                  e
                                );
                                e.target.src = "/fallback-image.png";
                              }}
                            />
                          </Zoom>
                        </li>
                      )}
                    </ul>
                    <p className="text-sm text-muted-foreground mt-3">
                      Pay manually using GPay (phone/UPI/QR) or bank transfer.
                    </p>
                  </div>
                ) : (
                  <p className="text-red-600">
                    Admin account details not available
                  </p>
                )}
                <div className="space-y-2">
                  <label>
                    Upload Payment Screenshot (Max 200MB, Any file type)
                  </label>
                  <Input type="file" onChange={handleFileChange} />
                  <Button
                    onClick={handleSubmit}
                    disabled={!paymentScreenshot || isLoading}
                  >
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
                  <p
                    className={
                      statusMessage.includes("Failed")
                        ? "text-red-600"
                        : "text-green-600"
                    }
                  >
                    {statusMessage}
                  </p>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      {/* Purchased Plans Table with Search Box */}
      <Card>
        <CardHeader className="text-[#d09d42] font-bold bg-[#0f1c3f] p-1 rounded flex justify-between items-center flex-wrap gap-4">
          <CardTitle>Purchased Plans</CardTitle>
          <div className="relative w-80">
            <Input
              placeholder="Search by Transaction ID / UTR / TxID"
              value={searchTransactionId}
              onChange={(e) => setSearchTransactionId(e.target.value)}
              className="pl-10 pr-4 py-2 text-sm bg-white border-gray-300 rounded-lg"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Profit %</TableHead>
                <TableHead>Transaction ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Plan Status</TableHead>
                <TableHead>Purchased At</TableHead>
                <TableHead>Expires At</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPurchasedPlans?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-gray-500">
                    {searchTransactionId
                      ? "No transactions found matching this Transaction ID"
                      : "No purchased plans yet"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredPurchasedPlans?.map((sub) => {
                  const minInvestment = sub.amount;
                  const profitPercentage = parseFloat(
                    sub.profit_percentage?.$numberDecimal || 0
                  );
                  const capitalLockin = sub.plan_id?.capital_lockin || 30;
                  const profitWithdrawal =
                    sub.plan_id?.profit_withdrawal || "daily";

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

                  return (
                    <TableRow key={sub._id}>
                      <TableCell>
                        {sub.user_id.username} ({sub.user_id.email})
                      </TableCell>
                      <TableCell>{sub.plan_id?.plan_name}</TableCell>
                      <TableCell>
                        {sub.amount} {sub.plan_id?.amount_type}
                      </TableCell>
                      <TableCell>
                        {sub.profit_percentage?.$numberDecimal}%
                      </TableCell>
                      <TableCell>
                        {sub.transaction_id ? (
                          <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                            {sub.transaction_id}
                          </span>
                        ) : (
                          <span className="text-gray-500 italic text-sm">
                            Not provided
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {sub.status === "pending" && (
                          <Clock className="inline h-4 w-4 text-yellow-500" />
                        )}
                        {sub.status === "verified" && (
                          <CheckCircle className="inline h-4 w-4 text-green-500" />
                        )}
                        {sub.status === "rejected" && (
                          <XCircle className="inline h-4 w-4 text-red-500" />
                        )}{" "}
                        {sub.status.charAt(0).toUpperCase() + sub.status.slice(1)}
                      </TableCell>
                      <TableCell>{sub.planStatus}</TableCell>
                      <TableCell>
                        {new Date(sub.purchased_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {sub.expires_at
                          ? new Date(sub.expires_at).toLocaleDateString()
                          : "N/A"}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          {sub.status === "pending" && (
                            <>
                              <Button
                                onClick={() => handleApprove(sub._id)}
                                disabled={isLoading}
                                variant="outline"
                                size="sm"
                              >
                                <CheckCircle className="mr-2 h-4 w-4 text-green-500" />{" "}
                                Approve
                              </Button>
                              <Dialog
                                open={
                                  showAddPointsDialog &&
                                  selectedSubscriptionForPoints?._id === sub._id
                                }
                                onOpenChange={handlePointsDialogClose}
                              >
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>
                                      Add Points for {sub.user_id.username}'s Subscription
                                    </DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <p>
                                      <strong>Plan Name:</strong>{" "}
                                      {selectedSubscriptionForPoints?.plan_id?.plan_name}
                                    </p>
                                    <p>
                                      <strong>Amount:</strong>{" "}
                                      {selectedSubscriptionForPoints?.amount}{" "}
                                      {selectedSubscriptionForPoints?.plan_id?.amount_type}
                                    </p>
                                    <p>
                                      <strong>Profit Percentage:</strong>{" "}
                                      {selectedSubscriptionForPoints?.profit_percentage?.$numberDecimal}%
                                    </p>
                                    <div>
                                      <label>Capital Amount</label>
                                      <Input
                                        type="number"
                                        value={pointsAmount}
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
                                    <div className="flex space-x-2">
                                      <Button
                                        onClick={handleAddPoints}
                                        disabled={isLoading || selectedSubscriptionForPoints?.pointsAdded}
                                        className="bg-[#d09d42] text-white hover:bg-[#0f1c3f]"
                                      >
                                        <Wallet className="mr-2 h-4 w-4" />{" "}
                                        {selectedSubscriptionForPoints?.pointsAdded
                                          ? "Points Added"
                                          : "Add Points"}
                                      </Button>
                                      <Button
                                        variant="outline"
                                        onClick={handlePointsDialogClose}
                                        disabled={isLoading}
                                      >
                                        Cancel
                                      </Button>
                                    </div>
                                    {statusMessage && (
                                      <p
                                        className={
                                          statusMessage.includes("Failed")
                                            ? "text-red-600"
                                            : "text-green-600"
                                        }
                                      >
                                        {statusMessage}
                                      </p>
                                    )}
                                  </div>
                                </DialogContent>
                              </Dialog>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={isLoading}
                                  >
                                    <XCircle className="mr-2 h-4 w-4 text-red-500" />{" "}
                                    Reject
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Reject Subscription</DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <Input
                                      placeholder="Enter rejection reason"
                                      value={rejectReason}
                                      onChange={(e) =>
                                        setRejectReason(e.target.value)
                                      }
                                    />
                                    <Button
                                      onClick={() => handleReject(sub._id)}
                                      disabled={isLoading || !rejectReason}
                                    >
                                      Submit Rejection
                                    </Button>
                                    {statusMessage && (
                                      <p
                                        className={
                                          statusMessage.includes("Failed")
                                            ? "text-red-600"
                                            : "text-green-600"
                                        }
                                      >
                                        {statusMessage}
                                      </p>
                                    )}
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </>
                          )}
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedSubscription(sub)}
                              >
                                <Eye className="mr-2 h-4 w-4" /> View Details
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="h-[500px] overflow-auto">
                              <DialogHeader>
                                <DialogTitle>Subscription Details</DialogTitle>
                              </DialogHeader>
                              {selectedSubscription && (
                                <div className="space-y-4">
                                  <p>
                                    <strong>Subscription ID:</strong>{" "}
                                    {selectedSubscription._id}
                                  </p>
                                  <p>
                                    <strong>User:</strong>{" "}
                                    {selectedSubscription.user_id.username} (
                                    {selectedSubscription.user_id.email})
                                  </p>
                                  <p>
                                    <strong>Phone Number:</strong>{" "}
                                    {selectedSubscription.user_id.phone_number}
                                  </p>
                                  <p>
                                    <strong>Plan:</strong>{" "}
                                    {selectedSubscription.plan_id?.plan_name}
                                  </p>
                                  <p>
                                    <strong>Amount:</strong>{" "}
                                    {selectedSubscription.amount}{" "}
                                    {selectedSubscription.plan_id?.amount_type}
                                  </p>
                                  <p>
                                    <strong>Profit Percentage:</strong>{" "}
                                    {selectedSubscription.profit_percentage?.$numberDecimal}%
                                  </p>
                                  <p>
                                    <strong>
                                      Profit Amount (
                                      {selectedSubscription.plan_id?.profit_withdrawal}
                                      ):
                                    </strong>{" "}
                                    {profitAmount.toFixed(2)}{" "}
                                    {selectedSubscription.plan_id?.amount_type}
                                  </p>
                                  <p>
                                    <strong>Total Return:</strong>{" "}
                                    {totalReturn.toFixed(2)}{" "}
                                    {selectedSubscription.plan_id?.amount_type}
                                  </p>
                                  <p>
                                    <strong>Status:</strong>{" "}
                                    {selectedSubscription.status
                                      .charAt(0)
                                      .toUpperCase() +
                                      selectedSubscription.status.slice(1)}
                                  </p>
                                  <p>
                                    <strong>Plan Status:</strong>{" "}
                                    {selectedSubscription.planStatus}
                                  </p>
                                  <p>
                                    <strong>Purchased At:</strong>{" "}
                                    {new Date(
                                      selectedSubscription.purchased_at
                                    ).toLocaleString()}
                                  </p>
                                  <p>
                                    <strong>Expires At:</strong>{" "}
                                    {selectedSubscription.expires_at
                                      ? new Date(
                                          selectedSubscription.expires_at
                                        ).toLocaleString()
                                      : "N/A"}
                                  </p>

                                  {/* Transaction ID in View Details */}
                                  {selectedSubscription.transaction_id ? (
                                    <p>
                                      <strong>Transaction ID / UTR / TxID:</strong>{" "}
                                      <span className="font-mono bg-gray-100 px-2 py-1 rounded text-sm">
                                        {selectedSubscription.transaction_id}
                                      </span>
                                    </p>
                                  ) : (
                                    <p>
                                      <strong>Transaction ID:</strong>{" "}
                                      <span className="text-gray-500 italic">Not provided</span>
                                    </p>
                                  )}

                                  {selectedSubscription.rejected_reason && (
                                    <p>
                                      <strong>Rejection Reason:</strong>{" "}
                                      {selectedSubscription.rejected_reason}
                                    </p>
                                  )}
                                  {imageUrl && (
                                    <div>
                                      <p>
                                        <strong>Payment Screenshot:</strong>
                                      </p>
                                      <Zoom>
                                        <img
                                          src={imageUrl}
                                          alt="Payment Screenshot"
                                          className="w-full max-w-md rounded-lg border shadow cursor-pointer"
                                          onError={(e) => {
                                            console.error(
                                              "Failed to load payment screenshot:",
                                              e
                                            );
                                            e.target.src = "/fallback-image.png";
                                          }}
                                        />
                                      </Zoom>
                                    </div>
                                  )}
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {filteredPurchasedPlans?.length > 0 && (
            <Pagination className="mt-4">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={() =>
                      handlePageChange(currentPage > 1 ? currentPage - 1 : 1)
                    }
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
                    onClick={() =>
                      handlePageChange(
                        currentPage < totalPages ? currentPage + 1 : totalPages
                      )
                    }
                    disabled={currentPage === totalPages}
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

export default AdminPurchasePlan;
