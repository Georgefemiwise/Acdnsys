import Link from "next/link";
import React from "react";
import { navLinks } from "./links";
import { GithubIcon } from "lucide-react";

interface NavigationBarProps {
  version: string;
}

export default function NavigationBar({ version }: NavigationBarProps) {
  const githubUrl = "https://github.com/Georgefemiwise/Acdnsys";

  return (
    <div className="w-full shadow-sm bg-base-200 flex justify-center">
      <div className="navbar md:max-w-9/12 ">
        <div className="navbar-start">
          {/* <div className="dropdown">
            <div tabIndex={0} role="button" className="btn btn-ghost lg:hidden">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h8m-8 6h16"
                />
              </svg>
            </div>
            <ul
              tabIndex={0}
              className="menu menu-sm dropdown-content bg-base-100 rounded-box z-1 mt-3 w-52 p-2 shadow"
            >
              <li>
                <a>Item 1</a>
              </li>
              <li>
                <a>Parent</a>
                <ul className="p-2">
                  <li>
                    <a>Submenu 1</a>
                  </li>
                  <li>
                    <a>Submenu 2</a>
                  </li>
                </ul>
              </li>
              <li>
                <a>Item 3</a>
              </li>
            </ul>
          </div> */}
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
          <Link href={"/"} className="btn btn-ghost text-xl">
            Acdns
          </Link>
        </div>
        <div className="navbar-center hidden lg:flex">
          <ul className="menu menu-horizontal">
            {navLinks.map((link) => (
              <li key={link.link}>
                {link.disabled ? (
                  <span className="capitalize text-gray-400 cursor-not-allowed opacity-60">
                    {link.name}
                  </span>
                ) : (
                  <Link href={link.link} className="capitalize hover:underline">
                    {link.name}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </div>
        <div className="navbar-end">
          <div className="flex items-center space-x-3">
            <span className="badge badge-info badge-xs">{version}</span>
            <a
              href={githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-ghost btn-sm"
            >
              <GithubIcon />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
