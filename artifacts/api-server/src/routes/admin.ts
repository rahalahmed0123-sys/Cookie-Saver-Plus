import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { eq } from "drizzle-orm";
import { db, sessionsTable } from "@workspace/db";
import {
  ListSessionsResponse,
  CreateSessionBody,
  UpdateSessionParams,
  UpdateSessionBody,
  DeleteSessionParams,
  CreateSessionResponse,
  UpdateSessionResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

// Simple admin key guard — reads from ADMIN_KEY env var.
// If ADMIN_KEY is not set, returns 401 with a clear message so mis-configuration
// is obvious rather than silently granting access.
function adminAuth(req: Request, res: Response, next: NextFunction): void {
  const adminKey = process.env.ADMIN_KEY;
  const provided = req.headers["x-admin-key"] as string | undefined;

  if (!adminKey) {
    res.status(503).json({ error: "ADMIN_KEY not configured on server" });
    return;
  }

  if (!provided || provided !== adminKey) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  next();
}

router.get("/admin/sessions", adminAuth, async (req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(sessionsTable)
    .orderBy(sessionsTable.createdAt);
  res.json(
    ListSessionsResponse.parse(
      rows.map((r) => ({
        ...r,
        createdAt: r.createdAt.toISOString(),
      })),
    ),
  );
});

router.post("/admin/sessions", adminAuth, async (req, res): Promise<void> => {
  const parsed = CreateSessionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [session] = await db
    .insert(sessionsTable)
    .values({
      label: parsed.data.label,
      cookieValue: parsed.data.cookieValue,
    })
    .returning();

  res.status(201).json(
    CreateSessionResponse.parse({
      ...session,
      createdAt: session.createdAt.toISOString(),
    }),
  );
});

router.patch(
  "/admin/sessions/:id",
  adminAuth,
  async (req, res): Promise<void> => {
    const params = UpdateSessionParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const body = UpdateSessionBody.safeParse(req.body);
    if (!body.success) {
      res.status(400).json({ error: body.error.message });
      return;
    }

    const updates: Partial<typeof sessionsTable.$inferInsert> = {};
    if (body.data.label !== undefined) updates.label = body.data.label;
    if (body.data.isActive !== undefined) updates.isActive = body.data.isActive;

    const [session] = await db
      .update(sessionsTable)
      .set(updates)
      .where(eq(sessionsTable.id, params.data.id))
      .returning();

    if (!session) {
      res.status(404).json({ error: "Session not found" });
      return;
    }

    res.json(
      UpdateSessionResponse.parse({
        ...session,
        createdAt: session.createdAt.toISOString(),
      }),
    );
  },
);

router.delete(
  "/admin/sessions/:id",
  adminAuth,
  async (req, res): Promise<void> => {
    const params = DeleteSessionParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const [deleted] = await db
      .delete(sessionsTable)
      .where(eq(sessionsTable.id, params.data.id))
      .returning();

    if (!deleted) {
      res.status(404).json({ error: "Session not found" });
      return;
    }

    res.sendStatus(204);
  },
);

export default router;
