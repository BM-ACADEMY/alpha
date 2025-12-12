import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Pencil, Trash2 } from "lucide-react";
import axiosInstance from "@/modules/common/lib/axios";
import ConfirmationDialog from "@/modules/common/reusable/ConfirmationDialog";
import { showToast } from "@/modules/common/toast/customToast";

// -------------------------------------------------
// Validation schema
// -------------------------------------------------
const formSchema = z.object({
  category: z.string().min(1, { message: "Please select a plan" }),
  amount_type: z.enum(["INR", "USDT"]),
  profit_percentage: z.string().refine(
    (val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0,
    { message: "Must be a valid positive number" }
  ),
  withdrawal_percentage: z.string().refine(
    (val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0,
    { message: "Must be a valid positive number" }
  ),
  platform_percentage: z.string().refine(
    (val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0,
    { message: "Must be a valid positive number" }
  ),
});

const PercentageManager = () => {
  // -----------------------------------------------------------------
  // State
  // -----------------------------------------------------------------
  const [percentages, setPercentages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Plans
  const [plans, setPlans] = useState([]);
  const [filteredPlans, setFilteredPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [isPlansReady, setIsPlansReady] = useState(false);

  // Pending edit payload
  const [pendingEdit, setPendingEdit] = useState(null);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      category: "",
      amount_type: "INR",
      profit_percentage: "",
      withdrawal_percentage: "",
      platform_percentage: "",
    },
  });

  // -----------------------------------------------------------------
  // Fetch percentages
  // -----------------------------------------------------------------
  const fetchPercentages = async () => {
    try {
      setIsLoading(true);
      const { data } = await axiosInstance.get("/percentages/fetch-all-percentages");
      setPercentages(data);
    } catch (error) {
      showToast(
        "error",
        `Failed to fetch percentages: ${error.response?.data?.message || error.message}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  // -----------------------------------------------------------------
  // Fetch plans
  // -----------------------------------------------------------------
  const fetchPlans = async () => {
    try {
      setPlansLoading(true);
      const { data } = await axiosInstance.get("/plans");
      setPlans(data);
    } catch (error) {
      showToast(
        "error",
        `Failed to load plans: ${error.response?.data?.message || error.message}`
      );
    } finally {
      setPlansLoading(false);
    }
  };

  // -----------------------------------------------------------------
  // Filter plans when amount_type changes
  // -----------------------------------------------------------------
  useEffect(() => {
    const amt = form.watch("amount_type");
    if (!amt) {
      setFilteredPlans([]);
      setIsPlansReady(false);
      return;
    }
    const filtered = plans.filter((p) => p.amount_type === amt);
    setFilteredPlans(filtered);
    setIsPlansReady(true);
  }, [form.watch("amount_type"), plans]);

  // -----------------------------------------------------------------
  // Reset category when amount_type changes
  // -----------------------------------------------------------------
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "amount_type") {
        form.setValue("category", "");
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  // -----------------------------------------------------------------
  // Apply pending edit – safely
  // -----------------------------------------------------------------
  useEffect(() => {
    if (!pendingEdit || !isPlansReady) return;

    const { id, category, profit, withdrawal, platform } = pendingEdit;

    // Normalize for comparison
    const savedPlanName = category.trim().toLowerCase();
    const planExists = filteredPlans.some(
      (p) => p.plan_name.trim().toLowerCase() === savedPlanName
    );

    // Always set the saved category (plan name)
    form.setValue("category", category);

    // Set other fields
    form.setValue("profit_percentage", profit);
    form.setValue("withdrawal_percentage", withdrawal);
    form.setValue("platform_percentage", platform);
    setEditingId(id);

    // Only warn if plan is truly missing
    if (!planExists) {
      showToast(
        "warning",
        `The saved plan "${category}" is not available for ${form.getValues(
          "amount_type"
        )}. You can select a different one.`
      );
    }

    setPendingEdit(null);
  }, [pendingEdit, isPlansReady, filteredPlans, form]);

  // -----------------------------------------------------------------
  // Submit (create / update)
  // -----------------------------------------------------------------
  const onSubmit = async (values) => {
    try {
      setIsSubmitting(true);
      const payload = {
        ...values,
        profit_percentage: parseFloat(values.profit_percentage),
        withdrawal_percentage: parseFloat(values.withdrawal_percentage),
        platform_percentage: parseFloat(values.platform_percentage),
      };

      if (editingId) {
        await axiosInstance.put(`/percentages/update-percentage/${editingId}`, payload);
        showToast("Success", "Percentage updated successfully");
        setEditingId(null);
      } else {
        await axiosInstance.post("/percentages/add-percentage", payload);
        showToast("Success", "Percentage created successfully");
      }

      const keepAmt = form.getValues("amount_type");
      form.reset({
        category: "",
        amount_type: keepAmt,
        profit_percentage: "",
        withdrawal_percentage: "",
        platform_percentage: "",
      });

      fetchPercentages();
    } catch (error) {
      showToast(
        "Error",
        `${error.response?.data?.message || "Operation failed"}`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // -----------------------------------------------------------------
  // EDIT – reliable
  // -----------------------------------------------------------------
  const handleEdit = async (id) => {
    try {
      const { data: percentage } = await axiosInstance.get(
        `/percentages/fetch-percentage-by-id/${id}`
      );

      // 1. Set amount_type → triggers filteredPlans
      form.setValue("amount_type", percentage.amount_type);

      // 2. Store rest → applied after dropdown is ready
      setPendingEdit({
        id,
        category: percentage.category, // e.g., "basic"
        profit: percentage.profit_percentage.$numberDecimal.toString(),
        withdrawal: percentage.withdrawal_percentage.$numberDecimal.toString(),
        platform: percentage.platform_percentage.$numberDecimal.toString(),
      });
    } catch (error) {
      showToast(
        "Error",
        `Failed to fetch percentage data: ${error.response?.data?.message || error.message}`
      );
    }
  };

  // -----------------------------------------------------------------
  // DELETE
  // -----------------------------------------------------------------
  const handleDelete = async () => {
    try {
      await axiosInstance.delete(`/percentages/delete-percentage/${deleteId}`);
      showToast("Success", "Percentage deleted successfully");
      fetchPercentages();
    } catch (error) {
      showToast(
        "Error",
        `${error.response?.data?.message || "Deletion failed"}`
      );
    } finally {
      setIsDialogOpen(false);
      setDeleteId(null);
    }
  };

  const openDeleteDialog = (id) => {
    setDeleteId(id);
    setIsDialogOpen(true);
  };

  // -----------------------------------------------------------------
  // Initial load
  // -----------------------------------------------------------------
  useEffect(() => {
    fetchPercentages();
    fetchPlans();
  }, []);

  // -----------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------
  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* ==================== FORM CARD ==================== */}
      <Card className="mb-8 shadow-lg">
        <CardHeader className="text-[#d09d42] font-bold bg-[#0f1c3f] p-1 rounded">
          <CardTitle>
            {editingId ? "Edit Percentage" : "Create Percentage"}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* ----- Amount Type ----- */}
                <FormField
                  control={form.control}
                  name="amount_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select amount type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="INR">INR</SelectItem>
                          <SelectItem value="USDT">USDT</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* ----- Dynamic Category (Plan) ----- */}
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category (Plan)</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={plansLoading || !isPlansReady}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue
                              placeholder={
                                plansLoading
                                  ? "Loading plans..."
                                  : !isPlansReady
                                  ? "Select Amount Type first"
                                  : "Select a plan"
                              }
                            />
                          </SelectTrigger>
                        </FormControl>

                        <SelectContent>
                          {filteredPlans?.map((plan) => {
                            const label = `${plan.amount_type} - ${plan.plan_name}`;
                            return (
                              <SelectItem key={plan._id} value={plan.plan_name}>
                                {label}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* ----- Profit % ----- */}
                <FormField
                  control={form.control}
                  name="profit_percentage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Profit Percentage</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Enter profit percentage"
                          step="0.01"
                          className="w-full"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* ----- Withdrawal % ----- */}
                <FormField
                  control={form.control}
                  name="withdrawal_percentage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Withdrawal Percentage</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Enter withdrawal percentage"
                          step="0.01"
                          className="w-full"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* ----- Platform % ----- */}
                <FormField
                  control={form.control}
                  name="platform_percentage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Platform Percentage</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Enter platform percentage"
                          step="0.01"
                          className="w-full"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* ----- Responsive Buttons ----- */}
              <div className="flex flex-col sm:flex-row gap-3 mt-4">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-[#d09d42] flex-1 text-white hover:bg-[#0f1c3f]"
                >
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingId ? "Update Percentage" : "Create Percentage"}
                </Button>

                {editingId && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const keepAmt = form.getValues("amount_type");
                      form.reset({
                        category: "",
                        amount_type: keepAmt,
                        profit_percentage: "",
                        withdrawal_percentage: "",
                        platform_percentage: "",
                      });
                      setEditingId(null);
                    }}
                    className="flex-1 border-gray-300"
                  >
                    Cancel Edit
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* ==================== LIST CARD ==================== */}
      <Card className="shadow-lg">
        <CardHeader className="text-[#d09d42] font-bold bg-[#0f1c3f] p-1 rounded">
          <CardTitle>Percentages List</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex justify-center items-center h-32">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : percentages.length === 0 ? (
            <div className="text-center text-gray-500 py-4">
              No percentages found. Create one to get started.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-semibold text-gray-700">Category</TableHead>
                    <TableHead className="font-semibold text-gray-700">Amount Type</TableHead>
                    <TableHead className="font-semibold text-gray-700">Profit %</TableHead>
                    <TableHead className="font-semibold text-gray-700">Withdrawal %</TableHead>
                    <TableHead className="font-semibold text-gray-700">Platform %</TableHead>
                    <TableHead className="font-semibold text-gray-700">Actions</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {percentages?.map((percentage) => (
                    <TableRow
                      key={percentage._id}
                      className="hover:bg-gray-100 transition-colors duration-200"
                    >
                      <TableCell
                        className={`font-medium capitalize ${
                          percentage.category.toLowerCase().includes("starter")
                            ? "text-green-600"
                            : percentage.category.toLowerCase().includes("advanced")
                            ? "text-blue-600"
                            : percentage.category.toLowerCase().includes("premium")
                            ? "text-yellow-600"
                            : percentage.category.toLowerCase().includes("elite")
                            ? "text-purple-600"
                            : "text-gray-600"
                        }`}
                      >
                        {percentage.category}
                      </TableCell>

                      <TableCell
                        className={
                          percentage.amount_type === "INR"
                            ? "text-green-600 font-semibold"
                            : "text-blue-600 font-semibold"
                        }
                      >
                        {percentage.amount_type}
                      </TableCell>

                      <TableCell>
                        {percentage.profit_percentage.$numberDecimal.toString()}
                      </TableCell>
                      <TableCell>
                        {percentage.withdrawal_percentage.$numberDecimal.toString()}
                      </TableCell>
                      <TableCell>
                        {percentage.platform_percentage.$numberDecimal.toString()}
                      </TableCell>

                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleEdit(percentage._id)}
                            className="text-blue-600 hover:text-blue-800 border-blue-300"
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => openDeleteDialog(percentage._id)}
                            className="text-red-600 hover:text-red-800 border-red-300"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ==================== DELETE DIALOG ==================== */}
      <ConfirmationDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onConfirm={handleDelete}
        title="Confirm Deletion"
        message="Are you sure you want to delete this percentage? This action cannot be undone."
      />
    </div>
  );
};

export default PercentageManager;
