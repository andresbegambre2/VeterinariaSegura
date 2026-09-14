require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const { rateLimit } = require("express-rate-limit");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./docs/swagger");
const routes = require("./routes");
const { notFound, errorHandler } = require("./middlewares/errors");

const app = express();
app.disable("x-powered-by");
app.use(helmet());
app.use(cors({ origin: process.env.ALLOWED_ORIGIN || "http://localhost:3000", methods: ["GET", "POST", "PUT", "PATCH", "DELETE"] }));
app.use(express.json({ limit: "10kb" }));
app.use("/api", rateLimit({ windowMs: 15 * 60 * 1000, limit: 100, standardHeaders: "draft-8", legacyHeaders: false }));
app.get("/", (req, res) => res.json({ mensaje: "API VeterinariaSegura funcionando" }));
app.use("/api", routes);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get("/openapi.json", (req, res) => res.json(swaggerSpec));
app.use(notFound);
app.use(errorHandler);

module.exports = app;
