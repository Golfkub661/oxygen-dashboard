'use client'

import { useState, useEffect } from 'react'
import { RiArrowDownLine, RiArrowUpLine, RiArrowDownSLine, RiCalendar2Line } from '@remixicon/react'
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
    meta: { align: 'text-left' },
  },
  {
    header: 'O2 (%)',
    accessorKey: 'o2_pct',
    enableSorting: true,
    meta: { align: 'text-right' },
    cell: ({ getValue }) => {
      const val = getValue()
      return (
        <span className={cn(
          'font-medium',
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
    meta: { align: 'text-right' },
  },
  {
    header: 'อุณหภูมิน้ำ (°C)',
    accessorKey: 'temp',
    enableSorting: false,
    meta: { align: 'text-right' },
  },
  {
    header: 'อุณหภูมิอากาศ (°C)',
    accessorKey: 'temp_air',
    enableSorting: false,
    meta: { align: 'text-right' },
  },
  {
    header: 'ความชื้น (%RH)',
    accessorKey: 'humidity',
    enableSorting: false,
    meta: { align: 'text-right' },
  },
]

export default function HistoryPage() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [hours, setHours] = useState(1)
  const [availableDates, setAvailableDates] = useState([])
  const [selectedDate, setSelectedDate] = useState(null)
  const [mode, setMode] = useState('hours') // 'hours' | 'date'

  // ดึงวันที่มีข้อมูล
  useEffect(() => {
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

  // ดึงข้อมูลตาราง
  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true)
      try {
        let url = `${API_URL}/api/history/`
        if (mode === 'date' && selectedDate) {
          url += `?date=${selectedDate}`
        } else {
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
  }, [hours, selectedDate, mode])

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: {
      sorting: [{ id: 'timestamp', desc: true }],
    },
  })

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-xl font-semibold text-gray-800">ประวัติการบันทึก</h1>

        <div className="flex items-center gap-3">

          {/* Dropdown เลือกวัน */}
          <div className="inline-flex items-center rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <span className="px-3 py-2 bg-white border-r border-gray-200">
              <RiCalendar2Line className="size-5 text-gray-400" />
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
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
                      onClick={() => {
                        setSelectedDate(date)
                        setMode('date')
                      }}
                    >
                      {date}
                    </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* ปุ่มกรองชั่วโมง */}
          <div className="flex gap-2">
            {[1, 6, 24].map((h) => (
              <button
                key={h}
                onClick={() => {
                  setHours(h)
                  setMode('hours')
                  setSelectedDate(null)
                }}
                className={cn(
                  'px-4 py-2 rounded-xl text-sm font-medium transition-colors',
                  mode === 'hours' && hours === h
                    ? 'bg-emerald-500 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                )}
              >
                {h === 1 ? '1 ชม.' : h === 6 ? '6 ชม.' : '24 ชม.'}
              </button>
            ))}
          </div>

        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">กำลังโหลด...</div>
        ) : data.length === 0 ? (
          <div className="p-8 text-center text-gray-400">ไม่มีข้อมูลในช่วงเวลานี้</div>
        ) : (
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="bg-gray-50">
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      onClick={header.column.getToggleSortingHandler()}
                      className={cn(
                        header.column.columnDef.meta?.align,
                        header.column.getCanSort() ? 'cursor-pointer select-none' : '',
                        'text-gray-600 font-medium'
                      )}
                    >
                      <div className="flex items-center gap-2">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getCanSort() && (
                          header.column.getIsSorted() === 'asc' ? (
                            <RiArrowUpLine className="size-4" />
                          ) : header.column.getIsSorted() === 'desc' ? (
                            <RiArrowDownLine className="size-4" />
                          ) : (
                            <RiArrowUpLine className="size-4 opacity-30" />
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
                <TableRow key={row.id} className="hover:bg-gray-50">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cn(cell.column.columnDef.meta?.align, 'text-gray-700')}
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
        <p className="text-sm text-gray-400 text-right">
          แสดง {data.length} รายการ (เฉลี่ยทุก 1 นาที)
          {mode === 'date' ? ` — วันที่ ${selectedDate}` : ` — ย้อนหลัง ${hours} ชั่วโมง`}
        </p>
      )}

    </div>
  )
}