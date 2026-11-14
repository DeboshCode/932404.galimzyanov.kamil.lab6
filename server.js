import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { convertTemperature } from "./public/temperature.js";

const app = express();
const projectDirectory = path.dirname(fileURLToPath(import.meta.url));
const publicDirectory = path.join(projectDirectory, "public");

app.disable("x-powered-by");

app.use("/api", (request, response, next) => {
    response.set("Cache-Control", "no-store");
    next();
});

app.get("/api/status", (request, response) => {
    response.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.get("/api/temp", (request, response) => {
    try {
        const { value, from, to } = request.query;
        response.json(convertTemperature(value, from, to));
    } catch (error) {
        response.status(400).json({ error: error.message });
    }
});

app.get("/", (request, response) => {
    response.sendFile(path.join(publicDirectory, "index.html"));
});

app.get("/about", (request, response) => {
    response.sendFile(path.join(publicDirectory, "about.html"));
});

app.get("/manifest.json", (request, response) => {
    response.type("application/manifest+json").sendFile(path.join(publicDirectory, "manifest.json"));
});

app.get("/sw.js", (request, response) => {
    response.set("Cache-Control", "no-cache");
    response.sendFile(path.join(publicDirectory, "sw.js"));
});

app.use(express.static(publicDirectory));

app.use((request, response) => {
    response.status(404).json({ error: "Not found" });
});

app.use((error, request, response, next) => {
    console.error(error.message);
    response.status(500).json({ error: "Internal server error" });
});

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    const port = Number(process.env.PORT || 3000);

    if (!Number.isInteger(port) || port < 1 || port > 65535) {
        console.error("Некорректный номер порта");
        process.exitCode = 1;
    } else {
        const server = app.listen(port, "127.0.0.1", () => {
            console.log("Server started on http://localhost:" + port);
        });

        server.on("error", (error) => {
            console.error(error.code === "EADDRINUSE" ? "Порт " + port + " уже занят" : error.message);
            process.exitCode = 1;
        });
    }
}

export default app;
