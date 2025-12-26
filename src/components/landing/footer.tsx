import Link from 'next/link';
import { Logo } from '@/components/common/Logo';

const quickLinks = [
  { href: '#about', label: 'About' },
  { href: '#contact', label: 'Contact' },
  { href: '#privacy', label: 'Privacy' },
];

export function LandingFooter() {
  return (
    <footer id="about" className="bg-card dark:bg-gray-900 border-t dark:border-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="flex flex-col items-center gap-2 sm:items-start">
            <Link href="/" className="flex items-center gap-2">
              <Logo />
            </Link>
            <p className="text-sm text-muted-foreground">Built for HackStrom 2025 by Team VEDABYTE</p>
          </div>
          <div className="flex items-center gap-6">
            {quickLinks.map(link => (
              <Link key={link.href} href={link.href} className="text-sm text-muted-foreground transition-colors hover:text-primary">
                {link.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="mt-8 border-t pt-6 text-center text-xs text-muted-foreground dark:border-gray-800">
          &copy; {new Date().getFullYear()} FestX. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
