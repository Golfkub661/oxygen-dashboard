'use client'

import { useState, useEffect } from 'react'

const API_URL = 'https://oxygen-dashboard-6wgh.onrender.com'

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [recording, setRecording] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
  try {
    const res = await fetch(`${API_URL}/api/latest/`)
    if (!res.ok) return  // ถ้า Render หลับ ไม่ต้อง parse JSON
    const json = await res.json()
    setData(json)
    setRecording(json.recording ?? false)
    setLoading(false)
  } catch (err) {
    console.error(err)
  }
}
    fetchData()
    const interval = setInterval(fetchData, 2000)
    return () => clearInterval(interval)
  }, [])

  const toggleRecording = async () => {
    try {
      await fetch(`${API_URL}/api/recording/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recording: !recording }),
      })
      setRecording(!recording)
    } catch (err) {
      console.error(err)
    }
  }

  if (loading) return <div className="p-8 text-white">กำลังโหลด...</div>

  return (
    <main className="min-h-screen bg-gray-900 text-white p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">🐟 Oxygen Dashboard</h1>
        <button
          onClick={toggleRecording}
          className={`px-6 py-2 rounded-xl font-semibold ${
            recording
              ? 'bg-red-500 hover:bg-red-600'
              : 'bg-green-500 hover:bg-green-600'
          }`}
        >
          {recording ? '⏹ หยุดบันทึก' : '⏺ เริ่มบันทึก'}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <Card title="O2 (%)" value={data?.o2_pct} unit="%" color="text-green-400" />
        <Card title="O2 (mg/L)" value={data?.o2_mgl} unit="mg/L" color="text-blue-400" />
        <Card title="อุณหภูมิน้ำ" value={data?.temp} unit="°C" color="text-yellow-400" />
        <Card title="อุณหภูมิอากาศ" value={data?.temp_air} unit="°C" color="text-orange-400" />
        <Card title="ความชื้น" value={data?.humidity} unit="%" color="text-purple-400" />
      </div>

      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-3">Relay</h2>
        <div className="flex gap-4">
          <RelayButton num={1} state={data?.relay1} apiUrl={API_URL} />
          <RelayButton num={2} state={data?.relay2} apiUrl={API_URL} />
          <RelayButton num={3} state={data?.relay3} apiUrl={API_URL} />
        </div>
      </div>
    </main>
  )
}

function Card({ title, value, unit, color }) {
  return (
    <div className="bg-gray-800 rounded-xl p-4">
      <p className="text-gray-400 text-sm">{title}</p>
      <p className={`text-3xl font-bold mt-1 ${color}`}>
        {value ?? '--'} <span className="text-lg">{unit}</span>
      </p>
    </div>
  )
}

function RelayButton({ num, state, apiUrl }) {
  const toggle = async () => {
    await fetch(`${apiUrl}/api/relay/${num}/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ state: !state }),
    })
  }

  return (
    <button
      onClick={toggle}
      className={`px-6 py-3 rounded-xl font-semibold ${
        state ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-600 hover:bg-gray-500'
      }`}
    >
      Relay {num} {state ? 'ON' : 'OFF'}
    </button>
  )
}