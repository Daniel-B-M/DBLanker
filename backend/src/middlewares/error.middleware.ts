import type {
    Request,
    Response,
    NextFunction,
} from "express";

export function errorHandler(
    error: unknown,
    _req: Request,
    res: Response,
    next: NextFunction,
) {
    if (res.headersSent) {
        return next(error);
    }

    if (typeof error === "object" && error !== null && "type" in error) {
        if (error.type === "entity.parse.failed") {
            return res.status(400).json({
                error: {
                    code: "INVALID_JSON",
                    message: "Request body must contain valid JSON",
                },
            });
        }

        if (error.type === "entity.too.large") {
            return res.status(413).json({
                error: {
                    code: "PAYLOAD_TOO_LARGE",
                    message: "Request body is too large",
                },
            });
        }
    }

    console.error(error);

    return res.status(500).json({
        error: {
            code: "INTERNAL_SERVER_ERROR",
            message: "An internal server error occurred",
        },
    });
}