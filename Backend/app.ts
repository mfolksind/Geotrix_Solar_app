import express from "express";
import dotenv from "dotenv";
dotenv.config();
import path from "path";
// import { env } from './src/config/env';
import applySecurity from "./src/common/middleware/security";
import { morganMiddleware } from "./src/common/logger/logger";
import cookieParser from "cookie-parser";
import { userRoutes } from "./src/modules/users";
import { authRoutes } from "./src/modules/auth";
import { addressRoutes } from "./src/modules/addresses";
import { categoryRoutes } from "./src/modules/categories";
import { productRoutes } from "./src/modules/products";
import { orderRoutes } from "./src/modules/orders";
import { cartRoutes } from "./src/modules/carts";
import uploadRoutes from "./src/modules/uploads/routes/upload.routes";
import { leadRoutes } from "./src/modules/leads";
import { paymentRoutes } from "./src/modules/payments";
import { reviewRoutes } from "./src/modules/reviews";
import { familyRoutes } from "./src/modules/families";
import adminRouter from "./src/admin";
import errorHandler from "./src/common/errors/errorHandler";
import notFound from "./src/common/errors/notFound";
import { supportRoutes } from "./src/modules/support";
import { notificationRoutes } from "./src/modules/notifications";

const app = express();

applySecurity(app);
app.use(morganMiddleware);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use("/uploads", express.static(path.join(process.cwd(), "public/uploads")));

app.use("/auth", authRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/addresses", addressRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/carts", cartRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/leads", leadRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/families", familyRoutes);
app.use("/api/support", supportRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/notifications", notificationRoutes);
app.use("/admin", adminRouter);
app.use("/api/admin", adminRouter);

app.use("/api", (req, res) => {
    const trimmedPath = req.path.replace(/\s+$/g, "");
    if (trimmedPath !== req.path) {
        return res.redirect(301, `${req.baseUrl}${trimmedPath}`);
    }
    res.status(200).json({ message: "API is running" });
});

app.use(notFound);
app.use(errorHandler);

export default app;
