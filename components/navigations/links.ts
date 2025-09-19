type navLinksTypes = {
  name: string;
  link: string;
  disabled?: boolean;
};

export const navLinks: navLinksTypes[] = [
  { name: "camera", link: "/camera", disabled: false },
  { name: "detection", link: "/detection", disabled: true },
  { name: "plates", link: "/plates", disabled: true },
  
];
