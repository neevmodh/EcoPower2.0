const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

export async function loginUser(email, password) {
  let res;
  try {
    res = await fetch(`${API_BASE}/api/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
  } catch {
    throw new Error("Can't reach the server. Check your connection and try again.");
  }
  if (res.status === 400 || res.status === 401) throw new Error('Invalid email or password.');
  if (!res.ok) throw new Error("The server can't reach its database right now. Please try again later.");
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
