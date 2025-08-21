import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Loader2, Plus, Edit, Trash2 } from "lucide-react";
import axiosInstance from "@/modules/common/lib/axios";
import ConfirmationDialog from "@/modules/common/reusable/ConfirmationDialog";
import { showToast } from "@/modules/common/toast/customToast";

const formSchema = z.object({
  plan_name: z.string().min(1, "Plan name is required"),
  profit_withdrawal: z.enum(["daily", "weekly", "monthly"]),
  amount_type: z.enum(["INR", "USDT"]),
  min_investment: z
    .string()
    .min(1, "Minimum investment is required")
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, {
      message: "Must be a valid positive number",
    }),
  capital_lockin: z
    .string()
    .min(1, "Capital lock-in is required")
    .refine((val) => !isNaN(parseInt(val)) && parseInt(val) >= 0, {
      message: "Must be a valid positive integer",
    }),
  profit_percentage: z
    .string()
    .min(1, "Profit percentage is required")
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, {
      message: "Must be a valid positive number",
    }),
  profit_percentage_day_week_month: z
    .string()
    .min(1, "Profit amount is required")
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, {
      message: "Must be a valid positive number",
    }),
  total_return_percentage: z
    .string()
    .min(1, "Total return percentage is required")
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, {
      message: "Must be a valid positive number",
    }),
  notes: z.string().optional(),
});

