/* ==========================================================================
   North Star Bakery — script.js
   Touchstone 4: JavaScript interactivity, form validation, browser storage
   ========================================================================== */

/* --------------------------------------------------------------------------
   FEATURE 1: Favorites Tracker (Products page)
   - Lets visitors mark bakery items as favorites so they can remember what
     to order or ask for when they visit or call the bakery.
   - Favorites are stored in an object (keyed by product id) in localStorage
     so the list survives a page refresh or a later visit.
   -------------------------------------------------------------------------- */

const FAVORITES_KEY = "northStarFavorites";

/**
 * Product catalog as an array of objects. Keeping this data separate from
 * the DOM (rather than reading names back out of the page) makes the
 * favorites feature easier to extend later and gives the JavaScript its own
 * source of truth for what each product id represents.
 */
const PRODUCTS = [
  { id: "sourdough", name: "Classic Sourdough", category: "Breads" },
  { id: "country-loaf", name: "Whole Wheat Country Loaf", category: "Breads" },
  { id: "multigrain", name: "Seeded Multigrain", category: "Breads" },
  { id: "croissants", name: "Butter Croissants", category: "Pastries" },
  { id: "babka", name: "Cinnamon Swirl Babka", category: "Pastries" },
  { id: "danishes", name: "Seasonal Fruit Danishes", category: "Pastries" },
  { id: "celebration-cakes", name: "Celebration Cakes", category: "Cakes" },
  { id: "cupcakes", name: "Individual Cupcakes", category: "Cakes" },
];

/** Looks up a product's display name from the PRODUCTS array by its id. */
function getProductName(productId) {
  const product = PRODUCTS.find((item) => item.id === productId);
  return product ? product.name : productId;
}

/**
 * Reads the saved favorites from localStorage.
 * Data is stored as an object, e.g. { "sourdough": true, "babka": true }
 * so each product id can be looked up directly instead of searching an array.
 */
function getFavorites() {
  const stored = localStorage.getItem(FAVORITES_KEY);
  if (!stored) {
    return {};
  }
  try {
    return JSON.parse(stored);
  } catch (error) {
    console.error("Could not read saved favorites:", error);
    return {};
  }
}

/** Saves the favorites object back to localStorage. */
function saveFavorites(favorites) {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
}

/** Turns a single favorite on or off and saves the updated object. */
function toggleFavorite(productId) {
  const favorites = getFavorites();
  favorites[productId] = !favorites[productId];
  saveFavorites(favorites);
  return favorites;
}

/** Updates one button's label/state to match whether it is a favorite. */
function updateFavoriteButton(button, isFavorite) {
  button.setAttribute("aria-pressed", isFavorite);
  button.classList.toggle("is-favorite", isFavorite);
  button.textContent = isFavorite ? "★ Favorited" : "☆ Add to Favorites";
}

/**
 * Rebuilds the "My Favorites" summary list at the top of the Products page
 * using the array of favorite product names currently saved.
 */
function renderFavoritesSummary() {
  const list = document.getElementById("favorites-list");
  const empty = document.getElementById("favorites-empty");
  if (!list || !empty) {
    return;
  }

  const favorites = getFavorites();
  const favoriteNames = Object.keys(favorites)
    .filter((id) => favorites[id])
    .map((id) => getProductName(id));

  list.innerHTML = "";

  if (favoriteNames.length === 0) {
    empty.hidden = false;
    return;
  }

  empty.hidden = true;
  favoriteNames.forEach((name) => {
    const item = document.createElement("li");
    item.textContent = name;
    list.appendChild(item);
  });
}

/** Wires up every "Add to Favorites" button on the page. */
function initFavoriteButtons() {
  const buttons = document.querySelectorAll(".favorite-btn");
  if (buttons.length === 0) {
    return;
  }

  const favorites = getFavorites();

  buttons.forEach((button) => {
    const productId = button.dataset.productId;
    updateFavoriteButton(button, Boolean(favorites[productId]));

    button.addEventListener("click", () => {
      const updatedFavorites = toggleFavorite(productId);
      updateFavoriteButton(button, Boolean(updatedFavorites[productId]));
      renderFavoritesSummary();
    });
  });

  renderFavoritesSummary();
}

/* --------------------------------------------------------------------------
   FEATURE 2: Contact Form Validation
   - Prevents the pre-order/inquiry form from submitting until the name and
     email fields are filled in correctly, with error messages shown right
     next to each field so visitors can fix mistakes without losing their
     other answers.
   -------------------------------------------------------------------------- */

/** Simple, readable check for a plausible email address. */
function isValidEmail(value) {
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return pattern.test(value.trim());
}

/** Shows or clears an error message under a given field. */
function setFieldError(input, errorElement, message) {
  if (message) {
    errorElement.textContent = message;
    input.setAttribute("aria-invalid", "true");
  } else {
    errorElement.textContent = "";
    input.removeAttribute("aria-invalid");
  }
}

/** Validates the contact form and reports the first problems it finds. */
function validateContactForm(event) {
  const form = event.target;
  const nameInput = form.querySelector("#name");
  const emailInput = form.querySelector("#email");
  const nameError = form.querySelector("#name-error");
  const emailError = form.querySelector("#email-error");

  let isValid = true;

  if (nameInput.value.trim() === "") {
    setFieldError(nameInput, nameError, "Please enter your name.");
    isValid = false;
  } else {
    setFieldError(nameInput, nameError, "");
  }

  if (emailInput.value.trim() === "") {
    setFieldError(emailInput, emailError, "Please enter your email.");
    isValid = false;
  } else if (!isValidEmail(emailInput.value)) {
    setFieldError(
      emailInput,
      emailError,
      "Please enter a valid email address (example: name@example.com)."
    );
    isValid = false;
  } else {
    setFieldError(emailInput, emailError, "");
  }

  if (!isValid) {
    event.preventDefault();
  }

  return isValid;
}

/** Wires up validation on the contact form, if it is present on the page. */
function initContactFormValidation() {
  const form = document.getElementById("contact-form");
  if (!form) {
    return;
  }
  form.addEventListener("submit", validateContactForm);
}

/* --------------------------------------------------------------------------
   FEATURE 3: Remembered Pickup Preference (Contact page)
   - Saves the visitor's chosen "Request Type" (Pre-Order or General
     Question) in sessionStorage and pre-fills it the next time they open
     the Contact page in the same browser session, so returning to the form
     doesn't mean starting over.
   -------------------------------------------------------------------------- */

const REQUEST_TYPE_KEY = "northStarRequestType";

function initRequestTypeMemory() {
  const select = document.getElementById("request-type");
  if (!select) {
    return;
  }

  const savedValue = sessionStorage.getItem(REQUEST_TYPE_KEY);
  if (savedValue) {
    select.value = savedValue;
  }

  select.addEventListener("change", () => {
    sessionStorage.setItem(REQUEST_TYPE_KEY, select.value);
  });
}

/* --------------------------------------------------------------------------
   Run everything once the page has loaded.
   -------------------------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  initFavoriteButtons();
  initContactFormValidation();
  initRequestTypeMemory();
});
