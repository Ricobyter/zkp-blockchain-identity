// environment.js
const fallbackBackendUrl = 'http://10.55.201.52:3001';
const fallbackAdminBackendUrl = 'http://10.55.201.52:5000';

export const BACKEND_URL =
	process.env.EXPO_PUBLIC_BACKEND_URL || fallbackBackendUrl;

export const ADMIN_BACKEND_URL =
	process.env.EXPO_PUBLIC_ADMIN_BACKEND_URL || fallbackAdminBackendUrl;