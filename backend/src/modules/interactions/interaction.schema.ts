import { z } from "zod";
import { dateSchema } from "../../shared/schemas/date.schema.js";
const MAX_DATABASE_ID = 2147483647;

export const createInteractionSchema = z
    .object({
        agentId: z.number().int().positive().max(MAX_DATABASE_ID),
        type: z.enum(["CALL", "TICKET"]),
    })
    .strict();

export type CreateInteractionInput = z.infer<
    typeof createInteractionSchema
>;

export const listInteractionsSchema = z
    .object({
        agentId: z.coerce.number().int().positive().max(MAX_DATABASE_ID).optional(),

        type: z
            .enum(["CALL", "TICKET"])
            .optional(),

        status: z
            .enum(["OPEN", "IN_PROGRESS", "RESOLVED"])
            .optional(),

        from: dateSchema.optional(),

        to: dateSchema.optional(),

        page: z.coerce
            .number()
            .int()
            .positive()
            .default(1),

        limit: z.coerce
            .number()
            .int()
            .positive()
            .max(100)
            .default(20),
    })
    .strict()
    .refine(
        (data) => {
            return (
                (data.from === undefined && data.to === undefined) ||
                (data.from !== undefined && data.to !== undefined)
            );
        },
        {
            message: "from and to must be provided together",
            path: ["from"],
        }
    )
    .refine(
        (data) =>
            data.from === undefined ||
            data.to === undefined ||
            data.from <= data.to,
        {
            message: "from cannot be later than to",
            path: ["from"],
        }
    );

export type ListInteractionsInput = z.infer<
    typeof listInteractionsSchema
>;

export const interactionIdSchema = z.object({
    id: z.coerce.number().int().positive().max(MAX_DATABASE_ID),
});

export const updateInteractionStatusSchema = z
    .object({
        status: z.enum(["IN_PROGRESS", "RESOLVED"]),
    })
    .strict();

export type UpdateInteractionStatusInput = z.infer<
    typeof updateInteractionStatusSchema
>;