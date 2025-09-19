import React, { ReactNode } from "react";
import NavigationBar from "./navigations/navbar";

interface DrawerLayoutProps {
  children: ReactNode;
}

export default function DrawerLayout({ children }: DrawerLayoutProps) {
  return (
    <div className="drawer mx-auto max-w-9/12  ">
      <input id="my-drawer-3" type="checkbox" className="drawer-toggle" />
      <div className="drawer-content flex flex-col items-center">
        {/* Navbar */}
        <NavigationBar/>
       

        {/* Page content */}
        <main className="p-4 flex place-content-center min-h-[90vh]">
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
        <ul className="menu bg-base-200 min-h-full w-80 p-4">
          <li>
            <a>Sidebar Item 1</a>
          </li>
          <li>
            <a>Sidebar Item 2</a>
          </li>
        </ul>
      </div>
    </div>
  );
}
