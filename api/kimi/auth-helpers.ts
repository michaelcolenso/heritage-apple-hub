export function decodeOAuthState(state: string): string | null {
  try {
    return atob(state);
  } catch {
    return null;
  }
}
