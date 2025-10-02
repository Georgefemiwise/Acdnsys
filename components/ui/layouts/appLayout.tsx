import React, { ReactNode } from "react";
import { getVersion } from "@/utils/getVersion";
import Link from "next/link";
import { Search, Bell, User } from "lucide-react";
import SideBar from "./sideBar";

export default function AppLayout({ children }: { children: ReactNode }) {
  const version = getVersion();

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden">
      {/* Top Bar */}
      <header className="flex items-center justify-between px-6 py-2  z-10">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-extrabold hover:link">
            <Link href={"/"}>
              Acdnsys <span className="text-sm text-primary">{version}</span>
            </Link>
          </h1>
          <div className="hidden md:flex items-center bg-base-200 rounded-lg px-3 py-1">
            <Search size={16} className="text-gray-500 mr-2" />
            <input
              type="text"
              placeholder="Search..."
              className="bg-transparent outline-none text-sm w-48"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button className="btn btn-ghost btn-circle">
            <Bell size={18} />
          </button>
          <div className="avatar">
            <div className="w-8 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
              <User size={18} />
            </div>
          </div>
        </div>
      </header>

      {/* Body Section */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <aside className="md:w-72 border-r border-base-300">
          <SideBar />
        </aside>

        {/* Main Content (scrollable) */}
        <main className="flex-1 p-6 overflow-y-auto bg-base-100">
          {children}
        </main>

        {/* Right Sidebar */}
        {/* <aside className="w-64 border-l border-base-300 p-4 bg-base-50">
          Empty or widgets
        </aside> */}
      </div>
    </div>
  );
}
