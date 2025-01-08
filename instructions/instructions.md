# Building an eCommerce Website Using Next.js and Supabase

## **Objective**
Create a modern eCommerce website similar to the provided design using **Next.js** for the front-end, **Supabase** for the back-end, and include a dashboard for product and order management. The application will include all essential pages, functionalities, and responsiveness.

---

## **Tech Stack**
- **Front-end**: Next.js, Tailwind CSS (or your preferred CSS framework)
- **Back-end**: Supabase (Database, Authentication, and Storage)
- **Payment Integration**: Stripe
- **Deployment**: Vercel (for the front-end) and Supabase (managed back-end)

---

## **Steps to Build**

### 1. **Set Up the Project**
1. Install Next.js and set up a new project:
   ```bash
   npx create-next-app@latest ecomm-site
   cd ecomm-site
   ```
2. Install necessary dependencies:
   ```bash
   npm install @supabase/supabase-js tailwindcss stripe @headlessui/react
   ```
3. Initialize Tailwind CSS:
   ```bash
   npx tailwindcss init
   ```
4. Set up Supabase:
   - Go to [Supabase](https://supabase.com/) and create a new project.
   - Get your Supabase URL and API Key from the dashboard.

### 2. **Create the Database in Supabase**
1. Set up tables for:
   - `users`: Manage user data.
   - `products`: Store product details (name, price, description, image, category, etc.).
   - `categories`: Manage product categories.
   - `orders`: Track user orders.
2. Use SQL scripts in Supabase to define relationships between tables.
3. Upload product images using Supabase Storage.

### 3. **Develop Pages and Features**

#### **Home Page**
- Create a hero section with a featured image, title, and call-to-action button.
- Add a section for discounted products.
- List product categories dynamically fetched from the `categories` table.
- Highlight collections with cards displaying product details.
- Create a partner logos slider.
- Add a newsletter subscription form with Supabase.

#### **Category/Collection Pages**
- Display a grid of products under each category.
- Add filter options (price, size, type) and integrate them dynamically with Supabase queries.
- Implement pagination for large product lists.

#### **Product Details Page**
- Display product details (images, title, price, description, and reviews).
- Add an `Add to Cart` button.
- Show related products fetched from the same category.

#### **Cart and Checkout**
- Create a shopping cart page to list selected products.
- Enable quantity modification and calculate the total price dynamically.
- Add a checkout form integrated with Stripe for payment processing.

#### **User Authentication**
- Use Supabase authentication for login, registration, and logout.
- Create private routes for dashboard access.

#### **Dashboard**
- Build a dashboard for admins to manage products, categories, and orders.
- Features:
  - Add/Edit/Delete products.
  - View and manage user orders.
  - View sales analytics using charts.

### 4. **Integrate Supabase in the Project**
1. Configure Supabase client in `utils/supabase.js`:
   ```javascript
   import { createClient } from '@supabase/supabase-js';

   const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
   const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

   export const supabase = createClient(supabaseUrl, supabaseKey);
   ```
2. Use Supabase queries in API routes or directly in components to fetch/add data.

### 5. **Add Payment Integration with Stripe**
1. Set up a Stripe account and get API keys.
2. Create API routes for Stripe checkout sessions.
3. Use Stripe for processing payments on the checkout page.

### 6. **Styling and Responsiveness**
- Use Tailwind CSS for styling the application.
- Ensure the website is fully responsive on all devices.

### 7. **Testing and Debugging**
- Test all pages and features thoroughly.
- Check Supabase logs for database query issues.
- Use Stripe test cards for payment testing.

### 8. **Deployment**
1. Deploy the front-end to Vercel:
   ```bash
   npm run build
   vercel
   ```
2. Supabase back-end is automatically hosted. Ensure the API keys and storage are configured correctly.

---

## **Folder Structure**
```
├── components
│   ├── Navbar.js
│   ├── Footer.js
│   ├── ProductCard.js
│   └── CategoryCard.js
├── pages
│   ├── index.js
│   ├── category
│   │   └── [id].js
│   ├── product
│   │   └── [id].js
│   ├── cart.js
│   ├── checkout.js
│   └── dashboard
│       ├── index.js
│       ├── products.js
│       └── orders.js
├── public
│   └── images
├── styles
│   └── globals.css
└── utils
    └── supabase.js
```

---

## **Future Enhancements**
- Add user reviews and ratings.
- Implement a wishlist feature.
- Enhance the dashboard with analytics and charts.
- Add multi-language support.
