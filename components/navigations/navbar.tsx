import Link from "next/link";
import React from "react";
import { navLinks } from "./links";

export default function NavigationBar() {
  return (
    <div className="navbar bg-base-300 max-w-7xl rounded mt-5">
      <div className="flex-none lg:hidden">
        <label
          htmlFor="my-drawer-3"
          aria-label="open sidebar"
          className="btn btn-square btn-ghost"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            className="inline-block h-6 w-6 stroke-current"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 6h16M4 12h16M4 18h16"
            ></path>
          </svg>
        </label>
      </div>
      <div className="mx-2 flex-1 px-2 font-bold">Acdns</div>
      <div className="hidden flex-none lg:block">
        <ul className="menu menu-horizontal">
          {navLinks.map((link) => (
            <li  key={link.link}>
              <Link className={`capitalize  ${link.disabled &&  "disabled"} `}href={link.link}>{link.name}</Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
