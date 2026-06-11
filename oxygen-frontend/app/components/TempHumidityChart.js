'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { AreaChart, Card } from '@tremor/react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://oxygen-dashboard-6wgh.onrender.com';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

const tempFormatter  = (n) => n == null ? '--' : `${Number(n).toFixed(1)} °C`;
const humidFormatter = (n) => n == null ? '--' : `${Number(n).toFixed(1)} %`;

function formatChange(payload, percentageChange, absoluteChange, unit) {
  if (!payload || isNaN(percentageChange)) return '--';
  const pct = `${percentageChange > 0 ? '+' : ''}${percentageChange.toFixed(1)}%`;
  const abs = `${absoluteChange >= 0 ? '+' : ''}${absoluteChange.toFixed(2)} ${unit}`;
  return `${pct} (${abs})`;
}

const HOURS_OPTIONS = [
  { label: '1 ชม.',  value: 1  },
  { label: '6 ชม.',  value: 6  },
  { label: '24 ชม.', value: 24 },
];

function safeTime(timestamp) {
  if (!timestamp) return null;
  const m = String(timestamp).match(/(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}:\d{2})/);
  if (m) return m[4];
  const d = new Date(timestamp);
  if (!isNaN(d.getTime()))
    return d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
  return null;
}

// ---- Generic chart card ----
function SensorAreaChart({ title, dataKey, color, formatter, unit, chartData, loading }) {
  const [hoverData, setHoverData] = useState(null);
  const lastLabelRef = useRef(null);

  const handleTooltip = useCallback((props) => {
    if (props.active && props.label) {
      if (lastLabelRef.current !== props.label) {
        lastLabelRef.current = props.label;
        setTimeout(() => setHoverData(props), 0);
      }
    } else {
      if (lastLabelRef.current !== null) {
        lastLabelRef.current = null;
        setTimeout(() => setHoverData(null), 0);
      }
    }
    return null;
  }, []);

  const payload      = hoverData?.payload?.[0];
  const currentValue = payload?.payload?.[dataKey];
  const currentTime  = payload?.payload?.time;

  const hoverIndex       = chartData.findIndex((e) => e.time === currentTime);
  const prevValue        = hoverIndex > 0 ? chartData[hoverIndex - 1]?.[dataKey] : undefined;
  const percentageChange = prevValue != null ? ((currentValue - prevValue) / prevValue) * 100 : NaN;
  const absoluteChange   = prevValue != null ? currentValue - prevValue : NaN;

  const displayValue = currentValue != null
    ? formatter(currentValue)
    : formatter(chartData[chartData.length - 1]?.[dataKey]);

  const displayTime  = currentTime ?? chartData[chartData.length - 1]?.time ?? '--';
  const changeStatus = formatChange(payload, percentageChange, absoluteChange, unit);

  return (
    <Card className="sm:mx-auto sm:max-w-lg">
      <p className="text-tremor-default text-tremor-content dark:text-dark-tremor-content">
        {title}
      </p>
      <p className="mt-2 text-tremor-metric font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong">
        {loading ? '...' : displayValue}
      </p>
      <p className="mt-1 flex items-baseline justify-between">
        <span className="text-tremor-default text-tremor-content dark:text-dark-tremor-content">
          เวลา {displayTime}
        </span>
        <span className={classNames(
          'rounded-tremor-small p-2 text-tremor-default font-medium',
          changeStatus === '--'
            ? 'text-tremor-content-emphasis dark:text-dark-tremor-content-emphasis'
            : percentageChange > 0
              ? 'text-emerald-700 dark:text-emerald-500'
              : 'text-red-700 dark:text-red-500',
        )}>
          {changeStatus}
        </span>
      </p>

      {!loading && chartData.length > 0 ? (
        <AreaChart
          data={chartData}
          index="time"
          categories={[dataKey]}
          colors={[color]}
          valueFormatter={formatter}
          showLegend={false}
          showYAxis={false}
          showGradient={false}
          startEndOnly={true}
          className="-mb-2 mt-8 h-48"
          customTooltip={handleTooltip}
        />
      ) : (
        <div className="mt-8 h-48 flex items-center justify-center text-tremor-content text-sm">
          {loading ? 'กำลังโหลด...' : 'ไม่มีข้อมูล'}
        </div>
      )}
    </Card>
  );
}

// ---- Main export ----
export default function TempHumidityChart() {
  const [availableDates, setAvailableDates] = useState([]);
  const [selectedDate, setSelectedDate]     = useState('');
  const [selectedHours, setSelectedHours]   = useState(24);
  const [chartData, setChartData]           = useState([]);
  const [loading, setLoading]               = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/api/available-dates/`)
      .then((r) => r.json())
      .then((data) => {
        const dates = data.dates || [];
        setAvailableDates(dates);
        if (dates.length > 0) setSelectedDate(dates[dates.length - 1]);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedDate) return;
    setLoading(true);

    const params = new URLSearchParams({ hours: selectedHours, date: selectedDate });
    fetch(`${API_BASE}/api/history/?${params}`)
      .then((r) => r.json())
      .then((raw) => {
        const items = raw.data || raw;
        const seen  = new Set();
        const data  = items
          .map((item) => {
            const t = safeTime(item.timestamp);
            if (!t || seen.has(t)) return null;
            seen.add(t);
            return {
              time:     t,
              temp_air: item.temp_air != null ? parseFloat(parseFloat(item.temp_air).toFixed(1)) : null,
              humidity: item.humidity != null ? parseFloat(parseFloat(item.humidity).toFixed(1)) : null,
            };
          })
          .filter(Boolean);
        setChartData(data);
      })
      .catch(() => setChartData([]))
      .finally(() => setLoading(false));
  }, [selectedDate, selectedHours]);

  return (
    <div className="space-y-4">

      {/* Controls — ใช้ร่วมกัน 2 กราฟ */}
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="text-sm rounded-tremor-default border border-tremor-border bg-tremor-background px-3 py-1.5 text-tremor-content-strong dark:border-dark-tremor-border dark:bg-dark-tremor-background dark:text-dark-tremor-content-strong focus:outline-none"
        >
          {availableDates.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>

        <div className="flex gap-1">
          {HOURS_OPTIONS.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => setSelectedHours(value)}
              className={classNames(
                'px-3 py-1.5 rounded-tremor-default text-sm font-medium transition-colors border',
                selectedHours === value
                  ? 'bg-tremor-brand text-white border-tremor-brand'
                  : 'bg-tremor-background text-tremor-content border-tremor-border hover:bg-tremor-background-subtle dark:bg-dark-tremor-background dark:text-dark-tremor-content dark:border-dark-tremor-border',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* กราฟอุณหภูมิอากาศ */}
      <SensorAreaChart
        title="อุณหภูมิอากาศ"
        dataKey="temp_air"
        color="orange"
        formatter={tempFormatter}
        unit="°C"
        chartData={chartData}
        loading={loading}
      />

      {/* กราฟความชื้นสัมพัทธ์ */}
      <SensorAreaChart
        title="ความชื้นสัมพัทธ์"
        dataKey="humidity"
        color="cyan"
        formatter={humidFormatter}
        unit="%"
        chartData={chartData}
        loading={loading}
      />

    </div>
  );
}