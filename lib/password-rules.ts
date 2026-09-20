/** Shared by the staff and member change-password actions. Returns an error message or null. */
export function checkNewPassword(password: string, confirm: string, extra: string[] = []): string | null {
  if (password.length < 8) return "Use at least 8 characters.";
  if (password !== confirm) return "The two passwords don't match.";
  if (extra.some((x) => x && password.toLowerCase() === x.toLowerCase())) {
    return "Your password can't be the same as your username or email.";
  }
  return null;
}
