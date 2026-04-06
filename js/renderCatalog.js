/* eslint-disable max-len */
import { loadGoods } from "./loadGoods.js";
import { showNotification } from "./notification.js";

const catalogGrid = document.querySelector(".catalog-grid");
const optionFilter = document.querySelector(".optionFilter");
const searchInput = document.querySelector(".search input");
const searchBtn = document.querySelector(".search button");

const API_URL = "https://edu.std-900.ist.mospolytech.ru/exam-2024-1/api";
const API_KEY = "4f49fe4f-3528-479d-aa06-92c6c6b8cb2f";

let goodsList = [];
let suggestionsList = null;

function getCart() {
    return JSON.parse(localStorage.getItem("cart")) || {};
}
function saveCart(cart) {
    localStorage.setItem("cart", JSON.stringify(cart));
}

function renderGoods(goods) {
    catalogGrid.innerHTML = "";
    if (!Array.isArray(goods) || goods.length === 0) {
        catalogGrid.innerHTML = `<p>Нет товаров, соответствующих вашему запросу</p>`;
        return;
    }

    goods.forEach(good => {
        const card = document.createElement("div");
        card.classList.add("goodCard");
        card.dataset.good = good.keyword;
        card.dataset.category = good.category;
        const hasDiscount = good.discount_price && good.discount_price < good.actual_price;
        const discountPercent = hasDiscount
            ? Math.round(100 - (good.discount_price / good.actual_price) * 100)
            : 0;

        card.innerHTML = `
            <div class="cardImageWrapper">
                <img class="goodImg" src="${good.image_url}" alt="${good.name}">
            </div>
            <p class="goodName">${good.name}</p>
            <p class="rating">Рейтинг ${good.rating}</p>
            <p class="price">
                ${hasDiscount ? `${good.discount_price} ₽` : `${good.actual_price} ₽`}
                ${hasDiscount ? `<span class="oldPrice">${good.actual_price} ₽</span>
                <span class="discount">-${discountPercent}%</span>` : ""}
            </p>
            <button class="goodBtn">Добавить</button>
        `;
        const btn = card.querySelector(".goodBtn");
        btn.addEventListener("click", () => {
            const cart = getCart();
            cart[good.id] = (cart[good.id] || 0) + 1;
            saveCart(cart);
            showNotification("Товар добавлен в корзину", "success");
        });

        catalogGrid.appendChild(card);
    });
}

function sortGoods(option, list = goodsList) {
    let sortedGoods = [...list];

    switch (option) {
    case "По убыванию рейтинга":
        sortedGoods.sort((a, b) => b.rating - a.rating);
        break;
    case "По возрастанию рейтинга":
        sortedGoods.sort((a, b) => a.rating - b.rating);
        break;
    case "По убыванию цены":
        sortedGoods.sort((a, b) => b.actual_price - a.actual_price);
        break;
    case "По возрастанию цены":
        sortedGoods.sort((a, b) => a.actual_price - b.actual_price);
        break;
    default:
        sortedGoods.sort((a, b) => a.name.localeCompare(b.name, "ru"));
    }

    renderGoods(sortedGoods);
}

function createSuggestionsContainer() {
    suggestionsList = document.createElement("ul");
    suggestionsList.classList.add("autocomplete-suggestions");
    suggestionsList.style.position = "absolute";
    suggestionsList.style.zIndex = "999";
    suggestionsList.style.background = "#fff";
    suggestionsList.style.border = "1px solid #ccc";
    suggestionsList.style.width = searchInput.offsetWidth + "px";
    suggestionsList.style.listStyle = "none";
    suggestionsList.style.padding = "0";
    suggestionsList.style.margin = "0";
    suggestionsList.style.maxHeight = "200px";
    suggestionsList.style.overflowY = "auto";
    searchInput.parentNode.appendChild(suggestionsList);
}

const clearSearch = document.getElementById("clearSearch");

searchInput.addEventListener("input", () => {
    clearSearch.style.display = searchInput.value ? "block" : "none";
});


async function updateSuggestions() {
    const query = searchInput.value.trim();
    if (!query) {
        suggestionsList.innerHTML = "";
        suggestionsList.style.display = "none";
        return;
    }

    try {
        const res = await fetch(`${API_URL}/autocomplete?api_key=${API_KEY}&query=${encodeURIComponent(query)}`);
        if (!res.ok) throw new Error("Ошибка автодополнения");
        const suggestions = await res.json();

        if (!suggestions.length) {
            suggestionsList.innerHTML = "";
            suggestionsList.style.display = "none";
            return;
        }

        suggestionsList.innerHTML = suggestions
            .map(s => `<li class="suggestion-item" data-name="${s}">${s}</li>`)
            .join("");
        suggestionsList.style.display = "block";

        suggestionsList.querySelectorAll(".suggestion-item").forEach(item => {
            item.addEventListener("click", () => {
                const words = searchInput.value.split(" ");
                words[words.length - 1] = item.dataset.name;
                searchInput.value = words.join(" ");
                suggestionsList.style.display = "none";
            });
        });
    } catch {
        suggestionsList.innerHTML = "";
        suggestionsList.style.display = "none";
    }
}

clearSearch.addEventListener("click", () => {
    searchInput.value = "";
    clearSearch.style.display = "none";
    updateSuggestions();
    renderGoods(goodsList);
});

function performSearch() {
    const query = searchInput.value.trim().toLowerCase();
    if (!query) return renderGoods(goodsList);

    const filtered = goodsList.filter(g => g.name.toLowerCase().includes(query));
    const sortOption = optionFilter.value;
    sortGoods(sortOption, filtered);
}

document.addEventListener("DOMContentLoaded", async () => {
    goodsList = await loadGoods();
    renderGoods(goodsList);
    createSuggestionsContainer();

    optionFilter.addEventListener("change", e => sortGoods(e.target.value));

    searchInput.addEventListener("input", updateSuggestions);

    searchBtn.addEventListener("click", performSearch);

    document.addEventListener("click", e => {
        if (!searchInput.contains(e.target) && !suggestionsList.contains(e.target)) {
            suggestionsList.style.display = "none";
        }
    });
});
