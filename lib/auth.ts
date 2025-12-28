export async function checkAuth(): Promise<boolean> {
  try {
    const response = await fetch('/api/auth/check', {
      credentials: 'include',
    })
    const data = await response.json()
    return data.authenticated === true
  } catch {
    return false
  }
}

export async function login(email: string, password: string) {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  })
  return response.json()
}

export async function logout() {
  const response = await fetch('/api/auth/logout', {
    method: 'POST',
    credentials: 'include',
  })
  return response.json()
}

