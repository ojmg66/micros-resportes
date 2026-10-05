"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
//import ThemeToggle from "./ThemeToggle";
import { Menu } from "lucide-react";


const NAV_LINKS = [
  { href: "/reportar", label: "Reportar", isLogging: false },
  { href: "/", label: "Listado", isLogging: false },

] as const;
// Clases base y activas (ejemplo con Tailwind CSS)

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isScrolled, setIsScrolled] = useState<boolean>(false);



  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`h-12 bg-green-500 backdrop-blur-lg border-b border-gray-200/50 sticky top-0 z-50 transition-shadow duration-300 ${isScrolled ? "shadow-xl shadow-black/10" : "shadow-lg shadow-black/5"
        }`}
    >
      <div className="absolute inset-0 bg-linear-to-r from-blue-500/5 to-purple-500/5 pointer-events-none" />
      <nav className="relative max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-12">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="bg-linear-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">

            </div>
            <span className="text-2xl font-bold bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">

            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {NAV_LINKS.filter((link) => !link.isLogging).map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200 relative group"
              >
                {link.label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-300 group-hover:w-full" />
              </Link>
            ))}
          </div>

          {/* CTA Button & Mobile Menu */}
          <div className="flex items-center space-x-4">


            {/* Mobile menu button */}
            <button
              type="button"
              aria-label="Toggle mobile menu"
              aria-expanded={isMenuOpen}
              onClick={() => setIsMenuOpen((prev) => !prev)}
              className="md:hidden p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors duration-200"
            >
              <Menu />
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-white/95 backdrop-blur-lg border-b border-gray-200/50 shadow-lg animate-slide-down">
            <div className="px-4 py-6 space-y-4">
              {NAV_LINKS.filter((link) => !link.isLogging).map(
                (link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsMenuOpen(false)}
                    className="block text-gray-700 hover:text-blue-600 font-medium py-2 transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                ),
              )}


            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
