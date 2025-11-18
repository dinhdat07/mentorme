import { Request, Response, NextFunction } from "express";
import { UserRole } from "@prisma/client";
import { verifyToken } from "../utils/jwt";

export const authGuard = (roles?: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization ?? "";
      if (!authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const token = authHeader.split(" ")[1];
      if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const payload = verifyToken(token);

      req.user = { id: payload.userId, role: payload.role as UserRole };

      if (roles && !roles.includes(req.user.role)) {
        return res.status(403).json({ message: "Forbidden" });
      }

      return next();
    } catch (error) {
      return res.status(401).json({ message: "Unauthorized" });
    }
  };
};
