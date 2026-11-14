// src/api/auth.api.js
import { client } from "./client";

export const authApi = {
  login: (payload) => client.auth.login(payload),
  logout: () => client.auth.logout(),
  me: () => client.auth.me(),
  register: (payload) => client.auth.register(payload),
};