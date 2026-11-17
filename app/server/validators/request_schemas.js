import { z } from 'zod';
import { missions } from '../../content/catalog.js';
import { ALLOWED_MODELS } from '../services/ollama_service.js';

export const emailSchema = z.string().trim().toLowerCase().max(254).pipe(z.email());

const levelSchema = z.number().int().min(1).max(3);

export const authLoginSchema = z.object({ email: emailSchema }).strict();

export const authOtpVerifySchema = z
  .object({
    email: emailSchema,
    code: z.string().trim().regex(/^\d{6}$/)
  })
  .strict();

export const challengeAskSchema = z
  .object({
    level: levelSchema,
    message: z.string().trim().min(1).max(600),
    model: z.enum(ALLOWED_MODELS).optional()
  })
  .strict();

export const challengeFlagSchema = z
  .object({
    level: levelSchema,
    flag: z.string().trim().min(1).max(100)
  })
  .strict();

export const missionAttemptSchema = z
  .object({
    missionId: z.enum(missions.map((mission) => mission.id)),
    payload: z.string().min(1).max(4000),
    mode: z.literal('live').default('live'),
    defended: z.boolean(),
    action: z.literal('run').default('run'),
    prediction: z.string().max(800).default(''),
    explanation: z.string().max(1200).default('')
  })
  .strict();
