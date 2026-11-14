import { convertTemperature } from "/temperature.js";

const unitLabels = { C: "°C", F: "°F", K: "K" };
const numberFormat = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 6 });
let installPrompt = null;

function showConnection(online) {
    const status = document.getElementById("connection-status");

    if (status) {
        status.textContent = online ? "Сервер доступен" : "Офлайн";
    }
}

async function fetchWithTimeout(url) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);

    try {
        return await fetch(url, { cache: "no-store", signal: controller.signal });
    } finally {
        clearTimeout(timer);
    }
}

async function checkConnection() {
    try {
        const response = await fetchWithTimeout("/api/status");
        showConnection(response.ok);
    } catch {
        showConnection(false);
    }
}

async function requestConversion(localResult) {
    if (!navigator.onLine) {
        return { data: localResult, offline: true };
    }

    const query = new URLSearchParams({
        value: String(localResult.value),
        from: localResult.from,
        to: localResult.to
    });

    let response;

    try {
        response = await fetchWithTimeout("/api/temp?" + query);
    } catch {
        return { data: localResult, offline: true };
    }

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || "Не удалось выполнить расчёт");
    }

    if (!Number.isFinite(data.result)) {
        throw new Error("Сервер вернул некорректный результат");
    }

    return { data, offline: false };
}

function initializeConverter() {
    const form = document.getElementById("converter-form");

    if (!form) {
        return;
    }

    const valueInput = document.getElementById("temperature-value");
    const fromInput = document.getElementById("temperature-from");
    const toInput = document.getElementById("temperature-to");
    const output = document.getElementById("conversion-result");
    const note = document.getElementById("conversion-note");
    const errorMessage = document.getElementById("conversion-error");
    const button = document.getElementById("convert-button");

    if (!valueInput || !fromInput || !toInput || !output || !note || !errorMessage || !button) {
        console.error("Не найдены элементы конвертера");
        return;
    }

    async function calculate(event) {
        if (event) {
            event.preventDefault();
        }

        button.disabled = true;
        errorMessage.hidden = true;
        note.textContent = "";

        try {
            const localResult = convertTemperature(valueInput.value, fromInput.value, toInput.value);
            const { data, offline } = await requestConversion(localResult);
            output.textContent = numberFormat.format(data.value) + " " + unitLabels[data.from]
                + " = " + numberFormat.format(data.result) + " " + unitLabels[data.to];
            note.textContent = offline ? "Результат рассчитан без подключения." : "";
            showConnection(!offline);
        } catch (error) {
            output.textContent = "—";
            errorMessage.textContent = error.message;
            errorMessage.hidden = false;
        } finally {
            button.disabled = false;
        }
    }

    form.addEventListener("submit", calculate);
    calculate();
}

async function registerServiceWorker() {
    const status = document.getElementById("offline-status");

    if (!status) {
        return;
    }

    if (!("serviceWorker" in navigator)) {
        status.textContent = "Офлайн-режим недоступен в этом браузере.";
        return;
    }

    try {
        await navigator.serviceWorker.register("/sw.js");
        await navigator.serviceWorker.ready;
        status.textContent = "Офлайн-режим готов.";
    } catch (error) {
        status.textContent = "Не удалось подготовить офлайн-режим.";
        console.error(error.message);
    }
}

const installButton = document.getElementById("install-app");

window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    installPrompt = event;

    if (installButton) {
        installButton.hidden = false;
    }
});

if (installButton) {
    installButton.addEventListener("click", async () => {
        if (!installPrompt) {
            return;
        }

        await installPrompt.prompt();
        await installPrompt.userChoice;
        installPrompt = null;
        installButton.hidden = true;
    });
}

window.addEventListener("appinstalled", () => {
    installPrompt = null;

    if (installButton) {
        installButton.hidden = true;
    }
});

window.addEventListener("online", checkConnection);
window.addEventListener("offline", () => showConnection(false));

initializeConverter();
checkConnection();
registerServiceWorker();
