import { Request, Response, NextFunction } from "express";
import { UserRole } from "@prisma/client";

export const onlyTutor = (mw: (req: Request, res: Response, next: NextFunction) => any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.user?.role === UserRole.TUTOR) return mw(req, res, next);
    return next();
  };
};
