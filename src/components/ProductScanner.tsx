'use client';

import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScanLine } from 'lucide-react';
import { FormEvent, useState, useRef, useEffect } from 'react';
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

export function ProductScanner() {
  const router = useRouter();
  const { toast } = useToast();
  const [barcode, setBarcode] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);

  useEffect(() => {
    if (isDialogOpen) {
      const getCameraPermission = async () => {
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
          Scan
        </Button>
      </form>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline">
            <ScanLine className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Scan Barcode</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className='relative'>
              <video ref={videoRef} className="w-full aspect-video rounded-md bg-muted" autoPlay muted playsInline />

              {hasCameraPermission === false && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Alert variant="destructive" className="w-auto">
                    <AlertTitle>Camera Access Required</AlertTitle>
                    <AlertDescription>
                      Please allow camera access to use this feature.
                    </AlertDescription>
                  </Alert>
                </div>
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
