import { supabaseAdmin } from '../lib/supabase';

/**
 * Initialize Supabase Storage Buckets for ZCC Pay-Per-Report Feature
 * Run this once during initial setup to create required storage buckets
 */
export async function initializeStorageBuckets(): Promise<void> {
  console.log('[Setup] Initializing Supabase Storage buckets...');

  try {
    // Create 'uploads' bucket (private)
    await createBucketIfNotExists('uploads', false);
    console.log('[Setup] ✓ Uploads bucket ready');

    // Create 'reports' bucket (private)
    await createBucketIfNotExists('reports', false);
    console.log('[Setup] ✓ Reports bucket ready');

    console.log('[Setup] Storage buckets initialized successfully');
  } catch (error) {
    console.error('[Setup] Failed to initialize storage buckets:', error);
    throw error;
  }
}

/**
 * Helper function to create a storage bucket if it doesn't exist
 */
async function createBucketIfNotExists(bucketName: string, isPublic: boolean): Promise<void> {
  try {
    // Check if bucket exists
    const { data: buckets } = await supabaseAdmin.storage.listBuckets();

    if (buckets?.some((b) => b.name === bucketName)) {
      console.log(`[Setup] Bucket '${bucketName}' already exists`);
      return;
    }

    // Create the bucket
    const { data, error } = await supabaseAdmin.storage.createBucket(bucketName, {
      public: isPublic,
    });

    if (error) {
      throw new Error(`Failed to create bucket '${bucketName}': ${error.message}`);
    }

    console.log(`[Setup] Created bucket '${bucketName}'`);
  } catch (error) {
    // Silently handle if bucket already exists (common in concurrent environments)
    if (error instanceof Error && error.message.includes('already exists')) {
      console.log(`[Setup] Bucket '${bucketName}' already exists`);
    } else {
      throw error;
    }
  }
}
