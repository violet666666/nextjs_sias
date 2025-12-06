import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import GradeComponent from '@/lib/models/GradeComponent';
import { authenticateAndAuthorize } from '@/lib/authMiddleware';

// GET: Get grade components for a subject and class
export async function GET(request) {
  try {
    const authResult = await authenticateAndAuthorize(request, ['guru', 'admin']);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    await connectDB();
    const { searchParams } = new URL(request.url);
    const mapel_id = searchParams.get('mapel_id');
    const kelas_id = searchParams.get('kelas_id');

    if (!mapel_id || !kelas_id) {
      return NextResponse.json({ error: 'mapel_id dan kelas_id wajib diisi' }, { status: 400 });
    }

    const guruId = authResult.user.id || authResult.user._id;
    const component = await GradeComponent.findOne({
      mapel_id,
      kelas_id,
      guru_id: guruId
    });

    return NextResponse.json(component || { components: [], total_percentage: 0 });
  } catch (error) {
    console.error('Error fetching grade components:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Create or update grade components
export async function POST(request) {
  try {
    const authResult = await authenticateAndAuthorize(request, ['guru', 'admin']);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    await connectDB();
    const body = await request.json();
    const { mapel_id, kelas_id, components } = body;

    if (!mapel_id || !kelas_id || !components || !Array.isArray(components)) {
      return NextResponse.json({ error: 'mapel_id, kelas_id, dan components wajib diisi' }, { status: 400 });
    }

    // Validate total percentage
    const totalPercentage = components.reduce((sum, comp) => sum + parseFloat(comp.percentage || 0), 0);
    if (Math.abs(totalPercentage - 100) > 0.01) {
      return NextResponse.json({ error: `Total persentase harus 100%. Saat ini: ${totalPercentage.toFixed(1)}%` }, { status: 400 });
    }

    const guruId = authResult.user.id || authResult.user._id;

    const component = await GradeComponent.findOneAndUpdate(
      { mapel_id, kelas_id, guru_id: guruId },
      {
        mapel_id,
        kelas_id,
        guru_id: guruId,
        components,
        total_percentage: totalPercentage
      },
      { new: true, upsert: true }
    );

    return NextResponse.json(component, { status: 200 });
  } catch (error) {
    console.error('Error saving grade components:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

