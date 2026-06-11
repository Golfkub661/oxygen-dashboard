'use client'

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  useSidebar,
} from '@/components/ui/sidebar'
import { ChevronDown, ChevronUp } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

export default function NavMain({ routes }) {
  const { state } = useSidebar()
  const isCollapsed = state === 'collapsed'
  const [openCollapsible, setOpenCollapsible] = useState(null)
  const pathname = usePathname()

  return (
    <SidebarMenu>
      {routes.map((route) => {
        const isOpen = !isCollapsed && openCollapsible === route.id
        const hasSubRoutes = !!route.subs?.length
        
        const isParentActive = pathname === route.link
        const isSubActive = route.subs?.some((sub) => pathname === sub.link)
        const isActive = isParentActive || isSubActive

        return (
          <SidebarMenuItem key={route.id}>
            {hasSubRoutes ? (
              <Collapsible
                open={isOpen}
                onOpenChange={(open) =>
                  setOpenCollapsible(open ? route.id : null)
                }
                className="w-full"
              >
                <CollapsibleTrigger asChild>
                  {/* เพิ่ม px-4 และ py-5 เพื่อเพิ่มพื้นที่ผิวสัมผัสปุ่มให้ดูหนาและสวยเต็มตากับกรอบขนาดใหญ่ */}
                  <SidebarMenuButton 
                    isActive={isActive}
                    className={`transition-all duration-200 group/btn px-4 py-5
                      ${isActive 
                        ? "!bg-emerald-50 !text-emerald-700 font-semibold dark:!bg-emerald-950/40 dark:!text-emerald-400" 
                        : "text-muted-foreground hover:!text-emerald-700 hover:!bg-emerald-50/60 focus:!bg-emerald-50/60 active:!bg-emerald-50 active:!text-emerald-700"
                      }
                    `}
                  >
                    <div className={`transition-colors duration-200 
                      ${isActive 
                        ? "!text-emerald-600" 
                        : "text-muted-foreground group-hover/btn:!text-emerald-600 group-active/btn:!text-emerald-600"
                      }
                    `}>
                      {route.icon}
                    </div>

                    {!isCollapsed && (
                      /* 👉 เปลี่ยนจาก ml-2 เป็น ml-4 ขยับข้อความให้ห่างจากไอคอนอย่างสวยงาม */
                      <span className={`ml-4 flex-1 text-sm font-medium transition-colors duration-200
                        ${isActive 
                          ? "text-emerald-700" 
                          : "group-hover/btn:text-emerald-700 group-active/btn:text-emerald-700"
                        }
                      `}>
                        {route.title}
                      </span>
                    )}
                    {!isCollapsed && (
                      <span className="ml-auto">
                        {isOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                      </span>
                    )}
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                {!isCollapsed && (
                  <CollapsibleContent>
                    {/* ปรับระยะเยื้องเมนูย่อยให้ขยับตามพื้นที่ที่ขยายขึ้น */}
                    <SidebarMenuSub className="ml-6 pl-4 border-l border-gray-200">
                      {route.subs?.map((sub) => {
                        const isCurrentSubActive = pathname === sub.link;
                        return (
                          <SidebarMenuItem key={sub.title}>
                            <SidebarMenuSubButton 
                              isActive={isCurrentSubActive} 
                              asChild
                              className={`transition-all duration-200 py-2
                                ${isCurrentSubActive 
                                  ? "!text-emerald-700 font-medium" 
                                  : "text-muted-foreground hover:!text-emerald-600 active:!text-emerald-600"
                                }
                              `}
                            >
                              <Link href={sub.link}>{sub.title}</Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuItem>
                        )
                      })}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                )}
              </Collapsible>
            ) : (
              /* สำหรับเมนูเดี่ยวที่ไม่มีเมนูย่อย (หน้าแรก, กราฟแสดงผล, ประวัติการบันทึก) */
              <SidebarMenuButton 
                tooltip={route.title} 
                isActive={isActive} 
                asChild
                className={`transition-all duration-200 group/item px-4 py-5
                  ${isActive 
                    ? "!bg-emerald-50 !text-emerald-700 font-semibold dark:!bg-emerald-950/40 dark:!text-emerald-400" 
                    : "text-muted-foreground hover:!text-emerald-700 hover:!bg-emerald-50/60 focus:!bg-emerald-50/60 active:!bg-emerald-50 active:!text-emerald-700"
                  }
                `}
              >
                <Link href={route.link} className="flex items-center w-full">
                  <div className={`transition-colors duration-200
                    ${isActive 
                      ? "!text-emerald-600" 
                      : "text-muted-foreground group-hover/item:!text-emerald-600 group-active/item:!text-emerald-600"
                    }
                  `}>
                    {route.icon}
                  </div>
                  
                  {!isCollapsed && (
                    /* 👉 เปลี่ยนจาก ml-2 เป็น ml-4 ขยับข้อความให้ห่างจากไอคอนของเมนูเดี่ยว */
                    <span className={`ml-4 text-sm font-medium transition-colors duration-200
                      ${isActive 
                        ? "text-emerald-700" 
                        : "group-hover/item:text-emerald-700 group-active/item:text-emerald-700"
                      }
                    `}>
                      {route.title}
                    </span>
                  )}
                </Link>
              </SidebarMenuButton>
            )}
          </SidebarMenuItem>
        )
      })}
    </SidebarMenu>
  )
}