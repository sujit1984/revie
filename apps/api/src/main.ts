import express from "express";
import { createReviewSchema } from "@revie/validation";

const app = express();
app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", service: "api" });
});

app.post("/v1/reviews", (req, res) => {
  const parsed = createReviewSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid payload", details: parsed.error.flatten() });
  }

  return res.status(201).json({ message: "Review accepted", input: parsed.data });
});

const port = Number(process.env.PORT ?? 4000);
app.listen(port, () => {
  console.log(`Revie API running on port ${port}`);
});
