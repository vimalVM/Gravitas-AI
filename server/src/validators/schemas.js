import { z } from 'zod';

export const MAX_MESSAGE_LENGTH = 4000;

// Strip ASCII control characters (except tab/newline) and normalise newlines.
// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
export const sanitizeText = (value) => value.replace(/\r\n?/g, '\n').replace(CONTROL_CHARS, '');

const uuid = z.string().uuid('Invalid identifier.');
const isoTimestamp = z.string().datetime({ offset: true, message: 'Invalid pagination cursor.' });

export const conversationParams = z.object({ conversationId: uuid });
export const messageParams = z.object({ messageId: uuid });

export const listConversationsQuery = z.object({
  search: z.string().trim().max(80).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(100),
});

export const listMessagesQuery = z
  .object({
    before: isoTimestamp.optional(),
    after: isoTimestamp.optional(),
    limit: z.coerce.number().int().min(1).max(100).default(30),
  })
  .refine((q) => !(q.before && q.after), { message: 'Use either "before" or "after", not both.' });

/** conversations/<conversationId>/<senderId>/<clientId>.<ext> */
export const ATTACHMENT_PATH_PATTERN =
  /^conversations\/[0-9a-f-]{36}\/[0-9a-f-]{36}\/[0-9a-f-]{36}\.(jpg|png|webp)$/;

export const createMessageBody = z
  .object({
    clientId: uuid,
    content: z
      .string()
      .max(MAX_MESSAGE_LENGTH * 2, `Messages can be at most ${MAX_MESSAGE_LENGTH} characters.`)
      .nullish()
      .transform((value) => {
        if (value == null) return null;
        const text = sanitizeText(value).trim();
        return text.length ? text : null;
      })
      .refine((value) => value === null || value.length <= MAX_MESSAGE_LENGTH, {
        message: `Messages can be at most ${MAX_MESSAGE_LENGTH} characters.`,
      }),
    attachmentPath: z
      .string()
      .regex(ATTACHMENT_PATH_PATTERN, 'Invalid attachment reference.')
      .nullish()
      .transform((value) => value ?? null),
  })
  .strict()
  .refine((body) => body.content !== null || body.attachmentPath !== null, {
    message: 'A message needs text, an image, or both.',
    path: ['content'],
  });

export const uploadImageBody = z.object({
  conversationId: uuid,
  clientId: uuid,
});

export const updateProfileBody = z
  .object({
    displayName: z
      .string()
      .transform((value) => sanitizeText(value).trim().replace(/\s+/g, ' '))
      .pipe(
        z
          .string()
          .min(2, 'Your name must be at least 2 characters.')
          .max(80, 'Your name must be 80 characters or fewer.'),
      ),
  })
  .strict();
