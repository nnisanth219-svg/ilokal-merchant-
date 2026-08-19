import type { NextFunction, Request, Response } from 'express'
import {
  getDashboardActivity,
  getDashboardRedemptionsChart,
  getDashboardStats,
} from '../services/dashboard.service.js'

export async function getStats(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await getDashboardStats()
    res.status(200).json({ success: true, data })
  } catch (error) {
    next(error)
  }
}

export async function getRedemptions(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await getDashboardRedemptionsChart()
    res.status(200).json({ success: true, data })
  } catch (error) {
    next(error)
  }
}

export async function getActivity(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const rawLimit = req.query.limit
    const limit =
      typeof rawLimit === 'string' && rawLimit.trim() !== ''
        ? Number.parseInt(rawLimit, 10)
        : 10

    const data = await getDashboardActivity(Number.isFinite(limit) ? limit : 10)
    res.status(200).json({ success: true, data })
  } catch (error) {
    next(error)
  }
}
