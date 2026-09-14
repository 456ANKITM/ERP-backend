import jwt  from "jsonwebtoken"; 
import {env} from "@/config/env.js";

export const signAccessToken = ({
    userId, 
    role, 
    businessId, 
    storeId
}) => {
    return jwt.sign(
        {
            sub: userId.toString(), 
            role, 
            businessId: businessId ? businessId.toString() : null, 
            storeId: storeId ? storeId.toString() : null, 
            type: "access"
        },
        env.JWT_ACCESS_SECRET,
        {
            expiresIn: env.JWT_ACCESS_EXPIRES_IN, 
            issuer:"erp-api", 
            audience: "erp-client"
        }
    )
}; 

export  const verifyAccessToken = (token) => {
    return jwt.verify(
        token, 
        env.JWT_ACCESS_SECRET, 
        {
            issuer:"erp-api", 
            audience: "erp-client"
        }
    )
}