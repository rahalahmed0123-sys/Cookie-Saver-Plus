import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, sessionsTable } from "@workspace/db";
import { GetAccessResponse } from "@workspace/api-zod";

const router: IRouter = Router();

// Public endpoint: returns a random active cookie session (single query — no race condition)
router.get("/access", async (req, res): Promise<void> => {
  const active = await db
    .select()
    .from(sessionsTable)
    .where(eq(sessionsTable.isActive, true));

  if (active.length === 0) {
    res.json(GetAccessResponse.parse({ found: false, activeCount: 0 }));
    return;
  }

  const chosen = active[Math.floor(Math.random() * active.length)];

  res.json(
    GetAccessResponse.parse({
      found: true,
      cookieValue: chosen.cookieValue,
      label: chosen.label,
      activeCount: active.length,
    }),
  );
});

export default router;
