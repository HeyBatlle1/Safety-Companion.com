import { supabase } from './supabase';

export interface BlueprintUpload {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
  checklistId: string;
  itemId: string;
  analysisStatus?: 'pending' | 'processing' | 'completed' | 'error';
  aiAnalysis?: {
    structuralElements?: string[];
    safetyHazards?: string[];
    elevationData?: any;
    riskScore?: number;
    recommendations?: string[];
  };
}

export class BlueprintStorageService {
  private bucketName = 'safety-blueprints';

  async ensureBucketExists() {
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(bucket => bucket.name === this.bucketName);
    
    if (!bucketExists) {
      const { error } = await supabase.storage.createBucket(this.bucketName, {
        public: false,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'image/svg+xml'],
        fileSizeLimit: 52428800 // 50MB
      });
      if (error && !error.message.includes('already exists')) {
        throw error;
      }
    }
  }

  async uploadBlueprint(
    file: File,
    checklistId: string,
    itemId: string,
    userId: string
  ): Promise<BlueprintUpload> {
    await this.ensureBucketExists();

    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'unknown';
    const fileName = `${userId}/${checklistId}/${itemId}/${Date.now()}.${fileExt}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(this.bucketName)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Blueprint upload error:', error);
      throw new Error('Failed to upload blueprint: ' + error.message);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(this.bucketName)
      .getPublicUrl(fileName);

    // Store metadata in database
    const blueprintData: BlueprintUpload = {
      id: crypto.randomUUID(),
      fileName: file.name,
      fileUrl: publicUrl,
      fileType: file.type,
      fileSize: file.size,
      uploadedAt: new Date().toISOString(),
      checklistId,
      itemId,
      analysisStatus: 'pending'
    };

    // Save to database (you'll need to create a blueprints table)
    const { error: dbError } = await supabase
      .from('blueprint_uploads')
      .insert(blueprintData);

    if (dbError) {
      // Cleanup storage if database insert fails
      await supabase.storage.from(this.bucketName).remove([fileName]);
      throw new Error('Failed to save blueprint metadata: ' + dbError.message);
    }

    return blueprintData;
  }

  async getBlueprints(checklistId: string, itemId?: string): Promise<BlueprintUpload[]> {
    let query = supabase
      .from('blueprint_uploads')
      .select('*')
      .eq('checklistId', checklistId);

    if (itemId) {
      query = query.eq('itemId', itemId);
    }

    const { data, error } = await query.order('uploadedAt', { ascending: false });

    if (error) {
      console.error('Error fetching blueprints:', error);
      return [];
    }

    return data || [];
  }

  async deleteBlueprint(blueprintId: string, fileName: string): Promise<void> {
    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from(this.bucketName)
      .remove([fileName]);

    if (storageError) {
      console.error('Error deleting blueprint file:', storageError);
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('blueprint_uploads')
      .delete()
      .eq('id', blueprintId);

    if (dbError) {
      throw new Error('Failed to delete blueprint metadata: ' + dbError.message);
    }
  }

  async updateAIAnalysis(blueprintId: string, analysis: BlueprintUpload['aiAnalysis']): Promise<void> {
    const { error } = await supabase
      .from('blueprint_uploads')
      .update({ 
        aiAnalysis: analysis,
        analysisStatus: 'completed'
      })
      .eq('id', blueprintId);

    if (error) {
      throw new Error('Failed to update AI analysis: ' + error.message);
    }
  }
}

export const blueprintStorage = new BlueprintStorageService();