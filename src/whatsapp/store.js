export const messageStore = new Map();

/**
 * Caches messages in-memory so Baileys can:
 * 1. Decrypt poll votes (getAggregateVotesInPollMessage)
 * 2. Handle message retries and receipt verification
 */
export function saveMessage(id, message) {
  if (!id || !message) return;
  messageStore.set(id, message);
  // Keep cache bounded
  if (messageStore.size > 2000) {
    const oldestKey = messageStore.keys().next().value;
    messageStore.delete(oldestKey);
  }
}

export function getStoredMessage(id) {
  return messageStore.get(id) || null;
}

