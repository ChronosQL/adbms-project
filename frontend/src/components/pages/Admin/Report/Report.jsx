import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Download, BarChart3, Wallet, ClipboardList, CarFront, Users, Loader2 } from 'lucide-react';
import { downloadReportPdf, reportItems, fetchReportData } from '../../../../services/reportService';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { BRAND, STATE, getTheme } from '../AdminDashboard/adminTheme';

const ICONS = {
  businessOverview: BarChart3,
  earnings: Wallet,
  bookingAnalysis: ClipboardList,
  vehicleAnalysis: CarFront,
  customerReviewAnalysis: Users,
};

const CHART_COLORS = [
  BRAND.coral,       // #EF8354
  '#3B82F6',         // Vibrant Blue
  STATE.success,     // #2F9E44
  STATE.warning,     // #E3A857
  '#8B5CF6',         // Purple
  BRAND.payneGray,   // #4F5D75
];

function ReportChartPreview({ reportKey, dark, t }) {
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

  const tickStyle = { fontSize: 10, fill: dark ? '#94A3B8' : BRAND.payneGray };
  const tooltipStyle = {
    backgroundColor: dark ? '#1E2230' : '#FFFFFF',
    borderColor: dark ? 'rgba(255,255,255,0.1)' : '#E8E8EA',
    borderRadius: '8px',
    color: dark ? '#FFFFFF' : BRAND.gunmetal,
    fontSize: '12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  };

  if (loading) {
    return (
      <div
        className="flex h-40 w-full items-center justify-center rounded-xl"
        style={{ background: dark ? '#242838' : '#F7F7F8' }}
      >
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: BRAND.coral }} />
      </div>
    );
  }

  if (!data) {
    return (
      <div
        className="flex h-40 w-full items-center justify-center rounded-xl text-sm"
        style={{ background: dark ? '#242838' : '#F7F7F8', color: t.textSecondary }}
      >
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
            <div className="flex h-[160px] w-full items-center justify-center text-sm italic" style={{ color: t.textSecondary }}>
              No tour data available yet
            </div>
          );
        }

        return (
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={chartData} innerRadius={42} outerRadius={68} dataKey="value" nameKey="name" stroke="none">
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'transparent' }} />
              <Legend verticalAlign="middle" align="right" layout="vertical" wrapperStyle={{ fontSize: '11px', color: t.textSecondary }} />
            </PieChart>
          </ResponsiveContainer>
        );
      }
      case 'earnings': {
        return (
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={data.months || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="label" tick={tickStyle} axisLine={false} tickLine={false} />
              <YAxis tick={tickStyle} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: dark ? 'rgba(255,255,255,0.05)' : '#F1F5F9' }} />
              <Bar dataKey="value" fill={BRAND.coral} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );
      }
      case 'bookingAnalysis': {
        return (
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={data.monthlyTrend || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="label" tick={tickStyle} axisLine={false} tickLine={false} />
              <YAxis tick={tickStyle} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: dark ? 'rgba(255,255,255,0.05)' : '#F1F5F9' }} />
              <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} />
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
            <div className="flex h-[160px] w-full items-center justify-center text-sm italic" style={{ color: t.textSecondary }}>
              No vehicle data available yet
            </div>
          );
        }

        return (
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={chartData} innerRadius={42} outerRadius={68} dataKey="value" nameKey="name" stroke="none">
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'transparent' }} />
              <Legend verticalAlign="middle" align="right" layout="vertical" wrapperStyle={{ fontSize: '11px', color: t.textSecondary }} />
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
              <YAxis dataKey="name" type="category" tick={tickStyle} axisLine={false} tickLine={false} width={42} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: dark ? 'rgba(255,255,255,0.05)' : '#F1F5F9' }} />
              <Bar dataKey="value" fill={STATE.warning} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );
      }
      default:
        return null;
    }
  };

  return (
    <div
      className="mt-4 overflow-hidden rounded-2xl p-2 transition-colors"
      style={{
        background: dark ? '#242838' : '#F7F7F8',
        border: `1px solid ${dark ? 'rgba(255,255,255,0.07)' : '#E8E8EA'}`,
      }}
    >
      {renderChart()}
    </div>
  );
}

function Report() {
  const outletCtx = useOutletContext();
  const dark = outletCtx?.dark ?? false;
  const t = getTheme(dark);

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
    <div className="space-y-6 p-4 md:p-6" style={{ color: t.textPrimary }}>
      {error && (
        <div
          className="rounded-2xl px-4 py-3 text-sm font-semibold"
          style={{
            background: 'rgba(224, 72, 59, 0.1)',
            border: '1px solid rgba(224, 72, 59, 0.25)',
            color: STATE.danger,
          }}
        >
          {error}
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {reportItems.map((item) => {
          const Icon = ICONS[item.key] || Download;
          const busy = loadingKey === item.key;

          return (
            <div
              key={item.key}
              className="flex flex-col rounded-3xl p-6 shadow-sm transition-all duration-200 hover:shadow-md"
              style={{
                background: t.cardBg,
                border: `1px solid ${t.cardBorder}`,
              }}
            >
              <div className="flex items-start gap-4">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-2xl flex-shrink-0"
                  style={{
                    background: 'rgba(239, 131, 84, 0.12)',
                    color: BRAND.coral,
                  }}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2
                    className="text-base font-bold truncate"
                    style={{
                      color: t.textPrimary,
                      fontFamily: "'Montserrat', sans-serif",
                    }}
                  >
                    {item.label}
                  </h2>
                  <p className="mt-1 text-xs" style={{ color: t.textSecondary }}>
                    Download the comprehensive PDF export for this sector.
                  </p>
                </div>
              </div>

              <div className="flex-1">
                <ReportChartPreview reportKey={item.key} dark={dark} t={t} />
              </div>

              <button
                type="button"
                onClick={() => handleDownload(item.key)}
                disabled={busy}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl py-3 px-4 text-sm font-bold text-white transition-all duration-150 active:scale-[0.98] disabled:cursor-wait disabled:opacity-70 shadow-sm"
                style={{
                  background: BRAND.coral,
                  fontFamily: "'Montserrat', sans-serif",
                }}
                onMouseEnter={e => { if (!busy) e.currentTarget.style.background = '#d96e41'; }}
                onMouseLeave={e => { if (!busy) e.currentTarget.style.background = BRAND.coral; }}
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