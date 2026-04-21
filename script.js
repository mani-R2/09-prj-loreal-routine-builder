/* Get references to DOM elements */
const categoryFilter = document.getElementById("categoryFilter");
const productsContainer = document.getElementById("productsContainer");
const chatForm = document.getElementById("chatForm");
const chatWindow = document.getElementById("chatWindow");
const selectedProductsContainer = document.getElementById("selectedProductsList");
const generateRoutineBtn = document.getElementById("generateRoutine");

let allProducts = []; // Store all products for easy access when filtering
let selectedProducts = []; // Store products selected by the user for routine building
let messages = []; // Store chat messages for OpenAI context

function loadSavedProducts() {
  const saved = localStorage.getItem("selectedProducts");
  if (saved) {
    selectedProducts = JSON.parse(saved);
    updateSelectedProducts();
  }
}

/* Save selected products to localStorage */
function saveSelectedProducts() {
  localStorage.setItem("selectedProducts", JSON.stringify(selectedProducts));
}

/* Show initial placeholder until user selects a category */
productsContainer.innerHTML = `
  <div class="placeholder-message">
    Select a category to view products
  </div>
`;

/* Load product data from JSON file */
async function loadProducts() {
    const response = await fetch("products.json");
    const data = await response.json();
    allProducts = data.products; // Store products in a global variable for filtering
    return data.products;
}

/* Update the selected products section */
function updateSelectedProducts() {
  if (selectedProducts.length === 0) {
    selectedProductsContainer.innerHTML = `
      <div class="placeholder-message">
        No products selected for routine
      </div>
    `;
    return;
  }

  /* Create HTML for each selected product and add a remove button */
  selectedProductsContainer.innerHTML = selectedProducts
    .map(
      (product) => `
      <div class="selected-product-card">
        <img src="${product.image}" alt="${product.name}">
        <div class="selected-product-info">
          <h4>${product.name}</h4>
          <p>${product.brand}</p>
          <button class="remove-btn" data-id="${product.id}">Remove</button>
        </div>
      </div>
    `
    )
    .join("") + `<button id="clearAllBtn">Clear All</button>`;

/* remove from selected products */
selectedProductsContainer.querySelectorAll(".remove-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const productId = btn.getAttribute("data-id");
    ToggleProductSelection(productId);
    saveSelectedProducts();
  });
});
/* Clear all selected products */
const clearAllBtn = document.getElementById("clearAllBtn");
if (clearAllBtn) {
  clearAllBtn.addEventListener("click", () => {
    selectedProducts = [];
    saveSelectedProducts();
    updateSelectedProducts();
    productsContainer.innerHTML = `
      <div class="placeholder-message">
        Select a category to view products
      </div>
    `;
  });
}
}

/* Toggle product selection for routine building */
function ToggleProductSelection(productId) {
  const product = allProducts.find((p) => p.id == productId);
  const index = selectedProducts.findIndex((p) => p.id == productId);

  if (index > -1) {
    // If product is already selected, remove it
    selectedProducts.splice(index, 1);
  } else {
    // Otherwise, add it to the selection
    selectedProducts.push(product);
  }

  updateSelectedProducts();
}

/* Initial load of products - can be called on page load or category change */
async function init() {
  await loadProducts();
}


/* Create HTML for displaying product cards */
function displayProducts(products) {
  productsContainer.innerHTML = products
    .map((product) => {
        const isSelected = selectedProducts.some((p) => p.id == product.id);
        return `
          <div class="product-card ${isSelected ? "selected" : ""}" data-id="${product.id}">
            <img src="${product.image}" alt="${product.name}">
            <div class="product-info">
              <h3>${product.name}</h3>
              <p>${product.brand}</p>
              <button class="desc-btn">View Description</button>
              <p class="description hidden">${product.description}</p>
            </div>
          </div>
         `;
      })
    .join("");

document.querySelectorAll(".desc-btn").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    const description = btn.nextElementSibling;
    e.stopPropagation(); // Prevent card click event from firing
    description.classList.toggle("hidden");
  });
});
}

/* Add click event listeners to product cards for selection */
productsContainer.addEventListener("click", (e) => {
  const card = e.target.closest(".product-card");
  if (!card) return; // Click was outside a product card

  const productId = card.getAttribute("data-id");
  ToggleProductSelection(productId);
});

/* Filter and display products when category changes */
categoryFilter.addEventListener("change", async (e) => {
  const products = await loadProducts();
  const selectedCategory = e.target.value;

  /* filter() creates a new array containing only products 
     where the category matches what the user selected */
  const filteredProducts = products.filter(
    (product) => product.category === selectedCategory
  );

  displayProducts(filteredProducts);
});

/* Chat form submission handler - placeholder for OpenAI integration */
chatForm.addEventListener("submit", async(e) => {
  e.preventDefault();
  const userInput = document.getElementById("userInput").value;
  messages.push({
     role: "user", 
     content: userInput
    });

  chatWindow.innerHTML = "Connect to the OpenAI API for a response!";
});

/* Generate routine button click handler - placeholder for OpenAI integration */
generateRoutineBtn.addEventListener("click", async () => {
  if (selectedProducts.length === 0) {
    chatWindow.innerHTML = "Please select some products to generate a routine.";
     return;
  }

  const productData = selectedProducts.map((p) => ({
    name: p.name,
    brand: p.brand,
    category: p.category,
    description: p.description,
  }));

  messages = [
    {
      role: "system",
      content: "You are a skincare routine expert. Based on the selected products, create a personalized skincare routine for the user.",
    },
    {
      role: "user",
      content: `Here are the products I've selected:\n${JSON.stringify(
        productData,
        null,
        2
      )}\nPlease create a skincare routine using these products.`,
    },
  ];

  chatWindow.innerHTML = "Generating your personalized skincare routine...";

  try {
    const response = await fetch("https://loreal-chatbot.iyrojas.workers.dev", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        products: selectedProducts,
        messages: messages,
      }),
    });

    const data = await response.json();
    const reply = data.choices[0].message.content;
    messages.push({
      role: "assistant",
      content: reply,
    });

    chatWindow.innerHTML = reply;
  } catch (error) {
    console.error("Error generating routine:", error);
    chatWindow.innerHTML = "Sorry, there was an error generating your routine.";
  }

  document.getElementById("userInput").value = "";
});

loadSavedProducts(); // Load any previously selected products on page load
updateSelectedProducts(); // Update the selected products section on page load
init(); // Load products and set up initial state