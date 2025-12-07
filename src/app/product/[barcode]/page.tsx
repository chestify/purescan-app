import { notFound } from "next/navigation";
import Image from "next/image";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import { SafetyScoreDisplay } from "@/components/SafetyScoreDisplay";
import { SaferAlternatives } from "@/components/SaferAlternatives";
import { ProductDescription } from "@/components/ProductDescription";

import {
  getProductByBarcode,
  getIngredientsByProductId,
  getIngredientById,
} from "@/lib/firestore";

import type { Product, Ingredient } from "@/lib/data";

import placeholderImages from "@/lib/placeholder-images.json";

// -----------------------------------------------
// Optional fallback calculator (only if Firestore score missing)
// -----------------------------------------------
function calculateFallbackScore(ingredients: Ingredient[]) {
  let totalRisk = 0;

  for (const ing of ingredients) {
    const weight = ing.riskWeight ?? ing.risk ?? 0;
    totalRisk += weight;
  }

  const score = Math.max(0, 100 - Math.min(100, 20 * Math.log(1 + totalRisk)));

  let label: "green" | "yellow" | "red" = "green";
  if (score < 50) label = "red";
  else if (score < 85) label = "yellow";

  return { score, color: label };
}

// -----------------------------------------------
// PAGE COMPONENT
// -----------------------------------------------

export default async function ProductPage({
  params,
}: {
  params: { barcode: string };
}) {
  // 1. Fetch product
  const product = (await getProductByBarcode(params.barcode)) as Product | null;

  if (!product) {
    notFound();
  }

  // 2. Fetch ingredient link docs
  const ingredientLinks: { ingredientId: string }[] =
    await getIngredientsByProductId(product.id);

  // 3. Fetch full ingredient docs
  const ingredients = (
    await Promise.all(
      ingredientLinks.map(async (link) => {
        const ing = await getIngredientById(link.ingredientId);
        return ing || null;
      })
    )
  ).filter(Boolean) as Ingredient[];

  // 4. Use Firestore safety score OR fallback
  const liveScore =
    product.safetyScore ??
    calculateFallbackScore(ingredients).score;

  const liveColor =
    product.safetyColor ??
    calculateFallbackScore(ingredients).color;

  const safetyInfo = {
    score: liveScore,
    label: liveColor.charAt(0).toUpperCase() + liveColor.slice(1),
  };

  // 5. Resolve image
  const productImage = placeholderImages.placeholderImages.find(
    (p) => p.id === product.imageUrlId
  );

  return (
    <div className="container py-12">
      <div className="grid md:grid-cols-2 gap-12 items-start">
        {/* LEFT COLUMN */}
        <div className="flex flex-col gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl font-headline">
                {product.name}
              </CardTitle>
              <CardDescription>{product.brand}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="aspect-square relative">
                <Image
                  src={
                    productImage?.imageUrl ??
                    "https://picsum.photos/seed/default/400/400"
                  }
                  alt={product.name}
                  data-ai-hint={productImage?.imageHint}
                  fill
                  className="object-cover rounded-md"
                />
              </div>
            </CardContent>
          </Card>

          <ProductDescription product={product} safetyInfo={safetyInfo} />

          {(safetyInfo.label === "Yellow" ||
            safetyInfo.label === "Red") && (
            <SaferAlternatives productLabel={safetyInfo.label} />
          )}
        </div>

        {/* RIGHT COLUMN */}
        <div className="flex flex-col gap-8">
          <Card className="text-center">
            <CardHeader>
              <CardTitle className="font-headline">Safety Score</CardTitle>
            </CardHeader>
            <CardContent>
              <SafetyScoreDisplay
                score={safetyInfo.score}
                label={safetyInfo.label}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-headline">
                Ingredient Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {ingredients.map((ingredient) => {
                  const name = ingredient.name ?? "Unknown";
                  const riskLevel =
                    ingredient.riskWeight ?? ingredient.risk ?? 0;

                  return (
                    <AccordionItem value={name} key={name}>
                      <AccordionTrigger>
                        <div className="flex items-center justify-between w-full pr-4">
                          <span>{name}</span>
                          {riskLevel > 5 ? (
                            <Badge variant="destructive">High Risk</Badge>
                          ) : riskLevel > 1 ? (
                            <Badge variant="secondary">Moderate</Badge>
                          ) : (
                            <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
                              Low Risk
                            </Badge>
                          )}
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        {ingredient.description ??
                          "No information available."}
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
