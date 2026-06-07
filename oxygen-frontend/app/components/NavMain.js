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
  SidebarMenuSubButton,
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
        
        // ตรวจสอบสถานะ Active: หน้าปัจจุบันตรงกับ link หลัก หรือตรงกับ link ของเมนูย่อย (subs)
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
                  {/* ปรับสีให้จางลง (text-muted-foreground) และจะเข้มขึ้นเมื่อ hover หรือ active */}
                  <SidebarMenuButton 
                    isActive={isActive}
                    className={`transition-all duration-200 group/btn
                      ${isActive 
                        ? "text-sidebar-foreground font-semibold" 
                        : "text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent"
                      }
                    `}
                  >
                    {/* บังคับสีไอคอนให้จางและเข้มตามสถานะ */}
                    <div className={`transition-colors duration-200 
                      ${isActive ? "text-sidebar-foreground" : "text-muted-foreground group-hover/btn:text-sidebar-foreground"}
                    `}>
                      {route.icon}
                    </div>

                    {!isCollapsed && (
                      <span className="ml-2 flex-1 text-sm font-medium">
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
                    <SidebarMenuSub>
                      {route.subs?.map((sub) => {
                        const isCurrentSubActive = pathname === sub.link;
                        return (
                          <SidebarMenuItem key={sub.title}>
                            <SidebarMenuSubButton 
                              isActive={isCurrentSubActive} 
                              asChild
                              className={`transition-all duration-200
                                ${isCurrentSubActive 
                                  ? "text-sidebar-foreground font-medium" 
                                  : "text-muted-foreground hover:text-sidebar-foreground"
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
              /* สำหรับเมนูเดี่ยวที่ไม่มีเมนูย่อย (เช่น หน้าแรก, กราฟ, ประวัติ) */
              <SidebarMenuButton 
                tooltip={route.title} 
                isActive={isActive} 
                asChild
                className={`transition-all duration-200 group/item
                  ${isActive 
                    ? "text-sidebar-foreground font-semibold bg-sidebar-accent" 
                    : "text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent"
                  }
                `}
              >
                <Link href={route.link} className="flex items-center w-full">
                  {/* จัดการสีของไอคอนเดี่ยว */}
                  <div className={`transition-colors duration-200
                    ${isActive ? "text-sidebar-foreground" : "text-muted-foreground group-hover/item:text-sidebar-foreground"}
                  `}>
                    {route.icon}
                  </div>
                  
                  {!isCollapsed && (
                    <span className="ml-2 text-sm font-medium">{route.title}</span>
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