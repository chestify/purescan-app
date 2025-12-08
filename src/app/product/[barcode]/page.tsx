
'use client';

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

import type { Product, Ingredient } from "@/lib/data";

import placeholderImages from "@/lib/placeholder-images.json";
import { useEffect, useState } from "react";
import { getProductByBarcode, getIngredientsByProductId, getIngredientById } from "@/lib/firestore-client";
import { Skeleton } from "@/components/ui/skeleton";

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

export default function ProductPage({
  params,
}: {
  params: { barcode: string };
}) {
  const [product, setProduct] = useState<Product | null>(null);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        // 1. Fetch product
        const productData = (await getProductByBarcode(params.barcode)) as Product | null;

        if (!productData) {
          notFound();
          return;
        }
        setProduct(productData);

        // 2. Fetch ingredient link docs
        const ingredientLinks: { ingredientId: string }[] =
          await getIngredientsByProductId(productData.id);

        // 3. Fetch full ingredient docs
        const ingredientDetails = (
          await Promise.all(
            ingredientLinks.map(async (link) => {
              const ing = await getIngredientById(link.ingredientId);
              return ing || null;
            })
          )
        ).filter(Boolean) as Ingredient[];
        setIngredients(ingredientDetails);

      } catch (err) {
        console.error("Error fetching product data:", err);
        setError("Failed to load product data.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [params.barcode]);

  if (loading) {
    return (
        <div className="container py-12">
            <div className="grid md:grid-cols-2 gap-12 items-start">
                <div className="flex flex-col gap-8">
                    <Card>
                        <CardHeader>
                            <Skeleton className="h-8 w-3/4" />
                            <Skeleton className="h-4 w-1/4" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="aspect-square w-full" />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                             <Skeleton className="h-8 w-1/2" />
                             <Skeleton className="h-4 w-3/4" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-5/6" />
                        </CardContent>
                    </Card>
                </div>
                <div className="flex flex-col gap-8">
                     <Card className="text-center">
                        <CardHeader>
                            <Skeleton className="h-8 w-1/2 mx-auto" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-40 w-40 rounded-full mx-auto" />
                            <Skeleton className="h-8 w-24 rounded-full mx-auto mt-4" />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <Skeleton className="h-8 w-3/4" />
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
  }

  if (error) {
    // This could be a more user-friendly error component
    return <div className="container py-12 text-center text-destructive">{error}</div>;
  }
  
  if (!product) {
      return notFound();
  }


  // 4. Use Firestore safety score OR fallback
  const fallbackScore = calculateFallbackScore(ingredients);
  const liveScore = product.safetyScore ?? fallbackScore.score;
  const liveColor = product.safetyColor ?? fallbackScore.color;

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
                  width={productImage ? 400 : 400}
                  height={productImage ? 400 : 400}
                  className="object-cover rounded-md w-full h-full"
                />
              </div>
            </CardContent>
          </Card>

          <ProductDescription ingredients={ingredients} safetyInfo={safetyInfo} />

          {(safetyInfo.label === "Yellow" ||
            safetyInfo.label === "Red") && (
            <SaferAlternatives productLabel={safetyInfo.label as 'Yellow' | 'Red'} />
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
                label={safetyInfo.label as 'Green' | 'Yellow' | 'Red'}
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
