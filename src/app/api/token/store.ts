
let accessToken: string | null = null;

export function getAccessToken() {
  return accessToken || process.env.THREADS_ACCESS_TOKEN;
}

export function setAccessToken(token: string) {
  if (token === "") {
    accessToken = null;
  } else {
    accessToken = token;
  }
}
