/**
 * Magic Pass Plus — Game Server
 * Colyseus multiplayer server for all games
 * Deployed on Railway (separate from main app)
 */

import { Server } from "colyseus";
import { WebSocketTransport } from "@colyseus/ws-transport";
import { createServer } from "http";
import express from "express";
import { monitor } from "@colyseus/monitor";

// Room imports
import { Match3Room } from "./rooms/Match3Room";
import { PokerRoom } from "./rooms/PokerRoom";
import { SpitRoom } from "./rooms/SpitRoom";
import { MysteryRoom } from "./rooms/MysteryRoom";

const app = express();
const port = Number(process.env.PORT || 2567);

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", games: ["match3", "poker", "spit", "mystery"], uptime: process.uptime() });
});

// Colyseus monitor (admin panel)
app.use("/monitor", monitor());

// Serve static game assets
app.use("/assets", express.static("public"));

const httpServer = createServer(app);

const gameServer = new Server({
  transport: new WebSocketTransport({ server: httpServer }),
});

// Register game rooms
gameServer.define("match3", Match3Room).filterBy(["difficulty"]);
gameServer.define("poker", PokerRoom).filterBy(["difficulty"]);
gameServer.define("spit", SpitRoom);
gameServer.define("mystery", MysteryRoom).filterBy(["duration"]);

httpServer.listen(port, () => {
  console.log(`🎮 Magic Pass Games Server running on port ${port}`);
  console.log(`📊 Monitor: http://localhost:${port}/monitor`);
  console.log(`🏓 Health: http://localhost:${port}/health`);
});
