import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  Trash2,
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

  // Password validation
  const [passwordValidations, setPasswordValidations] = useState({
    minLength: false,
    uppercase: false,
    number: false,
    specialChar: false,
  });

  // Pagination
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;
  const totalPages = Math.ceil(total / limit);

  // Filters
  const [search, setSearch] = useState("");
  const [selectedMonthFilter, setSelectedMonthFilter] = useState("all");
  const [selectedYearFilter, setSelectedYearFilter] = useState("all");
  const [emailVerifiedFilter, setEmailVerifiedFilter] = useState("all");
  const [adminVerifiedFilter, setAdminVerifiedFilter] = useState("all");

  // Generate years and months
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 2019 }, (_, i) => 2020 + i);
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

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
    const { username, email, phone_number, password, confirmPassword } = formData;
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

  // Fetch Users with Filters & Pagination
  const fetchUsers = async (newPage = 1) => {
    try {
      setIsLoading(true);

      const params = new URLSearchParams({
        page: String(newPage),
        limit: String(limit),
        search: search.trim(),
        emailVerified: emailVerifiedFilter === "all" ? "" : emailVerifiedFilter,
        adminVerified: adminVerifiedFilter === "all" ? "" : adminVerifiedFilter,
      });

      // Date filter logic
      if (
        selectedMonthFilter !== "all" ||
        selectedYearFilter !== "all"
      ) {
        const start = new Date();
        const end = new Date();

        const year = selectedYearFilter === "all" ? currentYear : Number(selectedYearFilter);
        start.setFullYear(year);
        end.setFullYear(year);

        if (selectedMonthFilter !== "all") {
          const monthIndex = parseInt(selectedMonthFilter, 10) - 1;
          start.setMonth(monthIndex);
          end.setMonth(monthIndex);
        } else {
          start.setMonth(0);
          end.setMonth(11);
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

      const rawUsers = response?.data?.users || [];
      setUsers(Array.isArray(rawUsers) ? rawUsers : []);
      setTotal(Number(response?.data?.total) || 0);
      setPage(newPage);
    } catch (error) {
      console.error("Fetch users error:", error);
      showToast("error", error.response?.data?.message || "Failed to fetch users");
      setUsers([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch + refetch on filter change
  useEffect(() => {
    fetchUsers(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    search,
    selectedMonthFilter,
    selectedYearFilter,
    emailVerifiedFilter,
    adminVerifiedFilter,
  ]);

  useEffect(() => {
    if (page > 1) fetchUsers(page);
  }, [page]);

  const resetAllFilters = () => {
    setSearch("");
    setSelectedMonthFilter("all");
    setSelectedYearFilter("all");
    setEmailVerifiedFilter("all");
    setAdminVerifiedFilter("all");
  };

  const hasActiveFilters = () =>
    search ||
    selectedMonthFilter !== "all" ||
    selectedYearFilter !== "all" ||
    emailVerifiedFilter !== "all" ||
    adminVerifiedFilter !== "all";

  // Form handlers
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!editUserId && formData.password !== formData.confirmPassword) {
      showToast("error", "Passwords do not match");
      return;
    }

    if (!editUserId && !validatePassword(formData.password)) {
      showToast("error", "Password does not meet requirements");
      return;
    }

    try {
      setIsLoading(true);
      if (editUserId) {
        await axiosInstance.put(`/users/update-user/${editUserId}`, {
          username: formData.username,
          email: formData.email,
          phone_number: formData.phone_number,
          password: formData.password || undefined,
        });
        showToast("success", "User updated successfully");
      } else {
        const response = await axiosInstance.post("/users/register", formData);
        showToast("success", response.data.message);
        setNewUserEmail(formData.email);
        setIsOtpDialogOpen(true);
      }
      setIsAddDialogOpen(false);
      resetForm();
      fetchUsers(page);
    } catch (error) {
      showToast("error", error.response?.data?.message || "Operation failed");
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
      showToast("error", error.response?.data?.message || "Failed to delete user");
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
      await axiosInstance.post("/users/verify-email", { email: newUserEmail, otp });
      showToast("success", "Email verified successfully");
      setIsOtpDialogOpen(false);
      setOtp("");
      setNewUserEmail("");
      fetchUsers(page);
    } catch (error) {
      showToast("error", error.response?.data?.message || "Invalid OTP");
    } finally {
      setIsLoading(false);
    }
  };

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
        <Button key={1} variant={1 === page ? "default" : "outline"} size="sm" onClick={() => goToPage(1)}>
          1
        </Button>
      );
      if (startPage > 2) pages.push(<span key="start-ellipsis" className="px-2">...</span>);
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
      if (endPage < totalPages - 1) pages.push(<span key="end-ellipsis" className="px-2">...</span>);
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
      <h1 className="text-2xl font-bold mb-6 text-[#0f1c3f]">User Management</h1>

      {/* Filters */}
      <div className="filters space-y-4">
        {/* Search */}
        <div className="relative max-w-md">
          <Input
            placeholder="Search by username, email, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-10"
          />
          {search && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full"
              onClick={() => setSearch("")}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Filter Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {/* Month */}
          <div className="space-y-1">
            <Label className="text-xs text-gray-600">Month</Label>
            <Select value={selectedMonthFilter} onValueChange={setSelectedMonthFilter}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="All Months" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Months</SelectItem>
                {months?.map((m, i) => (
                  <SelectItem key={i} value={String(i + 1).padStart(2, "0")}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Year */}
          <div className="space-y-1">
            <Label className="text-xs text-gray-600">Year</Label>
            <Select value={selectedYearFilter} onValueChange={setSelectedYearFilter}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="All Years" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {years?.map((y) => (
                  <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Email Verified */}
          <div className="space-y-1">
            <Label className="text-xs text-gray-600">Email Verified</Label>
            <Select value={emailVerifiedFilter} onValueChange={setEmailVerifiedFilter}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="true">Yes</SelectItem>
                <SelectItem value="false">No</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Admin Verified */}
          <div className="space-y-1">
            <Label className="text-xs text-gray-600">Admin Verified</Label>
            <Select value={adminVerifiedFilter} onValueChange={setAdminVerifiedFilter}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="true">Yes</SelectItem>
                <SelectItem value="false">No</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Clear Filters */}
        {hasActiveFilters() && (
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={resetAllFilters} className="text-red-600">
              <RotateCcw className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
          </div>
        )}
      </div>

      {/* Add User Button */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogTrigger asChild>
          <Button className="bg-[#d09d42] hover:bg-[#0f1c3f] text-white">
            <UserPlus className="mr-2 h-4 w-4" /> Add User
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editUserId ? "Edit User" : "Add New User"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Username</Label>
              <Input
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <Label>Phone Number</Label>
              <Input
                name="phone_number"
                value={formData.phone_number}
                onChange={handleInputChange}
                required
              />
            </div>
            {!editUserId && (
              <>
                <div>
                  <Label>Password</Label>
                  <Input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                  />
                  <div className="mt-2 space-y-1 text-sm">
                    {Object.entries(passwordValidations)?.map(([key, valid]) => (
                      <div key={key} className="flex items-center">
                        {valid ? (
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500 mr-2" />
                        )}
                        <span>
                          {key === "minLength" && "6+ characters"}
                          {key === "uppercase" && "One uppercase letter"}
                          {key === "number" && "One number"}
                          {key === "specialChar" && "One special character"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <Label>Confirm Password</Label>
                  <Input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </>
            )}
            <Button type="submit" disabled={isSubmitDisabled() || isLoading} className="w-full">
              {isLoading ? "Saving..." : editUserId ? "Update User" : "Add User"}
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
            <Button type="submit" disabled={isLoading} className="w-full">
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
        message="Are you sure you want to delete this user? This action cannot be undone."
      />

      {/* Users Table */}
      <Card>
        <CardHeader className="bg-[#0f1c3f] text-[#d09d42] font-bold">
          <CardTitle>Users List</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading && users.length === 0 ? (
            <div className="p-6 space-y-3">
              {[...Array(8)]?.map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead className="text-center">Email Verified</TableHead>
                  <TableHead className="text-center">Admin Verified</TableHead>
                  <TableHead>Joined Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length > 0 ? (
                  users?.map((user) => (
                    <TableRow key={user._id}>
                      <TableCell className="font-medium">{user.username}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.phone_number}</TableCell>
                      <TableCell className="text-center">
                        {user.email_verified ? (
                          <CheckCircle className="h-5 w-5 text-green-600 mx-auto" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600 mx-auto" />
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {user.verified_by_admin ? (
                          <CheckCircle className="h-5 w-5 text-green-600 mx-auto" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600 mx-auto" />
                        )}
                      </TableCell>
                      <TableCell>
                        {format(new Date(user.created_at), "dd MMM yyyy")}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(user)}
                        >
                          <Edit className="h-4 w-4 mr-1" /> Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            setDeleteUserId(user._id);
                            setIsDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      No users found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t">
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
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminUserManagement;
