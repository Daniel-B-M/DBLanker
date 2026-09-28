// Builds a readable label such as "America/Bogota (UTC-5)".
export function formatTimezoneLabel(timezone: string): string {
    const offset = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        timeZoneName: 'shortOffset',
    })
        .formatToParts(new Date())
        .find((part) => part.type === 'timeZoneName')?.value

    return offset ? `${timezone} (${offset.replace('GMT', 'UTC')})` : timezone
}
