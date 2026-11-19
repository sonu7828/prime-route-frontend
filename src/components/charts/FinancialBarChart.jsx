import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { TrendingUp, ArrowUpRight } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

const defaultFinancialSummary = {
  monthlyBars: [
    { month: 'Jun', revenue: 0, expenses: 0 },
    { month: 'Jul', revenue: 0, expenses: 0 },
    { month: 'Aug', revenue: 0, expenses: 0 },
    { month: 'Sep', revenue: 0, expenses: 0 },
    { month: 'Oct', revenue: 0, expenses: 0 },
    { month: 'Nov', revenue: 0, expenses: 0 },
  ],
  totalRevenue: 0,
  totalExpenses: 0,
  netProfit: 0,
};

export default function FinancialBarChart({ data: propData }) {
  const summary = propData || defaultFinancialSummary;
  const bars = summary.monthlyBars || defaultFinancialSummary.monthlyBars;

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-[0_2px_12px_rgba(7,29,73,0.04)] h-full flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-50 text-[#075EE8]">
            <TrendingUp className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-[#0A1E42] text-base">Financial Summary</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
        {/* Bars */}
        <div className="lg:col-span-8 h-[160px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={bars} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748B', fontSize: 10 }}
              />
              <YAxis hide />
              <Tooltip
                cursor={{ fill: '#F1F5F9', radius: 4 }}
                formatter={(val) => [formatCurrency(val), 'Revenue']}
                contentStyle={{
                  backgroundColor: '#071D49',
                  borderRadius: '10px',
                  border: 'none',
                  color: '#fff',
                  fontSize: '11px',
                }}
              />
              <Bar
                dataKey="revenue"
                fill="#075EE8"
                radius={[4, 4, 0, 0]}
                barSize={16}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Financial Stat Breakdown on Right */}
        <div className="lg:col-span-4 flex flex-col justify-center space-y-3 pl-2 border-t lg:border-t-0 lg:border-l border-slate-100">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <span className="w-2 h-2 rounded-full bg-[#075EE8]" />
              Total Revenue
            </div>
            <div className="text-base font-extrabold text-[#0A1E42] mt-0.5">
              {formatCurrency(summary.totalRevenue || 0)}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <span className="w-2 h-2 rounded-full bg-[#0A1E42]" />
              Total Expenses
            </div>
            <div className="text-base font-extrabold text-[#0A1E42] mt-0.5">
              {formatCurrency(summary.totalExpenses || 0)}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <div className="text-xs text-slate-500 font-medium">Net Profit</div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-base font-extrabold text-[#0A1E42]">
                {formatCurrency(summary.netProfit || 0)}
              </span>
              <span className="inline-flex items-center text-[11px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                <ArrowUpRight className="w-3 h-3 mr-0.5" />
                {summary.profitMarginChange || summary.profitGrowth || '+100%'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

