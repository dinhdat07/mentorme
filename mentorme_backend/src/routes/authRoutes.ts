import { Router } from "express";
import { prisma } from "../lib/prisma";
import { UserRole, UserStatus } from "@prisma/client";
import { z } from "zod";
import { hashPassword, comparePassword } from "../utils/password";
import { signToken } from "../utils/jwt";
import { authGuard } from "../middleware/auth";
import { buildGoogleAuthUrl, getGoogleProfile } from "../utils/googleAuth";
import { env } from "../config/env";

const router = Router();

const registerSchema = z.object({
  fullName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(6),
  password: z.string().min(6),
  role: z.nativeEnum(UserRole),
});

router.post("/register", async (req, res) => {
  try {
    const payload = registerSchema.parse(req.body);

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: payload.email }, { phone: payload.phone }],
      },
    });

    if (existingUser) {
      return res.status(400).json({ message: "Email or phone already in use" });
    }

    const passwordHash = await hashPassword(payload.password);

    const user = await prisma.user.create({
      data: {
        fullName: payload.fullName,
        email: payload.email,
        phone: payload.phone,
        passwordHash,
        role: payload.role,
        status: payload.role === UserRole.TUTOR ? UserStatus.PENDING : UserStatus.ACTIVE,
      },
    });

    if (user.role === UserRole.STUDENT) {
      await prisma.studentProfile.create({
        data: {
          userId: user.id,
          gradeLevel: "Unknown",
          preferredSubjects: [],
        },
      });
    } else if (user.role === UserRole.TUTOR) {
      await prisma.tutorProfile.create({
        data: {
          userId: user.id,
          certificates: [],
          teachingModes: [],
        },
      });
    }

    const token = signToken({ userId: user.id, role: user.role });

    const { passwordHash: _, ...safeUser } = user;
    return res.status(201).json({ user: safeUser, accessToken: token });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid payload", issues: error.issues });
    }
    return res.status(500).json({ message: "Internal server error" });
  }
});

const loginSchema = z.object({
  emailOrPhone: z.string(),
  password: z.string().min(6),
});

router.post("/login", async (req, res) => {
  try {
    const payload = loginSchema.parse(req.body);
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: payload.emailOrPhone }, { phone: payload.emailOrPhone }],
      },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    if (!user.passwordHash) {
      return res.status(400).json({ message: "Please sign in with Google" });
    }

    const isValid = await comparePassword(payload.password, user.passwordHash);

    if (!isValid) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = signToken({ userId: user.id, role: user.role });
    const { passwordHash: _, ...safeUser } = user;
    return res.json({ user: safeUser, accessToken: token });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "Invalid payload", issues: error.issues });
    }
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/me", authGuard(), async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        studentProfile: true,
        tutorProfile: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { passwordHash: _, ...safeUser } = user;
    return res.json({
      user: safeUser,
      studentProfile: user.studentProfile,
      tutorProfile: user.tutorProfile,
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/google", (req, res) => {
  const requestedRole = (req.query.role as string | undefined)?.toUpperCase();
  const role =
    requestedRole === UserRole.TUTOR ? UserRole.TUTOR : UserRole.STUDENT;

  const url = buildGoogleAuthUrl(role);
  return res.redirect(url);
});

router.get("/google/callback", async (req, res) => {
  try {
    const { code, state } = req.query;

    if (!code || typeof code !== "string") {
      return res.status(400).json({ message: "Missing authorization code" });
    }

    let stateRole = UserRole.STUDENT;
    if (typeof state === "string") {
      try {
        const decoded = JSON.parse(Buffer.from(state, "base64url").toString());
        if (decoded.role === UserRole.TUTOR) {
          stateRole = UserRole.TUTOR;
        }
      } catch {
        // default to STUDENT
      }
    }

    const profile = await getGoogleProfile(code);

    let user =
      (await prisma.user.findUnique({
        where: { googleId: profile.googleId },
      })) ||
      (await prisma.user.findUnique({
        where: { email: profile.email },
      }));

    if (user) {
      if (!user.googleId) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { googleId: profile.googleId },
        });
      }
    } else {
      user = await prisma.user.create({
        data: {
          fullName: profile.fullName,
          email: profile.email,
          phone: null,
          passwordHash: null,
          googleId: profile.googleId,
          role: stateRole,
          status: stateRole === UserRole.TUTOR ? UserStatus.PENDING : UserStatus.ACTIVE,
        },
      });
    }

    if (user.role === UserRole.STUDENT) {
      await prisma.studentProfile.upsert({
        where: { userId: user.id },
        update: {},
        create: {
          userId: user.id,
          gradeLevel: "Unknown",
          preferredSubjects: [],
        },
      });
    } else if (user.role === UserRole.TUTOR) {
      await prisma.tutorProfile.upsert({
        where: { userId: user.id },
        update: {},
        create: {
          userId: user.id,
          certificates: [],
          teachingModes: [],
        },
      });
    }

    const token = signToken({ userId: user.id, role: user.role });

    const redirectUrl = new URL(`${env.frontendUrl}/auth/google-callback`);
    redirectUrl.searchParams.set("token", token);
    redirectUrl.searchParams.set("role", user.role);

    return res.redirect(redirectUrl.toString());
  } catch (error) {
    return res.status(500).json({ message: "Google authentication failed" });
  }
});

export default router;
