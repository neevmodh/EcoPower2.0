const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

export async function loginUser(email, password) {
  const res = await fetch(`${API_BASE}/api/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error('Invalid credentials');
  return res.json();
}

export async function fetchDashboard(userId) {
  const res = await fetch(`${API_BASE}/api/users/${userId}/dashboard`);
  if (!res.ok) throw new Error('Failed to load dashboard');
  return res.json();
}

export async function fetchPlans() {
  const res = await fetch(`${API_BASE}/api/plans`);
  if (!res.ok) throw new Error('Failed to load plans');
  return res.json();
}
