
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Mengupload file PDF ke bucket 'dokumen-sop'
 * @param file Objek File dari input HTML
 * @returns Object berisi path dan publicUrl, atau throw error jika gagal
 */
export const uploadSOPFile = async (file: File) => {
  // 1. Validasi Tipe File
  if (file.type !== 'application/pdf') {
    throw new Error('Hanya file PDF yang diperbolehkan.');
  }

  // 2. Generate Nama Unik (Timestamp + Clean Filename)
  // Menghapus spasi dan karakter aneh agar aman di URL
  const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_'); 
  const uniqueFileName = `${Date.now()}_${cleanFileName}`;

  // 3. Upload ke Supabase Storage
  const { data, error } = await supabase.storage
    .from('dokumen-sop')
    .upload(uniqueFileName, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    throw error;
  }

  // 4. Dapatkan Public URL
  const { data: publicUrlData } = supabase.storage
    .from('dokumen-sop')
    .getPublicUrl(uniqueFileName);

  return {
    path: uniqueFileName,
    url: publicUrlData.publicUrl
  };
};

/**
 * Membuat Signed URL (URL Sementara) untuk file di private bucket
 * @param filePath Path file di storage (biasanya nama file)
 * @param expiresIn Durasi URL valid dalam detik (Default: 3600 detik / 60 menit)
 */
export const getSOPSignedUrl = async (filePath: string, expiresIn: number = 3600) => {
  const { data, error } = await supabase.storage
    .from('dokumen-sop')
    .createSignedUrl(filePath, expiresIn);

  if (error) {
    throw error;
  }

  return data.signedUrl;
};
