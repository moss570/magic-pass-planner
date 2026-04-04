const AUTH_REDIRECT_STORAGE_KEY = "magic-pass:post-auth-redirect";
const DEFAULT_POST_AUTH_REDIRECT = "/dashboard";
const RETURN_TO_PARAM = "returnTo";

const isSafeInternalPath = (value: string | null): value is string =>
  Boolean(value && value.startsWith("/") && !value.startsWith("//"));

export const buildPostAuthRedirect = (search: string) => {
  const params = new URLSearchParams(search);
  const requestedReturnTo = params.get(RETURN_TO_PARAM);
  const returnTo = isSafeInternalPath(requestedReturnTo)
    ? requestedReturnTo
    : DEFAULT_POST_AUTH_REDIRECT;

  params.delete(RETURN_TO_PARAM);

  const nextSearch = params.toString();
  if (!nextSearch) return returnTo;

  const separator = returnTo.includes("?") ? "&" : "?";
  return `${returnTo}${separator}${nextSearch}`;
};

export const preparePostAuthRedirect = (search: string) => {
  const redirectTo = buildPostAuthRedirect(search);

  if (typeof window !== "undefined" && isSafeInternalPath(redirectTo)) {
    window.sessionStorage.setItem(AUTH_REDIRECT_STORAGE_KEY, redirectTo);
  }

  return redirectTo;
};

export const clearStoredPostAuthRedirect = () => {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(AUTH_REDIRECT_STORAGE_KEY);
};

const consumeStoredPostAuthRedirect = () => {
  if (typeof window === "undefined") return null;

  const storedPath = window.sessionStorage.getItem(AUTH_REDIRECT_STORAGE_KEY);
  clearStoredPostAuthRedirect();

  return isSafeInternalPath(storedPath) ? storedPath : null;
};

export const resolvePostAuthRedirect = (search: string) => {
  const params = new URLSearchParams(search);

  if (params.has(RETURN_TO_PARAM)) {
    const redirectTo = buildPostAuthRedirect(search);
    clearStoredPostAuthRedirect();
    return redirectTo;
  }

  return consumeStoredPostAuthRedirect();
};
