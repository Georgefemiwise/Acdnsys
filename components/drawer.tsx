import React, { ReactNode } from "react";
import NavigationBar from "./navigations/navbar";
import { getVersion } from "@/utils/getVersion";
import Link from "next/link";
import { navLinks } from "./navigations/links";

interface DrawerLayoutProps {
  children: ReactNode;
}

export default function DrawerLayout({ children }: DrawerLayoutProps) {
   const version = getVersion();
  return (
    <div className="drawer mx-auto  ">
      <input id="my-drawer-3" type="checkbox" className="drawer-toggle" />
      <div className="drawer-content flex flex-col items-center">
        {/* Navbar */}
        <NavigationBar version={version} />

        {/* Page content */}
        <main className="p-4 flex place-content-center min-h-[90vh] md:max-w-9/12 ">
          <div className="md:w-6xl">{children}</div>
        </main>
      </div>

      {/* Sidebar */}
      <div className="drawer-side">
        <label
          htmlFor="my-drawer-3"
          aria-label="close sidebar"
          className="drawer-overlay"
        ></label>

        <div className="bg-base-200 min-h-full w-80 p-6 flex flex-col justify-between shadow-xl">
          {/* Brand Header */}
          <div>
            <h2 className="text-xl font-extrabold text-primary">Acdnsys</h2>
            <p className="text-xs text-gray-500 mt-1">
              Camera Detection & Plate Recognition
            </p>
            <div className="divider my-4"></div>

            {/* Navigation */}
            <ul className="menu space-y-2">
              {navLinks.map((link) => (
                <li key={link.link}>
                  {link.disabled ? (
                    <span className="flex items-center gap-2 text-gray-400 cursor-not-allowed opacity-60">
                      <span className="capitalize">{link.name}</span>
                      <span className="badge badge-sm badge-outline">
                        Coming soon
                      </span>
                    </span>
                  ) : (
                    <Link
                      href={link.link}
                      className="flex items-center gap-2 capitalize hover:bg-base-300 rounded-lg px-3 py-2 transition"
                    >
                      {link.name}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Footer */}
          <div className="mt-8 text-xs text-gray-500">
            <p>© {new Date().getFullYear()} Acdnsys</p>
            <p className="mt-1">Version {version} • Student Build</p>
          </div>
        </div>
      </div>
    </div>
  );
}
