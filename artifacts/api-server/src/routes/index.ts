import { Router, type IRouter } from "express";
import healthRouter from "./health";
import accessRouter from "./access";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(accessRouter);
router.use(adminRouter);

export default router;
