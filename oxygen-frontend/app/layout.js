import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import DashboardSidebar from "./components/Sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Oxygen Dashboard",
  description: "IoT Oxygen Sensor Dashboard",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-screen bg-gray-100 text-gray-900">
        <TooltipProvider>
          <SidebarProvider>
            <DashboardSidebar />
            <main className="flex-1 overflow-auto">
              <div className="flex items-center gap-2 px-6 pt-4">
                <SidebarTrigger className="text-gray-500 hover:bg-gray-200 bg-gray-100" />
              </div>
              <div className="p-6">
                {children}
              </div>
            </main>
          </SidebarProvider>
        </TooltipProvider>
      </body>
    </html>
  )
}