import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Layers, 
  DollarSign, 
  Lock, 
  RefreshCcw, 
  Percent, 
  TrendingUp, 
  FileText 
} from "lucide-react";
import PlanPurchase from './PlanPurchase';

const iconColor = "#c7a453";

const Plans = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPurchase, setShowPurchase] = useState(false);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_BASE_URL}/plans`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        if (!response.ok) throw new Error('Failed to fetch plans');
        const data = await response.json();
        setPlans(data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };
    fetchPlans();
  }, []);

  const formatDecimal = (decimal) => {
    if (!decimal) return 'N/A';
    if (decimal.$numberDecimal) return decimal.$numberDecimal;
    return decimal.toString ? decimal.toString() : 'N/A';
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64 text-lg">Loading plans...</div>;
  }

  if (error) {
    return <div className="flex justify-center items-center h-64 text-red-500 text-lg">Error: {error}</div>;
  }

  return (
    <div className="p-8 bg-gradient-to-b from-gray-50 via-white to-gray-100 min-h-screen">
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-4xl font-extrabold flex items-center gap-3 text-gray-800">
          <div className="p-3 rounded-full bg-white shadow-md border border-gray-200">
            <Layers className="w-9 h-9" style={{ color: iconColor }} />
          </div>
          Available Plans
        </h1>
        <Button 
          className="px-4 py-2 text-sm font-medium rounded-lg"
          style={{ backgroundColor: iconColor, color: '#fff' }}
          onClick={() => setShowPurchase(!showPurchase)}
        >
          {showPurchase ? 'Back to Plans' : 'Purchase Plan'}
        </Button>
      </div>

      {showPurchase ? (
        <PlanPurchase />
      ) : plans.length === 0 ? (
        <p className="text-gray-500 text-lg">No plans available.</p>
      ) : (
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <Card 
              key={plan._id} 
              className="border border-gray-100 shadow-lg rounded-2xl hover:shadow-2xl hover:-translate-y-1 transition-transform bg-white/80 backdrop-blur-sm"
            >
              <CardHeader className="pb-3">
                <CardTitle className="flex justify-between items-center">
                  <span className="flex items-center gap-2 text-xl font-semibold text-gray-900">
                    <Layers className="w-6 h-6" style={{ color: iconColor }} />
                    {plan.plan_name}
                  </span>
                  <Badge 
                    className="px-3 py-1 text-sm border rounded-lg font-medium" 
                    style={{ borderColor: iconColor, color: iconColor }}
                  >
                    {plan.amount_type}
                  </Badge>
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-4 mt-2 text-gray-700">
                <p className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-gray-100">
                    <DollarSign className="w-4 h-4" style={{ color: iconColor }} />
                  </div>
                  <span><strong>Minimum Investment:</strong> {formatDecimal(plan.min_investment)}</span>
                </p>

                <p className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-gray-100">
                    <Lock className="w-4 h-4" style={{ color: iconColor }} />
                  </div>
                  <span><strong>Capital Lock-in:</strong> {plan.capital_lockin} days</span>
                </p>

                <p className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-gray-100">
                    <RefreshCcw className="w-4 h-4" style={{ color: iconColor }} />
                  </div>
                  <span><strong>Profit Withdrawal:</strong> {plan.profit_withdrawal}</span>
                </p>

                <p className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-gray-100">
                    <Percent className="w-4 h-4" style={{ color: iconColor }} />
                  </div>
                  <span><strong>Profit Percentage:</strong> {formatDecimal(plan.profit_percentage)}%</span>
                </p>

                <p className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-gray-100">
                    <TrendingUp className="w-4 h-4" style={{ color: iconColor }} />
                  </div>
                  <span><strong>Profit (Day/Week/Month):</strong> {formatDecimal(plan.profit_percentage_day_week_month)}%</span>
                </p>

                <p className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-gray-100">
                    <Percent className="w-4 h-4" style={{ color: iconColor }} />
                  </div>
                  <span><strong>Total Return:</strong> {formatDecimal(plan.total_return_percentage)}%</span>
                </p>

                {plan.notes && (
                  <p className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-gray-100">
                      <FileText className="w-4 h-4" style={{ color: iconColor }} />
                    </div>
                    <span><strong>Notes:</strong> {plan.notes}</span>
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Plans;