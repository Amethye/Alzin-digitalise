import { useState, useEffect, useRef } from "react";
import { navItems as originalNavItems, type NavItem } from "./NavItems";
import LogoUrl from "@images/LogoFPMs.svg?url";

type Me = {
  email?: string;
  role?: string;
  member_id?: string;
  identifiant?: string; 
};

export default function Nav() {
  const [role, setRole] = useState<string>("guest");
  const [me, setMe] = useState<Me | null>(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showDesktopMenu, setShowDesktopMenu] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement | null>(null);
  const desktopMenuRef = useRef<HTMLDivElement | null>(null);
  const logoSrc = LogoUrl.split("?")[0];

  useEffect(() => {
    const email = localStorage.getItem("email");

    if (!email) {
      setMe(null);
      setRole("guest");
      return;
    }

    fetch("/api/me/", {
      method: "GET",
      headers: {
        "X-User-Email": email,
        "Content-Type": "application/json"
      }
    })
      .then(async (res) => {
        const data = await res.json();

        if (!res.ok || !data.id) {
          setMe(null);
          setRole("guest");
          return;
        }

        setMe({
          identifiant: data.pseudo,
          email: data.email,
          role: data.role,
        });

        setRole(data.role);
      })
      .catch(() => {
        setMe(null);
        setRole("guest");
      });
  }, []);

  useEffect(() => {
    if (!showMobileMenu && !showDesktopMenu) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (!target) return;

      const mobileEl = mobileMenuRef.current;
      const desktopEl = desktopMenuRef.current;

      if (mobileEl?.contains(target) || desktopEl?.contains(target)) {
        return;
      }

      setShowMobileMenu(false);
      setShowDesktopMenu(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [showMobileMenu, showDesktopMenu]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileMenuOpen(false);
        setShowMobileMenu(false);
        setShowDesktopMenu(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const handleLogout = async () => {
    setShowMobileMenu(false);
    setShowDesktopMenu(false);
    setIsMobileMenuOpen(false);

    await fetch("/api/auth/logout/", {
      method: "POST",
      credentials: "include",
    });

    localStorage.removeItem("email");
    localStorage.removeItem("utilisateur_id");
    localStorage.removeItem("role");
    localStorage.removeItem("is_admin");


    setMe(null);
    setRole("guest");

    window.location.href = "/";
  };

  const isAdmin = role === "admin";
  const isVerifier = role === "verifier";
  const isLoggedIn = Boolean(me);

  const navItems = originalNavItems.filter((item) => {
    if (item.adminOnly) {
      const verifierHasAccess = item.verifierOnly && isVerifier;
      if (!isAdmin && !verifierHasAccess) return false;
    } else if (item.verifierOnly && !isVerifier && !isAdmin) {
      return false;
    }

    if (isLoggedIn && (item.label === "Se connecter" || item.label === "S'inscrire")) {
      return false;
    }
    return true;
  });

  const userMenuLinks = [
    { label: "Mon compte", href: "/account" },
    { label: "Mes favoris", href: "/favoris" },
    { label: "Mes commandes", href: "/orders" },
    { label: "Mes demandes", href: "/mes-demandes" },
    { label: "Support", href: "/support" },
  ];

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((previous) => !previous);
    setShowMobileMenu(false);
    setShowDesktopMenu(false);
  };

  const handleNavItemClick = () => {
    setIsMobileMenuOpen(false);
    setShowMobileMenu(false);
    setShowDesktopMenu(false);
  };

  return (
    <>
      <nav className="w-full flex flex-col gap-4 p-4 lg:grid lg:grid-cols-[1fr_auto]">
        <div className="flex items-center justify-between gap-4 lg:col-span-2">
          <a href="/" className="inline-flex items-center gap-3 text-base duration-150 hover:opacity-80 xs:text-lg">
            <img src={logoSrc} alt="Logo FPMs" className="h-12 w-auto max-w-[70px]" />
            <span className="text-base font-semibold leading-tight text-mauve sm:text-lg">
              <span className="lg:hidden">Alzin</span>
              <span className="hidden lg:inline">Alzin FPMs</span>
            </span>
          </a>

          <div className="flex items-center gap-3">
            <div className="text-sm text-gray-700 lg:hidden" ref={mobileMenuRef}>
              {me ? (
                <div className="relative inline-block">
                  <button
                    type="button"
                    onClick={() => {
                      setShowMobileMenu((previous) => !previous);
                      setShowDesktopMenu(false);
                    }}
                    aria-expanded={showMobileMenu}
                    className="btn btn-ghost px-2 py-1 text-xs"
                  >
                    Connecté
                    <svg width="16" height="16" fill="currentColor" className="ml-1 text-mauve" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M5.23 7.21a.75.75 0 011.06.02L10 11.293l3.71-4.063a.75.75 0 111.08 1.04l-4.25 4.667a.75.75 0 01-1.08 0l-4.25-4.667a.75.75 0 01.02-1.06z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              ) : (
                <span className="text-gray-500">Non connecté</span>
              )}
            </div>

            <button
              type="button"
              onClick={toggleMobileMenu}
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-navigation"
              className="btn lg:hidden"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
              Menu
            </button>
          </div>
        </div>

        {/* DESKTOP NAV */}
        <ul className="hidden flex-wrap justify-center gap-2 text-sm lg:col-start-1 lg:row-start-2 lg:flex lg:flex-nowrap lg:items-center lg:justify-center lg:gap-4 xl:text-base">
          {navItems.map((item: NavItem) => (
            <li key={item.href} className="mx-auto flex items-center justify-center">
              <div className="inline-flex">

                {item.label === "Site Fédé" ? (
                  <a
                    href={item.href}
                    onClick={handleNavItemClick}
                    className="btn btn-solid"
                  >
                    {item.label}
                  </a>
                ) : (
                  <a
                    href={item.href}
                    onClick={handleNavItemClick}
                    className="
                      relative px-1 py-1
                      text-mauve font-semibold
                      after:absolute after:bottom-0 after:left-0 after:z-50
                      after:h-[3px] after:w-0 after:rounded-full
                      after:bg-mauve after:duration-500
                      hover:after:w-full
                    "
                  >
                    {item.label}
                  </a>
                )}

              </div>
            </li>
          ))}
        </ul>

        {/* DESKTOP USER MENU */}
        <div
          className="hidden text-sm text-gray-700 lg:col-start-2 lg:row-start-2 lg:flex lg:justify-end lg:whitespace-nowrap"
          ref={desktopMenuRef}
        >
          {me ? (
            <div className="relative inline-block">
              <button
                type="button"
                onClick={() => {
                  setShowDesktopMenu((previous) => !previous);
                  setShowMobileMenu(false);
                }}
                aria-expanded={showDesktopMenu}
                className="btn btn-ghost px-2 py-1"
              >
                Connecté : <strong>{me.identifiant}</strong> ({me.role})
                <svg width="16" height="16" fill="currentColor" className="ml-1 text-mauve" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M5.23 7.21a.75.75 0 011.06.02L10 11.293l3.71-4.063a.75.75 0 111.08 1.04l-4.25 4.667a.75.75 0 01-1.08 0l-4.25-4.667a.75.75 0 01.02-1.06z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
              {showDesktopMenu && (
                <div className="absolute right-0 mt-2 w-48 rounded-lg bg-white shadow-lg border border-mauve/30 z-50">
                  <a
                    href="/account"
                    onClick={() => setShowDesktopMenu(false)}
                    className="block px-4 py-2 text-sm text-mauve hover:bg-purple-50"
                  >
                    Mon compte
                  </a>

                  <a
                    href="/favoris"
                    onClick={() => setShowDesktopMenu(false)}
                    className="block px-4 py-2 text-sm text-mauve hover:bg-purple-50"
                  >
                    Mes favoris
                  </a>

                  <a
                    href="/orders"
                    onClick={() => setShowDesktopMenu(false)}
                    className="block px-4 py-2 text-sm text-mauve hover:bg-purple-50"
                  >
                    Mes commandes
                  </a>

                  <button
                    onClick={handleLogout}
                    className="btn btn-danger w-full justify-start"
                  >
                    Se déconnecter
                  </button>
                </div>
              )}
            </div>
          ) : (
            <span className="text-gray-500">Non connecté</span>
          )}
        </div>
      </nav>

      {/* MOBILE NAV */}
      {isMobileMenuOpen && (
        <>
          <div className="fixed inset-0 z-30 bg-black/30 lg:hidden" onClick={toggleMobileMenu} />

          <div
            id="mobile-navigation"
            className="fixed bottom-0 right-0 top-0 z-40 w-72 max-w-[80%] bg-white/95 shadow-xl backdrop-blur-sm lg:hidden"
          >
            <div className="flex items-center justify-between border-b px-4 py-4">
              <span className="text-base font-semibold text-mauve">Menu</span>
              <button type="button" onClick={toggleMobileMenu} className="btn btn-ghost p-2">
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="border-b px-4 py-4 text-sm text-gray-700">
              {me ? (
                <div>
                  <p className="font-semibold text-mauve">{me.identifiant}</p>
                  <p className="text-gray-600">Rôle : {me.role}</p>
                  <div className="mt-3 space-y-2">
                    {userMenuLinks.map((link) => (
                      <a
                        key={link.href}
                        href={link.href}
                        onClick={handleNavItemClick}
                        className="btn w-full justify-center"
                      >
                        {link.label}
                      </a>
                    ))}

                    <button
                      onClick={handleLogout}
                      className="btn btn-danger w-full justify-center font-semibold"
                    >
                      Se déconnecter
                    </button>
                  </div>
                </div>
              ) : (
                <span className="text-gray-500">Non connecté</span>
              )}
            </div>

            <ul className="flex h-full flex-col gap-4 overflow-y-auto px-6 py-6 text-base">
              {navItems.map((item: NavItem) => (
                <li key={item.href}>

                  {item.label === "Site Fédé" ? (
                    <a
                      href={item.href}
                      onClick={handleNavItemClick}
                      className="btn btn-solid w-full justify-center font-semibold"
                    >
                      {item.label}
                    </a>
                  ) : (
                    <a
                      href={item.href}
                      onClick={handleNavItemClick}
                      className="
                        relative block px-1 py-1 text-center
                        text-mauve font-semibold
                        after:absolute after:bottom-0 after:left-1/2 after:z-50
                        after:h-[3px] after:w-0 after:-translate-x-1/2 after:rounded-full
                        after:bg-mauve after:duration-500
                        hover:after:w-full
                      "
                    >
                      {item.label}
                    </a>
                  )}

                </li>
              ))}
            </ul>

          </div>
        </>
      )}
    </>
  );
}
