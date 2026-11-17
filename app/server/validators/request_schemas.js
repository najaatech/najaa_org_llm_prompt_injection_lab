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

export const challengeStartSchema = z.object({ level: levelSchema }).strict();

export const conversationResetSchema = z
  .object({ level: levelSchema, model: z.enum(ALLOWED_MODELS).optional() })
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

const quizIdSchema = z.enum(['sorting', 'rag-quiz', 'rag-game']);

export const quizSubmitSchema = z
  .object({
    quizId: quizIdSchema,
    answers: z.record(z.string().max(20), z.union([z.string().max(20), z.number().int().min(0).max(10)]))
  })
  .strict();

export const quizStartSchema = z.object({ quizId: quizIdSchema }).strict();

/** 3 to 20 letters, digits, underscore, dot or dash. Shown to other learners, so no spaces or markup. */
export const nicknameSchema = z
  .object({ nickname: z.string().trim().min(3).max(20).regex(/^[A-Za-z0-9_.-]+$/) })
  .strict();
