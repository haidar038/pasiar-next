// File: src/app/api/submit-cagar-budaya/route.ts
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { title, userId, ...acfData } = body;

        console.log('Received data:', { title, userId, acfData });

        // Define explicit field mapping to ensure correct WordPress field names
        const fieldMapping: { [key: string]: string } = {
            lokasi: 'lokasi',
            nilaiSejarah: 'nilai_sejarah',
            nilaiBudaya: 'nilai_budaya',
            sumberInformasi: 'sumber_informasi',
            jenisBangunan: 'jenis_bangunan',
            usiaBangunan: 'usia_bangunan',
            kondisiBangunan: 'kondisi_bangunan',
            nilaiArsitektur: 'nilai_arsitektur',
            jenisSitus: 'jenis_situs',
            luasSitus: 'luas_situs',
            kondisiSitus: 'kondisi_situs',
            jenisKawasan: 'jenis_kawasan',
            luasKawasan: 'luas_kawasan',
            kondisiKawasan: 'kondisi_kawasan',
            jenisBenda: 'jenis_benda',
            deskripsiBenda: 'deskripsi_benda',
            tahunPenemuan: 'tahun_penemuan',
            kondisiBenda: 'kondisi_benda',
            jenisStruktur: 'jenis_struktur',
            deskripsiStruktur: 'deskripsi_struktur',
            tahunDibangun: 'tahun_dibangun',
            kondisiStruktur: 'kondisi_struktur',
        };

        // Build ACF fields object with proper field names
        const acfFields: { [key: string]: any } = {};
        const metaFields: { [key: string]: any } = {};

        // Add supabase_user_id first
        acfFields['supabase_user_id'] = userId;
        metaFields['supabase_user_id'] = userId;

        // Process other fields
        for (const key in acfData) {
            const value = acfData[key];

            // Only include non-empty values
            if (value !== null && value !== undefined && value !== '') {
                // Use explicit mapping if exists, otherwise convert to snake_case
                const wpFieldName = fieldMapping[key] || key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
                acfFields[wpFieldName] = value;
                metaFields[wpFieldName] = value;
            }
        }

        console.log('ACF Fields to send:', acfFields);

        // WordPress Authentication
        const user = process.env.WORDPRESS_API_USER;
        const pass = process.env.WORDPRESS_API_PASS;
        const wpApiUrl = process.env.WORDPRESS_API_URL;

        if (!user || !pass || !wpApiUrl) {
            throw new Error('WordPress credentials or URL not found in environment variables.');
        }

        // Get JWT token
        const tokenResponse = await fetch(`${wpApiUrl}/jwt-auth/v1/token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: user, password: pass }),
        });

        if (!tokenResponse.ok) {
            const errorDetails = await tokenResponse.text();
            console.error('Token error:', errorDetails);
            throw new Error(`Failed to get authentication token. Details: ${errorDetails}`);
        }

        const tokenData = await tokenResponse.json();
        const token = tokenData.token;

        // METHOD 1: Try creating post with ACF data in one request
        const postData = {
            title: title,
            status: 'pending',
            acf: acfFields,
        };

        console.log('Sending to WordPress:', JSON.stringify(postData, null, 2));

        let postResponse;
        let postId;

        try {
            const createPostResponse = await fetch(`${wpApiUrl}/wp/v2/cagar_budaya`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(postData),
            });

            if (!createPostResponse.ok) {
                const errorData = await createPostResponse.json();
                console.error('WordPress Post Creation Error:', errorData);
                throw new Error(`Failed to create post in WordPress: ${JSON.stringify(errorData)}`);
            }

            postResponse = await createPostResponse.json();
            postId = postResponse.id;
            console.log('Post created with ID:', postId);
        } catch (createError) {
            console.error('Method 1 failed, trying alternative approach:', createError);

            // METHOD 2: Create post first, then update with ACF data
            const basicPostResponse = await fetch(`${wpApiUrl}/wp/v2/cagar_budaya`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    title: title,
                    status: 'pending',
                }),
            });

            if (!basicPostResponse.ok) {
                const errorData = await basicPostResponse.json();
                throw new Error(`Failed to create basic post: ${JSON.stringify(errorData)}`);
            }

            postResponse = await basicPostResponse.json();
            postId = postResponse.id;
            console.log('Basic post created with ID:', postId);
        }

        // METHOD 3: Update post with ACF data using multiple approaches
        const updateMethods = [
            // Approach 1: Standard ACF update
            {
                name: 'Standard ACF Update',
                payload: { acf: acfFields },
            },
            // Approach 2: Meta fields update
            {
                name: 'Meta Fields Update',
                payload: { meta: metaFields },
            },
            // Approach 3: Mixed approach with prefixed meta fields
            {
                name: 'Prefixed Meta Fields',
                payload: {
                    meta: Object.fromEntries(Object.entries(metaFields).map(([key, value]) => [`_${key}`, value])),
                },
            },
        ];

        let updateSuccess = false;

        for (const method of updateMethods) {
            try {
                console.log(`Trying ${method.name}...`);

                const updateResponse = await fetch(`${wpApiUrl}/wp/v2/cagar_budaya/${postId}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(method.payload),
                });

                if (updateResponse.ok) {
                    const updateData = await updateResponse.json();
                    console.log(`${method.name} successful`);

                    // Check if ACF data is present
                    if (updateData.acf && Object.values(updateData.acf).some((val) => val !== null)) {
                        updateSuccess = true;
                        console.log('ACF data successfully saved!');
                        break;
                    }
                } else {
                    const errorData = await updateResponse.json();
                    console.log(`${method.name} failed:`, errorData);
                }
            } catch (error) {
                console.log(`${method.name} error:`, error);
            }
        }

        // METHOD 4: If all above methods fail, try direct database approach via custom endpoint
        if (!updateSuccess) {
            console.log('Trying custom meta update approach...');

            try {
                // This approach manually sets meta fields
                const customUpdatePromises = Object.entries(acfFields).map(async ([fieldKey, fieldValue]) => {
                    // Try both with and without underscore prefix
                    const variations = [fieldKey, `_${fieldKey}`, `field_${fieldKey}`];

                    for (const variation of variations) {
                        try {
                            const metaUpdateResponse = await fetch(`${wpApiUrl}/wp/v2/cagar_budaya/${postId}`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    Authorization: `Bearer ${token}`,
                                },
                                body: JSON.stringify({
                                    meta: {
                                        [variation]: fieldValue,
                                    },
                                }),
                            });

                            if (metaUpdateResponse.ok) {
                                console.log(`Successfully updated ${fieldKey} as ${variation}`);
                                break;
                            }
                        } catch (error) {
                            console.log(`Failed to update ${fieldKey} as ${variation}:`, error);
                        }
                    }
                });

                await Promise.all(customUpdatePromises);
            } catch (customError) {
                console.error('Custom meta update failed:', customError);
            }
        }

        // Get the final post data to verify what was saved
        // Wait a moment for WordPress to process the updates
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const finalPostResponse = await fetch(`${wpApiUrl}/wp/v2/cagar_budaya/${postId}?context=edit`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        const finalPostData = await finalPostResponse.json();
        console.log('Final post data ACF:', finalPostData.acf);

        // Check if any ACF fields were saved
        const savedAcfFields = finalPostData.acf || {};
        const savedFieldCount = Object.values(savedAcfFields).filter((val) => val !== null && val !== '').length;

        return NextResponse.json(
            {
                message: savedFieldCount > 0 ? 'Data successfully sent for review with ACF fields!' : 'Post created but ACF fields may need manual verification.',
                data: finalPostData,
                sentFields: acfFields,
                postId: postId,
                savedAcfFields: savedAcfFields,
                savedFieldCount: savedFieldCount,
                debug: {
                    updateSuccess,
                    finalAcfCheck: savedAcfFields,
                },
            },
            { status: 201 }
        );
    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json(
            {
                message: error.message || 'Server error occurred',
                error: error.toString(),
            },
            { status: 500 }
        );
    }
}
