import React, { useEffect, useState } from "react";
import axiosInstance from "@/modules/common/lib/axios";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const Plans = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await axiosInstance.get("/plans");
        console.log("API Response:", response.data);
        setPlans(response.data);
        setLoading(false);
      } catch (err) {
        console.error("Fetch Error:", err);
        setError(err.message);
        setLoading(false);
      }
    };
    fetchPlans();
  }, []);

  const formatDecimal128 = (decimal128) => {
    if (!decimal128) return "N/A";
    return decimal128.$numberDecimal
      ? decimal128.$numberDecimal
      : decimal128.toString();
  };

  const calculateDailyReturnPercentage = (plan) => {
    if (!plan.min_investment || !plan.profit_percentage_day_week_month)
      return "N/A";

    const minInvestment = parseFloat(formatDecimal128(plan.min_investment));
    const profit = parseFloat(
      formatDecimal128(plan.profit_percentage_day_week_month)
    );

    let dailyProfit = profit;
    if (plan.profit_withdrawal === "weekly") {
      dailyProfit = profit / 7;
    } else if (plan.profit_withdrawal === "monthly") {
      dailyProfit = profit / 30;
    }

    if (minInvestment === 0) return "N/A";
    const dailyReturnPercentage = (dailyProfit / minInvestment) * 100;
    return dailyReturnPercentage.toFixed(2) + "%";
  };

  const inrPlans = plans.filter((plan) => plan.amount_type === "INR");
  const usdtPlans = plans.filter((plan) => plan.amount_type === "USDT");

  if (loading) {
    return <div className="text-center py-8 text-white">Loading...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-400">Error: {error}</div>;
  }

  const renderTable = (plans, title) => (
    <div className="mb-12">
      <h2 className="text-2xl md:text-3xl font-bold mb-6 text-white text-center">
        {title}
      </h2>
      {plans.length === 0 ? (
        <p className="text-gray-300 text-center">No {title} available.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white/10 backdrop-blur-md shadow-lg rounded-2xl overflow-hidden">
            <thead className="bg-white/20">
              <tr>
                {[
                  "Plan Name",
                  "Investment Range",
                  "Capital Lock-in (Days)",
                  "Daily Return %",
                  "Daily Return (Example)",
                  "Notes",
                ].map((heading) => (
                  <th
                    key={heading}
                    className="px-6 py-4 text-left text-xs md:text-sm font-semibold text-gray-100 uppercase tracking-wide"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {plans.map((plan, idx) => (
                <tr
                  key={plan._id}
                  className={`${
                    idx % 2 === 0 ? "bg-white/5" : "bg-white/10"
                  } hover:bg-white/20 transition`}
                >
                  <td className="px-6 py-4 text-xs md:text-sm text-gray-100 font-medium">
                    {plan.plan_name || "N/A"}
                  </td>
                  <td className="px-6 py-4 text-xs md:text-sm text-gray-200">
                    {formatDecimal128(plan.min_investment)}
                  </td>
                  <td className="px-6 py-4 text-xs md:text-sm text-gray-200">
                    {plan.capital_lockin || "N/A"}
                  </td>
                  <td className="px-6 py-4 text-xs md:text-sm text-green-400 font-semibold">
                    {calculateDailyReturnPercentage(plan)}
                  </td>
                  <td className="px-6 py-4 text-xs md:text-sm text-gray-200">
                    ₹ {formatDecimal128(plan.profit_percentage_day_week_month)}%{" "}
                    (on ₹{formatDecimal128(plan.min_investment)})
                  </td>
                  <td className="px-6 py-4 text-xs md:text-sm text-gray-300  whitespace-normal break-words min-w-[200px]">
                    {plan.notes || "N/A"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  return (
    <section className="bg-[#0e1946] min-h-screen py-12 px-4 md:px-8 flex flex-col justify-between">
      <div className="container mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: -30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          viewport={{ once: true }}
          className="text-4xl md:text-5xl font-extrabold text-center mb-12 text-white"
        >
          Investment Plans
        </motion.h2>
        {renderTable(inrPlans, "INR Plans")}
        {renderTable(usdtPlans, "USDT Plans")}
      </div>

      {/* Bottom Center Button */}
      <div className="flex justify-center mt-5">
        <Link
          to="/user-login"
          className="px-6 py-3 bg-[#d29e45] text-white font-semibold rounded-full shadow-lg hover:scale-105 transform transition-all duration-300"
        >
          Invest Now
        </Link>
      </div>
    </section>
  );
};

export default Plans;
