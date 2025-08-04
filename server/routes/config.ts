import { Router } from "express";
import type { Request, Response } from "express";

const router = Router();

// Get configuration data (including API keys for frontend)
router.get("/", (req: Request, res: Response) => {
  try {
    const config = {
      googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || null,
      // Add other non-sensitive config as needed
    };
    
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: "Failed to get configuration" });
  }
});

export { router as configRoutes };