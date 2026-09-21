import { ROLES } from "@/constants/roles";
import { authenticate } from "@/middlewares/authenticate";
import { authorize } from "@/middlewares/authorize";
import { validateBody } from "@/middlewares/validate";
import {Router} from "express"; 
import { createSupplierSchema, updateSupplierSchema } from "./suppliers.validators";
import { createSupplierControllers, getSupplierDetailsController, listSupplierControllers, removeSupplierController, updateSupplierController } from "./suppliers.controllers";

const router = Router(); 

router.use(authenticate); 
router.use(authorize(ROLES.OWNER, ROLES.STORE_MANAGER)); 

router.post("/", validateBody(createSupplierSchema), createSupplierControllers); 
router.get("/", listSupplierControllers); 
router.get("/:id", getSupplierDetailsController); 
router.patch("/:id", validateBody(updateSupplierSchema), updateSupplierController)
router.delete("/:id", removeSupplierController); 

export default router;