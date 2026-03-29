import React, { useState, useEffect, useCallback } from 'react';
import { dashboardAPI } from '../services/api';
import { toast } from 'react-toastify';
import {
  PieChart, Pie, Cell,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

const COLORS = ['#6366f1', '#8b5cf6', '#a855f7', '#ec4899', '#f43f5e', '#f59e0b', '#22c55e', '#06b6d4'];

const fmt = (n) => '$' + (Number(n) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const currentYear  = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1; // 1-indexed

// Last 5 years as options
const YEAR_OPTIONS = Array.from({ length: 5 }, (_, i) => currentYear - i);

const styles = {
  page:       { padding: 24, maxWidth: 1200, margin: '0 auto' },
  header:     { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, flexWrap: 'wrap', gap: 12 },
  title:      { fontSize: 28, fontWeight: 'bold' },
  controls:   { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' },
  cardsGrid:  { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 24, marginBottom: 32 },
  card:       { padding: 24 },
  cardLabel:  { color: '#9ca3af', fontSize: 14 },
  chartsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(400px,1fr))', gap: 24 },
  chartPanel: { padding: 24 },
  noData:     { color: '#6b7280', textAlign: 'center', padding: 48 },
  tooltip:    { backgroundColor: '#1e1b4b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 },
  select:     {
    padding: '8px 12px', borderRadius: 8,
    border: '1px solid rgba(255,255,255,0.15)',
    background: 'rgba(255,255,255,0.05)',
    color: '#fff', cursor: 'pointer', fontSize: 14, outline: 'none',
  },
};

const DashboardPage = () => {
  const [summary, setSummary]           = useState(null);
  const [cats, setCats]                 = useState(null);
  const [trend, setTrend]               = useState(null);
  const [period, setPeriod]             = useState('month');
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth); // 1-indexed

  const [loading, setLoading] = useState(true);

  // Build the "month" string to send to API e.g. "2026-02"
  const monthParam = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;

  const load = useCallback(async (activePeriod, activeMonthParam, activeYear) => {
    setLoading(true);
    try {
      let trendCall;
      let apiMonthParam;

      if (activePeriod === 'month') {
        apiMonthParam = activeMonthParam;           // e.g. "2026-02"
        trendCall = dashboardAPI.getDailyTrend(activeMonthParam);
      } else if (activePeriod === 'year') {
        apiMonthParam = String(activeYear);         // e.g. "2026"
        trendCall = dashboardAPI.getYearlyTrend(activeYear);
      } else {
        apiMonthParam = undefined;
        trendCall = dashboardAPI.getMonthlyTrend(6);
      }

      const [summaryRes, catsRes, trendRes] = await Promise.all([
        dashboardAPI.getSummary(activePeriod, apiMonthParam),
        dashboardAPI.getCategoryBreakdown(activePeriod, 'expense', apiMonthParam),
        trendCall,
      ]);

      setSummary(summaryRes.data);
      setCats(catsRes.data);
      // Each endpoint returns a different key
      setTrend(trendRes.data.daily ?? trendRes.data.monthly ?? trendRes.data.trend);

    } catch (err) {
      console.error('Dashboard load failed:', err);
      toast.error(`Failed to load dashboard: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(period, monthParam, selectedYear);
  }, [period, monthParam, selectedYear, load]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh', fontSize: 24 }}>
        Loading...
      </div>
    );
  }

  const balance  = summary?.balance ?? 0;
  const trendKey = period === 'month' ? 'day' : 'month';

  const cards = [
    { label: 'Income',   value: fmt(summary?.total_income),  color: '#22c55e' },
    { label: 'Expenses', value: fmt(summary?.total_expense), color: '#ef4444' },
    { label: 'Balance',  value: fmt(balance),                color: balance >= 0 ? '#22c55e' : '#ef4444' },
    { label: 'Budget',   value: (summary?.budget_percentage?.toFixed(1) ?? '0') + '%', color: '#f59e0b' },
  ];

  const trendTitle = period === 'month'
    ? `Daily Trend — ${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}`
    : period === 'year'
    ? `Monthly Trend — ${selectedYear}`
    : 'Trend';

  return (
    <div style={styles.page}>

      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>Dashboard</h1>
        <div style={styles.controls}>

          {/* Period buttons */}
          {['week', 'month', 'year', 'all'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={period === p ? 'gradient-bg' : ''}
              style={{
                padding: '8px 16px', borderRadius: 8, border: 'none',
                color: '#fff', cursor: 'pointer', textTransform: 'capitalize',
                background: period === p ? undefined : 'rgba(255,255,255,0.05)',
              }}
            >
              {p}
            </button>
          ))}

          {/* Year dropdown — show for both month and year views */}
          {(period === 'month' || period === 'year') && (
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              style={styles.select}
            >
              {YEAR_OPTIONS.map((y) => (
                <option key={y} value={y} style={{ background: '#1e1b4b' }}>{y}</option>
              ))}
            </select>
          )}

          {/* Month dropdown — only for month view */}
          {period === 'month' && (
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              style={styles.select}
            >
              {MONTH_NAMES.map((name, i) => (
                <option key={i + 1} value={i + 1} style={{ background: '#1e1b4b' }}>{name}</option>
              ))}
            </select>
          )}

        </div>
      </div>

      {/* Summary cards */}
      <div style={styles.cardsGrid}>
        {cards.map((card) => (
          <div key={card.label} className="glass card-hover" style={styles.card}>
            <p style={styles.cardLabel}>{card.label}</p>
            <p style={{ fontSize: 28, fontWeight: 'bold', color: card.color, marginTop: 8 }}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div style={styles.chartsGrid}>

        {/* Categories */}
        <div className="glass" style={styles.chartPanel}>
          <h2 style={{ marginBottom: 16 }}>Categories</h2>
          {cats?.categories?.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={cats.categories}
                  cx="50%" cy="50%"
                  outerRadius={100}
                  dataKey="total"
                  nameKey="category"
                  label={({ category, percentage }) => `${category} ${percentage}%`}
                >
                  {cats.categories.map((entry, index) => (
                    <Cell key={entry.category} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={styles.tooltip} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p style={styles.noData}>No data</p>
          )}
        </div>

        {/* Trend */}
        <div className="glass" style={styles.chartPanel}>
          <h2 style={{ marginBottom: 16 }}>{trendTitle}</h2>
          {trend?.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis
                  dataKey={trendKey}
                  stroke="#9ca3af"
                  tickFormatter={(v) => period === 'month' ? v.split('-')[2] : v}
                />
                <YAxis stroke="#9ca3af" />
                <Tooltip contentStyle={styles.tooltip} />
                <Area type="monotone" dataKey="income"  stroke="#22c55e" fill="rgba(34,197,94,0.2)" />
                <Area type="monotone" dataKey="expense" stroke="#ef4444" fill="rgba(239,68,68,0.2)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <p style={styles.noData}>No data</p>
          )}
        </div>

      </div>
    </div>
  );
};

export default DashboardPage;