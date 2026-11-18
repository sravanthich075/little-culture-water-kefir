const WHATSAPP_NUMBER = "919392118642";
const STORAGE_KEY = "little-culture-cart-v1";

const products = {
  citrus: {
    name: "Lemon Ginger",
    image: "https://images.unsplash.com/photo-1600271886742-f049cd451bba?auto=format&fit=crop&w=180&q=75",
    size: 250,
    price: 99,
  },
  berry: {
    name: "Seasonal Berry",
    image: "https://images.unsplash.com/photo-1497534446932-c925b458314e?auto=format&fit=crop&w=180&q=75",
    size: 500,
    price: 179,
  },
  original: {
    name: "Original",
    image: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=180&q=75",
    size: 1000,
    price: 329,
  },
};

const formatRupees = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});
const cartItems = document.querySelector("#cartItems");
const cartDrawer = document.querySelector("#cartDrawer");
const overlay = document.querySelector("#overlay");
const checkoutDialog = document.querySelector("#checkoutDialog");
const toast = document.querySelector("#toast");
let cart = loadCart();
let toastTimeout;

function loadCart() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (!Array.isArray(saved)) return [];
    const restored = new Map();
    for (const item of saved) {
      if (
        !item ||
        !Object.hasOwn(products, item.productId) ||
        !Number.isSafeInteger(item.quantity) ||
        item.quantity <= 0
      ) continue;

      const product = products[item.productId];
      const existing = restored.get(item.productId);
      if (existing) existing.quantity += item.quantity;
      else restored.set(item.productId, {
        productId: item.productId,
        size: product.size,
        quantity: item.quantity,
      });
    }
    return [...restored.values()];
  } catch (error) {
    console.error("Could not restore the saved shopping bag.", error);
    return [];
  }
}

function saveCart() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  } catch (error) {
    console.error("Could not save the shopping bag.", error);
    showToast("Your bag could not be saved on this device.");
  }
}

function bottleLabel(size) {
  return size === 1000 ? "1 litre" : `${size} ml`;
}

function itemTotal(item) {
  return products[item.productId].price * item.quantity;
}

function cartTotal() {
  return cart.reduce((total, item) => total + itemTotal(item), 0);
}

function cartQuantity() {
  return cart.reduce((total, item) => total + item.quantity, 0);
}

function renderCart() {
  const quantity = cartQuantity();
  document.querySelector("#cartCount").textContent = quantity;
  document.querySelector("#drawerCount").textContent = `(${quantity})`;
  cartItems.replaceChildren();

  for (const [index, item] of cart.entries()) {
    const product = products[item.productId];
    const line = document.createElement("article");
    line.className = "cart-line";

    const thumb = document.createElement("div");
    thumb.className = "cart-thumb";
    const image = document.createElement("img");
    image.src = product.image;
    image.alt = "";
    thumb.append(image);

    const details = document.createElement("div");
    const title = document.createElement("h3");
    title.textContent = product.name;
    const size = document.createElement("p");
    size.textContent = `Water kefir · ${bottleLabel(item.size)}`;
    const controls = document.createElement("div");
    controls.className = "quantity-control";
    controls.setAttribute("aria-label", `Quantity for ${product.name}, ${bottleLabel(item.size)}`);
    const decrease = document.createElement("button");
    decrease.type = "button";
    decrease.textContent = "−";
    decrease.setAttribute("aria-label", "Decrease quantity");
    decrease.addEventListener("click", () => changeQuantity(index, -1));
    const count = document.createElement("span");
    count.textContent = item.quantity;
    const increase = document.createElement("button");
    increase.type = "button";
    increase.textContent = "+";
    increase.setAttribute("aria-label", "Increase quantity");
    increase.addEventListener("click", () => changeQuantity(index, 1));
    controls.append(decrease, count, increase);
    details.append(title, size, controls);

    const pricing = document.createElement("div");
    pricing.className = "cart-line-price";
    pricing.textContent = formatRupees.format(itemTotal(item));
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "remove-item";
    remove.textContent = "Remove";
    remove.addEventListener("click", () => removeItem(index));
    pricing.append(remove);

    line.append(thumb, details, pricing);
    cartItems.append(line);
  }

  const isEmpty = cart.length === 0;
  document.querySelector("#emptyCart").classList.toggle("is-visible", isEmpty);
  document.querySelector("#drawerFooter").hidden = isEmpty;
  document.querySelector("#cartSubtotal").textContent = formatRupees.format(cartTotal());
  document.querySelector("#checkoutSubtotal").textContent = formatRupees.format(cartTotal());
}

