// Product recommendations flow.
'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating product recommendations
 * based on user browsing history.
 *
 * - getProductRecommendations - A function that takes user browsing history and returns product recommendations.
 * - ProductRecommendationInput - The input type for the getProductRecommendations function.
 * - ProductRecommendationOutput - The output type for the getProductRecommendations function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ProductRecommendationInputSchema = z.object({
  browsingHistory: z
    .string()
    .describe('The user browsing history as a string of product names, comma-separated.'),
});
export type ProductRecommendationInput = z.infer<typeof ProductRecommendationInputSchema>;

const ProductRecommendationOutputSchema = z.object({
  recommendations: z
    .array(z.string())
    .describe('An array of product names that are recommended to the user.'),
});
export type ProductRecommendationOutput = z.infer<typeof ProductRecommendationOutputSchema>;

export async function getProductRecommendations(input: ProductRecommendationInput): Promise<ProductRecommendationOutput> {
  return productRecommendationFlow(input);
}

const productRecommendationPrompt = ai.definePrompt({
  name: 'productRecommendationPrompt',
  input: {schema: ProductRecommendationInputSchema},
  output: {schema: ProductRecommendationOutputSchema},
  prompt: `You are an intelligent shopping assistant. Your goal is to help users discover products they'll love.
Based on the following list of recently viewed product names, please recommend up to 4 other distinct product names from a typical e-commerce catalog that this user might be interested in.
Prioritize products that are related to or complement the items in the browsing history, but also aim to introduce some relevant variety.
Do not suggest products that are already present in the browsing history.

Browsing History (comma-separated list of product names):
{{{browsingHistory}}}

Provide your recommendations as a list of product names.
Format: Only the product names, separated by commas. For example: "Cool Gadget, Stylish Mug, Useful Book"
Recommended Products:`,
});

const productRecommendationFlow = ai.defineFlow(
  {
    name: 'productRecommendationFlow',
    inputSchema: ProductRecommendationInputSchema,
    outputSchema: ProductRecommendationOutputSchema,
  },
  async input => {
    const {output} = await productRecommendationPrompt(input);
    // If the LLM returns a single string, try to split it into an array if needed.
    // However, Genkit often handles this conversion based on the Zod schema for output.
    // Ensuring the prompt requests comma-separated values helps.
    if (output && output.recommendations && typeof output.recommendations === 'string') {
        // This is a fallback; ideally, Genkit handles schema conversion.
        // The prompt now asks for comma-separated names, so this might be useful if Genkit doesn't auto-split.
        // @ts-ignore - Temporarily allowing this for potential string to array conversion
        output.recommendations = (output.recommendations as string).split(',').map(name => name.trim()).filter(name => name.length > 0);
    } else if (output && !output.recommendations) {
        output.recommendations = []; // Ensure recommendations is always an array
    }
    return output || { recommendations: [] }; // Ensure a valid output structure is always returned
  }
);

