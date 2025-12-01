import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import ParentChildRequest from '@/lib/models/ParentChildRequest';
import Orangtua from '@/lib/models/Orangtua';
import { authenticateAndAuthorize } from '@/lib/authMiddleware';
import mongoose from 'mongoose';

export async function POST(request, { params }) {
  try {
    const authResult = await authenticateAndAuthorize(request, ['admin']);
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    await connectDB();
    
    // Next.js 15: params is async, need to await
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json({ error: 'Request ID tidak ditemukan' }, { status: 400 });
    }
    
    console.log('Processing approve request for ID:', id);
    
    // Find request by ID
    const req = await ParentChildRequest.findById(id);
    if (!req) {
      console.error('Request not found:', id);
      return NextResponse.json({ error: 'Request tidak ditemukan.' }, { status: 404 });
    }
    
    if (req.status !== 'pending') {
      console.error('Request already processed:', req.status);
      return NextResponse.json({ error: 'Request sudah diproses.' }, { status: 400 });
    }
    
    // Get ObjectId values dari request
    // req.orangtua_id dan req.siswa_id sudah dalam format ObjectId dari Mongoose
    // Pastikan dalam format ObjectId yang benar
    const orangtuaId = req.orangtua_id;
    const siswaId = req.siswa_id;
    
    console.log('Raw values from request:', {
      orangtuaId: orangtuaId,
      orangtuaIdType: typeof orangtuaId,
      orangtuaIdIsObjectId: orangtuaId instanceof mongoose.Types.ObjectId,
      siswaId: siswaId,
      siswaIdType: typeof siswaId,
      siswaIdIsObjectId: siswaId instanceof mongoose.Types.ObjectId
    });
    
    // Validasi ObjectId
    if (!mongoose.Types.ObjectId.isValid(orangtuaId)) {
      console.error('Invalid orangtuaId:', orangtuaId);
      return NextResponse.json({ error: 'Data orangtua tidak valid.' }, { status: 400 });
    }
    if (!mongoose.Types.ObjectId.isValid(siswaId)) {
      console.error('Invalid siswaId:', siswaId);
      return NextResponse.json({ error: 'Data siswa tidak valid.' }, { status: 400 });
    }
    
    // Konversi ke ObjectId jika belum
    const orangtuaObjectId = orangtuaId instanceof mongoose.Types.ObjectId 
      ? orangtuaId 
      : new mongoose.Types.ObjectId(orangtuaId);
    const siswaObjectId = siswaId instanceof mongoose.Types.ObjectId 
      ? siswaId 
      : new mongoose.Types.ObjectId(siswaId);
    
    console.log('Processing approve - orangtua_id:', orangtuaObjectId.toString(), 'siswa_id:', siswaObjectId.toString());
    console.log('ObjectId validation:', {
      orangtuaObjectIdValid: mongoose.Types.ObjectId.isValid(orangtuaObjectId),
      siswaObjectIdValid: mongoose.Types.ObjectId.isValid(siswaObjectId),
      orangtuaObjectIdType: orangtuaObjectId.constructor.name,
      siswaObjectIdType: siswaObjectId.constructor.name
    });
    
    // Verifikasi bahwa User dengan ID tersebut ada
    const User = (await import('@/lib/models/userModel')).default;
    const orangtuaUser = await User.findById(orangtuaObjectId);
    const siswaUser = await User.findById(siswaObjectId);
    
    if (!orangtuaUser) {
      console.error('Orangtua user not found:', orangtuaObjectId.toString());
      return NextResponse.json({ error: 'User orangtua tidak ditemukan.' }, { status: 404 });
    }
    if (!siswaUser) {
      console.error('Siswa user not found:', siswaObjectId.toString());
      return NextResponse.json({ error: 'User siswa tidak ditemukan.' }, { status: 404 });
    }
    
    console.log('User validation:', {
      orangtuaUserExists: !!orangtuaUser,
      orangtuaUserRole: orangtuaUser?.role,
      siswaUserExists: !!siswaUser,
      siswaUserRole: siswaUser?.role
    });
    
    // Cari record Orangtua dengan user_id yang sama (gunakan ObjectId untuk query)
    let orangtuaRecord = await Orangtua.findOne({ user_id: orangtuaObjectId });
    
    console.log('Orangtua record query result:', {
      found: !!orangtuaRecord,
      recordId: orangtuaRecord?._id?.toString(),
      recordUserId: orangtuaRecord?.user_id?.toString(),
      recordSiswaIds: orangtuaRecord?.siswa_ids?.map(id => id.toString()) || []
    });
    
    if (orangtuaRecord) {
      console.log('Existing Orangtua record found:', orangtuaRecord._id.toString());
      
      // Pastikan siswa_ids adalah array
      if (!Array.isArray(orangtuaRecord.siswa_ids)) {
        orangtuaRecord.siswa_ids = [];
      }
      
      // Cek apakah siswa_id sudah ada di array
      const siswaIdStr = siswaObjectId.toString();
      const siswaExists = orangtuaRecord.siswa_ids.some(id => {
        if (!id) return false;
        return id.toString() === siswaIdStr;
      });
      
      if (!siswaExists) {
        console.log('Adding siswa_id to existing record');
        console.log('Current siswa_ids before:', orangtuaRecord.siswa_ids.map(id => id.toString()));
        console.log('Record _id validation:', {
          recordId: orangtuaRecord._id.toString(),
          recordIdValid: mongoose.Types.ObjectId.isValid(orangtuaRecord._id),
          siswaObjectId: siswaObjectId.toString(),
          siswaObjectIdValid: mongoose.Types.ObjectId.isValid(siswaObjectId)
        });
        
        // Pendekatan 1: Langsung push ke array dan save (paling reliable)
        orangtuaRecord.siswa_ids.push(siswaObjectId);
        console.log('After push, siswa_ids length:', orangtuaRecord.siswa_ids.length);
        console.log('After push, siswa_ids:', orangtuaRecord.siswa_ids.map(id => id.toString()));
        
        // Mark array sebagai modified untuk memastikan Mongoose menyimpan perubahan
        orangtuaRecord.markModified('siswa_ids');
        
        try {
          await orangtuaRecord.save({ validateBeforeSave: true });
          console.log('Successfully saved using markModified and save');
        } catch (saveError) {
          console.error('Save error details:', {
            name: saveError.name,
            message: saveError.message,
            errors: saveError.errors,
            stack: saveError.stack
          });
          
          // Jika save gagal, coba dengan updateOne
          console.log('Save failed, trying updateOne with $push');
          const updateResult = await Orangtua.updateOne(
            { _id: orangtuaRecord._id },
            { $push: { siswa_ids: siswaObjectId } },
            { runValidators: false } // Skip validators untuk menghindari masalah dengan required
          );
          console.log('Update result:', {
            matchedCount: updateResult.matchedCount,
            modifiedCount: updateResult.modifiedCount,
            acknowledged: updateResult.acknowledged,
            upsertedCount: updateResult.upsertedCount
          });
          
          if (updateResult.matchedCount === 0) {
            throw new Error('Record Orangtua tidak ditemukan untuk di-update');
          }
          
          if (updateResult.modifiedCount === 0) {
            console.warn('WARNING: modifiedCount is 0 - mungkin siswa_id sudah ada atau ada masalah lain');
          }
        }
        
        // Verifikasi dengan fetch ulang dari database
        const verified = await Orangtua.findById(orangtuaRecord._id);
        console.log('Verified siswa_ids after update:', verified.siswa_ids ? verified.siswa_ids.map(id => id.toString()) : []);
        
        const verifiedExists = verified.siswa_ids && verified.siswa_ids.some(id => {
          if (!id) return false;
          return id.toString() === siswaIdStr;
        });
        
        if (!verifiedExists) {
          console.error('ERROR: Verifikasi gagal setelah semua upaya');
          console.error('Expected siswa_id:', siswaIdStr);
          console.error('Current siswa_ids:', verified.siswa_ids ? verified.siswa_ids.map(id => id.toString()) : []);
          
          // Coba sekali lagi dengan findOneAndUpdate
          console.log('Trying final approach: findOneAndUpdate');
          const finalResult = await Orangtua.findOneAndUpdate(
            { _id: orangtuaRecord._id },
            { $push: { siswa_ids: siswaObjectId } },
            { new: true }
          );
          
          if (finalResult) {
            const finalVerified = finalResult.siswa_ids && finalResult.siswa_ids.some(id => {
              return id && id.toString() === siswaIdStr;
            });
            
            if (!finalVerified) {
              throw new Error('Gagal menambahkan siswa_id ke array siswa_ids setelah semua upaya');
            }
            console.log('Success after findOneAndUpdate');
          } else {
            throw new Error('Gagal menambahkan siswa_id ke array siswa_ids setelah semua upaya');
          }
        } else {
          console.log('Verifikasi berhasil - siswa_id ada di array');
          console.log('Total siswa_ids:', verified.siswa_ids.length);
        }
      } else {
        console.log('Siswa_id sudah ada di array');
      }
    } else {
      console.log('No existing record, creating new Orangtua record');
      
      // Buat record baru dengan user_id dan siswa_ids array
      orangtuaRecord = await Orangtua.create({ 
        user_id: orangtuaObjectId, 
        siswa_ids: [siswaObjectId] 
      });
      
      console.log('New Orangtua record created:', orangtuaRecord._id.toString());
      console.log('siswa_ids:', orangtuaRecord.siswa_ids.map(id => id.toString()));
      
      // Verifikasi
      if (!orangtuaRecord.siswa_ids || orangtuaRecord.siswa_ids.length === 0) {
        throw new Error('Gagal membuat record Orangtua dengan siswa_ids');
      }
    }
    
    // Hapus request setelah berhasil approve
    await ParentChildRequest.findByIdAndDelete(id);
    console.log('Request deleted successfully');
    
    return NextResponse.json({ success: true, message: 'Request berhasil disetujui dan dihapus.' });
  } catch (e) {
    console.error('Error in approve route:', e);
    console.error('Error name:', e.name);
    console.error('Error message:', e.message);
    console.error('Error stack:', e.stack);
    return NextResponse.json({ 
      error: e.message || 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? e.stack : undefined
    }, { status: 500 });
  }
} 