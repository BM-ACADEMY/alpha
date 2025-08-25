// import React, { useState, useEffect } from "react";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Skeleton } from "@/components/ui/skeleton";
// import {
//   Users,
//   Package,
//   DollarSign,
//   UserPlus,
//   Users as ReferralIcon,
//   Calendar,
// } from "lucide-react";
// import {
//   AreaChart,
//   Area,
//   XAxis,
//   YAxis,
//   PieChart ,
//   Pie,
//   Cell,
//   CartesianGrid,
//   Tooltip,
//   ResponsiveContainer,
// } from "recharts";

// const mockData = {
//   totalUsers: 1500,
//   totalPlans: 8,
//   currentMonthAmount: 75000,
//   totalAmount: 1200000,
//   newUsersToday: 45,
//   referralUsers: 320,
//   planUserCounts: [
//     { name: "Jan", PlanA: 100, PlanB: 50, PlanC: 80 },
//     { name: "Feb", PlanA: 150, PlanB: 70, PlanC: 90 },
//     { name: "Mar", PlanA: 200, PlanB: 100, PlanC: 120 },
//     { name: "Apr", PlanA: 180, PlanB: 90, PlanC: 110 },
//     { name: "May", PlanA: 220, PlanB: 120, PlanC: 140 },
//     { name: "Jun", PlanA: 250, PlanB: 140, PlanC: 160 },
//     { name: "Jul", PlanA: 300, PlanB: 160, PlanC: 180 },
//   ],
//   currencyDistribution: [
//     { name: "INR", value: 800000 },
//     { name: "USDT", value: 400000 },
//   ],
// };

// const Dashboard = () => {
//   const [isLoading, setIsLoading] = useState(true);
//   const [data, setData] = useState(null);

//   useEffect(() => {
//     // Simulate API call
//     const timer = setTimeout(() => {
//       setData(mockData);
//       setIsLoading(false);
//     }, 2000);
//     return () => clearTimeout(timer);
//   }, []);

//   return (
//     <div className="p-6 space-y-6">
//       <h1 className="text-[#d09d42] font-bold bg-[#0f1c3f] p-1 rounded">Admin Dashboard Overview</h1>

//       {/* First Row: Stats Cards */}
//       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
//         {isLoading ? (
//           <>
//             {[...Array(6)].map((_, i) => (
//               <Skeleton key={i} className="h-32 w-full" />
//             ))}
//           </>
//         ) : (
//           <>
//             <Card>
//               <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//                 <CardTitle className="text-sm font-medium">
//                   Total Users
//                 </CardTitle>
//                 <Users className="h-4 w-4 text-muted-foreground" />
//               </CardHeader>
//               <CardContent>
//                 <div className="text-2xl font-bold">{data.totalUsers}</div>
//               </CardContent>
//             </Card>
//             <Card>
//               <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//                 <CardTitle className="text-sm font-medium">
//                   Total Plans
//                 </CardTitle>
//                 <Package className="h-4 w-4 text-muted-foreground" />
//               </CardHeader>
//               <CardContent>
//                 <div className="text-2xl font-bold">{data.totalPlans}</div>
//               </CardContent>
//             </Card>
//             <Card>
//               <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//                 <CardTitle className="text-sm font-medium">
//                   Current Month Amount
//                 </CardTitle>
//                 <Calendar className="h-4 w-4 text-muted-foreground" />
//               </CardHeader>
//               <CardContent>
//                 <div className="text-2xl font-bold">
//                   ${data.currentMonthAmount.toLocaleString()}
//                 </div>
//               </CardContent>
//             </Card>
//             <Card>
//               <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//                 <CardTitle className="text-sm font-medium">
//                   Total Amount
//                 </CardTitle>
//                 <DollarSign className="h-4 w-4 text-muted-foreground" />
//               </CardHeader>
//               <CardContent>
//                 <div className="text-2xl font-bold">
//                   ${data.totalAmount.toLocaleString()}
//                 </div>
//               </CardContent>
//             </Card>
//             <Card>
//               <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//                 <CardTitle className="text-sm font-medium">
//                   New Users Today
//                 </CardTitle>
//                 <UserPlus className="h-4 w-4 text-muted-foreground" />
//               </CardHeader>
//               <CardContent>
//                 <div className="text-2xl font-bold">{data.newUsersToday}</div>
//               </CardContent>
//             </Card>
//             <Card>
//               <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//                 <CardTitle className="text-sm font-medium">
//                   Referral Users
//                 </CardTitle>
//                 <ReferralIcon className="h-4 w-4 text-muted-foreground" />
//               </CardHeader>
//               <CardContent>
//                 <div className="text-2xl font-bold">{data.referralUsers}</div>
//               </CardContent>
//             </Card>
//           </>
//         )}
//       </div>

