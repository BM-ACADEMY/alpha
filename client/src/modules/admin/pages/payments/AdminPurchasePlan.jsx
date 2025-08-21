import React, { useState, useEffect, useRef, useContext } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, CreditCard, Upload, CheckCircle, XCircle, Clock, Eye } from "lucide-react";
import axiosInstance from "@/modules/common/lib/axios";
import { AuthContext } from "@/modules/common/context/AuthContext";

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

  // Fetch plans and purchased plans
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
    fetchPurchasedPlans(currentPage);
    return () => {
      isMounted = false;
    };
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
            console.error("Search user error:", error.message, error.response?.data);
            setSelectedUser(null);
            setStatusMessage("User not found");
          });
      } else {
        setSelectedUser(null);
      }
    }, 1000);
  };

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
    if (!selectedUser) {
      setStatusMessage("Please select a user");
      return;
    }
    setSelectedPlan(plan);
    setAmount(plan?.min_investment?.$numberDecimal || "");
    setShowProfitDialog(true);
  };

  // Proceed with subscription
  const handleProceed = () => {
    if (!selectedUser || !selectedPlan) {
      setStatusMessage("Please select a user and plan");
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
    if (!paymentScreenshot || !subscriptionId || !selectedUser?.username || !amount) {
      console.error("Missing required fields:", {
        hasPaymentScreenshot: !!paymentScreenshot,
        subscriptionId,
        username: selectedUser?.username,
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
    formData.append("username", selectedUser.username);
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
      fetchPurchasedPlans(currentPage);
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

  // Approve subscription
  const handleApprove = async (subscriptionId) => {
    setIsLoading(true);
    try {
      const res = await axiosInstance.patch(`/user-subscription-plan/verify/${subscriptionId}`);
      console.log("Subscription approved:", res.data);
      setStatusMessage(res.data.message);
      fetchPurchasedPlans(currentPage);
    } catch (error) {
      console.error("Approve subscription error:", error.message, error.response?.data);
      setStatusMessage(error.response?.data?.message || "Failed to approve subscription");
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
      const res = await axiosInstance.patch(`/user-subscription-plan/reject/${subscriptionId}`, {
        rejected_reason: rejectReason,
      });
      console.log("Subscription rejected:", res.data);
      setStatusMessage(res.data.message);
      setRejectReason("");
      fetchPurchasedPlans(currentPage);
    } catch (error) {
      console.error("Reject subscription error:", error.message, error.response?.data);
      setStatusMessage(error.response?.data?.message || "Failed to reject subscription");
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
        console.error("Fetch purchased plans error:", error.message, error.response?.data);
        setStatusMessage("Failed to fetch purchased plans");
      });
  };

  // Pagination handlers
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  return (
    <div className="p-6 space-y-8">
      {/* Search User */}
      <Card>
        <CardHeader>
          <CardTitle>Search User</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Input placeholder="Email or Phone Number" value={searchQuery} onChange={handleSearch} />
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
                          disabled={!selectedUser || isLoading}
                          variant="outline"
                        >
                          <CreditCard className="mr-2 h-4 w-4" /> Purchase
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>
                            Confirm Purchase: {selectedPlan?.plan_name} for {selectedUser?.username}
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
                          disabled={!selectedUser || isLoading}
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

      {/* Purchased Plans Table */}
      <Card>
        <CardHeader>
          <CardTitle>Purchased Plans</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Profit %</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Plan Status</TableHead>
                <TableHead>Purchased At</TableHead>
                <TableHead>Expires At</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchasedPlans.map((sub) => {
                // Calculate profit for display in View Details
                const minInvestment = sub.amount;
                const profitPercentage = parseFloat(sub.profit_percentage?.$numberDecimal || 0);
                const capitalLockin = sub.plan_id.capital_lockin || 30;
                const profitWithdrawal = sub.plan_id.profit_withdrawal || "daily";

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
                    <TableCell>{sub.plan_id.plan_name}</TableCell>
                    <TableCell>{sub.amount} {sub.plan_id.amount_type}</TableCell>
                    <TableCell>{sub.profit_percentage?.$numberDecimal}%</TableCell>
                    <TableCell>
                      {sub.status === "pending" && <Clock className="inline h-4 w-4 text-yellow-500" />}
                      {sub.status === "verified" && <CheckCircle className="inline h-4 w-4 text-green-500" />}
                      {sub.status === "rejected" && <XCircle className="inline h-4 w-4 text-red-500" />}
                      {" "}
                      {sub.status.charAt(0).toUpperCase() + sub.status.slice(1)}
                    </TableCell>
                    <TableCell>{sub.planStatus}</TableCell>
                    <TableCell>{new Date(sub.purchased_at).toLocaleDateString()}</TableCell>
                    <TableCell>{sub.expires_at ? new Date(sub.expires_at).toLocaleDateString() : "N/A"}</TableCell>
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
                              <CheckCircle className="mr-2 h-4 w-4 text-green-500" /> Approve
                            </Button>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={isLoading}
                                >
                                  <XCircle className="mr-2 h-4 w-4 text-red-500" /> Reject
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
                                    onChange={(e) => setRejectReason(e.target.value)}
                                  />
                                  <Button
                                    onClick={() => handleReject(sub._id)}
                                    disabled={isLoading || !rejectReason}
                                  >
                                    Submit Rejection
                                  </Button>
                                  {statusMessage && (
                                    <p className={statusMessage.includes("Failed") ? "text-red-600" : "text-green-600"}>
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
                                <p><strong>Subscription ID:</strong> {selectedSubscription._id}</p>
                                <p><strong>User:</strong> {selectedSubscription.user_id.username} ({selectedSubscription.user_id.email})</p>
                                <p><strong>Phone Number:</strong> {selectedSubscription.user_id.phone_number}</p>
                                <p><strong>Plan:</strong> {selectedSubscription.plan_id.plan_name}</p>
                                <p><strong>Amount:</strong> {selectedSubscription.amount} {selectedSubscription.plan_id.amount_type}</p>
                                <p><strong>Profit Percentage:</strong> {selectedSubscription.profit_percentage?.$numberDecimal}%</p>
                                <p><strong>Profit Amount ({selectedSubscription.plan_id.profit_withdrawal}):</strong> {profitAmount.toFixed(2)} {selectedSubscription.plan_id.amount_type}</p>
                                <p><strong>Total Return:</strong> {totalReturn.toFixed(2)} {selectedSubscription.plan_id.amount_type}</p>
                                <p><strong>Status:</strong> {selectedSubscription.status.charAt(0).toUpperCase() + selectedSubscription.status.slice(1)}</p>
                                <p><strong>Plan Status:</strong> {selectedSubscription.planStatus}</p>
                                <p><strong>Purchased At:</strong> {new Date(selectedSubscription.purchased_at).toLocaleString()}</p>
                                <p><strong>Expires At:</strong> {selectedSubscription.expires_at ? new Date(selectedSubscription.expires_at).toLocaleString() : "N/A"}</p>
                                {selectedSubscription.rejected_reason && (
                                  <p><strong>Rejection Reason:</strong> {selectedSubscription.rejected_reason}</p>
                                )}
                                {imageUrl && (
                                  <div>
                                    <p><strong>Payment Screenshot:</strong></p>
                                    <img src={imageUrl} alt="Payment Screenshot" className="w-full max-w-md" />
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
              })}
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

export default AdminPurchasePlan;