import { Button } from "@/components/ui/button";
import { ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function BusinessPage() {
  return (
    <div className="flex flex-col">
      <section className="w-full py-12 md:py-24 lg:py-32 bg-card">
        <div className="container px-4 md:px-6">
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-12">
            <div className="flex flex-col justify-center space-y-4">
              <div className="space-y-4">
                <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">For Businesses</div>
                <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">
                  Get PureScan Certified
                </h1>
                <p className="max-w-[600px] text-muted-foreground md:text-xl">
                  Showcase your commitment to clean ingredients and build trust with conscious consumers. The PureScan Certified seal is a mark of transparency and quality.
                </p>
              </div>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                <Button asChild size="lg">
                  <Link href="/auth/sign-up?role=business">
                    Create a Business Account
                  </Link>
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-center">
              <ShieldCheck className="h-48 w-48 text-primary animate-pulse" />
            </div>
          </div>
        </div>
      </section>

      <section className="w-full py-12 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6 space-y-12">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
             <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl font-headline">Benefits of Certification</h2>
             <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed">
                Joining the PureScan certification program helps your brand stand out.
              </p>
          </div>
          <div className="mx-auto grid items-start gap-8 sm:max-w-4xl sm:grid-cols-2 md:gap-12 lg:max-w-5xl lg:grid-cols-3">
            <div className="grid gap-1 text-center">
              <h3 className="text-lg font-bold">Build Trust</h3>
              <p className="text-sm text-muted-foreground">Consumers are more likely to purchase products they know are safe.</p>
            </div>
            <div className="grid gap-1 text-center">
              <h3 className="text-lg font-bold">Increase Visibility</h3>
              <p className="text-sm text-muted-foreground">Your products will be highlighted as 'Certified Clean' in our app.</p>
            </div>
            <div className="grid gap-1 text-center">
              <h3 className="text-lg font-bold">Gain Insights</h3>
              <p className="text-sm text-muted-foreground">Access data on how consumers are interacting with your products.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
