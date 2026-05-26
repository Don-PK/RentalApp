import { listAgents, createAgent, deleteAgent, sendAgentResetLink } from './user.service.js';

export async function agents(req, res) {
  try {
    const agents = await listAgents({ adminId: req.user.id });
    return res.json(agents);
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Failed to load agents' });
  }
}

export async function create(req, res) {
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'name, email, and password are required' });
    const agent = await createAgent({ name, email, password, phone, adminId: req.user.id });
    return res.status(201).json(agent);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
}

export async function sendReset(req, res) {
  try {
    const result = await sendAgentResetLink(req.params.id, { adminId: req.user.id });
    return res.json(result);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
}

export async function deleteAgentController(req, res) {
  try {
    await deleteAgent(req.params.id, { adminId: req.user.id });
    return res.status(204).send();
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
}