function addToCart(productId, size, openAfterAdd = false) {
  const existing = cart.find((item) => item.productId === productId && item.size === size);
  if (existing) existing.quantity += 1;
  else cart.push({ productId, size, quantity: 1 });
  saveCart();
  renderCart();
  showToast(`${products[productId].name} added to your bag.`);
  if (openAfterAdd) openDrawer();
}

function changeQuantity(index, amount) {
  const item = cart[index];
  if (!item) return;
  item.quantity += amount;
  if (item.quantity <= 0) cart.splice(index, 1);
  saveCart();
  renderCart();
}

function removeItem(index) {
  cart.splice(index, 1);
  saveCart();
  renderCart();
}

function openDrawer() {
  overlay.hidden = false;
  cartDrawer.classList.add("is-open");
  cartDrawer.setAttribute("aria-hidden", "false");
  document.body.classList.add("locked");
  document.querySelector("#closeCart").focus();
}

function closeDrawer() {
  cartDrawer.classList.remove("is-open");
  cartDrawer.setAttribute("aria-hidden", "true");
  overlay.hidden = true;
  document.body.classList.remove("locked");
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.clearTimeout(toastTimeout);
  toastTimeout = window.setTimeout(() => toast.classList.remove("is-visible"), 2600);
}

document.querySelectorAll("[data-add]").forEach((button) => {
  button.addEventListener("click", () => {
    const productId = button.dataset.add;
    addToCart(productId, products[productId].size);
  });
});

document.querySelector("#openCart").addEventListener("click", openDrawer);
document.querySelector("#closeCart").addEventListener("click", closeDrawer);
document.querySelector("#continueShopping").addEventListener("click", closeDrawer);
overlay.addEventListener("click", closeDrawer);
document.querySelector("#menuToggle").addEventListener("click", (event) => {
  const button = event.currentTarget;
  const isOpen = button.getAttribute("aria-expanded") === "true";
  button.setAttribute("aria-expanded", String(!isOpen));
  button.setAttribute("aria-label", isOpen ? "Open menu" : "Close menu");
  document.querySelector("#primaryNav").classList.toggle("is-open", !isOpen);
});
document.querySelectorAll("#primaryNav a").forEach((link) => {
  link.addEventListener("click", () => {
    document.querySelector("#menuToggle").setAttribute("aria-expanded", "false");
    document.querySelector("#menuToggle").setAttribute("aria-label", "Open menu");
    document.querySelector("#primaryNav").classList.remove("is-open");
  });
});
document.querySelector("#checkoutButton").addEventListener("click", () => {
  closeDrawer();
  document.querySelector("#formError").textContent = "";
  checkoutDialog.showModal();
  document.querySelector("#customerName").focus();
});
document.querySelector("#closeCheckout").addEventListener("click", () => checkoutDialog.close());
checkoutDialog.addEventListener("click", (event) => {
  if (event.target === checkoutDialog) checkoutDialog.close();
});
document.querySelector("#checkoutForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity()) return;
  if (cart.length === 0) {
    checkoutDialog.close();
    showToast("Your bag is empty. Add a bottle to get started.");
    return;
  }

  const formData = new FormData(form);
  const phone = String(formData.get("phone")).trim();
  const phoneDigits = phone.replace(/\D/g, "");
  const formError = document.querySelector("#formError");
  formError.textContent = "";
  if (phoneDigits.length < 8 || phoneDigits.length > 15) {
    formError.textContent = "Enter a phone number with 8 to 15 digits.";
    return;
  }
  const orderLines = cart.map((item) => {
    const product = products[item.productId];
    return `• ${product.name} Water Kefir — ${bottleLabel(item.size)} × ${item.quantity}: ${formatRupees.format(itemTotal(item))}`;
  });
  const note = String(formData.get("note") || "").trim();
  const message = [
    "Hi Little Culture! I'd like to place a water kefir order:",
    "",
    ...orderLines,
    "",
    `Subtotal: ${formatRupees.format(cartTotal())}`,
    "Delivery charges: to be confirmed",
    "",
    `Name: ${String(formData.get("name")).trim()}`,
    `Phone: ${phone}`,
    `Delivery area/address: ${String(formData.get("address")).trim()}`,
    ...(note ? [`Note: ${note}`] : []),
  ].join("\n");
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  const whatsappWindow = window.open(whatsappUrl, "_blank");
  if (!whatsappWindow) {
    document.querySelector("#formError").textContent = "WhatsApp could not open. Please allow pop-ups and try again.";
    return;
  }
  whatsappWindow.opener = null;
  cart = [];
  saveCart();
  renderCart();
  form.reset();
  checkoutDialog.close();
  showToast("Your order details are ready in WhatsApp.");
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && cartDrawer.classList.contains("is-open")) closeDrawer();
});
document.querySelector("#currentYear").textContent = new Date().getFullYear();
renderCart();
