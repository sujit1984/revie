import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import { sendError } from "./lib/errors.js";
import { authRouter } from "./routes/authRoutes.js";
import { taxonomyRouter } from "./routes/taxonomyRoutes.js";
import { productsRouter } from "./routes/productsRoutes.js";
import { reviewsRouter } from "./routes/reviewsRoutes.js";
import { adminRouter } from "./routes/adminRoutes.js";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", service: "api" });
});

app.use("/auth", authRouter);
app.use("/v1/taxonomy", taxonomyRouter);
app.use("/v1/products", productsRouter);
app.use("/v1/reviews", reviewsRouter);
app.use("/v1/admin", adminRouter);

app.use((req, res) => sendError(res, 404, "NOT_FOUND", `Route not found: ${req.method} ${req.path}`));

app.listen(env.port, () => {
  console.log(`Revie API running on port ${env.port}`);
});
