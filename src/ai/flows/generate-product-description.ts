'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating a product description based on ingredients and safety score.
 *
 * @remarks
 * The flow takes in ingredients and a safety score as input and generates a product description.
 *
 * @exports generateProductDescription - The function to generate product descriptions.
 * @exports GenerateProductDescriptionInput - The input type for the generateProductDescription function.
 * @exports GenerateProductDescriptionOutput - The output type for the generateProductDescription function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateProductDescriptionInputSchema = z.object({
  ingredients: z
    .string()
    .describe('A comma-separated list of ingredients in the product.'),
  safetyScore: z
    .number()
    .describe('The safety score of the product (0-100).'),
  productLabel: z
    .string()
    .describe('The product label (Green, Yellow, or Red).')
});

export type GenerateProductDescriptionInput = z.infer<
  typeof GenerateProductDescriptionInputSchema
>;

const GenerateProductDescriptionOutputSchema = z.object({
  description: z
    .string()
    .describe('The generated product description.'),
});

export type GenerateProductDescriptionOutput = z.infer<
  typeof GenerateProductDescriptionOutputSchema
>;

export async function generateProductDescription(
  input: GenerateProductDescriptionInput
): Promise<GenerateProductDescriptionOutput> {
  return generateProductDescriptionFlow(input);
}

const generateProductDescriptionPrompt = ai.definePrompt({
  name: 'generateProductDescriptionPrompt',
  input: {schema: GenerateProductDescriptionInputSchema},
  output: {schema: GenerateProductDescriptionOutputSchema},
  prompt: `You are an expert product description writer.

  Given the following ingredients, safety score, and product label, generate a compelling and informative product description.

  Ingredients: {{{ingredients}}}
  Safety Score: {{{safetyScore}}}
  Product Label: {{{productLabel}}}

  Description:`,
});

const generateProductDescriptionFlow = ai.defineFlow(
  {
    name: 'generateProductDescriptionFlow',
    inputSchema: GenerateProductDescriptionInputSchema,
    outputSchema: GenerateProductDescriptionOutputSchema,
  },
  async input => {
    const {output} = await generateProductDescriptionPrompt(input);
    return output!;
  }
);
