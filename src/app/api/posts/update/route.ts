import { NextResponse } from "next/server";
import { getWordPressToken } from "@/lib/wordpress";
import { supabase } from "@/lib/supabaseClient";

// Validation schemas for different CPT types
const FIELD_VALIDATION_SCHEMAS = {
    cagar_budaya: {
        required: ["title"],
        optional: ["lokasi", "nilai_sejarah", "usia_bangunan", "kondisi_bangunan"],
        maxLengths: {
            title: 200,
            lokasi: 500,
            nilai_sejarah: 2000,
            usia_bangunan: 100,
            kondisi_bangunan: 1000,
        },
    },
    kesenian: {
        required: ["title"],
        optional: ["daerah_asal", "jenis_kesenian", "deskripsi"],
        maxLengths: {
            title: 200,
            daerah_asal: 100,
            jenis_kesenian: 100,
            deskripsi: 2000,
        },
    },
    tokoh: {
        required: ["title"],
        optional: ["tempat_lahir", "tanggal_lahir", "profesi", "kontribusi"],
        maxLengths: {
            title: 200,
            tempat_lahir: 100,
            tanggal_lahir: 50,
            profesi: 100,
            kontribusi: 2000,
        },
    },
};

// Enhanced validation function
function validateFormData(cptSlug: string, formData: any): { isValid: boolean; errors: string[] } {
    const schema = FIELD_VALIDATION_SCHEMAS[cptSlug as keyof typeof FIELD_VALIDATION_SCHEMAS];
    const errors: string[] = [];

    if (!schema) {
        errors.push(`Tipe konten '${cptSlug}' tidak dikenali.`);
        return { isValid: false, errors };
    }

    // Check required fields
    for (const field of schema.required) {
        if (!formData[field] || (typeof formData[field] === "string" && formData[field].trim() === "")) {
            errors.push(`Field '${field}' wajib diisi.`);
        }
    }

    // Check max lengths
    for (const [field, maxLength] of Object.entries(schema.maxLengths)) {
        if (formData[field] && typeof formData[field] === "string" && formData[field].length > maxLength) {
            errors.push(`Field '${field}' tidak boleh lebih dari ${maxLength} karakter.`);
        }
    }

    return { isValid: errors.length === 0, errors };
}

// Enhanced sanitization function
function sanitizeFormData(formData: any): any {
    const sanitized: any = {};

    for (const [key, value] of Object.entries(formData)) {
        if (value !== null && value !== undefined) {
            if (typeof value === "string") {
                // Basic HTML sanitization and trim
                sanitized[key] = value
                    .trim()
                    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
                    .replace(/<[^>]*>/g, "");
            } else {
                sanitized[key] = value;
            }
        }
    }

    return sanitized;
}

// Rate limiting helper (basic implementation)
const rateLimitMap = new Map();
function checkRateLimit(userId: string): boolean {
    const now = Date.now();
    const userRequests = rateLimitMap.get(userId) || [];

    // Remove requests older than 1 minute
    const recentRequests = userRequests.filter((time: number) => now - time < 60000);

    // Allow max 10 requests per minute
    if (recentRequests.length >= 10) {
        return false;
    }

    recentRequests.push(now);
    rateLimitMap.set(userId, recentRequests);
    return true;
}

