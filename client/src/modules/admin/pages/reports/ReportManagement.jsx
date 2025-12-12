import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext } from '@/components/ui/pagination';
import { Calendar, DollarSign, Users, AlertTriangle, Clock } from 'lucide-react';
import axiosInstance from '@/modules/common/lib/axios';

const PaginatedTable = ({ data, columns, pageSize = 5 }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(data.length / pageSize);
  const currentData = data.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            {columns?.map((col) => (
              <TableHead key={col.header}>{col.header}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {currentData?.map((row, idx) => (
            <TableRow key={idx}>
              {columns?.map((col) => (
                <TableCell key={col.header}>{col.accessor(row)}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {totalPages > 1 && (
        <Pagination className="mt-4 justify-center">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => handlePageChange(currentPage - 1)}
                className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
              />
            </PaginationItem>
            {[...Array(totalPages)]?.map((_, i) => (
              <PaginationItem key={i}>
                <PaginationLink
                  onClick={() => handlePageChange(i + 1)}
                  isActive={currentPage === i + 1}
                >
                  {i + 1}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                onClick={() => handlePageChange(currentPage + 1)}
                className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </>
  );
};

const ReportManagement = () => {
  const [overall, setOverall] = useState({});
  const [weekExpirations, setWeekExpirations] = useState({});
  const [monthExpirations, setMonthExpirations] = useState({});
  const [weekSettlements, setWeekSettlements] = useState({});
  const [monthSettlements, setMonthSettlements] = useState({});
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [overallRes, weekExpRes, monthExpRes, weekSetRes, monthSetRes, plansRes] = await Promise.all([
          axiosInstance.get('/reports/overall'),
          axiosInstance.get('/reports/expirations/week'),
          axiosInstance.get('/reports/expirations/month'),
          axiosInstance.get('/reports/settlements/week'),
          axiosInstance.get('/reports/settlements/month'),
          axiosInstance.get('/plans'),
        ]);

        setOverall(overallRes.data);
        setWeekExpirations(weekExpRes.data);
        setMonthExpirations(monthExpRes.data);
        setWeekSettlements(weekSetRes.data);
        setMonthSettlements(monthSetRes.data);
        setPlans(plansRes.data);
      } catch (error) {
        console.error('Error fetching reports:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-indigo-600"></div>
      </div>
    );
  }

  const expirationColumns = [
    { header: 'User', accessor: (row) => row.user.username },
    { header: 'Plan', accessor: (row) => row.plan.plan_name },
    { header: 'Amount', accessor: (row) => `${row.plan.amount_type === 'INR' ? '₹' : 'USDT'} ${row.amount}` },
    { header: 'Currency', accessor: (row) => row.plan.amount_type },
    { header: 'Expires At', accessor: (row) => new Date(row.expires_at).toLocaleDateString() },
  ];

  const settlementColumns = [
    { header: 'User', accessor: (row) => row.user.username },
    { header: 'Plan', accessor: (row) => row.plan.plan_name },
    { header: 'Capital Amount', accessor: (row) => `${row.plan.amount_type === 'INR' ? '₹' : 'USDT'} ${row.userPlanCapitalAmount}` },
    { header: 'Daily Profit', accessor: (row) => `${row.plan.amount_type === 'INR' ? '₹' : 'USDT'} ${row.dailyProfitAmount}` },
    { header: 'Total Amount to Settle', accessor: (row) => `${row.plan.amount_type === 'INR' ? '₹' : 'USDT'} ${row.totalAmountToSettle}` },
    { header: 'Currency', accessor: (row) => row.plan.amount_type },
    { header: 'Expires At', accessor: (row) => new Date(row.expires_at).toLocaleDateString() },
  ];

  // Prepare data for the plan distribution table
  const planDistributionData = plans?.map((plan) => ({
    plan_name: plan.plan_name,
    count: overall.planWiseCounts?.[plan.plan_name] || 0,
  }));

  const planDistributionColumns = [
    { header: 'Plan Name', accessor: (row) => row.plan_name },
    { header: 'Chosen Count', accessor: (row) => row.count },
  ];

  return (
    <div className="container mx-auto py-12 bg-gradient-to-b from-gray-50 to-white">
      <h1 className="text-4xl font-bold text-indigo-800 mb-8 text-center">Admin Reports & Analysis</h1>

      <Tabs defaultValue="overall" className="space-y-8">
        <TabsList className="justify-center mb-8 bg-transparent rounded-full p-1 border border-indigo-200 shadow-sm">
          <TabsTrigger value="overall" className="px-6 py-3 text-lg font-medium rounded-full data-[state=active]:bg-indigo-600 data-[state=active]:text-white hover:bg-indigo-100">Overall Stats</TabsTrigger>
          <TabsTrigger value="weekly" className="px-6 py-3 text-lg font-medium rounded-full data-[state=active]:bg-indigo-600 data-[state=active]:text-white hover:bg-indigo-100">Weekly Reports</TabsTrigger>
          <TabsTrigger value="monthly" className="px-6 py-3 text-lg font-medium rounded-full data-[state=active]:bg-indigo-600 data-[state=active]:text-white hover:bg-indigo-100">Monthly Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overall" className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="flex items-center">
                <Users className="h-8 w-8 text-indigo-600 mr-2" />
                <CardTitle>Total Plans</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{overall.totalPlans || 0}</p>
              </CardContent>
            </Card>
            <Card className="shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="flex items-center">
                <DollarSign className="h-8 w-8 text-green-600 mr-2" />
                <CardTitle>Chosen Plans</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{overall.chosenCount || 0}</p>
              </CardContent>
            </Card>
            <Card className="shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="flex items-center">
                <Clock className="h-8 w-8 text-yellow-600 mr-2" />
                <CardTitle>Expired Plans</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{overall.expiredCount || 0}</p>
              </CardContent>
            </Card>
            <Card className="shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="flex items-center">
                <AlertTriangle className="h-8 w-8 text-red-600 mr-2" />
                <CardTitle>Rejected Plans</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{overall.rejectedCount || 0}</p>
              </CardContent>
            </Card>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <CardTitle>Plans by Currency</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Total: {overall.totalPlans || 0}</p>
                <p>INR: {overall.inrPlans || 0}</p>
                <p>USDT: {overall.usdtPlans || 0}</p>
              </CardContent>
            </Card>
            <Card className="shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <CardTitle>Chosen by Currency</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Total: {overall.chosenCount || 0}</p>
                <p>INR: {overall.chosenINR || 0}</p>
                <p>USDT: {overall.chosenUSDT || 0}</p>
              </CardContent>
            </Card>
            <Card className="shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <CardTitle>Expired by Currency</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Total: {overall.expiredCount || 0}</p>
                <p>INR: {overall.expiredINR || 0}</p>
                <p>USDT: {overall.expiredUSDT || 0}</p>
              </CardContent>
            </Card>
            <Card className="shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <CardTitle>Rejected by Currency</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Total: {overall.rejectedCount || 0}</p>
                <p>INR: {overall.rejectedINR || 0}</p>
                <p>USDT: {overall.rejectedUSDT || 0}</p>
              </CardContent>
            </Card>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <CardTitle>Plan Wise Chosen Counts</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {plans?.map((plan) => (
                    <li key={plan._id}>
                      {plan.plan_name}: {overall.planWiseCounts?.[plan.plan_name] || 0}
                    </li>
                  ))}
                  {plans.length === 0 && <li>No plans available</li>}
                </ul>
              </CardContent>
            </Card>
            <Card className="shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <CardTitle>Plan Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {planDistributionData?.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {planDistributionColumns?.map((col) => (
                          <TableHead key={col.header}>{col.header}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {planDistributionData?.map((row, idx) => (
                        <TableRow key={idx}>
                          {planDistributionColumns?.map((col) => (
                            <TableCell key={col.header}>{col.accessor(row)}</TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p>No data available for plan distribution</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="weekly">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-6 w-6 mr-2 text-indigo-600" />
                  Weekly Expirations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg mb-4">
                  Total: {weekExpirations.count || 0} | INR: ₹{weekExpirations.totalAmounts?.INR || 0} | USDT: {weekExpirations.totalAmounts?.USDT || 0}
                </p>
                <PaginatedTable data={weekExpirations.expirations || []} columns={expirationColumns} />
              </CardContent>
            </Card>
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DollarSign className="h-6 w-6 mr-2 text-green-600" />
                  Weekly Settlements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg mb-4">
                  Total: {weekSettlements.count || 0} | INR: ₹{weekSettlements.totalSettlementAmounts?.INR || 0} | USDT: {weekSettlements.totalSettlementAmounts?.USDT || 0}
                </p>
                <PaginatedTable data={weekSettlements.settlements || []} columns={settlementColumns} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="monthly">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-6 w-6 mr-2 text-indigo-600" />
                  Monthly Expirations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg mb-4">
                  Total: {monthExpirations.count || 0} | INR: ₹{monthExpirations.totalAmounts?.INR || 0} | USDT: {monthExpirations.totalAmounts?.USDT || 0}
                </p>
                <PaginatedTable data={monthExpirations.expirations || []} columns={expirationColumns} />
              </CardContent>
            </Card>
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DollarSign className="h-6 w-6 mr-2 text-green-600" />
                  Monthly Settlements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg mb-4">
                  Total: {monthSettlements.count || 0} | INR: ₹{monthSettlements.totalSettlementAmounts?.INR || 0} | USDT: {monthSettlements.totalSettlementAmounts?.USDT || 0}
                </p>
                <PaginatedTable data={monthSettlements.settlements || []} columns={settlementColumns} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReportManagement;
