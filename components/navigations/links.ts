type navLinksTypes = {
  name: string;
  link: string;
  disabled?: boolean;
};

export const navLinks: navLinksTypes[] = [
  { name: "camera", link: "/camera", disabled: false },
  { name: "plates", link: "/plates", disabled: false },
  { name: "detection", link: "/detection", disabled: false },
  
];
