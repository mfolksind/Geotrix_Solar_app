import { Application } from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";
import xss from "xss-clean";
import hpp from "hpp";
import { env } from "../../config/env";

export function applySecurity(app: Application): void {
    // Trust proxy when behind a reverse proxy (e.g., in production)
    if (env.NODE_ENV === "production") {
        app.set("trust proxy", 1);
    }

    // Basic protections
    app.use(
        helmet({
            crossOriginResourcePolicy: { policy: "cross-origin" },
        }),
    );

    // CORS - automatically allow and reflect requesting origin
    app.use(
        cors({
            origin: true,
            credentials: true,
        }),
    );

    // Compression
    app.use(compression());

    // Rate limiter - basic sizing, can be tuned via environment if needed
    const limiter = rateLimit({
        windowMs: 1 * 60 * 1000,
        max: 250, // limit each IP to 100 requests per windowMs
        standardHeaders: true,
        legacyHeaders: false,
        skip: (req) => {
            const origin = req.headers.origin;
            if (origin && (origin.includes("3000") || origin.toLowerCase().includes("admin"))) {
                return true; // Bypass rate limit for admin panel
            }
            return false;
        },
    });
    app.use(limiter);

    // Data sanitization against NoSQL injection
    app.use(mongoSanitize());

    // Data sanitization against XSS
    app.use(xss());

    // Prevent HTTP parameter pollution
    app.use(hpp());
}

export default applySecurity;
