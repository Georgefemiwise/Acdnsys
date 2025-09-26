import { navLinks } from "@/components/navigations/links";
import Link from "next/link";
import React from "react";

export default function SideBar() {
  return (
    <aside className="hidden md:flex flex-col bg-primary... border-r border-base-300 p-4 shadow-md h-full pr-5">
      <nav className="flex-1 justify-items-end">

        <ul className="menu space-y-1">
          {navLinks.map((link) => {
            const Icon = link.icon; //  grab the component
            return (
              <li key={link.link}>
                {link.disabled ? (
                  <span className="flex items-center  gap-2 text-neutral-500 cursor-not-allowed opacity-60">
                    <Icon size={18} />
                    <span className="capitalize">{link.name}</span>
                    <span className="badge badge-sm badge-outline">Soon</span>
                  </span>
                ) : (
                  <Link
                    href={link.link}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-base-300 transition"
                  >
                    <Icon size={18} />
                    <span className="capitalize">{link.name}</span>
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      {/* <footer className="text-xs text-gray-500 mt-6">
        <p>© {new Date().getFullYear()} Acdnsys</p>
        <p>Version {"version"}</p>
      </footer> */}
    </aside>
  );
}
