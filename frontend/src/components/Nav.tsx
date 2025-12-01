import { useState, useEffect, useRef } from "react";
import LogoUrl from "@images/LogoFPMs.svg?url";

type Me = {
  email?: string;
  role?: string;
  identifiant?: string;
};

type NavItem = {
  label: string;
  href: string;
  protected?: boolean;
  admin?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { label: "Se connecter", href: "/login" },
    { label: "S'inscrire", href: "/register" },
    { label : "Admin", href: "/admin", admin: true},
    { label : "Site Fédé", href: "https://www.fede.fpms.ac.be/folklore" },
];

export default function Nav() {
  const [me, setMe] = useState<Me | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const logoSrc = LogoUrl.split("?")[0];

  // Charger l'utilisateur connecté
  useEffect(() => {
    fetch("/api/me", { credentials: "include" })
      .then(async (res) => {
        if (!res.ok) return setMe(null);
        const data = await res.json();
        setMe(data);
      })
      .catch(() => setMe(null));
  }, []);

  // Fermer le menu quand clic extérieur
  useEffect(() => {
    if (!mobileOpen) return;

    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMobileOpen(false);
      }
    };

    window.addEventListener("mousedown", handleClick);
    return () => window.removeEventListener("mousedown", handleClick);
  }, [mobileOpen]);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    setMe(null);
  };

  return (
    <>
      {/* HEADER */}
      <header className="w-full bg-white shadow-sm sticky top-0 z-40">
        <nav className="container mx-auto flex items-center justify-between px-6 py-4">

          {/* Logo */}
          <a href="/" className="flex items-center gap-3">
            <img src={logoSrc} alt="Logo FPMs" className="h-10 w-auto" />
            <span className="font-semibold text-lg text-mauve hidden sm:block">
              Alzin FPMS
            </span>
          </a>

          {/* MENU DESKTOP */}
          <ul className="hidden md:flex items-center gap-8 text-gray-700 text-sm">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  className="hover:text-mauve transition font-medium"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>

          {/* COMPTE */}
          <div className="hidden md:flex items-center gap-5">
            {me ? (
              <>
                <span className="text-mauve font-semibold">
                  {me.identifiant}
                </span>
                <button
                  onClick={logout}
                  className="px-4 py-2 rounded-lg bg-mauve text-white hover:bg-purple-700 transition"
                >
                  Déconnexion
                </button>
              </>
            ) : (
              <a
                href="/login"
                className="px-4 py-2 rounded-lg border border-mauve text-mauve hover:bg-mauve hover:text-white transition"
              >
                Connexion
              </a>
            )}
          </div>

          {/* BURGER */}
          <button
            className="md:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <svg
              className="h-7 w-7 text-mauve"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        </nav>
      </header>

      {/* MENU MOBILE */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm md:hidden">
          <div
            ref={menuRef}
            className="absolute right-0 top-0 h-full w-72 bg-white shadow-xl p-6 flex flex-col gap-6"
          >
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-mauve">Menu</span>
              <button onClick={() => setMobileOpen(false)}>
              </button>
            </div>

            {/* Liens */}
            <ul className="flex flex-col gap-4 text-gray-700">
              {NAV_ITEMS.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    className="block text-lg font-medium hover:text-mauve transition"
                    onClick={() => setMobileOpen(false)}
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>

            {/* Connexion mobile */}
            <div className="mt-5">
              {me ? (
                <>
                  <p className="font-semibold text-mauve">{me.identifiant}</p>
                  <button
                    onClick={logout}
                    className="mt-3 w-full px-4 py-2 rounded-lg bg-mauve text-white hover:bg-purple-700 transition"
                  >
                    Déconnexion
                  </button>
                </>
              ) : (
                <a
                  href="/login"
                  className="block w-full px-4 py-2 rounded-lg border border-mauve text-mauve text-center hover:bg-mauve hover:text-white transition"
                >
                  Connexion
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}