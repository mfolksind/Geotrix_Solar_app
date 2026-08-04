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

    // CORS - allow only client URL
    app.use(
        cors({
            origin: [env.CLIENT_URL, "http://localhost:3001"],
            credentials: true,
        }),
    );

    // Compression
    app.use(compression());

    // Rate limiter - basic sizing, can be tuned via environment if needed
    const limiter = rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // limit each IP to 100 requests per windowMs
        standardHeaders: true,
        legacyHeaders: false,
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
