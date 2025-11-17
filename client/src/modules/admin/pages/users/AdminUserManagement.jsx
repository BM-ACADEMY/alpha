import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import {
  UserPlus,
  Edit,
  CheckCircle,
  XCircle,
  Eye,
  Trash2,
  User,
  X,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import axiosInstance from "@/modules/common/lib/axios";
import { showToast } from "@/modules/common/toast/customToast";
import ConfirmationDialog from "@/modules/common/reusable/ConfirmationDialog";

const AdminUserManagement = () => {
  const [users, setUsers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    phone_number: "",
    password: "",
    confirmPassword: "",
  });
  const [editUserId, setEditUserId] = useState(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState(null);
  const [isOtpDialogOpen, setIsOtpDialogOpen] = useState(false);
  const [otp, setOtp] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [passwordValidations, setPasswordValidations] = useState({
    minLength: false,
    uppercase: false,
    number: false,
    specialChar: false,
  });
  const [selectedUserDetails, setSelectedUserDetails] = useState(null);
  const detailsRef = useRef(null);

  // Pagination state
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;
  const totalPages = Math.ceil(total / limit);

  // Filters
  const [search, setSearch] = useState("");
  const [selectedMonthFilter, setSelectedMonthFilter] = useState("all");
  const [selectedYearFilter, setSelectedYearFilter] = useState("all");
  const [selectedPlan, setSelectedPlan] = useState("all");
  const [emailVerifiedFilter, setEmailVerifiedFilter] = useState("all");
  const [adminVerifiedFilter, setAdminVerifiedFilter] = useState("all");

  // Generate years and months
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 2019 }, (_, i) => 2020 + i);
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  // Password validation
  const validatePassword = (password) => {
    const minLength = password.length >= 6;
    const uppercase = /[A-Z]/.test(password);
    const number = /[0-9]/.test(password);
    const specialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    setPasswordValidations({ minLength, uppercase, number, specialChar });
    return minLength && uppercase && number && specialChar;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === "password") validatePassword(value);
  };

  const isSubmitDisabled = () => {
    const { username, email, phone_number, password, confirmPassword } =
      formData;
    if (editUserId) return !username || !email || !phone_number;
    return (
      !username ||
      !email ||
      !phone_number ||
      !password ||
      !confirmPassword ||
      password !== confirmPassword ||
      !Object.values(passwordValidations).every(Boolean)
    );
  };

  // Fetch Plans
  const fetchPlans = async () => {
    try {
      const response = await axiosInstance.get("/plans");
      const data = Array.isArray(response.data) ? response.data : [];
      setPlans(data);
    } catch (error) {
      console.error("Failed to fetch plans:", error);
      setPlans([]);
    }
  };

  // Fetch Users with Filters and Pagination
  const fetchUsers = async (newPage = 1) => {
    try {
      setIsLoading(true);

      const params = new URLSearchParams({
        page: String(newPage),
        limit: String(limit),
        search: search.trim(),
        plan: selectedPlan === "all" ? "" : selectedPlan,
        emailVerified: emailVerifiedFilter === "all" ? "" : emailVerifiedFilter,
        adminVerified: adminVerifiedFilter === "all" ? "" : adminVerifiedFilter,
      });

      // Only apply date filter if real values are selected
      if (
        (selectedMonthFilter && selectedMonthFilter !== "all") ||
        (selectedYearFilter && selectedYearFilter !== "all")
      ) {
        const start = new Date();
        const end = new Date();

        const year =
          selectedYearFilter === "all"
            ? currentYear
            : Number(selectedYearFilter);
        start.setFullYear(year);
        end.setFullYear(year);

        if (selectedMonthFilter && selectedMonthFilter !== "all") {
          const monthIndex = parseInt(selectedMonthFilter, 10) - 1;
          start.setMonth(monthIndex);
          end.setMonth(monthIndex);
        } else {
          start.setMonth(0); // January
          end.setMonth(11); // December
        }

        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        end.setMonth(end.getMonth() + 1);
        end.setDate(0);
        end.setHours(23, 59, 59, 999);

        if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
          params.append("startDate", format(start, "yyyy-MM-dd"));
          params.append("endDate", format(end, "yyyy-MM-dd"));
        }
      }

      const response = await axiosInstance.get(
        `/users/fetch-all-users-details-filter?${params.toString()}`
      );

      const rawUsers = response?.data?.users;
      const newUsers = Array.isArray(rawUsers) ? rawUsers : [];
      setUsers(newUsers);

      const totalCount = Number(response?.data?.total) || 0;
      setTotal(totalCount);
      setPage(newPage);
    } catch (error) {
      console.error("Fetch users error:", error);
      showToast(
        "error",
        error.response?.data?.message || "Failed to fetch users"
      );
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Load plans
  useEffect(() => {
    fetchPlans();
  }, []);

  // Refetch on filter change or page change
  useEffect(() => {
    fetchUsers(1);
  }, [
    search,
    selectedMonthFilter,
    selectedYearFilter,
    selectedPlan,
    emailVerifiedFilter,
    adminVerifiedFilter,
  ]);

  useEffect(() => {
    if (page > 1) {
      fetchUsers(page);
    }
  }, [page]);

  // Reset filters
  const resetSearch = () => setSearch("");
  const resetMonth = () => {
    setSelectedMonthFilter("all");
    setSelectedYearFilter("all");
  };
  const resetPlan = () => setSelectedPlan("all");
  const resetEmailVerified = () => setEmailVerifiedFilter("all");
  const resetAdminVerified = () => setAdminVerifiedFilter("all");

  const resetAllFilters = () => {
    setSearch("");
    setSelectedMonthFilter("all");
    setSelectedYearFilter("all");
    setSelectedPlan("all");
    setEmailVerifiedFilter("all");
    setAdminVerifiedFilter("all");
  };

  const hasActiveFilters = () => {
    return (
      search ||
      selectedMonthFilter !== "all" ||
      selectedYearFilter !== "all" ||
      selectedPlan !== "all" ||
      emailVerifiedFilter !== "all" ||
      adminVerifiedFilter !== "all"
    );
  };

  // Form handlers
  const handleSubmit = async (e) => {
    e.preventDefault();
    const { username, email, phone_number, password, confirmPassword } =
      formData;

    if (!editUserId && password !== confirmPassword) {
      showToast("error", "Passwords do not match");
      return;
    }

    if (!editUserId && !validatePassword(password)) {
      showToast("error", "Password does not meet requirements");
      return;
    }

    try {
      setIsLoading(true);
      if (editUserId) {
        await axiosInstance.put(`/users/update-user/${editUserId}`, {
          username,
          email,
          phone_number,
          password: password || undefined,
        });
        showToast("success", "User updated successfully");
      } else {
        const response = await axiosInstance.post("/users/register", {
          username,
          email,
          phone_number,
          password,
          confirmPassword,
        });
        showToast("success", response.data.message);
        setNewUserEmail(email);
        setIsOtpDialogOpen(true);
      }
      setIsAddDialogOpen(false);
      resetForm();
      fetchUsers(page); // Refresh current page
    } catch (error) {
      showToast(
        "error",
        error.response?.data?.message || "Failed to save user"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      username: "",
      email: "",
      phone_number: "",
      password: "",
      confirmPassword: "",
    });
    setEditUserId(null);
    setPasswordValidations({
      minLength: false,
      uppercase: false,
      number: false,
      specialChar: false,
    });
  };

  const handleEdit = (user) => {
    setEditUserId(user._id);
    setFormData({
      username: user.username,
      email: user.email,
      phone_number: user.phone_number,
      password: "",
      confirmPassword: "",
    });
    setIsAddDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteUserId) return;
    try {
      setIsLoading(true);
      await axiosInstance.delete(`/users/${deleteUserId}`);
      showToast("success", "User deleted successfully");
      const newTotal = total - 1;
      setTotal(newTotal);
      if (users.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        fetchUsers(page);
      }
    } catch (error) {
      showToast(
        "error",
        error.response?.data?.message || "Failed to delete user"
      );
    } finally {
      setIsLoading(false);
      setIsDeleteDialogOpen(false);
      setDeleteUserId(null);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      await axiosInstance.post("/users/verify-email", {
        email: newUserEmail,
        otp,
      });
      showToast("success", "Email verified successfully");
      setIsOtpDialogOpen(false);
      setOtp("");
      setNewUserEmail("");
      fetchUsers(page);
    } catch (error) {
      showToast(
        "error",
        error.response?.data?.message || "Failed to verify OTP"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetails = async (id) => {
    try {
      setIsLoading(true);
      const response = await axiosInstance.get(
        `/users/fetch-full-details/${id}`
      );
      setSelectedUserDetails(response.data);
      detailsRef.current?.scrollIntoView({ behavior: "smooth" });
    } catch (error) {
      showToast(
        "error",
        error.response?.data?.message || "Failed to fetch user details"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Pagination handlers
  const goToPage = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== page) {
      setPage(newPage);
    }
  };

  const renderPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let startPage = Math.max(1, page - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);

    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    if (startPage > 1) {
      pages.push(
        <Button
          key={1}
          variant={1 === page ? "default" : "outline"}
          size="sm"
          onClick={() => goToPage(1)}
        >
          1
        </Button>
      );
      if (startPage > 2) {
        pages.push(
          <span key="start-ellipsis" className="px-2 text-gray-500">
            ...
          </span>
        );
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <Button
          key={i}
          variant={i === page ? "default" : "outline"}
          size="sm"
          onClick={() => goToPage(i)}
        >
          {i}
        </Button>
      );
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push(
          <span key="end-ellipsis" className="px-2 text-gray-500">
            ...
          </span>
        );
      }
      pages.push(
        <Button
          key={totalPages}
          variant={totalPages === page ? "default" : "outline"}
          size="sm"
          onClick={() => goToPage(totalPages)}
        >
          {totalPages}
        </Button>
      );
    }

    return pages;
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold mb-4 text-[#0f1c3f]">
        User Management
      </h1>

      {/* ---------- FILTERS ---------- */}
      <div className="mb-6 space-y-4">
        {/* SEARCH – full width */}
        <div className="relative max-w-full">
          <Input
            placeholder="Search by username, email, phone"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-10 w-full"
          />
          {search && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full"
              onClick={resetSearch}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* FILTER GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {/* MONTH */}
          <div className="space-y-1">
            <Label className="text-xs text-gray-600">Month</Label>
            <div className="relative">
              <Select
                value={selectedMonthFilter}
                onValueChange={setSelectedMonthFilter}
              >
                <SelectTrigger className="pr-10 h-9">
                  <SelectValue placeholder="All Months" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Months</SelectItem>
                  {months.map((month, idx) => (
                    <SelectItem
                      key={idx}
                      value={String(idx + 1).padStart(2, "0")}
                    >
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedMonthFilter !== "all" && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-9"
                  onClick={() => setSelectedMonthFilter("all")}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* YEAR */}
          <div className="space-y-1">
            <Label className="text-xs text-gray-600">Year</Label>
            <div className="relative">
              <Select
                value={selectedYearFilter}
                onValueChange={setSelectedYearFilter}
              >
                <SelectTrigger className="pr-10 h-9">
                  <SelectValue placeholder="All Years" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  {years.map((y) => (
                    <SelectItem key={y} value={String(y)}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedYearFilter !== "all" && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-9"
                  onClick={() => setSelectedYearFilter("all")}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* PLAN */}
          <div className="space-y-1">
            <Label className="text-xs text-gray-600">Plan</Label>
            <div className="relative">
              <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                <SelectTrigger className="pr-10 h-9">
                  <SelectValue placeholder="All Plans" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Plans</SelectItem>
                  {plans.map((p) => (
                    <SelectItem key={p._id} value={p.plan_name}>
                      {p.plan_name} ({p.amount_type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedPlan !== "all" && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-9"
                  onClick={resetPlan}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* EMAIL VERIFIED */}
          <div className="space-y-1">
            <Label className="text-xs text-gray-600">Email Verified</Label>
            <div className="relative">
              <Select
                value={emailVerifiedFilter}
                onValueChange={setEmailVerifiedFilter}
              >
                <SelectTrigger className="pr-10 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="true">Yes</SelectItem>
                  <SelectItem value="false">No</SelectItem>
                </SelectContent>
              </Select>
              {emailVerifiedFilter !== "all" && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-9"
                  onClick={resetEmailVerified}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* ADMIN VERIFIED */}
          <div className="space-y-1">
            <Label className="text-xs text-gray-600">Admin Verified</Label>
            <div className="relative">
              <Select
                value={adminVerifiedFilter}
                onValueChange={setAdminVerifiedFilter}
              >
                <SelectTrigger className="pr-10 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="true">Yes</SelectItem>
                  <SelectItem value="false">No</SelectItem>
                </SelectContent>
              </Select>
              {adminVerifiedFilter !== "all" && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-9"
                  onClick={resetAdminVerified}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Clear All Filters */}
      {hasActiveFilters() && (
        <div className="flex justify-end mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={resetAllFilters}
            className="text-red-600 hover:text-red-700"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Clear All Filters
          </Button>
        </div>
      )}

      {/* Add User Button */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogTrigger asChild>
          <Button className="bg-[#d09d42] text-white hover:bg-[#0f1c3f] mb-4">
            <UserPlus className="mr-2 h-4 w-4" /> Add User
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editUserId ? "Edit User" : "Add New User"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="phone_number">Phone Number</Label>
              <Input
                id="phone_number"
                name="phone_number"
                value={formData.phone_number}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                required={!editUserId}
              />
              {!editUserId && (
                <div className="mt-2 space-y-1 text-sm">
                  {["minLength", "uppercase", "number", "specialChar"].map(
                    (key) => (
                      <div key={key} className="flex items-center">
                        {passwordValidations[key] ? (
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500 mr-2" />
                        )}
                        <span>
                          {key === "minLength" && "6+ chars"}
                          {key === "uppercase" && "1 uppercase"}
                          {key === "number" && "1 number"}
                          {key === "specialChar" && "1 special char"}
                        </span>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required={!editUserId}
              />
            </div>
            <Button type="submit" disabled={isSubmitDisabled() || isLoading}>
              {isLoading ? "Saving..." : editUserId ? "Update" : "Register"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* OTP Dialog */}
      <Dialog open={isOtpDialogOpen} onOpenChange={setIsOtpDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verify Email</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleOtpSubmit} className="space-y-4">
            <Input
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
            />
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Verifying..." : "Verify OTP"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Delete User"
        message="This action cannot be undone."
      />

      {/* Users Table */}
      <Card>
        <CardHeader className="text-[#d09d42] font-bold bg-[#0f1c3f] p-1 rounded">
          <CardTitle>Users</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && users.length === 0 ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Username</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead className="whitespace-nowrap">
                      Email Verified
                    </TableHead>
                    <TableHead className="whitespace-nowrap">
                      Admin Verified
                    </TableHead>
                    <TableHead>Joined Date</TableHead>
                    <TableHead>Active Plan</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length > 0 ? (
                    users.map((user) => (
                      <TableRow key={user._id}>
                        <TableCell>{user.username}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.phone_number}</TableCell>
                        <TableCell>
                          {user.email_verified ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                        </TableCell>
                        <TableCell>
                          {user.verified_by_admin ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                        </TableCell>
                        <TableCell>
                          {new Date(user.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {user.activePlan && user.activePlan !== "None" ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {user.activePlan}
                            </span>
                          ) : (
                            <span className="text-gray-500 italic">None</span>
                          )}
                        </TableCell>
                        <TableCell className="space-x-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(user)}
                          >
                            <Edit className="h-4 w-4 mr-1" /> Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setDeleteUserId(user._id);
                              setIsDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-1" /> Delete
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetails(user._id)}
                          >
                            <Eye className="h-4 w-4 mr-1" /> View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-4">
                        No users found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 px-2">
                  <div className="text-sm text-gray-600">
                    Showing {(page - 1) * limit + 1} to{" "}
                    {Math.min(page * limit, total)} of {total} users
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => goToPage(page - 1)}
                      disabled={page === 1 || isLoading}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>

                    {renderPageNumbers()}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => goToPage(page + 1)}
                      disabled={page === totalPages || isLoading}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* User Details */}
      {selectedUserDetails && (
        <div ref={detailsRef} className="mt-8">
          <Card className="shadow-xl border border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <User className="mr-2 h-6 w-6" /> User Details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 max-h-[60vh] overflow-y-auto space-y-6">
              {/* Add your full details here */}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AdminUserManagement;