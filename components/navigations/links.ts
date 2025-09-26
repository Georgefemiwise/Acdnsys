import {
  Camera,
  Settings,
  ScanLine,
  BarChart3,
  LucideIcon,
} from "lucide-react";

export type NavLinkType = {
  name: string;
  link: string;
  icon: LucideIcon; // notice: we store the component, not JSX
  disabled?: boolean;
};

export const navLinks: NavLinkType[] = [
  { name: "camera", link: "/camera", icon: Camera },
  { name: "management", link: "/management", icon: Settings },
  { name: "detection", link: "/detection", icon: ScanLine },
  { name: "analytics", link: "/analytics", icon: BarChart3, disabled: true },
];
