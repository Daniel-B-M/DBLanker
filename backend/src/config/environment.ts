const timezone =
    process.env.BUSINESS_TIMEZONE ?? "America/Bogota";

try {
    new Intl.DateTimeFormat("en-US", {
        timeZone: timezone,
    });
} catch {
    throw new Error("BUSINESS_TIMEZONE must be a valid time zone");
}

export const BUSINESS_TIMEZONE = timezone;