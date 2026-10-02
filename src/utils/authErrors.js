export function friendlyError(err) {
  const map = {
    'auth/email-already-in-use': 'This email already has an account. Try logging in.',
    'auth/invalid-email': 'That email does not look right.',
    'auth/weak-password': 'Password is too weak. Use at least 8 characters.',
    'auth/invalid-credential': 'Wrong email or password.',
    'auth/user-not-found': 'No account found with this email.',
    'auth/wrong-password': 'Wrong email or password.',
    'auth/too-many-requests': 'Too many tries. Please wait a bit and try again.',
    'auth/popup-closed-by-user': 'Google sign-in was closed. Try again.',
    'auth/network-request-failed': 'Network problem. Check your internet.',
  }
  return map[err?.code] || 'Something went wrong. Please try again.'
}