'use client';

import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import Link from 'next/link';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/business', label: 'For Business' },
  { href: '/dashboard', label: 'Dashboard' },
];

const userNavLinks = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/dashboard/favorites', label: 'Favorites' },
    { href: '/dashboard/settings', label: 'Settings' },
];

const businessNavLinks = [
    { href: '/dashboard/business', label: 'Business Dashboard' },
    { href: '/dashboard/business/products', label: 'Manage Products' },
];

const adminNavLinks = [
    { href: '/admin', label: 'Admin Dashboard' },
]


export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  // This is a placeholder. In a real app, you'd get this from an auth context.
  const userRole = 'user'; // יכול להיות 'user', 'business', 'admin', or null

  const getNavLinks = () => {
      // This is a placeholder for a real auth check
      const isLoggedIn = true; 
      if (!isLoggedIn) {
          return [
            { href: '/', label: 'Home' },
            { href: '/business', label: 'For Business' },
          ];
      }
      switch(userRole) {
          case 'user': return userNavLinks;
          case 'business': return businessNavLinks;
          case 'admin': return adminNavLinks;
          default: return navLinks;
      }
  }
  
  const currentNavLinks = getNavLinks();


  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Logo />
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          {currentNavLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="transition-colors hover:text-primary"
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="hidden md:flex items-center gap-2">
           <Button variant="ghost" asChild>
            <Link href="/auth/sign-in">Sign In</Link>
          </Button>
          <Button asChild>
            <Link href="/auth/sign-up">Sign Up</Link>
          </Button>
        </div>
        <div className="md:hidden">
          <Button variant="ghost" size="icon" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            <span className="sr-only">Toggle menu</span>
          </Button>
        </div>
      </div>
      {isOpen && (
        <div className="md:hidden" onClick={() => setIsOpen(false)}>
          <div className="container py-4 flex flex-col gap-4">
            <nav className="flex flex-col gap-4 text-lg font-medium">
                {currentNavLinks.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="transition-colors hover:text-primary"
                >
                  {label}
                </Link>
              ))}
            </nav>
            <div className="flex items-center gap-2">
              <Button variant="ghost" asChild className="flex-1">
                <Link href="/auth/sign-in">Sign In</Link>
              </Button>
              <Button asChild className="flex-1">
                <Link href="/auth/sign-up">Sign Up</Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
