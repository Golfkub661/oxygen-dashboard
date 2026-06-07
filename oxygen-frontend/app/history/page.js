'use client'


import { useState, useEffect } from 'react'
import { RiArrowDownLine, RiArrowUpLine, RiArrowDownSLine, RiCalendar2Line, RiTimeLine } from '@remixicon/react'
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
    header: 'อุณหภูมิน้ำ (°C)',
    accessorKey: 'temp',
    enableSorting: false,
    meta: { align: 'text-center' },
  },
  {
    header: 'อุณหภูมิอากาศ (°C)',
    accessorKey: 'temp_air',
    enableSorting: false,
    meta: { align: 'text-center' },
  },
  {
    header: 'ความชื้น (%RH)',
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
  // 🎯 ใช้ state นี้เพื่อบันทึกว่าผู้ใช้คลิกเปลี่ยนอะไร "ล่าสุด" (ดึงข้อมูลตามตัวนั้นทันที)
  const [lastActiveFilter, setLastActiveFilter] = useState('hours') // 'hours' | 'date'
  const [isMounted, setIsMounted] = useState(false)
  
  // ดึงวันที่มีข้อมูลทั้งหมดจาก API
  useEffect(() => {
    setIsMounted(true)
    const fetchDates = async () => {
      try {
        const res = await fetch(`${API_URL}/api/available-dates/`)
        if (!res.ok) return
        const json = await res.json()
        setAvailableDates(json.dates ?? [])
      } catch (err) {
        console.error(err)
      }
    }
    fetchDates()
  }, [])


  // ดึงข้อมูลตารางตามเงื่อนไขตัวกรองล่าสุด
  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true)
      try {
        let url = `${API_URL}/api/history/`
       
        // ถ้าระบบจำได้ว่าผู้ใช้เพิ่งคลิกเลือก "วันที่" ล่าสุด ให้ดึงข้อมูลวันที่
        if (lastActiveFilter === 'date' && selectedDate) {
          url += `?date=${selectedDate}`
        } else {
          // ถ้าเพิ่งคลิกเปลี่ยน "รายชั่วโมง" (เช่น กด 1 -> 6 ชม.) ให้ยิงค้นหาตามชั่วโมงทันที
          url += `?hours=${hours}`
        }
       
        const res = await fetch(url)
        if (!res.ok) return
        const json = await res.json()
        setData(json.data ?? [])
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchHistory()
  }, [hours, selectedDate, lastActiveFilter]) // คอยจับตาดูตัวแปรคัดกรองล่าสุด


  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: {
      sorting: [{ id: 'timestamp', desc: true }],
    },
  })

  if (!isMounted) return <div className="min-h-screen bg-gray-100" />

  const getHoursLabel = (h) => {
    if (h === 1) return 'ย้อนหลัง 1 ชม.'
    if (h === 6) return 'ย้อนหลัง 6 ชม.'
    if (h === 24) return 'ย้อนหลัง 24 ชม.'
    return `ย้อนหลัง ${h} ชม.`
  }

  return (
    <div className="w-full bg-gray-100 min-h-screen p-6">
      <div className="w-4/5 mx-auto flex flex-col gap-6">

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight">ประวัติการบันทึก</h1>

          <div className="flex items-center gap-3">
           
            {/* Dropdown 1: เลือกวันที่ */}
            <div className="inline-flex items-center rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <span className="px-3 py-2 bg-white border-r border-gray-200">
                <RiCalendar2Line className="size-5 text-gray-400" />
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className={cn(
                    "flex items-center gap-2 px-4 py-2 bg-white text-sm font-semibold transition-colors hover:bg-gray-50",
                    lastActiveFilter === 'date' ? "text-emerald-600" : "text-gray-700"
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
                        onClick={() => {
                          setSelectedDate(date)
                          setLastActiveFilter('date') // บอกระบบว่าต้องการดูข้อมูลแบบระบุวันที่
                        }}
                      >
                        {date}
                      </DropdownMenuItem>
                    ))
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>


            {/* Dropdown 2: เลือกช่วงเวลา */}
            <div className="inline-flex items-center rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <span className="px-3 py-2 bg-white border-r border-gray-200">
                <RiTimeLine className="size-5 text-gray-400" />
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className={cn(
                    "flex items-center gap-2 px-4 py-2 bg-white text-sm font-semibold transition-colors hover:bg-gray-50",
                    lastActiveFilter === 'hours' ? "text-emerald-600" : "text-gray-700"
                  )}>
                    {getHoursLabel(hours)}
                    <RiArrowDownSLine className="size-4 text-gray-500" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  {[1, 6, 24].map((h) => (
                    <DropdownMenuItem
                      key={h}
                      className={cn(hours === h && "bg-emerald-50 text-emerald-600 font-medium")}
                      onClick={() => {
                        setHours(h)
                        setLastActiveFilter('hours') // ⚡ สั่งให้ระบบเปลี่ยนไปดึงข้อมูลตามชั่วโมงทันทีโดยไม่ต้องคลิกวันที่ใหม่!
                      }}
                    >
                      {h === 1 ? '1 ชม.' : h === 6 ? '6 ชม.' : '24 ชม.'}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
          {loading ? (
            <div className="p-12 text-center text-base font-medium text-gray-400">กำลังโหลดข้อมูล...</div>
          ) : data.length === 0 ? (
            <div className="p-12 text-center text-base font-medium text-gray-400">ไม่มีข้อมูลในช่วงเวลานี้</div>
          ) : (
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
                          'text-gray-500 font-bold py-3.5 text-sm uppercase tracking-wider'
                        )}
                      >
                        <div className="flex items-center gap-1.5 justify-center">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {header.column.getCanSort() && (
                            header.column.getIsSorted() === 'asc' ? (
                              <RiArrowUpLine className="size-4 text-emerald-500" />
                            ) : header.column.getIsSorted() === 'desc' ? (
                              <RiArrowDownLine className="size-4 text-emerald-500" />
                            ) : (
                              <RiArrowUpLine className="size-4 opacity-20" />
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
                          'text-gray-700 py-3.5 font-medium text-sm'
                        )}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {data.length > 0 && (
          <p className="text-sm font-semibold text-gray-400 text-right">
            แสดง {data.length} รายการ (เฉลี่ยทุก 1 นาที)
            {lastActiveFilter === 'date' ? ` — วันที่ ${selectedDate}` : ` — ย้อนหลัง ${hours} ชั่วโมง`}
          </p>
        )}

      </div>
    </div>
  )
}