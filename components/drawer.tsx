import React, { ReactNode } from "react";
import NavigationBar from "./navigations/navbar"; // you can merge parts into topbar if you want
import { getVersion } from "@/utils/getVersion";
import Link from "next/link";
import { navLinks } from "./navigations/links";
import { Search, Bell, User } from "lucide-react";

interface DrawerLayoutProps {
  children: ReactNode;
}

export default function DrawerLayout({ children }: DrawerLayoutProps) {
  const version = getVersion();

  return (
    <div className="bg-green-400 w-full h-full">
      <div className="grid grid-cols-12 h-full">
        <div className="bg-green-200 col-span-2">
          <div className=""></div>

        </div>
        <main className="bg-green-500  col-span-10">{"children"}</main>
      </div>
    </div>
  );
}
// <div className="flex flex-col min-h-screen bg-blue-600 w-full">
//   {/* Body: 3 columns */}
//   <div className="grid grid-cols-10 bg-emerald-700">
//     {/* Left Sidebar */}
//     <aside className="hidden md:flex flex-col w-64 bg-primary border-r border-base-300 p-4 shadow-md">
//       <nav className="flex-1 bg-amber-600 justify-items-end">
//         <ul className="menu space-y-1">
//           {navLinks.map((link) => {
//             const Icon = link.icon; // grab the component
//             return (
//               <li key={link.link} className="bg-amber-200">
//                 {link.disabled ? (
//                   <span className="flex items-center gap-2 text-gray-400 cursor-not-allowed opacity-60">
//                     <Icon size={18} />
//                     <span className="capitalize">{link.name}</span>
//                     <span className="badge badge-sm badge-outline">
//                       Soon
//                     </span>
//                   </span>
//                 ) : (
//                   <Link
//                     href={link.link}
//                     className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-base-300 transition"
//                   >
//                     <Icon size={18} />
//                     <span className="capitalize">{link.name}</span>
//                   </Link>
//                 )}
//               </li>
//             );
//           })}
//         </ul>
//       </nav>

//       {/* Footer */}
//       <footer className="text-xs text-gray-500 mt-6">
//         <p>© {new Date().getFullYear()} Acdnsys</p>
//         <p>Version {version}</p>
//       </footer>
//     </aside>

//     <div className="col-span-8">
//       {/* Top Bar */}
//       <header className="flex items-center justify-between bg-base-100 px-6 py-3 shadow-md">
//         <div className="flex items-center gap-3">
//           <h1 className="text-xl font-extrabold text-primary">Acdnsys</h1>
//           <div className="hidden md:flex items-center bg-base-200 rounded-lg px-3 py-1">
//             <Search size={16} className="text-gray-500 mr-2" />
//             <input
//               type="text"
//               placeholder="Search..."
//               className="bg-transparent outline-none text-sm w-48"
//             />
//           </div>
//         </div>

//         <div className="flex items-center gap-4">
//           <button className="btn btn-ghost btn-circle">
//             <Bell size={18} />
//           </button>
//           <div className="avatar">
//             <div className="w-8 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
//               <User size={18} />
//             </div>
//           </div>
//         </div>
//       </header>
//       {/* Main Content */}
//       <main className="flex-1 bg-base-100 p-6 overflow-y-auto">
//         {children}
//       </main>
//     </div>

//     {/* Right Sidebar */}
//     {/* <aside className="hidden lg:flex flex-col w-72 bg-base-50 border-l border-base-300 p-4 shadow-inner">
//       <h2 className="font-semibold text-gray-600 mb-3">Right Panel</h2>
//       <div className="text-sm text-gray-500">
//         Add notifications, stats, widgets, or leave empty.
//       </div>
//     </aside> */}
//   </div>
// </div>
