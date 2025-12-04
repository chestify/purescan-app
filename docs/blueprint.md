# **App Name**: PureScan

## Core Features:

- Product Scan: Scan product barcode to retrieve product details using an external API. Implement error handling for unrecognized barcodes.
- Ingredient Analysis: Analyze product ingredients against a risk database. Calculates an aggregate safety score.
- Safety Score Calculation: Calculates a safety score (0-100) based on the cumulative risk of ingredients.
- Product Labeling: Label products as Green (Safe), Yellow (Caution), or Red (Toxic) based on the safety score.
- Safer Alternatives: Suggest safer alternative products based on user region (Caribbean, Africa, Latin America). Uses generative AI tool, which uses the product label as the central part of the decision-making, when to make alternative product suggestions.
- Subscription Management: Manage premium subscriptions via Stripe integration. Includes user authentication and role-based access control.
- Admin Panel: Admin interface for managing products, ingredients, and risk scores. Securely manages Firestore data.
- Business Account for Clean Certification: Business Account creation and verification to mark their products as certified clean.

## Style Guidelines:

- Primary color: Natural green (#8FBC8F), representing health and cleanliness.
- Background color: Off-white (#F5F5DC), providing a clean and calm backdrop.
- Accent color: Soft orange (#FFB347), used sparingly to draw attention to important elements.
- Body and headline font: 'PT Sans', a versatile sans-serif, for a modern and readable interface.
- Use simple, clear icons to represent product categories and safety ratings.
- Clean and minimalist layout with a focus on readability and ease of navigation.
- Subtle animations to provide feedback during scanning and data loading.