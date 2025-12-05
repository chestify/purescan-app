
'use client';

import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScanLine, Loader2 } from 'lucide-react';
import { FormEvent, useState, useRef, useEffect, useTransition } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { getProductById, PRODUCTS_DB } from '@/lib/data';

// In a real app, this would use a proper barcode scanning library
const fakeScan = (videoElement: HTMLVideoElement, barcode: string) => {
    return new Promise<string>((resolve) => {
      setTimeout(() => {
        resolve(barcode);
      }, 2000); // Simulate a 2-second scan
    });
};


export function ProductScanner() {
  const router = useRouter();
  const { toast } = useToast();
  const [barcode, setBarcode] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isScanning, startScanTransition] = useTransition();
  const [scannedBarcode, setScannedBarcode] = useState<string>('');

  useEffect(() => {
    // Select a random product barcode only on the client-side to avoid hydration errors.
    const productIds = PRODUCTS_DB.map(p => p.id);
    const randomId = productIds[Math.floor(Math.random() * productIds.length)];
    setScannedBarcode(randomId);
  }, []);

  const handleNavigation = (barcode: string) => {
    const product = getProductById(barcode.trim());
    if (!product) {
      toast({
        title: 'Product Not Found',
        description: "We couldn't find a product with that barcode in our database.",
        variant: 'destructive',
      });
      return;
    }
    router.push(`/product/${barcode.trim()}`);
  }

  useEffect(() => {
    if (isDialogOpen) {
      setHasCameraPermission(null);
      const getCameraPermission = async () => {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            setHasCameraPermission(false);
            return;
        }
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
          setHasCameraPermission(true);

          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        } catch (error) {
          console.error('Error accessing camera:', error);
          setHasCameraPermission(false);
          toast({
            variant: 'destructive',
            title: 'Camera Access Denied',
            description: 'Please enable camera permissions in your browser settings to use this feature.',
          });
        }
      };

      getCameraPermission();
    } else {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
    }
  }, [isDialogOpen, toast]);

  useEffect(() => {
    if (hasCameraPermission && videoRef.current && scannedBarcode) {
        startScanTransition(async () => {
            const resultBarcode = await fakeScan(videoRef.current!, scannedBarcode);
            toast({
                title: "Scan Successful",
                description: `Found product with barcode: ${resultBarcode}`,
            });
            handleNavigation(resultBarcode);
            setIsDialogOpen(false);
        });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasCameraPermission, scannedBarcode]);

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
    handleNavigation(barcode);
  };

  return (
    <div className="flex w-full max-w-sm items-center space-x-2">
      <form onSubmit={handleSubmit} className="flex flex-grow items-center space-x-2">
        <Input
          type="text"
          placeholder="Enter product barcode..."
          value={barcode}
          onChange={(e) => setBarcode(e.target.value)}
          aria-label="Product barcode"
          className="flex-grow"
        />
        <Button type="submit">
          Search
        </Button>
      </form>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" aria-label="Scan barcode">
            <ScanLine className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Scan Barcode</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className='relative flex items-center justify-center bg-muted rounded-md aspect-video'>
              <video ref={videoRef} className="w-full h-full object-cover rounded-md" autoPlay muted playsInline />

              {isScanning && (
                 <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50">
                    <Loader2 className="h-8 w-8 animate-spin text-white" />
                    <p className="text-white mt-2">Scanning...</p>
                 </div> 
              )}

              {hasCameraPermission === false && (
                  <Alert variant="destructive" className="w-auto">
                    <AlertTitle>Camera Access Required</AlertTitle>
                    <AlertDescription>
                      Please allow camera access.
                    </AlertDescription>
                  </Alert>
              )}
            </div>

          </div>
          <DialogFooter>
            <Button onClick={() => setIsDialogOpen(false)} variant="outline">Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
