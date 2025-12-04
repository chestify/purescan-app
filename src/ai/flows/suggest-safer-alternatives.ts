'use server';

/**
 * @fileOverview This file defines a Genkit flow for suggesting safer alternative products based on a given product's safety label and user region.
 *
 * - suggestSaferAlternatives - A function that suggests safer alternative products.
 * - SuggestSaferAlternativesInput - The input type for the suggestSaferAlternatives function.
 * - SuggestSaferAlternativesOutput - The output type for the suggestSaferAlternatives function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestSaferAlternativesInputSchema = z.object({
  productLabel: z
    .enum(['Green', 'Yellow', 'Red'])
    .describe('The safety label of the scanned product (Green, Yellow, or Red).'),
  region: z
    .string()
    .describe(
      'The user\u0027s region (e.g., Caribbean, Africa, Latin America) to find relevant alternatives.'
    ),
});
export type SuggestSaferAlternativesInput = z.infer<
  typeof SuggestSaferAlternativesInputSchema
>;

const SuggestSaferAlternativesOutputSchema = z.object({
  alternatives: z
    .array(z.string())
    .describe('A list of safer alternative product suggestions.'),
});
export type SuggestSaferAlternativesOutput = z.infer<
  typeof SuggestSaferAlternativesOutputSchema
>;

export async function suggestSaferAlternatives(
  input: SuggestSaferAlternativesInput
): Promise<SuggestSaferAlternativesOutput> {
  return suggestSaferAlternativesFlow(input);
}

const suggestSaferAlternativesPrompt = ai.definePrompt({
  name: 'suggestSaferAlternativesPrompt',
  input: {schema: SuggestSaferAlternativesInputSchema},
  output: {schema: SuggestSaferAlternativesOutputSchema},
  prompt: `You are an AI assistant specializing in recommending safer alternative products based on a product's safety label and the user's region.

  Given the following information, suggest safer alternatives:

  Product Safety Label: {{{productLabel}}}
  User Region: {{{region}}}

  Consider the product's safety label and the user's region to provide relevant and accessible alternatives. Provide a list of product names, taking into account regional availability.
  Do not include any introductory or concluding sentences in your response, only include the alternative product suggestions.

  Example:
  - Alternative Product 1
  - Alternative Product 2
  - Alternative Product 3`,
});

const suggestSaferAlternativesFlow = ai.defineFlow(
  {
    name: 'suggestSaferAlternativesFlow',
    inputSchema: SuggestSaferAlternativesInputSchema,
    outputSchema: SuggestSaferAlternativesOutputSchema,
  },
  async input => {
    const {output} = await suggestSaferAlternativesPrompt(input);
    return output!;
  }
);
