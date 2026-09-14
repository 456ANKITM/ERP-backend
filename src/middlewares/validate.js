import ApiError from "@/utils/ApiError.js";

export const validateBody = (schema) => {
    return (req, res, next) => {
        const result = schema(req.body);
        if(!result.success) {
            return next(
                new ApiError(400, "Validation Failed", result.errors)
            )
        }
        req.body = result.data; 
        next();
    }
}