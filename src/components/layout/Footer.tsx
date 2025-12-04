import { Logo } from '@/components/Logo';

export function Footer() {
  return (
    <footer className="border-t bg-card mt-auto">
      <div className="container py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <Logo />
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} PureScan. All rights reserved.
          </p>
          <div className="flex gap-4">
             {/* Social links can go here */}
          </div>
        </div>
      </div>
    </footer>
  );
}
