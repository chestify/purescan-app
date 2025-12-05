import { notFound } from 'next/navigation';
import Image from 'next/image';

import placeholderImages from '@/lib/placeholder-images.json';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { SafetyScoreDisplay } from '@/components/SafetyScoreDisplay';
import { SaferAlternatives } from '@/components/SaferAlternatives';
import { ProductDescription } from '@/components/ProductDescription';

import { getProductByBarcode, getIngredientsByProductId, getIngredientById } from "@/lib/firestore";

export type SafetyInfo = {
  score: number;
  label: 'Green' | 'Yellow' | 'Red';
};

export function calculateSafetyScore(ingredients: any[]): { score: number; riskyIngredients: any[] } {
  let totalRisk = 0;
  const riskyIngredients: any[] = [];

  ingredients.forEach(ingredient => {
    const riskWeight = ingredient?.riskWeight ?? 0;
    totalRisk += riskWeight;
    if (riskWeight > 0) riskyIngredients.push(ingredient);
  });

  // Convert to 0–100 scale
  const score = Math.max(0, 100 - Math.min(100, 20 * Math.log(1 + totalRisk)));

  return { score, riskyIngredients };
}

export function getSafetyInfo(score: number): SafetyInfo {
  if (score >= 85) return { score, label: 'Green' };
  if (score >= 50) return { score, label: 'Yellow' };
  return { score, label: 'Red' };
}

export default async function ProductPage({ params }: { params: { barcode: string } }) {
  // Fetch product from Firestore
  const product = await getProductByBarcode(params.barcode);

  if (!product) {
    notFound();
  }

  // Fetch product ingredients
  const productIngredients = await getIngredientsByProductId(product.id);
  const ingredients = await Promise.all(
    productIngredients.map(async pi => await getIngredientById(pi.ingredientId))
  );

  // Calculate safety score
  const { score, riskyIngredients } = calculateSafetyScore(ingredients);
  const safetyInfo = getSafetyInfo(score);

  // Find product image
  const productImage = placeholderImages.placeholderImages.find(p => p.id === product.imageUrlId);

  return (
    <div className="container py-12">
      <div className="grid md:grid-cols-2 gap-12 items-start">
        <div className="flex flex-col gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl font-headline">{product.name}</CardTitle>
              <CardDescription>{product.brand}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="aspect-square relative">
                <Image
                  src={productImage?.imageUrl ?? "https://picsum.photos/seed/default/400/400"}
                  alt={product.name}
                  data-ai-hint={productImage?.imageHint}
                  fill
                  className="object-cover rounded-md"
                />
              </div>
            </CardContent>
          </Card>

          <ProductDescription product={product} safetyInfo={safetyInfo} />

          {(safetyInfo.label === 'Yellow' || safetyInfo.label === 'Red') && (
            <SaferAlternatives productLabel={safetyInfo.label} />
          )}
        </div>

        <div className="flex flex-col gap-8">
          <Card className="text-center">
            <CardHeader>
              <CardTitle className="font-headline">Safety Score</CardTitle>
            </CardHeader>
            <CardContent>
              <SafetyScoreDisplay score={safetyInfo.score} label={safetyInfo.label} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Ingredient Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {ingredients.map(ingredient => {
                  const name = ingredient.name ?? "Unknown";
                  const riskLevel = ingredient.riskWeight ?? 0;

                  return (
                    <AccordionItem value={name} key={name}>
                      <AccordionTrigger>
                        <div className="flex items-center justify-between w-full pr-4">
                          <span>{name}</span>
                          {riskLevel > 5 ? <Badge variant="destructive">High Risk</Badge> 
                            : riskLevel > 1 ? <Badge variant="secondary">Moderate</Badge> 
                            : <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">Low Risk</Badge>}
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        {ingredient.description ?? "No information available."}
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
