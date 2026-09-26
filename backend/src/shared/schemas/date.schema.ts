import { z } from "zod";

export const dateSchema = z.iso.date({
    error: "Date must be a valid calendar date in YYYY-MM-DD format",
});