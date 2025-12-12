import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import axiosInstance from "@/modules/common/lib/axios";
import { showToast } from "@/modules/common/toast/customToast";

export default function UserVerificationTabs() {
  const [notVerifiedUsers, setNotVerifiedUsers] = useState([]);
  const [verifiedUsers, setVerifiedUsers] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [dialogType, setDialogType] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get("/users/fetch-all-users-details", {
          withCredentials: true,
        });
        const users = response.data;
        setNotVerifiedUsers(users.filter((u) => !u.verified_by_admin));
        setVerifiedUsers(users.filter((u) => u.verified_by_admin));
      } catch (error) {
        console.error("Fetch users error:", error);
        showToast("error", error.response?.data?.message || "Failed to fetch users");
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const handleVerify = (user) => {
    setSelectedUser(user);
    setDialogType("verify");
    setOpenDialog(true);
  };

  const handleUnverify = (user) => {
    setSelectedUser(user);
    setDialogType("unverify");
    setOpenDialog(true);
  };

  const handleViewKYC = (user) => {
    setSelectedUser(user);
    setDialogType("view");
    setOpenDialog(true);
  };

  const confirmAction = async () => {
    if (!selectedUser) return;

    try {
      const updatedStatus = dialogType === "verify" ? true : false;
      const response = await axiosInstance.patch(
        `/users/${selectedUser._id}`,
        { verified_by_admin: updatedStatus },
        { withCredentials: true }
      );

      if (response.status === 200) {
        if (dialogType === "verify") {
          setNotVerifiedUsers(notVerifiedUsers.filter((u) => u._id !== selectedUser._id));
          setVerifiedUsers([...verifiedUsers, { ...selectedUser, verified_by_admin: true }]);
          showToast("success", `${selectedUser.username} verified successfully`);
        } else if (dialogType === "unverify") {
          setVerifiedUsers(verifiedUsers.filter((u) => u._id !== selectedUser._id));
          setNotVerifiedUsers([...notVerifiedUsers, { ...selectedUser, verified_by_admin: false }]);
          showToast("success", `${selectedUser.username} unverified successfully`);
        }
      }
    } catch (error) {
      console.error(`${dialogType} error:`, error);
      showToast("error", error.response?.data?.message || `Failed to ${dialogType} user`);
    } finally {
      setOpenDialog(false);
      setSelectedUser(null);
      setDialogType("");
    }
  };

  const renderKYCDetails = () => {
    if (!selectedUser) return null;
    return (
      <div className="space-y-4">
        <div>
          <strong>PAN Number:</strong> {selectedUser.pan_number || "Not provided"}
        </div>
        <div>
          <strong>Aadhar Number:</strong> {selectedUser.aadhar_number || "Not provided"}
        </div>
        {selectedUser.pan_image && (
          <div>
            <strong>PAN Image:</strong>
            <img
              src={selectedUser.pan_image}
              alt="PAN Image"
              className="w-64 h-40 object-contain border rounded mt-2"
              onError={(e) => {
                e.target.alt = "Failed to load PAN image";
                e.target.src = "/placeholder-image.png";
              }}
            />
          </div>
        )}
        {selectedUser.aadhar_image && (
          <div>
            <strong>Aadhar Image:</strong>
            <img
              src={selectedUser.aadhar_image}
              alt="Aadhar Image"
              className="w-64 h-40 object-contain border rounded mt-2"
              onError={(e) => {
                e.target.alt = "Failed to load Aadhar image";
                e.target.src = "/placeholder-image.png";
              }}
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-6">
      {loading && <p className="text-center">Loading users...</p>}
      <Tabs defaultValue="notVerified" className="w-full">
        <TabsList className="flex justify-center space-x-4 w-fit mx-auto">
          <TabsTrigger value="notVerified" className="px-4 py-1 text-sm">
            Not Verified Users
          </TabsTrigger>
          <TabsTrigger value="verified" className="px-4 py-1 text-sm">
            Verified Users
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notVerified">
          <div className="mt-4 border rounded-lg shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>S.No</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>PAN Number</TableHead>
                  <TableHead>Aadhar Number</TableHead>
                  <TableHead>KYC Details</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {notVerifiedUsers.length > 0 ? (
                  notVerifiedUsers?.map((user, index) => (
                    <TableRow key={user._id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{user.username}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.pan_number || "Not provided"}</TableCell>
                      <TableCell>{user.aadhar_number || "Not provided"}</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewKYC(user)}
                          disabled={!user.pan_image && !user.aadhar_image}
                        >
                          View KYC
                        </Button>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleVerify(user)}
                        >
                          Verify
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">
                      No Not Verified Users
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="verified">
          <div className="mt-4 border rounded-lg shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>S.No</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>PAN Number</TableHead>
                  <TableHead>Aadhar Number</TableHead>
                  <TableHead>KYC Details</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {verifiedUsers.length > 0 ? (
                  verifiedUsers?.map((user, index) => (
                    <TableRow key={user._id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{user.username}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.pan_number || "Not provided"}</TableCell>
                      <TableCell>{user.aadhar_number || "Not provided"}</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewKYC(user)}
                          disabled={!user.pan_image && !user.aadhar_image}
                        >
                          View KYC
                        </Button>
                      </TableCell>
                      <TableCell className="flex items-center gap-5">
                        <span className="text-green-600 font-semibold">Verified</span>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleUnverify(user)}
                        >
                          Unverify
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">
                      No Verified Users
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogType === "view"
                ? "KYC Details"
                : dialogType === "verify"
                ? "Verify User"
                : "Unverify User"}
            </DialogTitle>
          </DialogHeader>
          {dialogType === "view" ? (
            renderKYCDetails()
          ) : (
            <p>
              Are you sure you want to{" "}
              <span className="font-semibold">
                {dialogType === "verify" ? "verify" : "unverify"}
              </span>{" "}
              <span className="font-semibold">{selectedUser?.username}</span>?
            </p>
          )}
          {dialogType !== "view" && (
            <DialogFooter className="mt-4 flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setOpenDialog(false)}>
                Cancel
              </Button>
              <Button
                variant={dialogType === "verify" ? "default" : "destructive"}
                onClick={confirmAction}
              >
                Yes, {dialogType === "verify" ? "Verify" : "Unverify"}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
