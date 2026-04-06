/* eslint-disable max-len */
export async function loadGoods() {
    const url = "https://edu.std-900.ist.mospolytech.ru/exam-2024-1/api/goods?api_key=4f49fe4f-3528-479d-aa06-92c6c6b8cb2f";

    try {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error("Ошибка загрузки данных: " + response.status);
        }
        const goods = await response.json();
        window.allGoods = goods;
        return goods;

    } catch (error) {
        console.error("Ошибка при загрузке:", error);
        return [];
    }
}