import { notFound } from 'next/navigation';
import Image from 'next/image';
import { getProductById, getIngredientByName, Ingredient } from '@/lib/data';
import placeholderImages from '@/lib/placeholder-images.json';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { SafetyScoreDisplay } from '@/components/SafetyScoreDisplay';
import { SaferAlternatives } from '@/components/SaferAlternatives';
import { ProductDescription } from '@/components/ProductDescription';
import type { Product } from '@/lib/data';

export type SafetyInfo = {
  score: number;
  label: 'Green' | 'Yellow' | 'Red';
};

export function calculateSafetyScore(product: Product): { score: number; riskyIngredients: Ingredient[] } {
  let score = 100;
  const riskyIngredients: Ingredient[] = [];

  product.ingredients.forEach(ingredientName => {
    const ingredientData = getIngredientByName(ingredientName);
    if (ingredientData && ingredientData.risk > 1) {
      score -= ingredientData.risk * 2;
      riskyIngredients.push(ingredientData);
    }
  });

  return { score: Math.max(0, score), riskyIngredients };
}

export function getSafetyInfo(score: number): SafetyInfo {
  if (score > 80) {
    return { score, label: 'Green' };
  }
  if (score > 50) {
    return { score, label: 'Yellow' };
  }
  return { score, label: 'Red' };
}

export default function ProductPage({ params }: { params: { barcode: string } }) {
  const product = getProductById(params.barcode);

  if (!product) {
    notFound();
  }

  const { score } = calculateSafetyScore(product);
  const safetyInfo = getSafetyInfo(score);
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
                        {product.ingredients.map(ingredientName => {
                            const ingredientData = getIngredientByName(ingredientName);
                            const riskLevel = ingredientData?.risk ?? 0;
                            return (
                                <AccordionItem value={ingredientName} key={ingredientName}>
                                    <AccordionTrigger>
                                        <div className="flex items-center justify-between w-full pr-4">
                                            <span>{ingredientName}</span>
                                            {riskLevel > 5 ? <Badge variant="destructive">High Risk</Badge> : riskLevel > 1 ? <Badge variant="secondary">Moderate</Badge> : <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">Low Risk</Badge>}
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        {ingredientData?.description ?? "No information available."}
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
