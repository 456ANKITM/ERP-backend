import User,{USER_STATUS} from "@/models/User.model.js";
import ApiError from "@/utils/ApiError.js";
import { verifyAccessToken } from "@/utils/jwt.js";

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new ApiError(401, "Authentication required");
    }
    const token = authHeader.split(" ")[1];
    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch {
      throw new ApiError(401, "Invalid or expired access token");
    }
    if (payload.type !== "access") {
      throw new ApiError(401, "Invalid access token");
    }
    const user = await User.findOne({
      _id: payload.sub,
      deletedAt: null,
    });

    if (!user) {
      throw new ApiError(401, "User no longer exists");
    }

    if (user.status !== USER_STATUS.ACTIVE) {
      throw new ApiError(403, "User account is not active");
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};
