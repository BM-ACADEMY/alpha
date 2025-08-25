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
  DialogTrigger
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
  UserPlus,
  Edit,
  CheckCircle,
  XCircle,
  Users,
  Eye,
  Trash2,
  User,
  Home,
  Wallet,
  DollarSign,
  Globe,
  Mail,
  Phone,
  CreditCard,
  Key,
  Shield,
  Code,
  Calendar,
  MapPin,
  Building,
  Flag,
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
  const [passwordValidations, setPasswordValidations] = useState({
    minLength: false,
    uppercase: false,
    number: false,
    specialChar: false,
  });
  const [selectedUserDetails, setSelectedUserDetails] = useState(null);
  const detailsRef = useRef(null);
  // Password validation logic
  const validatePassword = (password) => {
    const minLength = password.length >= 6;
    const uppercase = /[A-Z]/.test(password);
    const number = /[0-9]/.test(password);
    const specialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    setPasswordValidations({
      minLength,
      uppercase,
      number,
      specialChar,
    });

    return minLength && uppercase && number && specialChar;
  };



  // Handle view details button click
  const handleViewDetails = async (id) => {
    try {
      setIsLoading(true);
      const response = await axiosInstance.get(`/users/fetch-full-details/${id}`);
      setSelectedUserDetails(response.data);
      detailsRef.current?.scrollIntoView({ behavior: "smooth" });
    } catch (error) {
      showToast(error, "Failed to fetch user details");
    } finally {
      setIsLoading(false);
    }
  };
  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "password") {
      validatePassword(value);
    }
  };

  // Check if submit button should be enabled
  const isSubmitDisabled = () => {
    const { username, email, phone_number, password, confirmPassword } = formData;
    if (editUserId) {
      // For edit, password is optional
      return !username || !email || !phone_number;
    }
    // For add, all fields required and password must be valid
    return (
      !username ||
      !email ||
      !phone_number ||
      !password ||
      !confirmPassword ||
      password !== confirmPassword ||
      !passwordValidations.minLength ||
      !passwordValidations.uppercase ||
      !passwordValidations.number ||
      !passwordValidations.specialChar
    );
  };

  // Fetch all users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axiosInstance.get("/users/fetch-all-users-details");
        setUsers(response.data);
        setIsLoading(false);
      } catch (error) {
        showToast(error, "Failed to fetch users");
        setIsLoading(false);
      }
    };
    fetchUsers();
  }, []);

  // Handle form submission (Add/Edit)
  const handleSubmit = async (e) => {
    e.preventDefault();
    const { username, email, phone_number, password, confirmPassword } = formData;

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
        const response = await axiosInstance.put(`/users/update-user/${editUserId}`, {
          username,
          email,
          phone_number,
          password: password ? password : undefined,
        });
        showToast("success", "User updated successfully");
        setUsers(
          users.map((user) =>
            user._id === editUserId ? response.data : user
          )
        );
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
    } catch (error) {
      showToast(
        "error",
        error.response?.data?.message || "Failed to save user"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Handle edit button click
  const handleEdit = (user) => {
    setEditUserId(user._id);
    setFormData({
      username: user.username,
      email: user.email,
      phone_number: user.phone_number,
      password: "",
      confirmPassword: "",
    });
    setPasswordValidations({
      minLength: false,
      uppercase: false,
      number: false,
      specialChar: false,
    });
    setIsAddDialogOpen(true);
  };

  // Handle delete confirmation
  const handleDelete = async () => {
    try {
      setIsLoading(true);
      await axiosInstance.delete(`/users/${deleteUserId}`);
      showToast("success", "User deleted successfully");
      setUsers(users.filter((user) => user._id !== deleteUserId));
      setIsDeleteDialogOpen(false);
      setDeleteUserId(null);
    } catch (error) {
      showToast(error, "Failed to delete user");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle OTP verification
  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      const response = await axiosInstance.post("/users/verify-email", {
        email: newUserEmail,
        otp,
      });
      console.log(response);

      showToast("success", "Email verified successfully");
      setIsOtpDialogOpen(false);
      setOtp("");
      setNewUserEmail("");
      const usersResponse = await axiosInstance.get("/users/fetch-all-users-details");
      setUsers(usersResponse.data);
    } catch (error) {
      showToast(
        "error",
        error.response?.data?.message || "Failed to verify OTP"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold mb-4 text-[#0f1c3f]">User Management</h1>

      {/* Add/Edit User Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogTrigger asChild>
          <Button className="mb-4 bg-[#d09d42] text-white hover:bg-[#0f1c3f] cursor-pointer">
            <UserPlus className="mr-2 h-4 w-4" /> Add User
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editUserId ? "Edit User" : "Add New User"}</DialogTitle>
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
                <div className="mt-2 space-y-1">
                  <div className="flex items-center">
                    {passwordValidations.minLength ? (
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500 mr-2" />
                    )}
                    <span className="text-sm">
                      Minimum 6 characters
                    </span>
                  </div>
                  <div className="flex items-center">
                    {passwordValidations.uppercase ? (
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500 mr-2" />
                    )}
                    <span className="text-sm">
                      At least one uppercase letter
                    </span>
                  </div>
                  <div className="flex items-center">
                    {passwordValidations.number ? (
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500 mr-2" />
                    )}
                    <span className="text-sm">
                      At least one number
                    </span>
                  </div>
                  <div className="flex items-center">
                    {passwordValidations.specialChar ? (
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500 mr-2" />
                    )}
                    <span className="text-sm">
                      At least one special character
                    </span>
                  </div>
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
              {isLoading
                ? "Saving..."
                : editUserId
                  ? "Update User"
                  : "Register User"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* OTP Verification Dialog */}
      <Dialog open={isOtpDialogOpen} onOpenChange={setIsOtpDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verify Email</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleOtpSubmit} className="space-y-4">
            <div>
              <Label htmlFor="otp">Enter OTP</Label>
              <Input
                id="otp"
                name="otp"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Verifying..." : "Verify OTP"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Confirm Deletion"
        message="Are you sure you want to delete this user? This action cannot be undone."
      />

      {/* Users Table */}
      <Card>
        <CardHeader className="text-[#d09d42] font-bold bg-[#0f1c3f] p-1 rounded">
          <CardTitle>Users</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone Number</TableHead>
                  <TableHead>Email Verified</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
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
                      <Button
                        variant="outline"
                        size="sm"
                        className="mr-2 cursor-pointer"
                        onClick={() => handleEdit(user)}
                      >
                        <Edit className="h-4 w-4 mr-1" /> Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mr-2  cursor-pointer"
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
                        className=" cursor-pointer"
                        onClick={() => handleViewDetails(user._id)}
                      >
                        <Eye className="h-4 w-4 mr-1" /> View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {selectedUserDetails && (
        <div ref={detailsRef} className="mt-8">
          <Card className="shadow-xl border border-gray-200">
            <CardHeader >
              <CardTitle className="flex items-center text-lg">
                <User className="mr-2 h-6 w-6" /> User Details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 max-h-[60vh] overflow-y-auto space-y-6">
              {/* User Information */}
              <div className="flex justify-between sm:flex flex-col ">
                {/* <h3 className="text-lg font-semibold mb-3 flex items-center text-gray-800">
                  <User className="mr-2 h-5 w-5 text-blue-500" /> Personal Information
                </h3> */}
                <ul className="space-y-2 bg-gray-50 p-4 rounded-lg flex flex-col gap-3 flex-1">
                  <li className="flex items-center">
                    <CreditCard className="h-4 w-4 text-blue-500 mr-2" />
                    <span><strong>Customer ID:</strong> {selectedUserDetails.user.customerId}</span>
                  </li>
                  <li className="flex items-center">
                    <User className="h-4 w-4 text-blue-500 mr-2" />
                    <span><strong>Username:</strong> {selectedUserDetails.user.username}</span>
                  </li>
                  <li className="flex items-center">
                    <Mail className="h-4 w-4 text-blue-500 mr-2" />
                    <span><strong>Email:</strong> {selectedUserDetails.user.email}</span>
                  </li>
                  <li className="flex items-center">
                    <Phone className="h-4 w-4 text-blue-500 mr-2" />
                    <span><strong>Phone Number:</strong> {selectedUserDetails.user.phone_number}</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-blue-500 mr-2" />
                    <span><strong>Email Verified:</strong> {selectedUserDetails.user.email_verified ? "Yes" : "No"}</span>
                  </li>
                  <li className="flex items-center">
                    <Shield className="h-4 w-4 text-blue-500 mr-2" />
                    <span><strong>Role:</strong> {selectedUserDetails.user.role_id?.role_name || "N/A"}</span>
                  </li>


                </ul>
                <ul className="space-y-2 bg-gray-50 p-4 rounded-lg flex flex-col gap-3 flex-1 ">
                  <li className="flex items-center">
                    <Key className="h-4 w-4 text-blue-500 mr-2" />
                    <span><strong>PAN Number:</strong> {selectedUserDetails.user.pan_number || "N/A"}</span>
                  </li>
                  <li className="flex items-center">
                    <Key className="h-4 w-4 text-blue-500 mr-2" />
                    <span><strong>Aadhar Number:</strong> {selectedUserDetails.user.aadhar_number || "N/A"}</span>
                  </li>
                  <li className="flex items-center">
                    <Code className="h-4 w-4 text-blue-500 mr-2" />
                    <span><strong>Referral Code:</strong> {selectedUserDetails.user.referral_code}</span>
                  </li>
                  <li className="flex items-center">
                    <Shield className="h-4 w-4 text-blue-500 mr-2" />
                    <span><strong>Verified by Admin:</strong> {selectedUserDetails.user.verified_by_admin ? "Yes" : "No"}</span>
                  </li>
                  <li className="flex items-center">
                    <User className="h-4 w-4 text-blue-500 mr-2" />
                    <span><strong>Referred By:</strong> {selectedUserDetails.user.referred_by || "N/A"}</span>
                  </li>
                  <li className="flex items-center">
                    <Calendar className="h-4 w-4 text-blue-500 mr-2" />
                    <span><strong>Created At:</strong> {new Date(selectedUserDetails.user.created_at).toLocaleString()}</span>
                  </li>
                </ul>
              </div>

              {/* Address Information */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center text-gray-800">
                  <Home className="mr-2 h-5 w-5 text-green-500" /> Address
                </h3>
                {selectedUserDetails.address ? (
                  <>
                    <div className="flex justify-between sm:flex flex-col">
                      <ul className="space-y-2 bg-gray-50 p-4 rounded-lg flex flex-1 flex-col gap-3">
                        <li className="flex items-center">
                          <MapPin className="h-4 w-4 text-green-500 mr-2" />
                          <span><strong>Address Line 1:</strong> {selectedUserDetails.address.address_line_1 || "N/A"}</span>
                        </li>
                        <li className="flex items-center">
                          <MapPin className="h-4 w-4 text-green-500 mr-2" />
                          <span><strong>Address Line 2:</strong> {selectedUserDetails.address.address_line_2 || "N/A"}</span>
                        </li>
                        <li className="flex items-center">
                          <Building className="h-4 w-4 text-green-500 mr-2" />
                          <span><strong>City:</strong> {selectedUserDetails.address.city || "N/A"}</span>
                        </li>

                      </ul>
                      <ul className="space-y-2 bg-gray-50 p-4 rounded-lg flex flex-1 flex-col gap-3">
                        <li className="flex items-center">
                          <MapPin className="h-4 w-4 text-green-500 mr-2" />
                          <span><strong>State:</strong> {selectedUserDetails.address.state || "N/A"}</span>
                        </li>
                        <li className="flex items-center">
                          <Flag className="h-4 w-4 text-green-500 mr-2" />
                          <span><strong>Country:</strong> {selectedUserDetails.address.country || "N/A"}</span>
                        </li>
                        <li className="flex items-center">
                          <MapPin className="h-4 w-4 text-green-500 mr-2" />
                          <span><strong>Pincode:</strong> {selectedUserDetails.address.pincode || "N/A"}</span>
                        </li>
                      </ul>
                    </div>
                  </>
                ) : (
                  <p className="text-gray-500 italic p-4">No address available</p>
                )}
              </div>

              {/* INR Account */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center text-gray-800">
                  <Wallet className="mr-2 h-5 w-5 text-yellow-500" /> INR Account
                </h3>
                {selectedUserDetails.inrAccount ? (


                  <>
                    <div className="flex justify-between sm:flex flex-col">
                      <ul className="space-y-2 bg-gray-50 p-4 rounded-lg flex flex-1 flex-col gap-3">
                        <li className="flex items-center">
                          <Building className="h-4 w-4 text-yellow-500 mr-2" />
                          <span><strong>Bank Name:</strong> {selectedUserDetails.inrAccount.bank_name || "N/A"}</span>
                        </li>
                        <li className="flex items-center">
                          <Code className="h-4 w-4 text-yellow-500 mr-2" />
                          <span><strong>IFSC Code:</strong> {selectedUserDetails.inrAccount.ifsc_code || "N/A"}</span>
                        </li>
                        <li className="flex items-center">
                          <User className="h-4 w-4 text-yellow-500 mr-2" />
                          <span><strong>Account Holder:</strong> {selectedUserDetails.inrAccount.account_holder_name || "N/A"}</span>
                        </li>
                        <li className="flex items-center">
                          <CreditCard className="h-4 w-4 text-yellow-500 mr-2" />
                          <span><strong>Account Number:</strong> {selectedUserDetails.inrAccount.account_number || "N/A"}</span>
                        </li>

                      </ul>
                      <ul className="space-y-2 bg-gray-50 p-4 rounded-lg flex flex-1 flex-col gap-3">
                        <li className="flex items-center">
                          <Phone className="h-4 w-4 text-yellow-500 mr-2" />
                          <span><strong>Linked Phone:</strong> {selectedUserDetails.inrAccount.linked_phone_number || "N/A"}</span>
                        </li>
                        <li className="flex items-center">
                          <DollarSign className="h-4 w-4 text-yellow-500 mr-2" />
                          <span><strong>UPI ID:</strong> {selectedUserDetails.inrAccount.upi_id || "N/A"}</span>
                        </li>
                        <li className="flex items-center">
                          <Phone className="h-4 w-4 text-yellow-500 mr-2" />
                          <span><strong>UPI Number:</strong> {selectedUserDetails.inrAccount.upi_number || "N/A"}</span>
                        </li>
                        {selectedUserDetails.inrAccount.qrcode && (
                          <li className="flex items-center">
                            <img
                              src={selectedUserDetails.inrAccount.qrcode}
                              alt="INR QR Code"
                              className="w-32 h-32 mt-2 rounded-lg shadow-sm"
                            />
                          </li>
                        )}
                      </ul>
                    </div>
                  </>
                ) : (
                  <p className="text-gray-500 italic p-4">No INR account available</p>
                )}
              </div>

              {/* USDT Account */}
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center text-gray-800">
                  <Globe className="mr-2 h-5 w-5 text-purple-500" /> USDT Account
                </h3>
                {selectedUserDetails.usdtAccount ? (


                  <>
                    <div className="flex justify-between">
                      <ul className="space-y-2 bg-gray-50 p-4 rounded-lg flex flex-1 flex-col gap-3">
                        <li className="flex items-center">
                          <Building className="h-4 w-4 text-purple-500 mr-2" />
                          <span><strong>Bank Name:</strong> {selectedUserDetails.usdtAccount.bank_name || "N/A"}</span>
                        </li>
                        <li className="flex items-center">
                          <Code className="h-4 w-4 text-purple-500 mr-2" />
                          <span><strong>IFSC Code:</strong> {selectedUserDetails.usdtAccount.ifsc_code || "N/A"}</span>
                        </li>
                        <li className="flex items-center">
                          <User className="h-4 w-4 text-purple-500 mr-2" />
                          <span><strong>Account Holder:</strong> {selectedUserDetails.usdtAccount.account_holder_name || "N/A"}</span>
                        </li>
                        <li className="flex items-center">
                          <CreditCard className="h-4 w-4 text-purple-500 mr-2" />
                          <span><strong>Account Number:</strong> {selectedUserDetails.usdtAccount.account_number || "N/A"}</span>
                        </li>


                      </ul>
                      <ul className="space-y-2 bg-gray-50 p-4 rounded-lg flex flex-1 flex-col gap-3">
                        <li className="flex items-center">
                          <Phone className="h-4 w-4 text-purple-500 mr-2" />
                          <span><strong>Linked Phone:</strong> {selectedUserDetails.usdtAccount.linked_phone_number || "N/A"}</span>
                        </li>
                        <li className="flex items-center">
                          <DollarSign className="h-4 w-4 text-purple-500 mr-2" />
                          <span><strong>UPI ID:</strong> {selectedUserDetails.usdtAccount.upi_id || "N/A"}</span>
                        </li>
                        <li className="flex items-center">
                          <Phone className="h-4 w-4 text-purple-500 mr-2" />
                          <span><strong>UPI Number:</strong> {selectedUserDetails.usdtAccount.upi_number || "N/A"}</span>
                        </li>
                        {selectedUserDetails.usdtAccount.qrcode && (
                          <li className="flex items-center">
                            <img
                              src={selectedUserDetails.usdtAccount.qrcode}
                              alt="USDT QR Code"
                              className="w-32 h-32 mt-2 rounded-lg shadow-sm"
                            />
                          </li>
                        )}
                      </ul>
                    </div>
                  </>
                ) : (
                  <p className="text-gray-500 italic p-4">No USDT account available</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AdminUserManagement;