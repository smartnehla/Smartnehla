import { clerkClient, getAuth } from "@clerk/express";
import type { RequestHandler } from "express";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

const readAdminEmails = (): Set<string> =>
  new Set(
    (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );

export const requireAdmin: RequestHandler = async (req, res, next): Promise<void> => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Sign in to continue." });
    return;
  }

  const allowedEmails = readAdminEmails();
  if (allowedEmails.size === 0) {
    res.status(503).json({
      error: "Admin access is locked. Configure the ADMIN_EMAILS environment variable before using the control center.",
    });
    return;
  }

  try {
    const user = await clerkClient.users.getUser(userId);
    const isAllowed = user.emailAddresses.some(
      (address) =>
        address.verification?.status === "verified" &&
        allowedEmails.has(address.emailAddress.toLowerCase()),
    );

    if (!isAllowed) {
      res.status(403).json({ error: "This account is not on the administrator allowlist." });
      return;
    }

    req.userId = userId;
    next();
  } catch (error) {
    req.log.error({ err: error }, "Unable to verify control-center administrator");
    res.status(503).json({ error: "Administrator access could not be verified." });
  }
};
