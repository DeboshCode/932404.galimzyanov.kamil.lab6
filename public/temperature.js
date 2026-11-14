export function convertTemperature(rawValue, from, to) {
    const units = ["C", "F", "K"];

    if (!units.includes(from) || !units.includes(to)) {
        throw new Error("Допустимые единицы: C, F, K");
    }

    if (typeof rawValue !== "number" && typeof rawValue !== "string") {
        throw new Error("Введите числовое значение температуры");
    }

    if (typeof rawValue === "string" && !/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(rawValue.trim())) {
        throw new Error("Введите числовое значение температуры");
    }

    const value = Number(rawValue);

    if (!Number.isFinite(value)) {
        throw new Error("Введите конечное числовое значение");
    }

    let result = value;

    if (from !== to) {
        let celsius = value;

        if (from === "F") {
            celsius = (value - 32) * (5 / 9);
        } else if (from === "K") {
            celsius = value - 273.15;
        }

        if (to === "F") {
            result = celsius * (9 / 5) + 32;
        } else if (to === "K") {
            result = celsius + 273.15;
        } else {
            result = celsius;
        }
    }

    if (!Number.isFinite(result)) {
        throw new Error("Результат выходит за допустимый числовой диапазон");
    }

    return { value, from, to, result: Number(result.toFixed(10)) };
}
