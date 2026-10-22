import { useState, useEffect } from 'react';
import { Download, BarChart3, Wallet, ClipboardList, CarFront, Users, Loader2 } from 'lucide-react';
import { downloadReportPdf, reportItems, fetchReportData } from '../../../../services/reportService';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const ICONS = {
  businessOverview: BarChart3,
  earnings: Wallet,
  bookingAnalysis: ClipboardList,
  vehicleAnalysis: CarFront,
  customerReviewAnalysis: Users,
};

const COLORS = ['#00b0a5', '#0f766e', '#2563eb', '#f59e0b', '#ef4444', '#8b5cf6'];

function ReportChartPreview({ reportKey }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await fetchReportData(reportKey);
        setData(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [reportKey]);

  if (loading) {
    return (
      <div className="flex h-40 w-full items-center justify-center bg-slate-50">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex h-40 w-full items-center justify-center bg-slate-50 text-sm text-slate-500">
        No data available
      </div>
    );
  }

  const renderChart = () => {
    switch (reportKey) {
      case 'businessOverview': {
        const chartData = [
          { name: 'Completed', value: data.completedTours || 0 },
          { name: 'Cancelled', value: data.cancelledBookings || 0 },
        ];
        
        const total = chartData.reduce((sum, item) => sum + item.value, 0);
        if (total === 0) {
          return (
            <div className="flex h-[160px] w-full items-center justify-center text-sm text-slate-400 italic">
              No tour data available yet
            </div>
          );
        }

        return (
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={chartData} innerRadius={40} outerRadius={70} dataKey="value" nameKey="name" stroke="none">
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip cursor={{ fill: 'transparent' }} />
              <Legend verticalAlign="middle" align="right" layout="vertical" wrapperStyle={{ fontSize: '11px' }} />
            </PieChart>
          </ResponsiveContainer>
        );
      }
      case 'earnings': {
        return (
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={data.months || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="label" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: '#f1f5f9' }} />
              <Bar dataKey="value" fill="#0f766e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );
      }
      case 'bookingAnalysis': {
        return (
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={data.monthlyTrend || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="label" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: '#f1f5f9' }} />
              <Bar dataKey="value" fill="#2563eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );
      }
      case 'vehicleAnalysis': {
        const chartData = [
          { name: 'Available', value: data.availability?.available || 0 },
          { name: 'Booked', value: data.availability?.booked || 0 },
          { name: 'Maintenance', value: data.availability?.maintenance || 0 },
        ];
        
        const total = chartData.reduce((sum, item) => sum + item.value, 0);
        if (total === 0) {
          return (
            <div className="flex h-[160px] w-full items-center justify-center text-sm text-slate-400 italic">
              No vehicle data available yet
            </div>
          );
        }

        return (
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={chartData} innerRadius={40} outerRadius={70} dataKey="value" nameKey="name" stroke="none">
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip cursor={{ fill: 'transparent' }} />
              <Legend verticalAlign="middle" align="right" layout="vertical" wrapperStyle={{ fontSize: '11px' }} />
            </PieChart>
          </ResponsiveContainer>
        );
      }
      case 'customerReviewAnalysis': {
        const chartData = Object.entries(data.reviewStats?.breakdown || {}).map(([key, val]) => ({
          name: `${key} Star`,
          value: val
        })).reverse();
        return (
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={40} />
              <Tooltip cursor={{ fill: '#f1f5f9' }} />
              <Bar dataKey="value" fill="#f59e0b" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );
      }
      default:
        return null;
    }
  };

  return (
    <div className="mt-4 overflow-hidden rounded-xl border border-slate-100 bg-white">
      {renderChart()}
    </div>
  );
}

function Report() {
  const [loadingKey, setLoadingKey] = useState(null);
  const [error, setError] = useState('');

  const handleDownload = async (key) => {
    try {
      setLoadingKey(key);
      setError('');
      await downloadReportPdf(key);
    } catch (err) {
      setError(err.message || 'Failed to download report.');
    } finally {
      setLoadingKey(null);
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {reportItems.map((item) => {
          const Icon = ICONS[item.key] || Download;
          const busy = loadingKey === item.key;

          return (
            <div key={item.key} className="flex flex-col rounded-3xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-lg transition-shadow">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#00b0a5]/10 text-[#008f86]">
                  <Icon className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-bold text-slate-900">{item.label}</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Download the PDF export for this section only.
                  </p>
                </div>
              </div>

              <div className="flex-1">
                <ReportChartPreview reportKey={item.key} />
              </div>

              <button
                type="button"
                onClick={() => handleDownload(item.key)}
                disabled={busy}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#00b0a5] px-4 py-3 text-sm font-bold text-white transition-all hover:bg-[#008f86] disabled:cursor-wait disabled:opacity-70"
              >
                <Download className="h-4 w-4" />
                {busy ? 'Preparing PDF...' : 'Download PDF'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Report;