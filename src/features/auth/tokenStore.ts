/**
 * In-memory access token store.
 * NEVER persisted to localStorage/sessionStorage — lives only in module scope.
 */

let _accessToken: string | null = null;

export function getAccessToken(): string | null {
  return _accessToken;
}

export function setAccessToken(token: string | null): void {
  _accessToken = token;
}
