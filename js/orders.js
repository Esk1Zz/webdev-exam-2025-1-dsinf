/* eslint-disable no-use-before-define */
/* eslint-disable max-len */
const API_URL = "https://edu.std-900.ist.mospolytech.ru/exam-2024-1/api";
const API_KEY = "4f49fe4f-3528-479d-aa06-92c6c6b8cb2f";

const ordersList = document.getElementById("orders-list");
const modal = document.getElementById("modal");

let ordersCache = [];
let goodsCache = [];

import { showNotification } from "./notification.js";

async function loadAllGoods() {
    try {
        const res = await fetch(`${API_URL}/goods?api_key=${API_KEY}`);
        goodsCache = await res.json();
    } catch (e) {
        showNotification("Ошибка загрузки товаров", "error");
    }
}

function getOrderGoodsText(order) {
    if (!order.good_ids || !Array.isArray(order.good_ids)) return "—";
    return order.good_ids
        .map(id => goodsCache.find(g => g.id === id))
        .filter(Boolean)
        .map(g => g.name)
        .join(", ");
}

function calculateOrderPrice(order) {
    if (!order.good_ids || !Array.isArray(order.good_ids)) return 0;
    return order.good_ids.reduce((sum, id) => {
        const good = goodsCache.find(g => g.id === id);
        if (!good) return sum;
        const price = good.discount_price && good.discount_price < good.actual_price
            ? good.discount_price
            : good.actual_price;
        return sum + price;
    }, 0);
}

function openModal(content) {
    modal.innerHTML = `
        <div class="modal-overlay"></div>
        <div class="modal-box">
            <div class="modal-content">
                ${content}
            </div>
        </div>
    `;
    modal.classList.remove("hidden");

    const overlay = modal.querySelector(".modal-overlay");
    if (overlay) overlay.onclick = () => modal.classList.add("hidden");
}

function showDetails(order) {
    openModal(`
        <h3>Заказ №${order.id}</h3>
        <p><b>Имя:</b> ${order.full_name}</p>
        <p><b>Email:</b> ${order.email}</p>
        <p><b>Телефон:</b> ${order.phone}</p>
        <p><b>Адрес:</b> ${order.delivery_address}</p>
        <p><b>Дата доставки:</b> ${order.delivery_date}</p>
        <p><b>Интервал доставки:</b> ${order.delivery_interval}</p>
        <p><b>Комментарий:</b> ${order.comment || "—"}</p>
        <p><b>Состав заказа:</b> ${getOrderGoodsText(order)}</p>
        <p><b>Стоимость:</b> ${calculateOrderPrice(order)} ₽</p>
        <div class="modal-actions">
            <button id="close-details">Ок</button>
        </div>
    `);
    document.getElementById("close-details").onclick = () => modal.classList.add("hidden");
}

async function deleteOrder(id) {
    try {
        const res = await fetch(`${API_URL}/orders/${id}?api_key=${API_KEY}`, { method: "DELETE" });
        if (!res.ok) throw new Error();
        showNotification("Заказ успешно удалён", "success");
        modal.classList.add("hidden");
        await init();
    } catch {
        showNotification("Ошибка удаления заказа", "error");
    }
}

function confirmDelete(id) {
    openModal(`
        <h3>Удалить заказ?</h3>
        <p>Вы уверены, что хотите удалить заказ?</p>
        <div class="modal-actions">
            <button id="delete-yes">Да</button>
            <button id="delete-no">Отмена</button>
        </div>
    `);
    document.getElementById("delete-yes").onclick = () => deleteOrder(id);
    document.getElementById("delete-no").onclick = () => modal.classList.add("hidden");
}

function renderOrders(orders) {
    ordersList.innerHTML = "";

    if (!orders.length) {
        ordersList.innerHTML = `<tr><td colspan="6">У вас пока нет заказов</td></tr>`;
        return;
    }

    orders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .forEach((order, index) => {
            const tr = document.createElement("tr");
            const price = calculateOrderPrice(order);
            const goodsText = getOrderGoodsText(order);

            tr.innerHTML = `
                <td>${index + 1}</td>
                <td>${new Date(order.created_at).toLocaleString()}</td>
                <td class="order-goods">${goodsText}</td>
                <td class="order-price">${price} ₽</td>
                <td>${order.delivery_date} ${order.delivery_interval}</td>
                <td>
                    <button class="details" data-id="${order.id}">Подробнее</button></br>
                    <button class="edit" data-id="${order.id}">Редактировать</button></br>
                    <button class="delete" data-id="${order.id}">Удалить</button>
                </td>
            `;
            ordersList.appendChild(tr);
        });
}

function showEdit(order) {
    openModal(`
        <h3>Редактирование заказа №${order.id}</h3>
        <form id="edit-order-form">
            <label>Имя</label>
            <input id="edit-name" value="${order.full_name}" required>

            <label>Email</label>
            <input id="edit-email" value="${order.email}" type="email" required>

            <label>Телефон</label>
            <input id="edit-phone" value="${order.phone}" required>

            <label>Адрес</label>
            <input id="edit-address" value="${order.delivery_address}" required>

            <label>Комментарий</label>
            <textarea id="edit-comment">${order.comment || ""}</textarea>

            <div class="modal-actions">
                <button type="submit">Сохранить</button>
                <button type="button" id="edit-cancel">Отмена</button>
            </div>
        </form>
    `);

    document.getElementById("edit-cancel").onclick = () => modal.classList.add("hidden");

    document.getElementById("edit-order-form").onsubmit = async (e) => {
        e.preventDefault();
        await saveEdit(order.id);
    };
}

async function saveEdit(id) {
    const data = {
        full_name: document.getElementById("edit-name").value.trim(),
        email: document.getElementById("edit-email").value.trim(),
        phone: document.getElementById("edit-phone").value.trim(),
        delivery_address: document.getElementById("edit-address").value.trim(),
        comment: document.getElementById("edit-comment").value.trim()
    };

    try {
        const res = await fetch(`${API_URL}/orders/${id}?api_key=${API_KEY}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error();
        showNotification("Заказ успешно изменён", "success");
        modal.classList.add("hidden");
        await init();
    } catch {
        showNotification("Ошибка изменения заказа", "error");
    }
}

ordersList.addEventListener("click", e => {
    const id = e.target.dataset.id;
    if (!id) return;

    const order = ordersCache.find(o => o.id == id);
    if (!order) return;

    if (e.target.classList.contains("details")) showDetails(order);
    if (e.target.classList.contains("edit")) showEdit(order);
    if (e.target.classList.contains("delete")) confirmDelete(id);
});

async function loadOrders() {
    try {
        const res = await fetch(`${API_URL}/orders?api_key=${API_KEY}`);
        if (!res.ok) throw new Error();
        return await res.json();
    } catch {
        showNotification("Ошибка загрузки заказов", "error");
        return [];
    }
}

async function init() {
    await loadAllGoods();
    ordersCache = await loadOrders();
    renderOrders(ordersCache);
}

document.addEventListener("DOMContentLoaded", init);
