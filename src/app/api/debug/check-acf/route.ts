// File: src/app/api/debug/check-acf/route.ts
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    try {
        const wpApiUser = process.env.WORDPRESS_API_USER;
        const wpApiPass = process.env.WORDPRESS_API_PASS;
        const wpApiUrl = process.env.WORDPRESS_API_URL;

        if (!wpApiUser || !wpApiPass || !wpApiUrl) {
            return NextResponse.json({ error: 'WordPress credentials missing' }, { status: 500 });
        }

        // Get JWT token
        const tokenResponse = await fetch(`${wpApiUrl}/jwt-auth/v1/token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: wpApiUser, password: wpApiPass }),
        });

        if (!tokenResponse.ok) {
            return NextResponse.json({ error: 'Failed to get token' }, { status: 500 });
        }

        const tokenData = await tokenResponse.json();
        const token = tokenData.token;

        // 1. Check post type
        const postTypeResponse = await fetch(`${wpApiUrl}/wp/v2/types/cagar_budaya`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        const postTypeInfo = postTypeResponse.ok ? await postTypeResponse.json() : null;

        // 2. Check ACF field groups with multiple endpoints
        const acfEndpoints = ['/wp-json/acf/v3/field-groups', '/wp/v2/acf/v3/field-groups', '/acf/v3/field-groups'];

        const fieldGroupTests = await Promise.all(
            acfEndpoints.map(async (endpoint) => {
                try {
                    const response = await fetch(`${wpApiUrl}${endpoint}`, {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    return {
                        endpoint,
                        status: response.status,
                        ok: response.ok,
                        data: response.ok ? await response.json() : await response.text(),
                    };
                } catch (error) {
                    return { endpoint, status: 'error', ok: false, error: String(error) };
                }
            })
        );

        // 3. Get a sample post with full details
        const samplePostResponse = await fetch(`${wpApiUrl}/wp/v2/cagar_budaya?per_page=1&context=edit`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        let samplePost = null;
        if (samplePostResponse.ok) {
            const posts = await samplePostResponse.json();
            samplePost = posts[0] || null;
        }

        // 4. Test creating a minimal post to check ACF behavior
        const testPostResponse = await fetch(`${wpApiUrl}/wp/v2/cagar_budaya`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                title: 'ACF Test Post - ' + new Date().toISOString(),
                status: 'draft',
                acf: {
                    lokasi: 'Test Location',
                    nilai_sejarah: 'Test Historical Value',
                },
            }),
        });

        let testPostResult = null;
        if (testPostResponse.ok) {
            testPostResult = await testPostResponse.json();

            // Try to delete the test post to clean up
            try {
                await fetch(`${wpApiUrl}/wp/v2/cagar_budaya/${testPostResult.id}?force=true`, {
                    method: 'DELETE',
                    headers: { Authorization: `Bearer ${token}` },
                });
            } catch (deleteError) {
                console.log('Could not delete test post:', deleteError);
            }
        }

        // 5. Check WordPress plugins and theme
        const pluginsResponse = await fetch(`${wpApiUrl}/wp/v2/plugins`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        let pluginsInfo = null;
        if (pluginsResponse.ok) {
            pluginsInfo = await pluginsResponse.json();
        }

        // 6. Check current user capabilities
        const userResponse = await fetch(`${wpApiUrl}/wp/v2/users/me`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        let currentUser = null;
        if (userResponse.ok) {
            currentUser = await userResponse.json();
        }

        return NextResponse.json({
            wordpressUrl: wpApiUrl,
            timestamp: new Date().toISOString(),

            postType: {
                accessible: postTypeResponse.ok,
                status: postTypeResponse.status,
                restEnabled: postTypeInfo?.rest_base || 'Not found',
                supports: postTypeInfo?.supports || [],
            },

            acfFieldGroups: {
                tests: fieldGroupTests,
                workingEndpoint: fieldGroupTests.find((test) => test.ok)?.endpoint || 'None working',
            },

            samplePost: {
                found: !!samplePost,
                id: samplePost?.id,
                acfFieldsPresent: samplePost?.acf ? Object.keys(samplePost.acf) : [],
                acfFieldsWithValues: samplePost?.acf
                    ? Object.entries(samplePost.acf)
                          .filter(([key, value]) => value !== null && value !== '')
                          .map(([key]) => key)
                    : [],
                fullAcfData: samplePost?.acf || null,
            },

            testPost: {
                creationSuccessful: testPostResponse.ok,
                status: testPostResponse.status,
                acfFieldsInResponse: testPostResult?.acf ? Object.keys(testPostResult.acf) : [],
                acfFieldsWithValues: testPostResult?.acf
                    ? Object.entries(testPostResult.acf)
                          .filter(([key, value]) => value !== null && value !== '')
                          .map(([key]) => key)
                    : [],
                error: !testPostResponse.ok ? await testPostResponse.text() : null,
            },

            currentUser: {
                id: currentUser?.id,
                name: currentUser?.name,
                capabilities: currentUser?.capabilities || 'Not accessible',
                roles: currentUser?.roles || [],
            },

            plugins: {
                accessible: pluginsResponse.ok,
                acfPlugins: pluginsInfo ? pluginsInfo.filter((plugin: any) => plugin.name.toLowerCase().includes('advanced custom fields') || plugin.name.toLowerCase().includes('acf')) : [],
                totalPlugins: pluginsInfo ? pluginsInfo.length : 0,
            },

            diagnostics: {
                likelyIssues: [],
                recommendations: [
                    'Check that ACF field group has "Show in REST API" enabled',
                    'Verify field names match exactly (case-sensitive)',
                    'Ensure WordPress user has proper permissions',
                    'Check if ACF Pro is installed and activated',
                    'Verify field group is assigned to cagar_budaya post type',
                    'Try updating WordPress, ACF, and JWT Auth plugin',
                ],
            },
        });
    } catch (error: any) {
        return NextResponse.json(
            {
                error: error.message,
                stack: error.stack,
                timestamp: new Date().toISOString(),
            },
            { status: 500 }
        );
    }
}
