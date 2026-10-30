import { createStorageService } from './storageService.js';
import { createProfileService } from './profileService.js';
import { createConversationService } from './conversationService.js';
import { createMessageService } from './messageService.js';

export function createServices({ supabase, env }) {
  const storage = createStorageService({ supabase, env });
  const profiles = createProfileService({ supabase, storage });
  const conversations = createConversationService({ supabase, storage, profiles });
  const messages = createMessageService({ supabase, storage });
  return { storage, profiles, conversations, messages };
}
