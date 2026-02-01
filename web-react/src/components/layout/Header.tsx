import { Link } from 'react-router-dom';
import { Activity } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';

export default function Header() {
  return (
    <header className="border-b border-border">
      <div className="flex h-16 items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2">
          <Activity className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold">PardusCrawler</span>
        </Link>
        <ThemeToggle />
      </div>
    </header>
  );
}
