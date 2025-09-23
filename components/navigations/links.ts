type navLinksTypes = {
  name: string;
  link: string;
  disabled?: boolean;
};

export const navLinks: navLinksTypes[] = [
  { name: "camera", link: "/camera", disabled: false },
  { name: "management", link: "/management", disabled: false },
  { name: "detection", link: "/detection", disabled: false },
  { name: "analytics", link: "/analytics", disabled: true },
];
