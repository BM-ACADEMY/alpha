// src/modules/admin/pages/referrals/referral.jsx
import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Search, Users } from "lucide-react";

const API_URL = `${import.meta.env.VITE_BASE_URL}/users/all-referred-users`;

export default function Referral() {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    pages: 1,
    limit: 15,
  });
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  // Fetch users with current page & search
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(API_URL, {
        params: { page: pagination.page, limit: 15, search: search.trim() },
        withCredentials: true,
      });

      console.log("API Response:", res.data); // Debug

      setUsers(res.data.users || []);
      setPagination(res.data.pagination || pagination);
    } catch (err) {
      console.error("Fetch error:", err.response?.data || err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, search]);

  // Debounce search and page changes
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 400);

    return () => clearTimeout(timer);
  }, [fetchUsers]);

  // Handle page change
  const goToPage = (page) => {
    if (page >= 1 && page <= pagination.pages) {
      setPagination((prev) => ({ ...prev, page }));
    }
  };

  // Handle search input
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearch(value);
    setPagination((prev) => ({ ...prev, page: 1 })); // Reset to page 1
  };

  // Render pagination numbers (up to 5 visible)
  const renderPageNumbers = () => {
    const pageNumbers = [];
    const totalPages = pagination.pages;
    const currentPage = pagination.page;

    let startPage = 1;
    let endPage = totalPages;

    if (totalPages > 5) {
      if (currentPage <= 3) {
        endPage = 5;
      } else if (currentPage >= totalPages - 2) {
        startPage = totalPages - 4;
      } else {
        startPage = currentPage - 2;
        endPage = currentPage + 2;
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(
        <PaginationItem key={i}>
          <PaginationLink
            onClick={() => goToPage(i)}
            isActive={currentPage === i}
            className="cursor-pointer"
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }

    return pageNumbers;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="w-6 h-6" /> Referral Dashboard
          </h1>
          <p className="text-muted-foreground">
            Users who joined via referral link
          </p>
        </div>
        <Badge variant="secondary" className="text-lg px-3 py-1">
          {pagination.total} Referred
        </Badge>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          placeholder="Search username, email, phone, code..."
          value={search}
          onChange={handleSearchChange}
          className="pl-10"
        />
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">#</TableHead>
              <TableHead>Customer ID</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Referred By</TableHead>
              <TableHead>Code</TableHead>
              <TableHead className="text-right">Joined</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading ? (
              // Loading Skeleton
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 8 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : users.length === 0 ? (
              // Empty State
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center py-12 text-muted-foreground text-lg"
                >
                  No users have joined via referral yet.
                  <br />
                  <span className="text-sm">
                    Try registering a user with a referral code.
                  </span>
                </TableCell>
              </TableRow>
            ) : (
              // Data Rows
              users.map((user, index) => {
                const serialNumber =
                  (pagination.page - 1) * pagination.limit + index + 1;

                return (
                  <TableRow key={user._id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{serialNumber}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {user.customerId}
                    </TableCell>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.phone_number}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {user.referred_by?.username || "Unknown"}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {user.referral_code}
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {new Date(user.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => goToPage(pagination.page - 1)}
                className={
                  pagination.page === 1
                    ? "opacity-50 pointer-events-none"
                    : "cursor-pointer"
                }
              />
            </PaginationItem>

            {renderPageNumbers()}

            <PaginationItem>
              <PaginationNext
                onClick={() => goToPage(pagination.page + 1)}
                className={
                  pagination.page === pagination.pages
                    ? "opacity-50 pointer-events-none"
                    : "cursor-pointer"
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}