const PlanManagement = () => {
  const [plans, setPlans] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState(null);
  const [profitPercentageFromBackend, setProfitPercentageFromBackend] = useState(null);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      plan_name: "",
      profit_withdrawal: "daily",
      amount_type: "INR",
      min_investment: "",
      capital_lockin: "",
      profit_percentage: "",
      profit_percentage_day_week_month: "",
      total_return_percentage: "",
      notes: "",
    },
    mode: "onChange",
  });

  const { watch, setValue } = form;
  const minInvestment = watch("min_investment");
  const profitWithdrawal = watch("profit_withdrawal");
  const profitPercentage = watch("profit_percentage");
  const capitalLockin = watch('capital_lockin');

  // Fetch profit percentage from backend
  const fetchProfitPercentage = async (amountType) => {
    try {
      const response = await axiosInstance.get("/percentages/fetch-all-percentages");
      const percentageData = response.data.find((p) => p.amount_type === amountType && p.category === "starter");
      if (percentageData) {
        setProfitPercentageFromBackend(percentageData.profit_percentage.$numberDecimal.toString());
        setValue("profit_percentage", percentageData.profit_percentage.$numberDecimal.toString());
      }
    } catch (error) {
      showToast("error", `Failed to fetch profit percentage: ${error}`);
    }
  };


  useEffect(() => {
    if (minInvestment && profitPercentage && profitWithdrawal) {
      const minInvestmentNum = parseFloat(minInvestment);
      const profitPercentageNum = parseFloat(profitPercentage);

      // total profit
      const totalProfit = (minInvestmentNum * profitPercentageNum) / 100;

      // profit per day
      const dailyProfit = totalProfit / capitalLockin;

      let profitAmount = 0;

      if (profitWithdrawal === "daily") {
        profitAmount = dailyProfit; // 12.5
      } else if (profitWithdrawal === "weekly") {
        profitAmount = dailyProfit * 7; // 87.5
      } else if (profitWithdrawal === "monthly") {
        // get current date
        const now = new Date();
        const nextMonth = new Date(now);
        nextMonth.setMonth(nextMonth.getMonth() + 1);

        // get days between current date and same date next month
        const diffTime = Math.abs(nextMonth - now);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        profitAmount = dailyProfit * diffDays;
      }

      const totalReturn = minInvestmentNum + totalProfit;

      setValue("profit_percentage_day_week_month", profitAmount.toFixed(2));
      setValue("total_return_percentage", totalReturn.toFixed(2));
    }
  }, [minInvestment, profitPercentage, profitWithdrawal, capitalLockin, setValue]);



  // Fetch plans
  const fetchPlans = async () => {
    try {
      setLoading(true);
      const { data } = await axiosInstance.get("/plans");
      setPlans(data);
    } catch (err) {
      showToast("error", `Failed to fetch plans: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle form submission
  const onSubmit = async (values) => {
    setLoading(true);
    try {
      const payload = {
        ...values,
        min_investment: parseFloat(values.min_investment),
        capital_lockin: parseInt(values.capital_lockin),
        profit_percentage: parseFloat(values.profit_percentage),
        profit_percentage_day_week_month: parseFloat(values.profit_percentage_day_week_month),
        total_return_percentage: parseFloat(values.total_return_percentage),
      };

      if (editingId) {
        await axiosInstance.put(`/plans/${editingId}`, payload);
        showToast("Success", "Plan updated successfully");
        form.reset({
          plan_name: "",
          profit_withdrawal: "daily",
          amount_type: "INR",
          min_investment: "",
          capital_lockin: "",
          profit_percentage: "",
          profit_percentage_day_week_month: "",
          total_return_percentage: "",
          notes: "",
        })
      } else {
        await axiosInstance.post("/plans", payload);
        showToast("Success", "Plan created successfully");
             form.reset({
          plan_name: "",
          profit_withdrawal: "daily",
          amount_type: "INR",
          min_investment: "",
          capital_lockin: "",
          profit_percentage: "",
          profit_percentage_day_week_month: "",
          total_return_percentage: "",
          notes: "",
        })
      }
      form.reset();
      setEditingId(null);
      fetchPlans();
    } catch (err) {
      showToast("Error", `${err.response?.data?.message || "Operation failed"}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle edit
  const handleEdit = async (plan) => {
    try {
      const flattenedPlan = {
        plan_name: plan.plan_name,
        profit_withdrawal: plan.profit_withdrawal,
        amount_type: plan.amount_type,
        min_investment: plan.min_investment?.$numberDecimal?.toString() || "",
        capital_lockin: plan.capital_lockin?.toString() || "",
        profit_percentage: plan.profit_percentage?.$numberDecimal?.toString() || "",
        profit_percentage_day_week_month: plan.profit_percentage_day_week_month?.$numberDecimal?.toString() || "",
        total_return_percentage: plan.total_return_percentage?.$numberDecimal?.toString() || "",
        notes: plan.notes || "",
      };
      form.reset(flattenedPlan);
      setEditingId(plan._id);
      await fetchProfitPercentage(plan.amount_type);
    } catch (error) {
      showToast("Error", `Failed to fetch plan data: ${error}`);
    }
  };

  // Handle delete
  const handleDeleteClick = (id) => {
    setPlanToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    setLoading(true);
    try {
      await axiosInstance.delete(`/plans/${planToDelete}`);
      showToast("Success", "Plan deleted successfully");
      fetchPlans();
    } catch (err) {
      showToast("Error", `${err.response?.data?.message || "Deletion failed"}`);
    } finally {
      setLoading(false);
      setDeleteDialogOpen(false);
      setPlanToDelete(null);
    }
  };

  // Fetch profit percentage when amount_type changes
  useEffect(() => {
    const amountType = form.watch("amount_type");
    if (amountType) {
      fetchProfitPercentage(amountType);
    }
  }, [form.watch("amount_type")]);

  useEffect(() => {
    fetchPlans();
  }, []);

  return (
    <div className="p-6 min-h-screen max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-[#0F1C3F]">Manage Plans</h1>

      <Card className="mb-8 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardTitle className="text-2xl font-semibold">
            {editingId ? "Edit Plan" : "Create Plan"}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="plan_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Plan Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter plan name"
                          {...field}
                          disabled={loading}
                          className="w-full"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="profit_withdrawal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Profit Withdrawal</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={loading}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select withdrawal" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="amount_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={loading}
                      >
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
                <FormField
                  control={form.control}
                  name="min_investment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Minimum Investment</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Enter investment amount"
                          step="0.01"
                          {...field}
                          disabled={loading}
                          className="w-full"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="capital_lockin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Capital Lock-in (days)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Enter duration"
                          {...field}
                          disabled={loading}
                          className="w-full"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="profit_percentage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Profit Percentage</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Profit percentage (from backend)"
                          step="0.01"
                          {...field}
                          disabled={true}
                          className="w-full bg-gray-100"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="profit_percentage_day_week_month"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {profitWithdrawal === "daily"
                          ? "Daily Profit Amount"
                          : profitWithdrawal === "weekly"
                            ? "Weekly Profit Amount"
                            : "Monthly Profit Amount"}
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Calculated profit amount"
                          step="0.01"
                          {...field}
                          disabled={true}
                          className="w-full bg-gray-100"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="total_return_percentage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Return</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Calculated total return"
                          step="0.01"
                          {...field}
                          disabled={true}
                          className="w-full bg-gray-100"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter notes"
                          {...field}
                          disabled={loading}
                          className="w-full"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="col-span-1 md:col-span-2">
                <Button
                  type="submit"
                  disabled={!form.formState.isValid || loading}
                   className="bg-[#0F1C3F] hover:bg-[#5B9BD5] text-white w-full cursor-pointer"
                >
                  {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : editingId ? (
                    <Edit className="mr-2 h-4 w-4" />
                  ) : (
                    <Plus className="mr-2 h-4 w-4" />
                  )}
                  {editingId ? "Update" : "Add"} Plan
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardTitle className="text-2xl font-semibold">Existing Plans</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : plans.length === 0 ? (
            <div className="text-center text-gray-500 py-4">
              No plans found. Create one to get started.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {plans.map((plan) => {
                const features = [
                  `Amount Type: ${plan.amount_type}`,
                  `Min Investment: ${plan.min_investment?.$numberDecimal || "N/A"} ${plan.amount_type}`,
                  `Capital Lock-in: ${plan.capital_lockin} days`,
                  `Profit Withdrawal: ${plan.profit_withdrawal}`,
                  `Profit Percentage: ${plan.profit_percentage?.$numberDecimal || "N/A"}%`,
                  `Profit Amount: ${plan.profit_percentage_day_week_month?.$numberDecimal || "N/A"} ${plan.amount_type}`,
                  `Total Return: ${plan.total_return_percentage?.$numberDecimal || "N/A"} ${plan.amount_type}`,
                ];
                return (
                  <Card key={plan._id} className="border border-gray-200 rounded-lg">
                    <CardHeader>
                      <CardTitle className="text-2xl font-bold">{plan.plan_name}</CardTitle>
                      <p className="text-gray-600 text-sm">{plan.notes || "Perfect for growing businesses"}</p>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold mb-4">
                        {plan.min_investment?.$numberDecimal || "N/A"} {plan.amount_type}
                      </p>
                      <ul className="mb-4 space-y-2 list-none">
                        {features.map((feature, index) => (
                          <li key={index} className="flex items-center text-gray-700">
                            <span className="mr-2 text-blue-600">✓</span>
                            {feature}
                          </li>
                        ))}
                      </ul>
                      <div className="mt-4 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                        <Button
                          variant="outline"
                          onClick={() => handleEdit(plan)}
                          className="flex-1 border-blue-300 text-blue-600 hover:bg-blue-600 hover:text-white"
                        >
                          <Edit className="h-4 w-4 mr-2" /> Edit
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => handleDeleteClick(plan._id)}
                          className="flex-1 bg-red-600 hover:bg-red-700"
                        >
                          <Trash2 className="h-4 w-4 mr-2" /> Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmationDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Confirm Deletion"
        message="Are you sure you want to delete this plan?"
      />
    </div>
  );
};

export default PlanManagement;