import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="container flex flex-col items-center justify-center text-center py-20 min-h-[60vh]">
      <AlertTriangle className="w-16 h-16 text-destructive mb-4" />
      <h2 className="text-3xl font-bold mb-2 font-headline">Product Not Found</h2>
      <p className="text-muted-foreground mb-6">
        Sorry, we couldn&apos;t find a product with that barcode in our database.
      </p>
      <Button asChild>
        <Link href="/">Scan Another Product</Link>
      </Button>
    </div>
  );
}
