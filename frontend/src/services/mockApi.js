/**
 * mockApi.js — Re-exports the unified mockChatService
 *
 * Maintains backwards compatibility with earlier components while delegating
 * to the structured mock service pipeline.
 */
export { askQuestion } from "./mockChatService";
