"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';

interface BudgetReportData {
  budget: {
    utilizationRate: number;
    totalAwarded: number;
    totalABC: number;
  };
  execution: {
    disbursementRate: number;
    totalDisbursed: number;
    totalObligated: number;
    totalPayable: number;
  };
  payables: Array<{
    caseId: string;
    title: string;
    dvNumber: string;
    amount: number;
    ageDays: number;
  }>;
}

interface WorkflowReportData {
  totalCases: number;
  awardedCount: number;
  completedCount: number;
  bottlenecks: Array<unknown>;
  stats: Array<{
    stage: string;
    avg: number;
    min: number;
    max: number;
  }>;
}

export default function ReportsPage() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [budgetData, setBudgetData] = useState<BudgetReportData | null>(null);
  const [workflowData, setWorkflowData] = useState<WorkflowReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [resBudget, resWorkflow] = await Promise.all([
          fetch(`/api/reports/budget?year=${year}`),
          fetch(`/api/reports/workflow?year=${year}`)
        ]);

        if (resBudget.ok) setBudgetData(await resBudget.json());
        if (resWorkflow.ok) setWorkflowData(await resWorkflow.json());
      } catch (error) {
        console.error('Failed to fetch reports', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [year]);

  const downloadCSV = (type: 'budget' | 'workflow') => {
    const data = type === 'budget' ? budgetData : workflowData;
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report-${type}-${year}.json`;
    a.click();
  };

  if (loading && !budgetData) return <div className="p-8">Loading reports...</div>;

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Reports & Analytics</h1>
        <div className="flex items-center gap-2">
           <select 
             value={year} 
             onChange={(e) => setYear(Number(e.target.value))}
             className="p-2 border rounded bg-white dark:bg-gray-800"
           >
             {[...Array(5)].map((_, i) => (
               <option key={i} value={new Date().getFullYear() - i}>{new Date().getFullYear() - i}</option>
             ))}
           </select>
        </div>
      </div>

      <Tabs defaultValue="budget" className="w-full">
        <TabsList>
          <TabsTrigger value="budget">Budget Execution</TabsTrigger>
          <TabsTrigger value="workflow">Workflow Performance</TabsTrigger>
        </TabsList>
        
        <TabsContent value="budget" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Utilization Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {budgetData ? (budgetData.budget.utilizationRate * 100).toFixed(1) : 0}%
                </div>
                <p className="text-xs text-gray-500">
                   ₱{(budgetData?.budget.totalAwarded || 0).toLocaleString()} awarded / ₱{(budgetData?.budget.totalABC || 0).toLocaleString()} ABC
                </p>
              </CardContent>
            </Card>
            <Card>
               <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Disbursement Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {budgetData ? (budgetData.execution.disbursementRate * 100).toFixed(1) : 0}%
                </div>
                <p className="text-xs text-gray-500">
                   ₱{(budgetData?.execution.totalDisbursed || 0).toLocaleString()} disbursed / ₱{(budgetData?.execution.totalObligated || 0).toLocaleString()} obligated
                </p>
              </CardContent>
            </Card>
            <Card>
               <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Payables (Unpaid DV)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ₱{((budgetData?.execution.totalPayable || 0) - (budgetData?.execution.totalDisbursed || 0)).toLocaleString()}
                </div>
                <p className="text-xs text-gray-500">
                   Processed DVs pending check
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Payables Aging (Compliance Alert)</CardTitle>
              <Button variant="outline" size="sm" onClick={() => downloadCSV('budget')}>Export JSON</Button>
            </CardHeader>
            <CardContent>
              {budgetData?.payables && budgetData.payables.length > 0 ? (
                <div className="space-y-2">
                  {budgetData.payables.map((p) => (
                    <div key={p.caseId} className="flex items-center justify-between p-2 border rounded hover:bg-gray-50 dark:hover:bg-gray-800">
                      <div>
                        <div className="font-medium">{p.title}</div>
                        <div className="text-xs text-gray-500">DV: {p.dvNumber} • Amount: ₱{p.amount.toLocaleString()}</div>
                      </div>
                      <div className="flex items-center gap-2">
                         <span className={`px-2 py-1 text-xs rounded-full ${
                           p.ageDays > 7 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                         }`}>
                           {p.ageDays} days old
                         </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No pending payables.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workflow" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Cases</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-bold">{workflowData?.totalCases || 0}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Awarded</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-bold">{workflowData?.awardedCount || 0}</div></CardContent>
            </Card>
             <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Completed</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-bold">{workflowData?.completedCount || 0}</div></CardContent>
            </Card>
            <Card>
               <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Bottlenecks</CardTitle></CardHeader>
               <CardContent>
                  <div className="text-2xl font-bold text-red-600">{workflowData?.bottlenecks?.length || 0}</div>
                  <p className="text-xs text-gray-500">Stages &gt; 7 days avg</p>
               </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Average Stage Durations (Days)</CardTitle>
              <Button variant="outline" size="sm" onClick={() => downloadCSV('workflow')}>Export JSON</Button>
            </CardHeader>
            <CardContent>
               <div className="space-y-4">
                 {workflowData?.stats?.map((s) => (
                   <div key={s.stage} className="space-y-1">
                     <div className="flex justify-between text-sm">
                       <span>{s.stage}</span>
                       <span className="font-medium">{s.avg.toFixed(1)} days</span>
                     </div>
                     {/* Simple Bar Chart */}
                     <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                       <div 
                         className={`h-full rounded-full ${s.avg > 7 ? 'bg-red-500' : 'bg-blue-500'}`} 
                         style={{ width: `${Math.min((s.avg / 30) * 100, 100)}%` }}
                       />
                     </div>
                     <div className="flex justify-between text-xs text-gray-400">
                       <span>Min: {s.min.toFixed(1)}</span>
                       <span>Max: {s.max.toFixed(1)}</span>
                     </div>
                   </div>
                 ))}
               </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
