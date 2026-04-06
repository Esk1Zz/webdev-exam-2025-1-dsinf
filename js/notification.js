export function showNotification(message, type = 'info') {
    const container = document.getElementById('notifications-container');
    if (!container) return;
    const note = document.createElement('div');
    note.className = `notification ${type}`;
    note.textContent = message;
    container.appendChild(note);
    setTimeout(() => note.remove(), 5000);
}
