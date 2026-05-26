import {
  getDashboardSummary,
  getDebtors,
} from "./dashboard.service.js";

function dashboardScope(user) {
  return user.role === 'AGENT' ? { agentId: user.id } : { createdById: user.id };
}

export async function summary(req, res) {
  try {
    const year = req.query.year ? Number(req.query.year) : new Date().getFullYear();
    const data = await getDashboardSummary(year, dashboardScope(req.user));
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ message: err.message || "Failed to load dashboard" });
  }
}

export async function debtorsList(req, res) {
  try {
    const { propertyId, minDaysOverdue } = req.query;
    const data = await getDebtors({
      propertyId: propertyId || undefined,
      minDaysOverdue: minDaysOverdue ? Number(minDaysOverdue) : undefined,
      ...dashboardScope(req.user),
    });
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ message: err.message || "Failed to load debtors" });
  }
}
