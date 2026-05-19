// Centralized API configuration to easily switch between local development and production servers
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
