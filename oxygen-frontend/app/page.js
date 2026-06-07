'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

const API_URL = 'https://oxygen-dashboard-6wgh.onrender.com'

const days = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์']
const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']
function pad(n) { return String(n).padStart(2, '0') }

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [recording, setRecording] = useState(false)
  const [now, setNow] = useState(new Date())
  
  // 🛡️ ป้องกันอาการจอแดง (Hydration Failed) จาก Next.js
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    
    const fetchData = async () => {
      try {
        const res = await fetch(`${API_URL}/api/latest/`)
        if (!res.ok) return
        const json = await res.json()
        setData(json)
        setRecording(json.recording ?? false)
      } catch (err) { console.error(err) }
    }
    fetchData()
    const interval = setInterval(fetchData, 2000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const toggleRecording = async () => {
    try {
      await fetch(`${API_URL}/api/recording/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: recording ? 'stop' : 'start' }),
      })
      setRecording(!recording)
    } catch (err) { console.error(err) }
  }

  const toggleRelay = async (num, currentState) => {
    await fetch(`${API_URL}/api/relay/${num}/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ state: !currentState }),
    })
  }

  // ดักรอให้ Client โหลดเสร็จก่อน เพื่อความเสถียรของหน้าจอ
  if (!isMounted) return <div className="min-h-screen bg-gray-100" />

  return (
    <div className="flex flex-col gap-4 bg-gray-100 min-h-screen p-6 w-full justify-start items-start">
      
      {/* ล็อคขนาดกลุ่มการ์ดไว้ที่สัดส่วน 3/5 ของหน้าจอตามเดิม */}
      <div className="w-3/5 flex flex-col gap-4">

        {/* แถวบน: การ์ดมอนิเตอร์ค่าต่างๆ */}
        <div className="grid gap-4" style={{ gridTemplateColumns: '1.8fr 1fr 1.5fr' }}>

          {/* การ์ด 1 — วัน/เวลา + อากาศ (อัปเกรดฟอนต์ใหญ่ยักษ์ + ดันความชื้นชิดขวาสุด) */}
          <Card className="bg-white rounded-2xl shadow-sm p-5 flex flex-col justify-between">
            <CardContent className="p-0 flex flex-col gap-5">
              <div className="flex items-baseline justify-between">
                <p className="text-3xl font-extrabold text-gray-800 tracking-tight">{days[now.getDay()]}</p>
                <div className="flex items-center gap-3">
                  <span className="text-base font-bold text-gray-500">
                    {now.getDate()} {months[now.getMonth()]} {now.getFullYear() + 543}
                  </span>
                  <span className="text-xl font-black text-emerald-500 bg-emerald-50 px-3 py-1 rounded-lg tabular-nums">
                    {pad(now.getHours())}:{pad(now.getMinutes())}:{pad(now.getSeconds())}
                  </span>
                </div>
              </div>
              
              {/* จุดแยกฝั่งซ้าย-ขวา ระหว่างอุณหภูมิอากาศ และความชื้นสัมพัทธ์ */}
              <div className="flex justify-between items-end border-t border-gray-100 pt-4 mt-1">
                <div>
                  <p className="text-4xl font-black text-gray-800 tracking-tight">
                    {data?.temp_air ?? '--'} <span className="text-xl font-bold text-gray-400">°C</span>
                  </p>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mt-1">อุณหภูมิอากาศ</p>
                </div>
                
                {/* 📌 ค่าวัดความชื้นสัมพัทธ์ตั้งค่าจัดชิดมุมขวาเด็ดขาด */}
                <div className="text-right">
                  <p className="text-4xl font-black text-gray-800 tracking-tight">
                    {data?.humidity ?? '--'} <span className="text-xl font-bold text-gray-400">%RH</span>
                  </p>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mt-1">ความชื้นสัมพัทธ์</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* การ์ด 2+3 ซ้อนกัน (อัปเกรดฟอนต์ตัวเลขค่าวัดให้หนาและเด่นขึ้น) */}
          <div className="flex flex-col gap-3">
            {/* การ์ด 2 — อุณหภูมิน้ำ ฟ้าอ่อน */}
            <div className="bg-blue-50/80 border border-blue-100 rounded-2xl p-4 flex flex-col justify-center flex-1">
              <p className="text-sm font-bold text-blue-700/90 uppercase tracking-wide">อุณหภูมิน้ำ</p>
              <p className="text-3xl font-black text-blue-900 mt-1.5 tracking-tight">
                {data?.temp ?? '--'} <span className="text-lg font-bold text-blue-500">°C</span>
              </p>
            </div>
            {/* การ์ด 3 — O2% เขียวอ่อน */}
            <div className="bg-green-50/80 border border-green-100 rounded-2xl p-4 flex flex-col justify-center flex-1">
              <p className="text-sm font-bold text-green-700/90 uppercase tracking-wide">ปริมาณออกซิเจน</p>
              <p className="text-3xl font-black text-green-900 mt-1.5 tracking-tight">
                {data?.o2_pct ?? '--'} <span className="text-lg font-bold text-green-500">%</span>
              </p>
            </div>
          </div>

          {/* การ์ด 4 — O2 mg/L (เพิ่มขนาดฟอนต์ให้ใหญ่ชัดเจนที่สุดบน Dashboard) */}
          <Card className="bg-white rounded-2xl shadow-sm p-5 flex flex-col justify-center">
            <CardContent className="p-0 flex flex-col">
              <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">ปริมาณออกซิเจน</p>
              <div className="flex items-baseline gap-1.5 mt-3">
                <span className="text-6xl font-black text-gray-800 tracking-tighter">
                  {data?.o2_mgl ?? '--'}
                </span>
                <span className="text-xl font-black text-gray-400">mg/L</span>
              </div>
            </CardContent>
          </Card>

        </div>

        {/* แถวล่าง — Relay + บันทึก (เพิ่มความหนาตัวอักษรของหัวข้อและปุ่มเพื่อความลงตัว) */}
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3].map((num) => {
            const state = data?.[`relay${num}`] ?? false
            return (
              <Card key={num} className="bg-white rounded-2xl shadow-sm p-4">
                <CardContent className="p-0 flex flex-col gap-3.5">
                  <div className="flex items-center gap-2 pb-1.5 border-b border-gray-50">
                    <div className={cn('w-2.5 h-2.5 rounded-full', state ? 'bg-emerald-500 animate-pulse' : 'bg-red-400')} />
                    <span className="text-sm font-extrabold text-gray-700 uppercase">Relay {num}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => toggleRelay(num, false)}
                      className="py-2.5 rounded-xl text-sm font-extrabold text-white bg-emerald-400 hover:bg-emerald-500 active:scale-95 transition-all shadow-sm"
                    >
                      เปิด
                    </button>
                    <button
                      onClick={() => toggleRelay(num, true)}
                      className="py-2.5 rounded-xl text-sm font-extrabold text-white bg-red-400 hover:bg-red-500 active:scale-95 transition-all shadow-sm"
                    >
                      ปิด
                    </button>
                  </div>
                </CardContent>
              </Card>
            )
          })}

          {/* การ์ดบันทึกข้อมูล */}
          <Card className={cn('rounded-2xl shadow-sm p-4 transition-colors', recording ? 'bg-green-50/50 border-green-200' : 'bg-white')}>
            <CardContent className="p-0 flex flex-col gap-3.5">
              <div className="flex items-center gap-2 pb-1.5 border-b border-gray-50">
                <div className={cn('w-2.5 h-2.5 rounded-full', recording ? 'bg-emerald-500 animate-pulse' : 'bg-red-400')} />
                <span className="text-sm font-extrabold text-gray-700">
                  {recording ? 'กำลังบันทึก' : 'ไม่ได้บันทึก'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={toggleRecording}
                  disabled={recording}
                  className="py-2.5 rounded-xl text-sm font-extrabold text-white bg-emerald-400 hover:bg-emerald-500 disabled:opacity-30 disabled:pointer-events-none active:scale-95 transition-all shadow-sm"
                >
                  เริ่ม
                </button>
                <button
                  onClick={toggleRecording}
                  disabled={!recording}
                  className="py-2.5 rounded-xl text-sm font-extrabold text-white bg-red-400 hover:bg-red-500 disabled:opacity-30 disabled:pointer-events-none active:scale-95 transition-all shadow-sm"
                >
                  หยุด
                </button>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  )
}