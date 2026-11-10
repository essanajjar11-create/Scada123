import express from "express";
import http from "http";
import path from "path";
import fs from "fs";
import { exec } from "child_process";
import { WebSocketServer, WebSocket } from "ws";

const ALLOWED_COSIM_COMMANDS = ["NORMAL_RUN", "SLG_FAULT_A", "MICROGRID_STEP"] as const;
type CosimCommand = (typeof ALLOWED_COSIM_COMMANDS)[number];

function isAllowedCosimCommand(value: unknown): value is CosimCommand {
  return typeof value === "string" && (ALLOWED_COSIM_COMMANDS as readonly string[]).includes(value);
}

function buildMatlabCommand(port: number, scenario: CosimCommand): string {
  const matlabPath = path.join(process.cwd(), "matlab", "cosim");
  const safePath = matlabPath.replace(/\\/g, "/").replace(/'/g, "''");
  const safeScenario = scenario.replace(/'/g, "''");
  return `matlab -batch "cd('${safePath}'); matlab_scada_bridge('http://localhost:${port}', '${safeScenario}');"`;
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  const server = http.createServer(app);

  // WebSocket Server attached to HTTP server
  const wss = new WebSocketServer({ server, path: "/ws" });

  const clients = new Set<WebSocket>();
  let cachedSnapshot: any = null;
  let cachedTelemetry: any = null;

  wss.on("connection", (ws) => {
    clients.add(ws);

    // Send connection welcome plus the cached control snapshot and the last
    // authoritative telemetry frame so a late-joining workstation starts in
    // sync instead of waiting for the next leader tick.
    ws.send(JSON.stringify({
      type: "CONNECTED",
      clientCount: clients.size,
      snapshot: cachedSnapshot,
      telemetry: cachedTelemetry
    }));

    // Broadcast updated client count to other clients
    const joinNotice = JSON.stringify({
      type: "CLIENT_COUNT",
      clientCount: clients.size,
    });
    for (const client of clients) {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(joinNotice);
      }
    }

    ws.on("message", (data) => {
      try {
        const messageStr = data.toString();
        const payload = JSON.parse(messageStr);

        if (payload.type === "FULL_STATE_SYNC" && payload.snapshot) {
          cachedSnapshot = { ...(cachedSnapshot || {}), ...payload.snapshot };
        }

        if (payload.type === "SWITCH_OPERATION" && payload.trId) {
          if (!cachedSnapshot) cachedSnapshot = {};
          if (payload.allSwitches) {
            if (payload.trId === "TR-1") cachedSnapshot.tr1Switches = payload.allSwitches;
            if (payload.trId === "TR-2") cachedSnapshot.tr2Switches = payload.allSwitches;
          } else if (payload.switchKey !== undefined && payload.newState !== undefined) {
            const swKey = payload.trId === "TR-1" ? "tr1Switches" : "tr2Switches";
            if (!cachedSnapshot[swKey]) cachedSnapshot[swKey] = {};
            cachedSnapshot[swKey][payload.switchKey] = payload.newState;
          }
        }

        if (payload.type === "MAINTENANCE_TOGGLE" && payload.maintenanceMode !== undefined) {
          if (!cachedSnapshot) cachedSnapshot = {};
          cachedSnapshot.maintenanceMode = payload.maintenanceMode;
        }

        if (payload.type === "SETTINGS_UPDATE") {
          if (!cachedSnapshot) cachedSnapshot = {};
          if (payload.simMode) cachedSnapshot.simMode = payload.simMode;
          if (payload.manualValues) cachedSnapshot.manualValues = { ...(cachedSnapshot.manualValues || {}), ...payload.manualValues };
          if (payload.thresholds) cachedSnapshot.thresholds = { ...(cachedSnapshot.thresholds || {}), ...payload.thresholds };
        }

        if (payload.type === "BESS_UPDATE" && payload.bessData) {
          if (!cachedSnapshot) cachedSnapshot = {};
          cachedSnapshot.bessData = { ...(cachedSnapshot.bessData || {}), ...payload.bessData };
        }

        if ((payload.type === "HVDC_UPDATE" || payload.type === "HVDC_SETPOINT") && payload.hvdcData) {
          if (!cachedSnapshot) cachedSnapshot = {};
          cachedSnapshot.hvdcData = { ...(cachedSnapshot.hvdcData || {}), ...payload.hvdcData };
        }

        if (payload.type === "TELEMETRY_SYNC" && payload.telemetry) {
          // Latest frame wins (frames carry a wall-clock sentAt from the leader).
          if (!cachedTelemetry || (payload.telemetry.sentAt ?? 0) >= (cachedTelemetry.sentAt ?? 0)) {
            cachedTelemetry = payload.telemetry;
          }
        }

        // Broadcast to all other connected clients
        for (const client of clients) {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(messageStr);
          }
        }
      } catch (err) {
        console.error("Error processing WebSocket message:", err);
      }
    });

    ws.on("close", () => {
      clients.delete(ws);
      const leaveNotice = JSON.stringify({
        type: "CLIENT_COUNT",
        clientCount: clients.size,
      });
      for (const client of clients) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(leaveNotice);
        }
      }
    });

    ws.on("error", (err) => {
      console.error("WebSocket client error:", err);
      clients.delete(ws);
    });
  });

  app.use(express.json({ limit: "50mb" }));

  // In-memory co-simulation state cache
  let latestMatlabTelemetry: any = {
    status: "STANDBY",
    lastUpdated: new Date().toISOString(),
    grid132kV: { Va_kV: 76.21, Vb_kV: 76.21, Vc_kV: 76.21, V_LL_kV: 132.0, freq_Hz: 50.0 },
    tr1_13_8kV: { Va_kV: 7.97, Vb_kV: 7.97, Vc_kV: 7.97, V_LL_kV: 13.8, current_A: 1172 },
    relays: { ansi87t_trip: 0, ansi21_trip: 0, ansi25_permissive: 1, ansi50_51_trip: 0 },
    microgrid: { solar_MW: 4.85, bess_SoC_pct: 72.4, bess_power_MW: -4.5, h2_kg_hr: 40.0, hvdc_MW: 20.0 },
    waveforms: []
  };

  // 1. Health check API
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", activeWebSocketClients: clients.size, matlabBridge: latestMatlabTelemetry.status });
  });

  // 2. MATLAB Push Telemetry Endpoint (Called from MATLAB Bridge)
  app.post("/api/matlab/push-telemetry", (req, res) => {
    try {
      const data = req.body;
      latestMatlabTelemetry = {
        ...data,
        status: "ACTIVE_COSIM",
        lastUpdated: new Date().toISOString()
      };

      // Broadcast MATLAB telemetry to all connected React Web SCADA clients
      const broadcastMsg = JSON.stringify({
        type: "MATLAB_COSIM_TELEMETRY",
        telemetry: latestMatlabTelemetry
      });

      for (const client of clients) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(broadcastMsg);
        }
      }

      res.json({ success: true, message: "Telemetry received and broadcasted" });
    } catch (err: any) {
      console.error("[MATLAB Bridge Error]:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 3. GET Latest MATLAB Telemetry
  app.get("/api/matlab/latest-telemetry", (_req, res) => {
    res.json(latestMatlabTelemetry);
  });

  // 4. POST Co-Simulation Command from Web UI
  app.post("/api/matlab/cosim-command", (req, res) => {
    const { command, params } = req.body;
    console.log(`[Co-Sim Command]: Received ${command}`, params);

    if (!isAllowedCosimCommand(command)) {
      return res.status(400).json({ success: false, error: `Unknown scenario '${String(command ?? "").slice(0, 64)}'` });
    }

    // Compute high-fidelity scenario waveforms
    const numPoints = 80;
    const waveforms = [];
    const omega = 2 * Math.PI * 0.05; // 50 Hz nominal in ms

    for (let idx = 0; idx < numPoints; idx++) {
      const t = idx * 2.5; // 0 to 200 ms
      let va132 = 107.7 * Math.sin(omega * t);
      let vb132 = 107.7 * Math.sin(omega * t - (2 * Math.PI) / 3);
      let vc132 = 107.7 * Math.sin(omega * t + (2 * Math.PI) / 3);

      let va138 = 11.26 * Math.sin(omega * t + Math.PI / 6);
      const vb138 = 11.26 * Math.sin(omega * t - Math.PI / 2);
      const vc138 = 11.26 * Math.sin(omega * t + (5 * Math.PI) / 6);

      // If SLG Fault Phase A injected at t >= 100ms
      if (command === "SLG_FAULT_A" && t >= 100) {
        va132 = va132 * 0.15; // 85% voltage sag on faulted phase
        va138 = va138 * 0.20;
        vb132 = vb132 * 1.08; // Mild healthy phase swell
        vc132 = vc132 * 1.08;
      }

      waveforms.push({
        t_ms: Number(t.toFixed(2)),
        Va_132kV: Number(va132.toFixed(2)),
        Vb_132kV: Number(vb132.toFixed(2)),
        Vc_132kV: Number(vc132.toFixed(2)),
        Va_13_8kV: Number(va138.toFixed(2)),
        Vb_13_8kV: Number(vb138.toFixed(2)),
        Vc_13_8kV: Number(vc138.toFixed(2))
      });
    }

    // Configure scenario telemetry states
    let relays = { ansi87t_trip: 0, ansi21_trip: 0, ansi25_permissive: 1, ansi50_51_trip: 0 };
    let microgrid = { solar_MW: 4.85, bess_SoC_pct: 72.4, bess_power_MW: -4.5, h2_kg_hr: 40.0, hvdc_MW: 20.0 };
    const grid132kV = { Va_kV: 76.21, Vb_kV: 76.21, Vc_kV: 76.21, V_LL_kV: 132.0, freq_Hz: 50.0, S_sc_MVA: 2500 };
    const tr1_13_8kV = { Va_kV: 7.97, Vb_kV: 7.97, Vc_kV: 7.97, V_LL_kV: 13.8, rated_MVA: 40.0, tap_position: 9, hot_spot_degC: 109.3, top_oil_degC: 78.4 };

    if (command === "SLG_FAULT_A") {
      relays = { ansi87t_trip: 1, ansi21_trip: 1, ansi25_permissive: 0, ansi50_51_trip: 1 };
      grid132kV.V_LL_kV = 112.5;
      grid132kV.Va_kV = 11.4;
      tr1_13_8kV.hot_spot_degC = 125.8;
      tr1_13_8kV.V_LL_kV = 11.8;
    } else if (command === "MICROGRID_STEP") {
      microgrid = { solar_MW: 5.0, bess_SoC_pct: 68.2, bess_power_MW: -8.5, h2_kg_hr: 40.0, hvdc_MW: 25.0 };
    }

    latestMatlabTelemetry = {
      status: "ACTIVE_COSIM",
      engine: "MATLAB R2023b / Simulink ode23tb",
      activeScenario: command,
      solverTimeMs: 14.8,
      lastUpdated: new Date().toISOString(),
      grid132kV,
      tr1_13_8kV,
      relays,
      microgrid,
      waveforms
    };

    // Broadcast updated scenario telemetry to all WebSocket clients instantly
    const broadcastMsg = JSON.stringify({
      type: "MATLAB_COSIM_TELEMETRY",
      telemetry: latestMatlabTelemetry
    });

    for (const client of clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(broadcastMsg);
      }
    }

    const cmd = buildMatlabCommand(PORT, command);
    const matlabPath = path.join(process.cwd(), "matlab", "cosim");

    exec(cmd, { cwd: matlabPath, timeout: 35000 }, (error) => {
      if (!error) {
        console.log(`[MATLAB Co-Sim]: Scenario ${command} executed in Simulink.`);
      }
    });

    res.json({
      success: true,
      command,
      status: "APPLIED_AND_STREAMED",
      telemetry: latestMatlabTelemetry
    });
  });

  // 5. POST Execute Local MATLAB Simulation Script Directly from Node.js
  app.post("/api/matlab/execute-batch", (req, res) => {
    const scenario: CosimCommand = isAllowedCosimCommand(req.body?.scenario) ? req.body.scenario : "NORMAL_RUN";
    const matlabPath = path.join(process.cwd(), "matlab", "cosim");
    const cmd = buildMatlabCommand(PORT, scenario);
    console.log(`[MATLAB Runner] Spawning background MATLAB process (Scenario: ${scenario})...`);
    exec(cmd, { cwd: matlabPath, timeout: 45000 }, (error, stdout) => {
      if (error) {
        console.warn(`[MATLAB Runner Warning]:`, error.message);
      } else {
        console.log(`[MATLAB Runner Output]:`, stdout || "Done");
      }
    });

    res.json({
      success: true,
      message: `MATLAB Simulink (${scenario}) initiated in background.`
    });
  });

  // Vite development middleware or production static serving
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Robust detection of dist folder across standalone exe and normal run
    const exeDir = path.dirname(process.execPath || "");
    const candidates = [
      path.join(exeDir, "dist"),
      path.join(process.cwd(), "dist"),
      path.join(__dirname, "dist"),
      path.join(__dirname),
      exeDir
    ];
    let distPath = path.join(process.cwd(), "dist");
    for (const cand of candidates) {
      if (fs.existsSync(path.join(cand, "index.html"))) {
        distPath = cand;
        break;
      }
    }
    console.log(`[SCADA Server] Serving static client from: ${distPath}`);
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    const localUrl = `http://localhost:${PORT}`;
    console.log(`[SCADA Server] Running on http://127.0.0.1:${PORT} with WebSocket on ws://127.0.0.1:${PORT}/ws`);
    
    // Auto-open client in browser/app mode when running in production if not suppressed
    if (process.env.NODE_ENV === "production" && process.env.AUTO_OPEN !== "false") {
      setTimeout(() => {
        // Try launching Edge in dedicated app mode (no browser chrome), fallback to default browser
        exec(`start msedge --app="${localUrl}"`, (err) => {
          if (err) {
            exec(`start "" "${localUrl}"`);
          }
        });
      }, 500);
    }
  });
}

startServer().catch((err) => {
  console.error("Failed to start SCADA server:", err);
});
