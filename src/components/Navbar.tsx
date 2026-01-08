import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Menu, X } from "lucide-react";
import { Link } from "react-router-dom";
import SearchDialog from "./SearchDialog";
import UserMenu from "./UserMenu";

const navItems = [
  { name: "Home", href: "/" },
  { name: "Movies", href: "/movies" },
  { name: "TV", href: "/tv" },
  { name: "Sports", href: "/sports" },
  { name: "Music Artists", href: "/artists" },
  { name: "Creators", href: "/creators" },
];

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled ? "bg-background/95 backdrop-blur-md border-b border-border" : "bg-gradient-to-b from-background/80 to-transparent"
        }`}
      >
        <nav className="container mx-auto px-4 md:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <span className="text-2xl md:text-3xl font-display tracking-wider cinna-gold-text">
                CINNAFLOW
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-8">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-200"
                >
                  {item.name}
                </Link>
              ))}
            </div>

            {/* Right Side */}
            <div className="flex items-center gap-2 sm:gap-4">
              <button
                onClick={() => setSearchOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
                aria-label="Search"
              >
                <Search className="w-5 h-5" />
                <span className="hidden sm:inline text-sm">Search</span>
                <kbd className="hidden md:inline-flex items-center gap-1 px-1.5 py-0.5 text-xs bg-secondary rounded">
                  ⌘K
                </kbd>
              </button>

              <UserMenu />

              {/* Mobile Menu Button */}
              <button
                className="lg:hidden p-2 rounded-full hover:bg-secondary transition-colors"
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Menu"
              >
                {isOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden py-4 border-t border-border"
            >
              <div className="flex flex-col gap-2">
                {navItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </nav>
      </motion.header>

      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
};

export default Navbar;
