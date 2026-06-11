'use client'

import { useState, useEffect } from 'react'
import { RiArrowDownLine, RiArrowUpLine, RiArrowDownSLine, RiCalendar2Line, RiTimeLine, RiDownloadLine } from '@remixicon/react'
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

const API_URL = 'https://oxygen-dashboard-6wgh.onrender.com'

const columns = [
  {
    header: 'เวลา',
    accessorKey: 'timestamp',
    enableSorting: true,
    meta: { align: 'text-center' },
  },
  {
    header: 'O2 (%)',
    accessorKey: 'o2_pct',
    enableSorting: true,
    meta: { align: 'text-center' },
    cell: ({ getValue }) => {
      const val = getValue()
      return (
        <span className={cn(
          'font-semibold text-base',
          val >= 80 ? 'text-emerald-600' :
          val >= 50 ? 'text-yellow-600' : 'text-red-600'
        )}>
          {val}
        </span>
      )
    },
  },
  {
    header: 'O2 (mg/L)',
    accessorKey: 'o2_mgl',
    enableSorting: true,
    meta: { align: 'text-center' },
  },
  {
    header: 'อุณหภูมิน้ำ',
    accessorKey: 'temp',
    enableSorting: false,
    meta: { align: 'text-center' },
  },
  {
    header: 'อุณหภูมิอากาศ',
    accessorKey: 'temp_air',
    enableSorting: false,
    meta: { align: 'text-center' },
  },
  {
    header: 'ความชื้น',
    accessorKey: 'humidity',
    enableSorting: false,
    meta: { align: 'text-center' },
  },
]

