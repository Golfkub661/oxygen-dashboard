'use client'

import { usePathname } from 'next/navigation'
import { Home, BarChart2, ClipboardList } from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import NavMain from './NavMain'

const menus = [
  { id: 'home',    href: '/',        label: 'หน้าแรก',          icon: <Home className="size-4" /> },
  { id: 'graph',   href: '/graph',   label: 'กราฟแสดงผล',       icon: <BarChart2 className="size-4" /> },
  { id: 'history', href: '/history', label: 'ประวัติการบันทึก',  icon: <ClipboardList className="size-4" /> },
]

export default function DashboardSidebar() {
  const pathname = usePathname()

  const routes = menus.map((menu) => ({
    id: menu.id,
    title: menu.label,
    icon: menu.icon,
    link: menu.href,
  }))

  return (
    <Sidebar collapsible="icon" className="bg-gray-100 border-none">
      <SidebarHeader className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🐟</span>
            <span className="font-semibold text-lg group-data-[collapsible=icon]:hidden">
              Oxygen Monitor
            </span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="px-2">
        <NavMain routes={routes} />
      </SidebarContent>
    </Sidebar>
  )
}