export async function POST(request: Request) {
    const startTime = Date.now();
    let logContext = {
        userId: null as string | null,
        postId: null as string | null,
        cptSlug: null as string | null,
        action: "update_post",
        timestamp: new Date().toISOString(),
        duration: 0,
        status: "error" as "success" | "error",
        error: null as string | null,
    };

    try {
        // 1. Authentication validation
        const token = request.headers.get("Authorization")?.replace("Bearer ", "");
        if (!token) {
            logContext.error = "Missing authorization token";
            console.error("[UPDATE_POST_ERROR]", logContext);
            return NextResponse.json(
                {
                    message: "Otentikasi pengguna gagal.",
                    code: "AUTH_MISSING_TOKEN",
                    timestamp: logContext.timestamp,
                },
                { status: 401 }
            );
        }

        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser(token);
        if (authError || !user) {
            logContext.error = `Authentication failed: ${authError?.message || "Invalid user"}`;
            console.error("[UPDATE_POST_ERROR]", logContext);
            return NextResponse.json(
                {
                    message: "Pengguna tidak valid.",
                    code: "AUTH_INVALID_USER",
                    timestamp: logContext.timestamp,
                },
                { status: 401 }
            );
        }

        logContext.userId = user.id;

        // 2. Rate limiting
        if (!checkRateLimit(user.id)) {
            logContext.error = "Rate limit exceeded";
            console.error("[UPDATE_POST_ERROR]", logContext);
            return NextResponse.json(
                {
                    message: "Terlalu banyak permintaan. Silakan coba lagi dalam 1 menit.",
                    code: "RATE_LIMIT_EXCEEDED",
                    timestamp: logContext.timestamp,
                },
                { status: 429 }
            );
        }

        // 3. Parse and validate request body
        let body;
        try {
            body = await request.json();
        } catch (parseError) {
            logContext.error = "Invalid JSON in request body";
            console.error("[UPDATE_POST_ERROR]", logContext);
            return NextResponse.json(
                {
                    message: "Format data tidak valid.",
                    code: "INVALID_JSON",
                    timestamp: logContext.timestamp,
                },
                { status: 400 }
            );
        }

        const { title, userId, cptSlug, postId, ...acfData } = body;
        logContext.postId = postId;
        logContext.cptSlug = cptSlug;

        // 4. Validate required parameters
        if (!postId || !cptSlug || !title) {
            logContext.error = "Missing required parameters";
            console.error("[UPDATE_POST_ERROR]", logContext);
            return NextResponse.json(
                {
                    message: "Data tidak lengkap. Pastikan semua field wajib telah diisi.",
                    code: "MISSING_REQUIRED_FIELDS",
                    timestamp: logContext.timestamp,
                },
                { status: 400 }
            );
        }

        // 5. Verify ownership
        if (userId !== user.id) {
            logContext.error = "User not authorized to update this post";
            console.error("[UPDATE_POST_ERROR]", logContext);
            return NextResponse.json(
                {
                    message: "Anda tidak berhak mengubah postingan ini.",
                    code: "UNAUTHORIZED_UPDATE",
                    timestamp: logContext.timestamp,
                },
                { status: 403 }
            );
        }

        // 6. Sanitize form data
        const sanitizedData = sanitizeFormData({ title, ...acfData });

        // 7. Validate form data
        const validation = validateFormData(cptSlug, sanitizedData);
        if (!validation.isValid) {
            logContext.error = `Validation failed: ${validation.errors.join(", ")}`;
            console.error("[UPDATE_POST_ERROR]", logContext);
            return NextResponse.json(
                {
                    message: "Data tidak valid.",
                    errors: validation.errors,
                    code: "VALIDATION_FAILED",
                    timestamp: logContext.timestamp,
                },
                { status: 400 }
            );
        }

        // 8. Build ACF fields with proper snake_case conversion
        const acfFields: { [key: string]: any } = {};
        for (const [key, value] of Object.entries(sanitizedData)) {
            if (key !== "title" && value !== null && value !== undefined) {
                const snakeCaseKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
                acfFields[snakeCaseKey] = value;
            }
        }

        // Ensure user ID is preserved
        acfFields.supabase_user_id = user.id;

        // 9. Get WordPress token
        const wpToken = await getWordPressToken();
        if (!wpToken) {
            logContext.error = "Failed to get WordPress token";
            console.error("[UPDATE_POST_ERROR]", logContext);
            throw new Error("Otentikasi server gagal.");
        }

        // 10. Verify post exists and user owns it before updating
        const verifyResponse = await fetch(`${process.env.WORDPRESS_API_URL}/wp/v2/${cptSlug}/${postId}?context=edit`, {
            headers: { Authorization: `Bearer ${wpToken}` },
        });

        if (!verifyResponse.ok) {
            logContext.error = `Post verification failed: ${verifyResponse.status}`;
            console.error("[UPDATE_POST_ERROR]", logContext);
            return NextResponse.json(
                {
                    message: "Postingan tidak ditemukan atau telah dihapus.",
                    code: "POST_NOT_FOUND",
                    timestamp: logContext.timestamp,
                },
                { status: 404 }
            );
        }

        const existingPost = await verifyResponse.json();
        if (existingPost.acf?.supabase_user_id !== user.id) {
            logContext.error = "User does not own this post";
            console.error("[UPDATE_POST_ERROR]", logContext);
            return NextResponse.json(
                {
                    message: "Anda tidak berhak mengubah postingan ini.",
                    code: "UNAUTHORIZED_UPDATE",
                    timestamp: logContext.timestamp,
                },
                { status: 403 }
            );
        }

        // 11. Update the post in WordPress
        const updateResponse = await fetch(`${process.env.WORDPRESS_API_URL}/wp/v2/${cptSlug}/${postId}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${wpToken}`,
            },
            body: JSON.stringify({
                title: sanitizedData.title,
                fields: acfFields,
            }),
        });

        const responseData = await updateResponse.json();

        if (!updateResponse.ok) {
            logContext.error = `WordPress update failed: ${responseData.message || updateResponse.status}`;
            console.error("[UPDATE_POST_ERROR]", logContext);
            throw new Error(responseData.message || "Gagal memperbarui data di WordPress.");
        }

        // 12. Success response
        logContext.status = "success";
        logContext.duration = Date.now() - startTime;
        console.log("[UPDATE_POST_SUCCESS]", logContext);

        return NextResponse.json(
            {
                message: "Data berhasil diperbarui!",
                data: {
                    id: responseData.id,
                    title: responseData.title,
                    slug: responseData.slug,
                    modified: responseData.modified,
                },
                code: "UPDATE_SUCCESS",
                timestamp: logContext.timestamp,
            },
            { status: 200 }
        );
    } catch (error: any) {
        logContext.error = error.message;
        logContext.duration = Date.now() - startTime;
        console.error("[UPDATE_POST_ERROR]", logContext);

        return NextResponse.json(
            {
                message: error.message || "Terjadi kesalahan internal server.",
                code: "INTERNAL_ERROR",
                timestamp: logContext.timestamp,
            },
            { status: 500 }
        );
    }
}
