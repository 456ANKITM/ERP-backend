import { validateBody } from "@/middlewares/validate.js";
import {Router} from "express"; 
import { acceptInviteSchema, inviteUserSchema, updateUserSchema, updateUserStatusSchema } from "./users.validator.js";
import { acceptInviteController, getUserDetailsController, listUsersController,  inviteUserController, updateUserController, removeUserController } from "./users.controller.js";
import { authenticate } from "@/middlewares/authenticate.js";
import { authorize } from "@/middlewares/authorize.js";
import { ROLES } from "@/constants/roles.js";

const router = Router(); 

// Public - the invited manager has no account credentials yet, so this must sit above the authentication middleware
router.post("/accept-invite", validateBody(acceptInviteSchema), acceptInviteController );

router.use(authenticate); 
router.use(authorize(ROLES.OWNER)); 

router.post("/invite", validateBody(inviteUserSchema), inviteUserController); 
router.get("/", listUsersController);
router.get("/:id", getUserDetailsController)
router.patch("/:id", validateBody(updateUserSchema), updateUserController); 
router.patch("/:id/status", validateBody(updateUserStatusSchema), updateUserController); 
router.delete("/:id", removeUserController)

export default router;