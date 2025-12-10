export type NavItem = {
  label: string;
  href: string;
  adminOnly?: boolean;
  verifierOnly?: boolean;
};

export const navItems: NavItem[] = [
    { label: "Se connecter", href: "/login" },
    { label: "S'inscrire", href: "/register" },
    { label: "Chants", href: "/chants" },
    { label: "Commandes", href: "/orders" }, 
    { label: "Évènements", href: "/events" },
    { label : "Admin", href: "/admindash", adminOnly: true},
    { label : "Site Fédé", href: "https://www.fede.fpms.ac.be/folklore" },
];
