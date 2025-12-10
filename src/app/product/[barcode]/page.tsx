"use client";

import { notFound } from "next/navigation";
import Image from "next/image";
import { useEffect, useState } from "react";

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
import { Skeleton } from "@/components/ui/skeleton";

import type { Product, Ingredient } from "@/lib/data";
import placeholderImages from "@/lib/placeholder-images.json";
import {
  getProductByBarcode,
  getIngredientsByProductId,
  getIngredientById,
} from "@/lib/firestore";

// Optional fallback calculator if Firestore safetyScore is missing
function calculateFallbackScore(ingredients: Ingredient[]) {
  let totalRisk = 0;

  for (const ing of ingredients) {
    const weight = (ing as any).riskWeight ?? (ing as any).risk ?? 0;
    totalRisk += weight;
  }

  const score = Math.max(
    0,
    100 - Math.min(100, 20 * Math.log(1 + totalRisk))
  );

  let color: "green" | "yellow" | "red" = "green";
  if (score < 50) color = "red";
  else if (score < 85) color = "yellow";

  return { score, color };
}

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

        // 1. Fetch product by scanned barcode
        const productData = (await getProductByBarcode(
          params.barcode
        )) as any as Product | null;

        if (!productData) {
          notFound();
          return;
        }
        setProduct(productData);

        // 2. Fetch linking docs from productIngredients
        const ingredientLinks = await getIngredientsByProductId(
          (productData as any).id
        );

        // 3. Resolve full ingredient docs
        const ingredientDetails = (
          await Promise.all(
            ingredientLinks.map(async (link: any) => {
              // Firestore link docs typically look like { id: <ingredientId>, productId: ..., ... }
              const ing = await getIngredientById(link.id || link.ingredientId);
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
    );
  }

  if (error) {
    return (
      <div className="container py-12 text-center text-destructive">
        {error}
      </div>
    );
  }

  if (!product) {
    return notFound();
  }

  // 4. Compute safety score: prefer Firestore fields, fall back if missing
  const fallbackScore = calculateFallbackScore(ingredients);
  const liveScore = (product as any).safetyScore ?? fallbackScore.score;
  const liveColor = (product as any).safetyColor ?? fallbackScore.color;

  const safetyInfo = {
    score: liveScore,
    label: (liveColor.charAt(0).toUpperCase() +
      liveColor.slice(1)) as "Green" | "Yellow" | "Red",
  };

  const productImage = placeholderImages.placeholderImages.find(
    (p) => p.id === (product as any).imageUrlId
  );

  return (
    <div className="container py-12">
      <div className="grid md:grid-cols-2 gap-12 items-start">
        {/* LEFT COLUMN */}
        <div className="flex flex-col gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl font-headline">
                {(product as any).name}
              </CardTitle>
              <CardDescription>{(product as any).brand}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="aspect-square relative">
                <Image
                  src={
                    productImage?.imageUrl ??
                    "https://picsum.photos/seed/default/400/400"
                  }
                  alt={(product as any).name}
                  data-ai-hint={productImage?.imageHint}
                  width={400}
                  height={400}
                  className="object-cover rounded-md w-full h-full"
                />
              </div>
            </CardContent>
          </Card>

          <ProductDescription
            ingredients={ingredients}
            safetyInfo={safetyInfo}
          />

          {(safetyInfo.label === "Yellow" ||
            safetyInfo.label === "Red") && (
            <SaferAlternatives
              productLabel={safetyInfo.label as "Yellow" | "Red"}
            />
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
                    (ingredient as any).riskWeight ??
                    (ingredient as any).risk ??
                    0;

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
