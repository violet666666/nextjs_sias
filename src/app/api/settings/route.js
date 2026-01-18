import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Setting from '@/lib/models/Setting';
import { authenticateAndAuthorize } from '@/lib/authMiddleware';

// GET settings (public or protected depends on key, but let's protect generic)
export async function GET(request) {
    try {
        const authResult = await authenticateAndAuthorize(request, ['admin', 'guru']);
        if (authResult.error) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        await connectDB();
        const { searchParams } = new URL(request.url);
        const key = searchParams.get('key');

        if (key) {
            const setting = await Setting.findOne({ key });
            return NextResponse.json(setting ? setting.value : null);
        }

        const settings = await Setting.find({});
        // Transform to object for easier consumption { key: value }
        const settingsMap = settings.reduce((acc, curr) => {
            acc[curr.key] = curr.value;
            return acc;
        }, {});

        return NextResponse.json(settingsMap);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST/PUT to update settings
export async function POST(request) {
    try {
        const authResult = await authenticateAndAuthorize(request, ['admin']);
        if (authResult.error) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        await connectDB();
        const body = await request.json();
        const { key, value, description } = body;

        if (!key || value === undefined) {
            return NextResponse.json({ error: 'Key and Value are required' }, { status: 400 });
        }

        const setting = await Setting.findOneAndUpdate(
            { key },
            {
                value,
                description,
                updatedBy: authResult.user.id
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        return NextResponse.json(setting);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
