export type Ingredient = {
  name: string;
  risk: number; // 0-10, where 10 is high risk
  description: string;
};

export type Product = {
  id: string; // barcode
  name: string;
  brand: string;
  imageUrlId: string;
  ingredients: string[]; // names of ingredients
};

export const INGREDIENTS_DB: Ingredient[] = [
  { name: 'Aqua (Water)', risk: 0, description: 'Just water.' },
  { name: 'Glycerin', risk: 1, description: 'A common, safe humectant.' },
  { name: 'Parabens', risk: 8, description: 'Preservatives linked to hormone disruption.' },
  { name: 'Sodium Lauryl Sulfate (SLS)', risk: 7, description: 'A surfactant that can cause skin irritation.' },
  { name: 'Fragrance (Parfum)', risk: 6, description: 'A mix of scent chemicals that can cause allergies.' },
  { name: 'Titanium Dioxide', risk: 3, description: 'A mineral filter, generally safe but can be a concern in aerosol form.' },
  { name: 'Avocado Oil', risk: 0, description: 'A natural, nourishing oil.' },
  { name: 'Shea Butter', risk: 0, description: 'A natural moisturizer.' },
  { name: 'Phthalates', risk: 9, description: 'Chemicals used to make plastics more durable, linked to endocrine disruption.'},
  { name: 'Talc', risk: 5, description: 'A mineral that can sometimes be contaminated with asbestos.'}
];

export const PRODUCTS_DB: Product[] = [
  {
    id: '123456789',
    name: 'Daily Moisturizing Lotion',
    brand: 'Generic Brand',
    imageUrlId: 'product-1',
    ingredients: ['Aqua (Water)', 'Glycerin', 'Sodium Lauryl Sulfate (SLS)', 'Parabens'],
  },
  {
    id: '987654321',
    name: 'Natural Care Body Butter',
    brand: 'Green Organics',
    imageUrlId: 'product-2',
    ingredients: ['Shea Butter', 'Avocado Oil', 'Glycerin'],
  },
  {
    id: '112233445',
    name: 'Scented Shower Gel',
    brand: 'AromaFresh',
    imageUrlId: 'product-3',
    ingredients: ['Aqua (Water)', 'Sodium Lauryl Sulfate (SLS)', 'Fragrance (Parfum)', 'Phthalates'],
  },
    {
    id: '556677889',
    name: 'Baby Powder',
    brand: 'Soft & Gentle',
    imageUrlId: 'product-4',
    ingredients: ['Talc', 'Fragrance (Parfum)'],
  },
];

export function getProductById(id: string): Product | undefined {
  return PRODUCTS_DB.find(p => p.id === id);
}

export function getIngredientByName(name: string): Ingredient | undefined {
  return INGREDIENTS_DB.find(i => i.name === name);
}
