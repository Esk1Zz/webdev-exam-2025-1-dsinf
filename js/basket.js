/* eslint-disable max-len */
import { loadGoods } from "./loadGoods.js";
import { showNotification } from "./notification.js";

const orderList = document.querySelector(".order-list");
const orderTotalBlock = document.querySelector(".order-total");
const orderForm = document.querySelector("#orderForm");

let goods = [];
let cart = {};


function saveCart() {
    localStorage.setItem("cart", JSON.stringify(cart));
}

function renderOrder() {
    orderList.innerHTML = "";
    let total = 0;

    Object.entries(cart).forEach(([index, count]) => {
        if (!Number.isInteger(count) || count <= 0) return;

        const good = goods.find(g => g.id === Number(index) || g.index === Number(index));
        if (!good) return;

        const hasDiscount = good.discount_price && good.discount_price < good.actual_price;
        const price = hasDiscount ? good.discount_price : good.actual_price;

        total += price * count;

        const discountPercent = hasDiscount ? Math.round(100 - (good.discount_price / good.actual_price) * 100) : 0;

        const card = document.createElement("div");
        card.classList.add("goodCard");

        card.innerHTML = `
            <div class="cardImageWrapper">
                <img class="goodImg" src="${good.image_url}" alt="${good.name}">
            </div>
            <p class="goodName">${good.name}</p>
            <p class="rating">${good.rating}</p>
            <p class="price">
                ${hasDiscount ? `${good.discount_price} ₽` : `${good.actual_price} ₽`}
                ${hasDiscount ? `<span class="oldPrice">${good.actual_price} ₽</span>
                <span class="discount">-${discountPercent}%</span>` : ""}
            </p>
            <div class="cart-controls">
                <button class="minus" data-id="${good.id}">−</button>
                <span class="count">${count}</span>
                <button class="plus" data-id="${good.id}">+</button>
                <button class="remove" data-id="${good.id}">×</button>
            </div>
        `;

        orderList.appendChild(card);
    });

    orderTotalBlock.textContent = `${total} ₽`;

    const totalInput = document.getElementById("total_price");
    if (totalInput) {
        totalInput.value = total;
    }

    // eslint-disable-next-line no-use-before-define
    addButtonsHandlers();
}

function loadCart() {
    cart = JSON.parse(localStorage.getItem("cart")) || {};
    Object.keys(cart).forEach(key => {
        if (!Number.isInteger(cart[key]) || cart[key] <= 0) {
            delete cart[key];
        }
    });
    saveCart();
}

function addButtonsHandlers() {
    orderList.querySelectorAll(".plus").forEach(btn => {
        btn.onclick = () => {
            const id = btn.dataset.id;
            cart[id] = (cart[id] || 0) + 1;
            saveCart();
            renderOrder();
        };
    });

    orderList.querySelectorAll(".minus").forEach(btn => {
        btn.onclick = () => {
            const id = btn.dataset.id;
            cart[id] = (cart[id] || 0) - 1;
            if (cart[id] <= 0) delete cart[id];
            saveCart();
            renderOrder();
        };
    });

    orderList.querySelectorAll(".remove").forEach(btn => {
        btn.onclick = () => {
            delete cart[btn.dataset.id];
            saveCart();
            renderOrder();
        };
    });
}

function parseForm() {
    const rawDate = document.getElementById("delivery_date").value;
    const [year, month, day] = rawDate.split("-");
    const formattedDate = `${day}.${month}.${year}`;

    const goodIds = Object.entries(cart).flatMap(([key, count]) => {
        const good = goods.find(g => g.id === Number(key));
        if (!good) return [];
        return Array(count).fill(good.id);
    });

    const data = {
        full_name: document.getElementById("name").value.trim(),
        email: document.getElementById("email").value.trim(),
        subscribe: document.querySelector('input[name="subscribe"]').checked ? 1 : 0,
        phone: document.getElementById("phone").value.trim(),
        delivery_address: document.getElementById("address").value.trim(),
        delivery_date: formattedDate,
        delivery_interval: document.getElementById("delivery_interval").value,
        comment: document.getElementById("comment").value.trim(),
        good_ids: goodIds
    };

    return data;
}

orderForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (Object.keys(cart).length === 0) {
        showNotification("Корзина пуста", "info");
        return;
    }

    const data = parseForm();

    try {
        const res = await fetch(
            "https://edu.std-900.ist.mospolytech.ru/exam-2024-1/api/orders?api_key=4f49fe4f-3528-479d-aa06-92c6c6b8cb2f",
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            }
        );

        if (!res.ok) throw new Error(`Ошибка ${res.status}`);

        showNotification("Заказ успешно оформлен!", "success");
        localStorage.removeItem("cart");
        cart = {};
        orderForm.reset();
        renderOrder();

    } catch (err) {
        console.error(err);
        showNotification("Ошибка при оформлении заказа", "error");
    }
});

document.addEventListener("DOMContentLoaded", async () => {
    goods = await loadGoods();
    loadCart();
    renderOrder();
});
