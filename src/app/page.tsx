"use client";

import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Shield, Truck } from 'lucide-react';
import placeholderImages from '@/lib/placeholder-images.json';
import BarcodeScanner from "@/components/BarcodeScanner";
import { useRouter } from "next/navigation";


const features = [
  {
    icon: <Shield className="h-8 w-8 text-primary" />,
    title: 'Instant Safety Analysis',
    description: 'Scan any product to get an immediate breakdown of its ingredients and potential risks.',
  },
  {
    icon: <CheckCircle className="h-8 w-8 text-primary" />,
    title: 'Find Safer Alternatives',
    description: 'Get AI-powered recommendations for cleaner, healthier products available in your region.',
  },
  {
    icon: <Truck className="h-8 w-8 text-primary" />,
    title: 'Certified Clean Choices',
    description: 'Look for the PureScan seal to easily identify products verified by our clean standards.',
  },
]

export default function Home() {
  const router = useRouter();

  function handleDetected(barcode: string) {
    console.log("Detected barcode:", barcode);
    router.push(`/product/${barcode}`);
  }
  const heroImage = placeholderImages.placeholderImages.find(p => p.id === "hero-image");

  return (
    <div className="flex flex-col">
      <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-card">
        <div className="container px-4 md:px-6">
          <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
            <div className="flex flex-col justify-center space-y-4">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none font-headline">
                  Know What's In Your Products.
                </h1>
                <p className="max-w-[600px] text-muted-foreground md:text-xl">
                  PureScan helps you understand product ingredients, so you can make safer choices for you and your family.
                </p>
              </div>
              <section className="mt-6">
  <h2 className="text-2xl font-bold mb-4">Scan a Product</h2>

  <BarcodeScanner onDetected={handleDetected} />

  <p className="text-center mt-2 text-sm text-muted-foreground">
    Point your camera at a barcode to begin.
  </p>
</section>

            </div>
            <div className="mx-auto aspect-[3/2] overflow-hidden rounded-xl lg:order-last">
              <Image
                src={heroImage?.imageUrl ?? "https://picsum.photos/seed/purescan-hero/600/400"}
                data-ai-hint={heroImage?.imageHint}
                width={600}
                height={400}
                alt={heroImage?.description ?? "A vibrant image representing a healthy and clean lifestyle."}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>
      
      <section className="w-full py-12 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">Our Features</div>
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">A New Standard of Clean</h2>
              <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                We provide the tools and transparency you need to navigate the world of consumer products with confidence.
              </p>
            </div>
          </div>
          <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:gap-12 lg:grid-cols-3 mt-12">
            {features.map((feature, index) => (
              <Card key={index} className="bg-background">
                <CardHeader className="flex flex-col items-center text-center gap-4">
                  {feature.icon}
                  <CardTitle>{feature.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