export default function HistoryPage() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [hours, setHours] = useState(1)
  const [availableDates, setAvailableDates] = useState([])
  const [selectedDate, setSelectedDate] = useState(null)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    const fetchDates = async () => {
      try {
        const res = await fetch(`${API_URL}/api/available-dates/`)
        if (!res.ok) return
        const json = await res.json()
        setAvailableDates(json.dates ?? [])
      } catch (err) { console.error(err) }
    }
    fetchDates()
  }, [])

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true)
      try {
        let url = `${API_URL}/api/history/?hours=${hours}`
        if (selectedDate) url += `&date=${selectedDate}`
        const res = await fetch(url)
        if (!res.ok) return
        const json = await res.json()
        setData(json.data ?? [])
      } catch (err) { console.error(err) }
      finally { setLoading(false) }
    }
    fetchHistory()
  }, [hours, selectedDate])

  const handleExportCSV = () => {
    if (data.length === 0) return
    const headers = ['เวลา', 'O2 (%)', 'O2 (mg/L)', 'อุณหภูมิน้ำ (°C)', 'อุณหภูมิอากาศ (°C)', 'ความชื้น (%RH)']
    const rows = data.map(row => [row.timestamp, row.o2_pct, row.o2_mgl, row.temp, row.temp_air, row.humidity])
    const csvContent = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    const filename = selectedDate
      ? `oxygen_${selectedDate.replace(/\//g, '-')}_${hours}h.csv`
      : `oxygen_last_${hours}h.csv`
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
  }

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: { sorting: [{ id: 'timestamp', desc: true }] },
  })

  if (!isMounted) return <div className="min-h-screen bg-gray-100" />

  const getHoursLabel = (h) => {
    if (h === 1) return 'ย้อนหลัง 1 ชม.'
    if (h === 6) return 'ย้อนหลัง 6 ชม.'
    if (h === 24) return 'ย้อนหลัง 24 ชม.'
    return `ย้อนหลัง ${h} ชม.`
  }

  return (
    <div className="w-full bg-gray-100 min-h-screen p-3 sm:p-6">
      <div className="w-full sm:w-4/5 mx-auto flex flex-col gap-4 sm:gap-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800 tracking-tight">ประวัติการบันทึก</h1>

          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">

            {/* Dropdown วันที่ */}
            <div className="inline-flex items-center rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <span className="px-2 sm:px-3 py-2 bg-white border-r border-gray-200">
                <RiCalendar2Line className="size-4 sm:size-5 text-gray-400" />
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className={cn(
                    "flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-white text-xs sm:text-sm font-semibold transition-colors hover:bg-gray-50",
                    selectedDate ? "text-emerald-600" : "text-gray-700"
                  )}>
                    {selectedDate ?? 'เลือกวันที่'}
                    <RiArrowDownSLine className="size-4 text-gray-500" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="max-h-60 overflow-y-auto">
                  {availableDates.length === 0 ? (
                    <DropdownMenuItem disabled>ไม่มีข้อมูล</DropdownMenuItem>
                  ) : (
                    availableDates.map((date) => (
                      <DropdownMenuItem
                        key={date}
                        className={cn(selectedDate === date && "bg-emerald-50 text-emerald-600 font-medium")}
                        onClick={() => setSelectedDate(date)}
                      >
                        {date}
                      </DropdownMenuItem>
                    ))
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Dropdown ช่วงเวลา */}
            <div className="inline-flex items-center rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <span className="px-2 sm:px-3 py-2 bg-white border-r border-gray-200">
                <RiTimeLine className="size-4 sm:size-5 text-gray-400" />
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-white text-xs sm:text-sm font-semibold text-emerald-600 transition-colors hover:bg-gray-50">
                    {getHoursLabel(hours)}
                    <RiArrowDownSLine className="size-4 text-gray-500" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-36 sm:w-44">
                  {[1, 6, 24].map((h) => (
                    <DropdownMenuItem
                      key={h}
                      className={cn(hours === h && "bg-emerald-50 text-emerald-600 font-medium")}
                      onClick={() => setHours(h)}
                    >
                      {h === 1 ? '1 ชม.' : h === 6 ? '6 ชม.' : '24 ชม.'}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Export */}
            <button
              onClick={handleExportCSV}
              disabled={data.length === 0}
              className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-white rounded-xl border border-gray-200 shadow-sm text-xs sm:text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <RiDownloadLine className="size-4" />
              Export
            </button>

          </div>
        </div>

        {/* Table — scroll แนวนอนบนมือถือ */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
          {loading ? (
            <div className="p-12 text-center text-base font-medium text-gray-400">กำลังโหลดข้อมูล...</div>
          ) : data.length === 0 ? (
            <div className="p-12 text-center text-base font-medium text-gray-400">ไม่มีข้อมูลในช่วงเวลานี้</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id} className="bg-gray-50/70 hover:bg-gray-50/70">
                      {headerGroup.headers.map((header) => (
                        <TableHead
                          key={header.id}
                          onClick={header.column.getToggleSortingHandler()}
                          className={cn(
                            header.column.columnDef.meta?.align,
                            header.column.getCanSort() ? 'cursor-pointer select-none' : '',
                            'text-gray-500 font-bold py-3 text-xs uppercase tracking-wider whitespace-nowrap px-3'
                          )}
                        >
                          <div className="flex items-center gap-1 justify-center">
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {header.column.getCanSort() && (
                              header.column.getIsSorted() === 'asc' ? (
                                <RiArrowUpLine className="size-3.5 text-emerald-500" />
                              ) : header.column.getIsSorted() === 'desc' ? (
                                <RiArrowDownLine className="size-3.5 text-emerald-500" />
                              ) : (
                                <RiArrowUpLine className="size-3.5 opacity-20" />
                              )
                            )}
                          </div>
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id} className="hover:bg-gray-50/80 transition-colors border-b border-gray-100">
                      {row.getVisibleCells().map((cell) => (
                        <TableCell
                          key={cell.id}
                          className={cn(
                            cell.column.columnDef.meta?.align,
                            'text-gray-700 py-3 font-medium text-xs sm:text-sm whitespace-nowrap px-3'
                          )}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {data.length > 0 && (
          <p className="text-xs sm:text-sm font-semibold text-gray-400 text-right">
            แสดง {data.length} รายการ (เฉลี่ยทุก 1 นาที)
            {selectedDate
              ? ` — วันที่ ${selectedDate} ${getHoursLabel(hours)}`
              : ` — ย้อนหลัง ${hours} ชั่วโมง`}
          </p>
        )}

      </div>
    </div>
  )
}