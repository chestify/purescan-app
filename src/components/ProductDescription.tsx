
'use client';

import { useState, useTransition, useEffect } from 'react';
import { Loader2, Sparkles, FileText } from 'lucide-react';
import { generateProductDescription } from '@/ai/flows/generate-product-description';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import type { Ingredient } from '@/lib/data';
import { Skeleton } from '@/components/ui/skeleton';

type SafetyInfo = {
    score: number;
    label: string;
};

type Props = {
  ingredients: Ingredient[];
  safetyInfo: SafetyInfo;
};

export function ProductDescription({ ingredients, safetyInfo }: Props) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [description, setDescription] = useState<string | null>(null);

  useEffect(() => {
    startTransition(async () => {
      try {
        const ingredientNames = ingredients.map(ing => ing.name).join(', ');
        const result = await generateProductDescription({
          ingredients: ingredientNames,
          safetyScore: safetyInfo.score,
          productLabel: safetyInfo.label,
        });
        if (result && result.description) {
          setDescription(result.description);
        } else {
          throw new Error('Could not generate description.');
        }
      } catch (error) {
        console.error(error);
        toast({
          title: 'Error',
          description: 'Could not generate a product description at this time.',
          variant: 'destructive',
        });
        setDescription('An error occurred while generating the description.');
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ingredients, safetyInfo]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-headline">
          <FileText className="h-6 w-6 text-primary" />
          AI-Generated Summary
        </CardTitle>
        <CardDescription>
            An AI-powered summary of this product's profile based on its ingredients.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isPending && (
            <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
            </div>
        )}
        {description && <p className="text-muted-foreground">{description}</p>}
      </CardContent>
    </Card>
  );
}
