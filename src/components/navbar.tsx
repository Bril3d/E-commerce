'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, Search, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/auth-context';
import { useSearch } from '@/contexts/search-context';
import { CartDropdown } from './cart-dropdown';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';

export function Navbar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { searchQuery, setSearchQuery, performSearch } = useSearch();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const isActive = (path: string) => pathname === path;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(searchQuery);
    setIsSearchOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-20">
      <div className="container flex h-16 items-center">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[300px] sm:w-[400px]">
            <nav className="flex flex-col gap-4">
              <Link
                href="/"
                className={`text-lg ${isActive('/') ? 'font-bold' : ''}`}
              >
                Home
              </Link>
              <Link
                href="/products"
                className={`text-lg ${isActive('/products') ? 'font-bold' : ''}`}
              >
                Products
              </Link>
              <Link
                href="/categories"
                className={`text-lg ${isActive('/categories') ? 'font-bold' : ''}`}
              >
                Categories
              </Link>
              {user ? (
                <>
                  <Link
                    href="/dashboard"
                    className={`text-lg ${isActive('/dashboard') ? 'font-bold' : ''}`}
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/account"
                    className={`text-lg ${isActive('/account') ? 'font-bold' : ''}`}
                  >
                    Account
                  </Link>
                </>
              ) : (
                <Link
                  href="/signin"
                  className={`text-lg ${isActive('/signin') ? 'font-bold' : ''}`}
                >
                  Sign In
                </Link>
              )}
            </nav>
          </SheetContent>
        </Sheet>

        <div className="flex w-full items-center gap-4 md:gap-6">
          <Link href="/" className="hidden md:block">
            <span className="text-xl font-bold">E-Commerce</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 mx-6">
            <Link
              href="/"
              className={`text-sm ${isActive('/') ? 'font-bold' : ''}`}
            >
              Home
            </Link>
            <Link
              href="/products"
              className={`text-sm ${isActive('/products') ? 'font-bold' : ''}`}
            >
              Products
            </Link>
            <Link
              href="/categories"
              className={`text-sm ${isActive('/categories') ? 'font-bold' : ''}`}
            >
              Categories
            </Link>
          </nav>

          <div className="flex flex-1 items-center justify-end gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
            >
              <Search className="h-5 w-5" />
            </Button>

            <div className="hidden md:flex">
              {user ? (
                <div className="flex items-center gap-4">
                  <Link href="/dashboard">
                    <Button variant="ghost">Dashboard</Button>
                  </Link>
                  <Link href="/account">
                    <Button variant="ghost">Account</Button>
                  </Link>
                </div>
              ) : (
                <Link href="/signin">
                  <Button>Sign In</Button>
                </Link>
              )}
            </div>

            <CartDropdown />
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div
        className={`border-b bg-background py-3 transition-all ${
          isSearchOpen ? 'block' : 'hidden'
        }`}
      >
        <div className="container">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search products..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>
        </div>
      </div>
    </header>
  );
}
