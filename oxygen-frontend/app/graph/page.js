'use client';

import O2AreaChart from '../components/O2AreaChart';
import TempHumidityChart from '../components/TempHumidityChart';
import WeatherRelationChart from '../components/WeatherRelationChart';

export default function GraphPage() {
  return (
    /* - w-4/5: กำหนดพื้นที่การ์ดรวมให้กินพื้นที่ 4 ใน 5 ส่วนของหน้าจอพอดี (80%) 
      - mx-auto: จัดกึ่งกลางหน้าจอ (แบ่งพื้นที่ว่างซ้ายขวาฝั่งละ 10% หรือเท่ากับฝั่งละ 0.5/5 ส่วน เท่ากันเป๊ะ)
    */
    <div className="p-4 h-screen flex flex-col gap-4 w-4/5 mx-auto">

      {/* แถว 1: O2AreaChart + WeatherRelationChart — สูง 20vh */}
      <div className="grid grid-cols-2 gap-4" style={{ height: '35vh' }}>
        <div className="rounded-xl border border-border bg-card p-3 shadow-sm overflow-hidden h-full">
          <O2AreaChart />
        </div>
        <div className="rounded-xl border border-border bg-card p-3 shadow-sm overflow-hidden h-full">
          <WeatherRelationChart />
        </div>
      </div>

      {/* แถว 2: TempHumidityChart ครึ่งซ้าย — สูง 20vh */}
      <div className="grid grid-cols-2 gap-4" style={{ height: '35vh' }}>
        <div className="rounded-xl border border-border bg-card p-3 shadow-sm overflow-hidden h-full">
          <TempHumidityChart />
        </div>
        {/* ช่องขวาว่างคงไว้ตามโครงสร้างเดิมของคุณ Golf */}
      </div>

    </div>
  );
}