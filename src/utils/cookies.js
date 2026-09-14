import {env} from "@/config/env.js";

const baseCookieOptions = {
    httpOnly: true, 
    secure: env.COOKIE_SECURE, 
    sameSite: env.COOKIE_SAME_SITE, 
    domain: env.COOKIE_DOMAIN, 
    path: "/"
}; 

export const setRefreshTokenCookie = (
    res, 
    token
) => {
    res.cookie(
        env.REFRESH_COOKIE_NAME, 
        token, 
        {
            ...baseCookieOptions, 
            maxAge: 30*24*60*60*1000
        }
    )
}; 

export const clearRefreshToken = (res) => {
    res.clearCookie(
        env.REFRESH_COOKIE_NAME, 
        baseCookieOptions
    )
}; 

export const getRefreshTokenFromRequest = (
    req,
) => {
    return req.cookies?.[env.REFRESH_COOKIE_NAME] || null;
}