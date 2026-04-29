import express from "express";
import "dotenv/config";
import morgan from "morgan";
import { logger } from "./utils/logger.config.js";
import http from "http";
import { Server } from "socket.io";
import TVService from "./utils/tvService.js";

const PORT = process.env.PORT || 3000;

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const tvService = new TVService(io);

const stream = {
    write: message => logger.info(message.trim())
};

app.use(morgan("tiny", { stream }));
app.use(express.json());
app.use(express.static("public"));

// Socket.IO event handling
io.on("connection", (socket) => {
    logger.info(`Client connected: ${socket.id}`);

    socket.emit("connected_tvs", tvService.getConnected());

    socket.on("connect_tv", async ({ ip }) => {
        logger.info(`Requested connection to TV: ${ip}`);
        const result = await tvService.connectTV(ip);
        socket.emit("connect_tv_result", { ip, ...result });
    });

    socket.on("send_code", async ({ ip, code }) => {
        const result = await tvService.sendCode(ip, code);
        socket.emit("send_code_result", { ip, ...result });
    });

    socket.on("send_key", async ({ ip, keyName, direction }) => {
        const result = await tvService.sendKey(ip, keyName, direction || "SHORT");
        if (result.status === "error") {
            socket.emit("send_key_error", { ip, error: result.error });
        }
    });

    socket.on("disconnect", () => {
        logger.info(`Client disconnected: ${socket.id}`);
    });

    socket.on("client_log", ({ level, message }) => {
        if (logger[level]) {
            logger[level](`[Client ${socket.id}] ${message}`);
        } else {
            logger.info(`[Client ${socket.id}] ${message}`);
        }
    });
});

// Only listen if not running in Jest
if (!process.env.JEST_WORKER_ID) {
    server.listen(PORT, () => {
        try {
            logger.info(`Listening on http://localhost:${PORT}`);
        } catch (err) {
            logger.error(`Server failed to startup: \n${err}`);
        }
    });
}

export default app;