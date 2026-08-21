export type Role = 'admin' | 'user';

export type UserSession = {
  id: string;
  username: string;
  role: Role;
};

const SESSION_KEY = 'guardian_vision_session';

export function login(username: string, password: string): UserSession | null {
  // Mock login logic for this mini-project
  // Admin credentials: admin / admin
  // User credentials: user1 / user1 (or any other user / user combination)
  
  if (username === 'admin' && password === 'admin') {
    const session: UserSession = { id: 'admin-1', username, role: 'admin' };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
  }
  
  if (username && password === username) {
    // Simple mock: password must match username for normal users
    const session: UserSession = { id: `user-${username}`, username, role: 'user' };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
  }

  return null;
}

export function logout() {
  localStorage.removeItem(SESSION_KEY);
}

export function getSession(): UserSession | null {
  try {
    const data = localStorage.getItem(SESSION_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}
