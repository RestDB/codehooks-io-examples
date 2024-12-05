import * as cookie from 'cookie'
import * as jwt from 'jsonwebtoken'
import { settings } from '../auth-settings'

export const authenticateToken = (req: any, res: any, next: any) => {
    let token: string;

    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7); // Remove 'Bearer ' prefix
    }
    if (req.headers.cookie) {
        const cookies = cookie.parse(req.headers.cookie);
        token = cookies['access-token']
    }
    if (token) {
        try {
            const decoded = jwt.verify(token, settings.JWT_ACCESS_TOKEN_SECRET);
            req.jwt_decoded = decoded;
            console.debug('mid ware verified access token', req.jwt_decoded)
            next()
        } catch (error: any) {
            if (error.name === "TokenExpiredError") {
                return next("Token lifetime exceeded!")               
            }        
            next(error);
        }
    } else {
        next('Missing token')
    }
}
