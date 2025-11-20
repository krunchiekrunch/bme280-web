import express from "express";
import http from "http";
import { Server } from "socket.io";
import Bme280 from "bme280";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

app.use(express.static("public"));

let latestData = {
  temperature: null,
  humidity: null,
  pressure: null,
  updated_at: null
};

app.get("/json", (req, res) => {
  res.json(latestData);
});

(async () => {
  try {
    const bme280 = await Bme280.open({
      i2cBusNumber: 1,
      i2cAddress: 0x76 // change the i2c address if its not 0x76
    });

    console.log("BME280 initialized");

    // change update interval here if u want
    setInterval(async () => {
      try {
        const reading = await bme280.read();
        latestData = {
          temperature: reading.temperature.toFixed(2),
          humidity: reading.humidity.toFixed(2),
          pressure: reading.pressure.toFixed(2),
          updated_at: new Date().toISOString()
        };
        
        io.emit("sensorData", latestData);
        
      } catch (err) {
        console.error("Read error:", err);
      }
    }, 1000);

  } catch (err) {
    console.error("BME280 init failed:", err);
  }

  server.listen(PORT, () =>
    console.log(`Server running at http://localhost:${PORT}`)
  );
})();
