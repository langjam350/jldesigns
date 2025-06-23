// src/utils/firebaseUpload.ts
import { getStorage, ref, uploadString, getDownloadURL } from 'firebase/storage';
import { app } from '../../lib/firebase';

export async function uploadFileToFirebase(fileData: string, fileName: string, category: string) {
  try {
    const storage = getStorage(app);
    const fileRef = ref(storage, `${category}/${fileName}`);
    
    // Upload the base64 string
    await uploadString(fileRef, fileData, 'base64');
    
    // Get the URL
    const url = await getDownloadURL(fileRef);
    
    return { success: true, url };
  } catch (error) {
    console.error(`[FirebaseUpload] Error uploading file ${fileName}:`, error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}