import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";

const tiers = [
  {
    name: "Free",
    price: "$0",
    description: "For casual users",
    features: ["5 scans per month", "Basic ingredient analysis", "Community support"],
    isCurrent: true,
  },
  {
    name: "Premium",
    price: "$9.99/mo",
    description: "For conscious consumers",
    features: ["Unlimited scans", "AI-powered safer alternatives", "Advanced ingredient insights", "Priority support"],
    isCurrent: false,
    cta: "Upgrade to Premium",
  },
];

export default function SubscriptionPage() {
  return (
    <div className="container py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold font-headline">Subscription Plans</h1>
        <p className="text-muted-foreground mt-2">Choose the plan that's right for you.</p>
      </div>
      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {tiers.map(tier => (
          <Card key={tier.name} className={tier.isCurrent ? "border-2 border-primary" : ""}>
            <CardHeader>
              <CardTitle>{tier.name}</CardTitle>
              <CardDescription>{tier.description}</CardDescription>
              <p className="text-4xl font-bold pt-2">{tier.price}</p>
            </CardHeader>
            <CardContent className="flex-grow">
              <ul className="space-y-3">
                {tier.features.map(feature => (
                  <li key={feature} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              {tier.isCurrent ? (
                <Button variant="outline" className="w-full" disabled>Your Current Plan</Button>
              ) : (
                <Button className="w-full">{tier.cta}</Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}
