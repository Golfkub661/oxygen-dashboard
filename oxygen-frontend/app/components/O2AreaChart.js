'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Calendar, Clock } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://oxygen-dashboard-6wgh.onrender.com';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

const mglFormatter = (number) => {
  if (number == null) return '--';
  return `${Number(number).toFixed(2)} mg/L`;
};

function formatChange(percentageChange, absoluteChange) {
  if (isNaN(percentageChange)) return '--';
  const pct = `${percentageChange > 0 ? '+' : ''}${percentageChange.toFixed(1)}%`;
  const abs = `${absoluteChange >= 0 ? '+' : ''}${absoluteChange.toFixed(2)} mg/L`;
  return `${pct} (${abs})`;
}

const HOURS_OPTIONS = [
  { label: '1 ชม.',  value: 1  },
  { label: '6 ชม.',  value: 6  },
  { label: '24 ชม.', value: 24 },
];

function safeTime(timestamp) {
  if (!timestamp) return null;
  const thaiMatch = String(timestamp).match(/(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}:\d{2})/);
  if (thaiMatch) return thaiMatch[4];
  const d = new Date(timestamp);
  if (!isNaN(d.getTime())) {
    return d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
  }
  return null;
}

export default function O2AreaChart() {
  const [availableDates, setAvailableDates] = useState([]);
  const [selectedDate, setSelectedDate]     = useState('');
  const [selectedHours, setSelectedHours]   = useState(24);
  const [chartData, setChartData]           = useState([]);
  const [loading, setLoading]               = useState(false);
  const [hoverData, setHoverData]           = useState(null);
  const containerRef  = useRef(null);

  // 1. ดึงข้อมูลวันที่ที่มีทั้งหมดตอนเริ่มต้นครั้งแรกครั้งเดียว
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

  // 2. โซนดึงข้อมูลประวัติกราฟ และสั่ง Auto Re-fetch ทุกๆ 1 นาที
  useEffect(() => {
    if (!selectedDate) return;

    const fetchData = (isSilent = false) => {
      if (!isSilent) setLoading(true);
      
      const params = new URLSearchParams({ hours: selectedHours, date: selectedDate });
      fetch(`${API_BASE}/api/history/?${params}`)
        .then((r) => r.json())
        .then((raw) => {
          const items = raw.data || raw;
          const seen = new Set();
          const data = items
            .map((item) => {
              const t = safeTime(item.timestamp);
              if (!t) return null;
              if (seen.has(t)) return null;
              seen.add(t);
              
              const mglRaw = item.o2_mgl ?? item.mgl ?? null;
              const mgl = mglRaw != null ? parseFloat(parseFloat(mglRaw).toFixed(2)) : null;
              return { time: t, mgl };
            })
            .filter(Boolean)
            .reverse(); // 🌟 แก้ไข: กลับลำดับข้อมูลจากเก่าไปใหม่เพื่อให้กราฟเรียงถูกต้อง
          setChartData(data);
        })
        .catch(() => setChartData([]))
        .finally(() => {
          if (!isSilent) setLoading(false);
        });
    };

    fetchData(false);

    const intervalId = setInterval(() => {
      fetchData(true);
    }, 60000);

    return () => clearInterval(intervalId);
  }, [selectedDate, selectedHours]);

  const handleMouseMove = useCallback((state) => {
    if (state && state.activePayload && state.activePayload.length > 0) {
      setHoverData(state.activePayload[0].payload);
    } else {
      setHoverData(null);
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHoverData(null);
  }, []);

  // ปรับการดึงข้อมูลจุดล่าสุด: หลังจาก .reverse() แล้ว ข้อมูลล่าสุดจะย้ายไปอยู่ตัวสุดท้ายของ Array (chartData.length - 1)
  const activePoint    = hoverData ?? chartData[chartData.length - 1];
  const currentValue   = activePoint?.mgl;
  const currentTime    = activePoint?.time ?? '--';
  const currentIndex   = chartData.findIndex((e) => e.time === currentTime);
  
  // ปรับการหาค่าก่อนหน้า (prevValue) ให้สัมพันธ์กับลำดับใหม่ (ย้อนไป 1 index ก่อนหน้า)
  const prevValue      = currentIndex > 0 ? chartData[currentIndex - 1]?.mgl : undefined;
  
  const percentageChange = prevValue != null ? ((currentValue - prevValue) / prevValue) * 100 : NaN;
  const absoluteChange   = prevValue != null ? currentValue - prevValue : NaN;
  const displayValue   = currentValue != null ? mglFormatter(currentValue) : '--';
  const changeStatus   = formatChange(percentageChange, absoluteChange);

  return (
    <div className="flex flex-col h-full w-full justify-between bg-white text-left p-4 rounded-2xl shadow-xs" ref={containerRef}>
      
      {/* ส่วนหัวของการ์ด */}
      <div className="flex justify-between items-start w-full mb-3">
        <div className="flex flex-col gap-1">
          <span className="text-[12px] text-gray-400 font-semibold tracking-wide">ปริมาณออกซิเจนละลายน้ำ</span>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-3xl font-bold text-gray-800 tracking-tight leading-none">
              {loading ? '...' : displayValue}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[12px] mt-1">
            <span className="flex items-center gap-1 font-semibold text-emerald-500">
              <Clock className="w-3.5 h-3.5 text-emerald-500" /> เวลา {currentTime}
            </span>
            <span className={classNames(
              'px-1.5 py-0.5 rounded-sm font-bold text-[10px]',
              changeStatus === '--'
                ? 'text-gray-400 bg-gray-50'
                : percentageChange > 0
                  ? 'text-emerald-600 bg-emerald-50'
                  : 'text-red-600 bg-red-50',
            )}>
              {changeStatus}
            </span>
          </div>
        </div>

        {/* ปุ่มเมนูคอนโทรลขวาบน */}
        <div className="flex items-center gap-2.5">
          <div className="relative flex items-center bg-white border border-gray-200 rounded-xl px-2.5 py-1.5 shadow-2xs hover:border-gray-300 transition-all duration-150">
            <Calendar className="w-3.5 h-3.5 text-gray-400 mr-1.5 pointer-events-none" />
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-xs font-semibold text-gray-700 bg-transparent pr-4 focus:outline-none appearance-none cursor-pointer"
            >
              {availableDates.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            <div className="absolute right-2.5 pointer-events-none text-gray-400 text-[9px]">▼</div>
          </div>

          <div className="flex gap-0.5 bg-gray-100/80 p-0.5 rounded-xl border border-gray-100/50 shadow-2xs">
            {HOURS_OPTIONS.map(({ label, value }) => (
              <button
                key={value}
                onClick={() => setSelectedHours(value)}
                className={classNames(
                  'px-3 py-1 rounded-lg text-[11px] font-bold transition-all duration-200',
                  selectedHours === value
                    ? 'bg-white text-gray-800 shadow-xs font-extrabold'
                    : 'text-gray-400 hover:text-gray-700',
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 📊 โซนตัวกราฟพื้นที่ (Area Chart) */}
      <div className="w-full min-w-0 flex-1 mt-4 relative" style={{ minHeight: '165px' }}>
        {!loading && chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 15, right: 10, left: -5, bottom: 10 }}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            >
              <defs>
                <linearGradient id="colorO2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.22}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.00}/>
                </linearGradient>
              </defs>
              
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#cbd5e1" />
              
              <XAxis
                dataKey="time"
                axisLine={false} // 🌟 แก้ไข: นำ reversed={true} ออกตามที่แจ้งแล้วครับ
                tickLine={false}
                tick={{ fill: '#334155', fontSize: 12, fontWeight: 600 }}
                dy={10}
                ticks={[chartData[0]?.time, chartData[chartData.length - 1]?.time].filter(Boolean)}
              />
              <YAxis
                type="number"
                domain={[0, 20]}
                ticks={[0, 4, 8, 12, 16, 20]}
                interval={0}
                width={35}
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#475569', fontSize: 12, fontWeight: 600 }}
                dx={-5}
              />
              <Tooltip content={() => null} />
              <Area
                type="monotone"
                dataKey="mgl"
                stroke="#10b981"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorO2)"
                activeDot={{ r: 5, strokeWidth: 0, fill: '#10b981' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-xs font-semibold border border-dashed border-gray-100 rounded-xl bg-gray-50">
            {loading ? 'กำลังซิงค์ข้อมูลเรียลไทม์...' : 'ไม่มีข้อมูลในช่วงเวลาดังกล่าว'}
          </div>
        )}
      </div>
    </div>
  );
}