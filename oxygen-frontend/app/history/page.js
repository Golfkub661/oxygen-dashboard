'use client'

import { useState, useEffect } from 'react'
import { RiArrowDownLine, RiArrowUpLine } from '@remixicon/react'
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

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true)
      try {
        const res = await fetch(`${API_URL}/api/history/?hours=${hours}`)
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
  }, [hours])

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
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-800">ประวัติการบันทึก</h1>
        <div className="flex gap-2">
          {[1, 6, 24].map((h) => (
            <button
              key={h}
              onClick={() => setHours(h)}
              className={cn(
                'px-4 py-2 rounded-xl text-sm font-medium transition-colors',
                hours === h
                  ? 'bg-emerald-500 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              )}
            >
              {h === 1 ? '1 ชั่วโมง' : h === 6 ? '6 ชั่วโมง' : '24 ชั่วโมง'}
            </button>
          ))}
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
                      <div className="flex items-center justify-between gap-2">
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
          แสดง {data.length} รายการ (เฉลี่ยทุก 1 นาที) — ย้อนหลัง {hours} ชั่วโมง
        </p>
      )}

    </div>
  )
}