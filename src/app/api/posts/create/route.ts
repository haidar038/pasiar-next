import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";
import { RateLimiter, ApiResponseBuilder, RequestValidator, PerformanceMonitor, WordPressApiOptimizer } from "@/lib/api-utils";

// Validation schemas
const VALIDATION_SCHEMAS = {
    cagar_budaya: {
        required: ["title"],
        optional: ["lokasi", "nilai_sejarah", "usia_bangunan", "kondisi_bangunan"],
        maxLengths: { title: 200, lokasi: 500, nilai_sejarah: 2000 },
    },
    kesenian: {
        required: ["title"],
        optional: ["daerah_asal", "jenis_kesenian", "deskripsi"],
        maxLengths: { title: 200, daerah_asal: 100, deskripsi: 2000 },
    },
    tokoh: {
        required: ["title"],
        optional: ["tempat_lahir", "tanggal_lahir", "profesi", "kontribusi"],
        maxLengths: { title: 200, tempat_lahir: 100, kontribusi: 2000 },
    },
};

function validatePostData(cptSlug: string, data: any): { isValid: boolean; errors: string[] } {
    const schema = VALIDATION_SCHEMAS[cptSlug as keyof typeof VALIDATION_SCHEMAS];
    const errors: string[] = [];

    if (!schema) {
        errors.push(`Unsupported content type: ${cptSlug}`);
        return { isValid: false, errors };
    }

    // Check required fields
    const requiredValidation = RequestValidator.validateRequiredFields(data, schema.required);
    if (!requiredValidation.isValid && requiredValidation.missingFields) {
        errors.push(...requiredValidation.missingFields.map((field) => `Field '${field}' is required`));
    }

    // Check field lengths
    for (const [field, maxLength] of Object.entries(schema.maxLengths)) {
        if (data[field] && typeof data[field] === "string" && data[field].length > maxLength) {
            errors.push(`Field '${field}' must not exceed ${maxLength} characters`);
        }
    }

    return { isValid: errors.length === 0, errors };
}

function sanitizePostData(data: any): any {
    const sanitized: any = {};

    for (const [key, value] of Object.entries(data)) {
        if (value !== null && value !== undefined) {
            if (typeof value === "string") {
                sanitized[key] = RequestValidator.sanitizeString(value);
            } else {
                sanitized[key] = value;
            }
        }
    }

    return sanitized;
}

export async function POST(request: Request) {
    const monitor = new PerformanceMonitor("create_post", {
        method: "POST",
        endpoint: "/api/posts/create",
    });

    try {
        // 1. Authentication
        const token = request.headers.get("Authorization")?.replace("Bearer ", "");
        if (!token) {
            monitor.error("Missing authorization token");
            return ApiResponseBuilder.unauthorizedError("Authentication token required");
        }

        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser(token);
        if (authError || !user) {
            monitor.error(`Authentication failed: ${authError?.message || "Invalid user"}`);
            return ApiResponseBuilder.unauthorizedError("Invalid authentication token");
        }

        monitor.updateContext({ userId: user.id });

        // 2. Rate limiting
        if (!RateLimiter.check(user.id, "create")) {
            monitor.error("Rate limit exceeded");
            return ApiResponseBuilder.rateLimitError();
        }

        // 3. Parse request body
        let body;
        try {
            body = await request.json();
        } catch (parseError) {
            monitor.error("Invalid JSON in request body");
            return ApiResponseBuilder.error("Invalid JSON format", 400, "INVALID_JSON");
        }

        const { title, userId, cptSlug, ...acfData } = body;
        monitor.updateContext({ cptSlug });

        // 4. Validate request
        if (!RequestValidator.validateSlug(cptSlug)) {
            monitor.error("Invalid CPT slug format");
            return ApiResponseBuilder.error("Invalid content type format", 400, "INVALID_CPT_SLUG");
        }

        if (userId !== user.id) {
            monitor.error("User ID mismatch");
            return ApiResponseBuilder.forbiddenError("User ID mismatch");
        }

        // 5. Sanitize and validate post data
        const sanitizedData = sanitizePostData({ title, ...acfData });
        const validation = validatePostData(cptSlug, sanitizedData);

        if (!validation.isValid) {
            monitor.error(`Validation failed: ${validation.errors.join(", ")}`);
            return ApiResponseBuilder.validationError(validation.errors);
        }

        // 6. Build ACF fields
        const acfFields: { [key: string]: any } = {};
        for (const [key, value] of Object.entries(sanitizedData)) {
            if (key !== "title" && value !== null && value !== undefined) {
                const snakeCaseKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
                acfFields[snakeCaseKey] = value;
            }
        }
        acfFields.supabase_user_id = user.id;

        // 7. Get WordPress token with caching
        const wpToken = await WordPressApiOptimizer.getOptimizedToken();
        if (!wpToken) {
            monitor.error("Failed to get WordPress token");
            throw new Error("Server authentication failed");
        }

        // 8. Create post in WordPress
        const response = await fetch(`${process.env.WORDPRESS_API_URL}/wp/v2/${cptSlug}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${wpToken}`,
            },
            body: JSON.stringify({
                title: sanitizedData.title,
                status: "pending",
                fields: acfFields,
            }),
        });

        const responseData = await response.json();

        if (!response.ok) {
            monitor.error(`WordPress API error: ${responseData.message || response.status}`);
            throw new Error(responseData.message || "Failed to create post in WordPress");
        }

        // 9. Success response
        monitor.updateContext({ postId: responseData.id?.toString() });
        monitor.success();

        return ApiResponseBuilder.success(
            {
                id: responseData.id,
                title: responseData.title,
                slug: responseData.slug,
                status: responseData.status,
                created: responseData.date,
            },
            "Post created successfully",
            "CREATE_SUCCESS"
        );
    } catch (error: any) {
        monitor.error(error.message);
        return ApiResponseBuilder.error(error.message || "Internal server error", 500, "INTERNAL_ERROR");
    }
}