//       {/* Charts Section */}
//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
//         {/* Line Wave Chart: Plan-wise User Count */}
//         <Card>
//           <CardHeader>
//             <CardTitle>Plan-wise User Count Over Time</CardTitle>
//           </CardHeader>
//           <CardContent>
//             {isLoading ? (
//               <Skeleton className="h-64 w-full" />
//             ) : (
//               <ResponsiveContainer width="100%" height={300}>
//                 <AreaChart
//                   data={data.planUserCounts}
//                   margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
//                 >
//                   <CartesianGrid strokeDasharray="3 3" />
//                   <XAxis dataKey="name" />
//                   <YAxis />
//                   <Tooltip />
//                   <Area
//                     type="monotone"
//                     dataKey="PlanA"
//                     stackId="1"
//                     stroke="#8884d8"
//                     fill="#8884d8"
//                   />
//                   <Area
//                     type="monotone"
//                     dataKey="PlanB"
//                     stackId="1"
//                     stroke="#82ca9d"
//                     fill="#82ca9d"
//                   />
//                   <Area
//                     type="monotone"
//                     dataKey="PlanC"
//                     stackId="1"
//                     stroke="#ffc658"
//                     fill="#ffc658"
//                   />
//                 </AreaChart>
//               </ResponsiveContainer>
//             )}
//           </CardContent>
//         </Card>

//         {/* Donut Chart: INR vs USDT Total Amount */}
//         <Card>
//           <CardHeader>
//             <CardTitle>Currency Distribution (INR vs USDT)</CardTitle>
//           </CardHeader>
//           <CardContent>
//             {isLoading ? (
//               <Skeleton className="h-64 w-full" />
//             ) : (
//               <ResponsiveContainer width="100%" height={300}>
//                 <PieChart>
//                   <Pie
//                     data={data.currencyDistribution}
//                     cx="50%"
//                     cy="50%"
//                     innerRadius={60}
//                     outerRadius={80}
//                     fill="#8884d8"
//                     paddingAngle={5}
//                     dataKey="value"
//                     label
//                   >
//                     {data.currencyDistribution.map((entry, index) => (
//                       <Cell
//                         key={`cell-${index}`}
//                         fill={index === 0 ? "#0088FE" : "#00C49F"}
//                       />
//                     ))}
//                   </Pie>
//                   <Tooltip />
//                 </PieChart>
//               </ResponsiveContainer>
//             )}
//           </CardContent>
//         </Card>
//       </div>
//     </div>
//   );
// };

// export default Dashboard;


import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  Package,
  DollarSign,
  UserPlus,
  Users as ReferralIcon,
  Calendar,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import axiosInstance from "@/modules/common/lib/axios"; // Adjust path to your axiosInstance
import { showToast } from "@/modules/common/toast/customToast";

const Dashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await axiosInstance.get("/dashboard-route/dashboard");
        setData(response.data);
        showToast("success", "Dashboard data loaded successfully!");
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        showToast("error",
          `${error.response?.data?.message}|| Failed to load dashboard data`

        );
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-[#d09d42] font-bold bg-[#0f1c3f] p-1 rounded">Admin Dashboard Overview</h1>

      {/* First Row: Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {isLoading ? (
          <>
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </>
        ) : (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data?.totalUsers || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Plans</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data?.totalPlans || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Current Month Amount</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${data?.currentMonthAmount?.toLocaleString() || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${data?.totalAmount?.toLocaleString() || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">New Users Today</CardTitle>
                <UserPlus className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data?.newUsersToday || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Referral Users</CardTitle>
                <ReferralIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data?.referralUsers || 0}</div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Area Chart: Plan-wise User Count */}
        <Card>
          <CardHeader>
            <CardTitle>Plan-wise User Count Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart
                  data={data?.planUserCounts || []}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="PlanA"
                    stackId="1"
                    stroke="#8884d8"
                    fill="#8884d8"
                  />
                  <Area
                    type="monotone"
                    dataKey="PlanB"
                    stackId="1"
                    stroke="#82ca9d"
                    fill="#82ca9d"
                  />
                  <Area
                    type="monotone"
                    dataKey="PlanC"
                    stackId="1"
                    stroke="#ffc658"
                    fill="#ffc658"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Pie Chart: Currency Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Currency Distribution (INR vs USDT)</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={data?.currencyDistribution || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                    label
                  >
                    {data?.currencyDistribution?.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={index === 0 ? "#0088FE" : "#00C49F"}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;