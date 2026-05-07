// 🔌 PRODUCTS NOW LOADED FROM API!
// 
// Previously: Hard-coded products array in this file
// Now: Products loaded dynamically from /api/products/list
// 
// Location: js/main.js - DOMContentLoaded event
// The API call fetches products from the backend and stores in global 'productsData'
//
// To add new products: Use the Admin Dashboard or API endpoints
// See: FRONTEND_INTEGRATION.md and API_SETUP.md for documentation

// ✅ Global products variable (populated by API in main.js)
let productsData = [];

// Example product structure (for reference):
/*
{
  id: 1,
  title: 'Product Name',
  price: 100000,
  img: './assets/img/products/image.jpg',
  category: 'Category Name',
  description: 'Product description',
  status: 1
}
*/

