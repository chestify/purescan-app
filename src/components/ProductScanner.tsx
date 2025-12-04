'use client';

import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScanLine } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export function ProductScanner() {
  const router = useRouter();
  const { toast } = useToast();
  const [barcode, setBarcode] = useState('');

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!barcode.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a product barcode.',
        variant: 'destructive',
      });
      return;
    }
    router.push(`/product/${barcode}`);
  };

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-sm items-center space-x-2">
      <Input
        type="text"
        placeholder="Enter product barcode..."
        value={barcode}
        onChange={(e) => setBarcode(e.target.value)}
        aria-label="Product barcode"
      />
      <Button type="submit">
        <ScanLine className="mr-2 h-4 w-4" />
        Scan
      </Button>
    </form>
  );
}
