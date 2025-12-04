'use client';

import { useState, useTransition } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { suggestSaferAlternatives, SuggestSaferAlternativesOutput } from '@/ai/flows/suggest-safer-alternatives';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

type Props = {
  productLabel: 'Yellow' | 'Red';
};

export function SaferAlternatives({ productLabel }: Props) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [region, setRegion] = useState('');
  const [alternatives, setAlternatives] = useState<SuggestSaferAlternativesOutput | null>(null);

  const handleGetAlternatives = () => {
    if (!region) {
      toast({
        title: 'Region Required',
        description: 'Please select your region to find alternatives.',
        variant: 'destructive',
      });
      return;
    }
    
    startTransition(async () => {
      try {
        const result = await suggestSaferAlternatives({ productLabel, region });
        if (result && result.alternatives) {
          setAlternatives(result);
        } else {
            throw new Error("No alternatives found.");
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Could not fetch alternatives at this time. Please try again.',
          variant: 'destructive',
        });
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-headline">
          <Sparkles className="h-6 w-6 text-accent" />
          Find Safer Alternatives
        </CardTitle>
        <CardDescription>
          This product has a {productLabel.toLowerCase()} rating. Let our AI help you find better options available in your area.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2">
          <label htmlFor="region-select" className="text-sm font-medium">Select your region</label>
          <Select onValueChange={setRegion} value={region}>
            <SelectTrigger id="region-select" aria-label="Select Region">
              <SelectValue placeholder="Select a region" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Caribbean">Caribbean</SelectItem>
              <SelectItem value="Africa">Africa</SelectItem>
              <SelectItem value="Latin America">Latin America</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleGetAlternatives} disabled={isPending || !region} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
          {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
          Generate Suggestions
        </Button>
        {alternatives && (
          <div className="pt-4">
            <h4 className="font-semibold mb-2">Here are some safer options:</h4>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              {alternatives.alternatives.map((alt, i) => (
                <li key={i}>{alt}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
