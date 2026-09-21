import { ROLES } from "@/constants/roles";
import { authenticate } from "@/middlewares/authenticate";
import { authorize } from "@/middlewares/authorize";
import { validateBody } from "@/middlewares/validate";
import {Router} from "express";
import { createCategorySchema } from "./categories.validator";
import { createCategoryController, listCategoriesController } from "./categories.controller";

const router = Router(); 

router.use(authenticate); 
router.use(authorize(ROLES.OWNER, ROLES.STORE_MANAGER));

router.post("/", validateBody(createCategorySchema), createCategoryController);
router.get("/", listCategoriesController);

export default router;