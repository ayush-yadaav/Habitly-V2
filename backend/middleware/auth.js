import jwt from "jsonwebtoken";

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "Not signed in. Please log in." });
  }

  try {
    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET || "dev_secret_change_me"
    );
    req.userId = payload.sub;
    next();
  } catch {
    return res.status(401).json({ error: "Session expired. Please log in again." });
  }
}
