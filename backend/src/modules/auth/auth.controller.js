import {
  changeInitialPassword,
  forgotPassword,
  loginUser,
  registerUser,
  resetPassword,
} from './auth.service.js';

export async function register(req, res) {
  try {
    const { name, email, password, confirmPassword, phone } = req.body;

    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({ message: 'name, email, password, and confirmPassword are required' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    const result = await registerUser({ name, email, password, phone, role: 'ADMIN' });
    return res.status(201).json(result);
  } catch (err) {
    return res.status(400).json({ message: err.message, code: err.code });
  }
}

export async function login(req, res) {
  try {
    const { email, password, code } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'email and password are required' });
    }

    const result = await loginUser({ email, password, code });
    return res.status(200).json(result);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
}

export async function changePassword(req, res) {
  try {
    const { password, confirmPassword } = req.body;
    const result = await changeInitialPassword({ userId: req.user.id, password, confirmPassword });
    return res.json(result);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
}

export async function forgot(req, res) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'email is required' });
    const result = await forgotPassword({ email });
    return res.json(result);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
}

export async function reset(req, res) {
  try {
    const { token, password, confirmPassword } = req.body;
    const result = await resetPassword({ token, password, confirmPassword });
    return res.json(result);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
}
