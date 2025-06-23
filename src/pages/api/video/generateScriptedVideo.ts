import type { NextApiRequest, NextApiResponse } from 'next';
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import { uploadFileToFirebase } from '@/utils/firebaseUpload';

interface ImageData {
  url: string;
  title: string;
  source: string;
}

interface CaptionTiming {
  text: string;
  start: number;
  end: number;
}

// Helper function to create script-based captions with perfect timing
function createScriptBasedCaptions(script: string, durationInSeconds: number): CaptionTiming[] {
  if (!script || !script.trim()) {
    return [];
  }
  
  // Clean and split script into words
  const words = script
    .replace(/[^\w\s]/g, ' ') // Replace punctuation with spaces
    .split(/\s+/) // Split on whitespace
    .filter(word => word.length > 0); // Remove empty strings
  
  if (words.length === 0) {
    return [];
  }
  
  // Calculate timing per word to fit exact duration
  const timePerWord = durationInSeconds / words.length;
  
  // Group words into readable phrases (3-4 words each)
  const phrases: CaptionTiming[] = [];
  const wordsPerPhrase = 3;
  
  for (let i = 0; i < words.length; i += wordsPerPhrase) {
    const phraseWords = words.slice(i, i + wordsPerPhrase);
    const phraseText = phraseWords.join(' ');
    
    // Calculate start and end times
    const startTime = i * timePerWord;
    const endTime = Math.min((i + phraseWords.length) * timePerWord, durationInSeconds);
    
    phrases.push({
      text: phraseText,
      start: Math.round(startTime * 100) / 100, // Round to 2 decimal places
      end: Math.round(endTime * 100) / 100
    });
  }
  
  console.log(`Created ${phrases.length} script-based caption phrases from ${words.length} words`);
  return phrases;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { script, images, audioFile, durationInSeconds, videoFile, taskId, captions } = req.body;

    // Validate required parameters
    if (!script || !audioFile || !durationInSeconds) {
      return res.status(400).json({ 
        success: false,
        message: 'Missing required parameters (script, audioFile, durationInSeconds)' 
      });
    }

    // Images and captions are optional
    const imageList: ImageData[] = images || [];
    const captionList: CaptionTiming[] = captions || [];

    console.log(`[Scripted Video] Initiating processing for task: ${taskId}`);
    console.log(`[Scripted Video] Script length: ${script.length} characters`);
    console.log(`[Scripted Video] Images provided: ${imageList.length}`);
    console.log(`[Scripted Video] Captions provided: ${captionList.length}`);
    console.log(`[Scripted Video] Audio file: ${audioFile}`);
    
    // If taskId is provided, use it for directory naming
    const processId = taskId || uuidv4();
    
    console.log(`[Scripted Video] Starting synchronous video generation for task: ${processId}`);
    
    try {
      // Process scripted video generation synchronously and return the result
      const result = await processScriptedVideoGeneration({
        script,
        images: imageList,
        audioFile,
        durationInSeconds,
        videoFile,
        taskId: processId,
        captions: captionList
      });
      
      // Return success with video data
      return res.status(200).json({
        success: true,
        message: 'Scripted video generation completed successfully',
        taskId: processId,
        videoUrl: result.videoUrl,
        duration: result.duration,
        fileSize: result.fileSize,
        fileName: result.fileName
      });
    } catch (error: any) {
      console.error(`[Scripted Video] Error during video generation:`, error);
      return res.status(500).json({
        success: false,
        message: 'Scripted video generation failed',
        error: error.message || 'Unknown error',
        taskId: processId
      });
    }
  } catch (error: unknown) {
    console.error('Error initiating scripted video generation:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to initiate scripted video generation', 
      error: error instanceof Error ? error.message : String(error) 
    });
  }
}

async function processScriptedVideoGeneration(
  params: {
    script: string;
    images: ImageData[];
    audioFile: string;
    durationInSeconds: number;
    videoFile?: string;
    taskId: string;
    captions?: CaptionTiming[];
  }
): Promise<{
  success: boolean;
  videoUrl: string;
  duration: number;
  fileSize: number;
  fileName: string;
}> {
  const { script, images, audioFile, durationInSeconds, videoFile, taskId, captions } = params;
  let tempDir = '';
  
  // Keep-alive mechanism to prevent container from idling
  let isProcessing = true;
  const keepAliveInterval = setInterval(() => {
    if (isProcessing) {
      console.log(`[Task ${taskId}] Still processing scripted video... keeping container active`);
      // Perform some small CPU work to ensure the container stays active
      for (let i = 0; i < 1000; i++) {
        Math.random() * Math.random();
      }
    }
  }, 20000);
  
  try {
    console.log(`[Task ${taskId}] Starting scripted video generation process with ${captions?.length || 0} captions`);
    
    // Create temporary directory for processing
    tempDir = path.join(process.cwd(), 'tmp', taskId);
    fs.mkdirSync(tempDir, { recursive: true });
    
    // Download images if provided
    const imagePaths: string[] = [];
    if (images && images.length > 0) {
      console.log(`[Task ${taskId}] Downloading ${images.length} images...`);
      for (let i = 0; i < images.length; i++) {
        try {
          const imagePath = await downloadImage(images[i], tempDir, i, taskId);
          imagePaths.push(imagePath);
        } catch (imageError) {
          console.warn(`[Task ${taskId}] Failed to download image ${i}: ${imageError}`);
          // Continue with other images
        }
      }
      console.log(`[Task ${taskId}] Successfully downloaded ${imagePaths.length}/${images.length} images`);
    }
    
    // Create video from images and script with captions
    const videoPath = await createScriptedVideo(script, imagePaths, durationInSeconds, tempDir, taskId, captions);
    
    // Combine video with audio
    const finalVideoPath = await combineVideoWithAudio(videoPath, audioFile, tempDir, taskId);
    
    // Upload final video
    const videoBuffer = fs.readFileSync(finalVideoPath);
    const base64Video = videoBuffer.toString('base64');
    const fileName = path.basename(videoFile || `scripted_video_${taskId}.mp4`);
    
    const uploadResult = await uploadFileToFirebase(base64Video, fileName, 'videos');
    
    if (!uploadResult.success) {
      throw new Error(`Failed to upload video: ${uploadResult.error || 'Unknown error'}`);
    }
    
    if (!uploadResult.url) {
      throw new Error('Upload successful but no URL returned');
    }
    
    const videoUrl = uploadResult.url;
    console.log(`[Task ${taskId}] Scripted video with captions uploaded successfully: ${videoUrl}`);
    
    // Get video file stats for metadata
    const videoStats = fs.statSync(finalVideoPath);
    const fileSize = videoStats.size;
    
    return {
      success: true,
      videoUrl: videoUrl,
      duration: durationInSeconds,
      fileSize: fileSize,
      fileName: fileName
    };
  } catch (error: unknown) {
    console.error(`[Task ${taskId}] Error generating scripted video:`, error);
    throw error;
  } finally {
    // Stop the keep-alive mechanism
    isProcessing = false;
    clearInterval(keepAliveInterval);
    
    // Clean up temporary files
    if (tempDir && fs.existsSync(tempDir)) {
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
        console.log(`[Task ${taskId}] Cleaned up temporary directory: ${tempDir}`);
      } catch (cleanupError) {
        console.error(`[Task ${taskId}] Error during cleanup:`, cleanupError);
      }
    }
  }
}

async function downloadImage(imageData: ImageData, tempDir: string, index: number, taskId: string): Promise<string> {
  try {
    console.log(`[Task ${taskId}] Downloading image ${index + 1}: ${imageData.url}`);
    
    const response = await axios.get(imageData.url, { 
      responseType: 'arraybuffer',
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (response.status !== 200) {
      throw new Error(`Failed to download image. Status: ${response.status}`);
    }
    
    // Determine file extension from content-type or URL
    const contentType = response.headers['content-type'] || '';
    let extension = '.jpg'; // default
    if (contentType.includes('png')) extension = '.png';
    else if (contentType.includes('gif')) extension = '.gif';
    else if (contentType.includes('webp')) extension = '.webp';
    
    const imagePath = path.join(tempDir, `image_${index.toString().padStart(3, '0')}${extension}`);
    await fs.promises.writeFile(imagePath, new Uint8Array(response.data));
    
    // Verify file was written
    const stats = await fs.promises.stat(imagePath);
    if (stats.size === 0) {
      throw new Error('Downloaded image file is empty');
    }
    
    console.log(`[Task ${taskId}] Image ${index + 1} downloaded successfully (${stats.size} bytes)`);
    return imagePath;
  } catch (error) {
    console.error(`[Task ${taskId}] Error downloading image ${index + 1}:`, error);
    throw error;
  }
}

async function createScriptedVideo(
  script: string, 
  imagePaths: string[], 
  durationInSeconds: number, 
  tempDir: string, 
  taskId: string,
  captions?: CaptionTiming[]
): Promise<string> {
  try {
    console.log(`[Task ${taskId}] Creating scripted video with ${imagePaths.length} images and ${captions?.length || 0} captions`);
    
    const outputPath = path.join(tempDir, 'scripted_video.mp4');
    
    // If we have no images, create a simple text-based video
    if (imagePaths.length === 0) {
      console.log(`[Task ${taskId}] No images provided, creating text-only video`);
      return await createTextOnlyVideo(script, durationInSeconds, tempDir, taskId, captions);
    }
    
    // Verify all image files exist and are valid
    const validImages = [];
    for (let i = 0; i < imagePaths.length; i++) {
      const imagePath = imagePaths[i];
      try {
        const stats = await fs.promises.stat(imagePath);
        if (stats.size > 0) {
          validImages.push(imagePath);
          console.log(`[Task ${taskId}] Valid image ${i + 1}: ${path.basename(imagePath)} (${stats.size} bytes)`);
        } else {
          console.warn(`[Task ${taskId}] Skipping empty image: ${imagePath}`);
        }
      } catch (statError) {
        console.warn(`[Task ${taskId}] Skipping invalid image: ${imagePath}`, statError);
      }
    }
    
    if (validImages.length === 0) {
      console.log(`[Task ${taskId}] No valid images found, creating text-only video`);
      return await createTextOnlyVideo(script, durationInSeconds, tempDir, taskId, captions);
    }
    
    console.log(`[Task ${taskId}] Using ${validImages.length} valid images`);
    
    // Calculate optimal image timing (minimum 4 seconds per image)
    const minSecondsPerImage = 4;
    const maxSecondsPerImage = 6;
    
    let secondsPerImage = durationInSeconds / validImages.length;
    
    // If images would change too fast, reduce the number of images used
    if (secondsPerImage < minSecondsPerImage) {
      const optimalImageCount = Math.floor(durationInSeconds / minSecondsPerImage);
      const imagesToUse = validImages.slice(0, Math.max(1, optimalImageCount));
      secondsPerImage = durationInSeconds / imagesToUse.length;
      
      console.log(`[Task ${taskId}] Reducing images from ${validImages.length} to ${imagesToUse.length} for better pacing`);
      console.log(`[Task ${taskId}] Each image will display for ${secondsPerImage.toFixed(1)} seconds`);
      
      // Update validImages to use the reduced set
      validImages.length = 0;
      validImages.push(...imagesToUse);
    } else {
      console.log(`[Task ${taskId}] Each image will display for ${secondsPerImage.toFixed(1)} seconds`);
    }
    
    // Use a simpler approach: create a video from each image, then concatenate
    let tempVideos: string[] = [];
    
    // Create individual videos for each image
    for (let i = 0; i < validImages.length; i++) {
      const imagePath = validImages[i];
      const tempVideoPath = path.join(tempDir, `temp_video_${i}.mp4`);
      
      console.log(`[Task ${taskId}] Creating video segment ${i + 1}/${validImages.length}`);
      
      await new Promise<void>((resolve, reject) => {
        ffmpeg()
          .input(imagePath)
          .inputOptions('-loop 1')
          .inputOptions(`-t ${secondsPerImage}`)
          .outputOptions('-c:v libx264')
          .outputOptions('-preset fast')
          .outputOptions('-pix_fmt yuv420p')
          .outputOptions('-vf scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:black')
          .outputOptions('-r 24')
          .output(tempVideoPath)
          .on('end', () => {
            tempVideos.push(tempVideoPath);
            resolve();
          })
          .on('error', (err) => {
            console.error(`[Task ${taskId}] Error creating video segment ${i + 1}:`, err);
            reject(err);
          })
          .run();
      });
    }
    
    // Concatenate all video segments
    console.log(`[Task ${taskId}] Concatenating ${tempVideos.length} video segments`);
    
    await new Promise<void>((resolve, reject) => {
      let ffmpegCommand = ffmpeg();
      
      // Add all temp videos as inputs
      tempVideos.forEach(videoPath => {
        ffmpegCommand = ffmpegCommand.input(videoPath);
      });
      
      // Create simple concat filter
      const concatFilter = tempVideos.map((_, index) => `[${index}:v]`).join('') + `concat=n=${tempVideos.length}:v=1:a=0[outv]`;
      
      // Build filter chain with captions if provided
      let filters: string[];
      let outputMap = '[outv]';
      
      if (captions && captions.length > 0) {
        // Create a single complex filter with both concat and captions
        const captionFilter = createCaptionFilter(captions);
        const combinedFilter = `${concatFilter};[outv]${captionFilter}[final_out]`;
        filters = [combinedFilter];
        outputMap = '[final_out]';
      } else {
        filters = [concatFilter];
      }
      
      ffmpegCommand
        .complexFilter(filters)
        .outputOptions(`-map ${outputMap}`)
        .outputOptions('-c:v libx264')
        .outputOptions('-preset fast')
        .outputOptions('-crf 23')
        .outputOptions('-pix_fmt yuv420p')
        .output(outputPath)
        .on('end', () => {
          console.log(`[Task ${taskId}] Scripted video creation complete`);
          resolve();
        })
        .on('error', (err) => {
          console.error(`[Task ${taskId}] Error concatenating video segments:`, err);
          reject(err);
        })
        .on('progress', (progress) => {
          // FFMPEG progress can be unreliable during concatenation, so just log periodically
          if (progress.frames && progress.frames % 50 === 0) {
            console.log(`[Task ${taskId}] Concatenation in progress... frames: ${progress.frames}`);
          }
        })
        .run();
    });
    
    return outputPath;
  } catch (error) {
    console.error(`[Task ${taskId}] Error creating scripted video:`, error);
    throw error;
  }
}

async function createTextOnlyVideo(
  script: string, 
  durationInSeconds: number, 
  tempDir: string, 
  taskId: string,
  captions?: CaptionTiming[]
): Promise<string> {
  try {
    console.log(`[Task ${taskId}] Creating text-only video with ${captions?.length || 0} captions`);
    
    const outputPath = path.join(tempDir, 'text_video.mp4');
    
    // Golden ratio positioning for text-only videos too
    const captionY = 'h*0.38+100'; // Same golden ratio + TikTok UI buffer
    
    let filterChain = '';
    
    if (captions && captions.length > 0) {
      console.log(`[Task ${taskId}] Processing ${captions.length} captions at golden ratio position`);
      // Create caption filter for psychological impact
      filterChain = createCaptionFilter(captions);
    } else {
      // Fallback to script text with golden ratio positioning
      const enhancedScript = script
        .replace(/['"]/g, "")
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
      
      filterChain = `drawtext=text='${enhancedScript}':fontcolor=white:fontsize=48:borderw=3:bordercolor=black:shadowx=1:shadowy=1:shadowcolor=black@0.6:x=(w-text_w)/2:y=${captionY}:enable='between(t,0,${durationInSeconds})'`;
    }
    
    // Create a simple colored background video with text overlay
    await new Promise<void>((resolve, reject) => {
      ffmpeg()
        .input(`color=c=black:s=1080x1920:d=${durationInSeconds}:r=24`)
        .inputFormat('lavfi')
        .outputOptions('-c:v libx264')
        .outputOptions('-preset fast')
        .outputOptions('-crf 23')
        .outputOptions('-pix_fmt yuv420p')
        .complexFilter([filterChain])
        .output(outputPath)
        .on('end', () => {
          console.log(`[Task ${taskId}] Text-only video creation complete with golden ratio positioning`);
          resolve();
        })
        .on('error', (err) => {
          console.error(`[Task ${taskId}] Error creating text-only video:`, err);
          reject(err);
        })
        .run();
    });
    
    return outputPath;
  } catch (error) {
    console.error(`[Task ${taskId}] Error creating text-only video:`, error);
    throw error;
  }
}

// Helper function to create caption filter for word-level captions
function createCaptionFilter(captions: CaptionTiming[]): string {
  if (!captions || captions.length === 0) {
    return '';
  }
  
  // Golden ratio positioning from TikTok user info bar
  // TikTok user info bar is ~100px from top on 1920px video
  // Golden ratio (38% from top) + 100px buffer = ideal caption zone
  const captionY = 'h*0.38+100'; // 38% from top (golden ratio) + 100px for TikTok UI
  
  console.log(`Creating caption filter for ${captions.length} word-level captions at golden ratio position`);
  
  // Create individual drawtext filters for each word
  const captionFilters = captions.map((caption, index) => {
    // Clean and enhance text for single words
    let enhancedText = caption.text
      .replace(/['"]/g, '') // Remove quotes
      .replace(/[:\[\],]/g, '') // Remove problematic chars completely for single words
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
    
    // Capitalize first letter for psychological impact
    if (enhancedText.length > 0) {
      enhancedText = enhancedText.charAt(0).toUpperCase() + enhancedText.slice(1).toLowerCase();
    }
    
    // For single words, no length limiting needed - just ensure it's reasonable
    if (enhancedText.length > 20) {
      enhancedText = enhancedText.substring(0, 20);
    }
    
    // Use exact Whisper timing - no adjustments for perfect sync
    const startTime = caption.start;
    const endTime = caption.end;
    
    // Golden ratio positioned captions with high visibility styling
    return `drawtext=text='${enhancedText}':fontcolor=white:fontsize=64:borderw=3:bordercolor=black:shadowx=1:shadowy=1:shadowcolor=black@0.6:x=(w-text_w)/2:y=${captionY}:enable='between(t,${startTime},${endTime})'`;
  });
  
  console.log(`Generated ${captionFilters.length} word-level caption filters at golden ratio position`);
  
  // Join all caption filters
  return captionFilters.join(',');
}


async function combineVideoWithAudio(videoPath: string, audioUrl: string, tempDir: string, taskId: string): Promise<string> {
  try {
    console.log(`[Task ${taskId}] [Audio] Downloading audio from: ${audioUrl}`);
    
    const audioResponse = await axios.get(audioUrl, { 
      responseType: 'arraybuffer',
      timeout: 100000,
      validateStatus: status => status < 500
    });
    
    if (audioResponse.status !== 200) {
      throw new Error(`Failed to download audio file. Status: ${audioResponse.status}`);
    }
    
    const audioPath = path.join(tempDir, 'audio.mp3');
    await fs.promises.writeFile(audioPath, new Uint8Array(audioResponse.data));
    
    const audioStats = await fs.promises.stat(audioPath);
    if (audioStats.size === 0) {
      throw new Error('Downloaded audio file is empty');
    }
    
    console.log(`[Task ${taskId}] [Audio] Audio downloaded successfully (${audioStats.size} bytes)`);
    
    const outputPath = path.join(tempDir, 'final_scripted_video.mp4');
    console.log(`[Task ${taskId}] [FFMPEG] Combining video and audio to: ${outputPath}`);
    
    await new Promise<void>((resolve, reject) => {
      ffmpeg()
        .input(videoPath)
        .input(audioPath)
        .outputOptions('-c:v copy')
        .outputOptions('-c:a aac')
        .outputOptions('-shortest') // End when the shortest input ends
        .output(outputPath)
        .on('end', () => {
          console.log(`[Task ${taskId}] [FFMPEG] Video and audio combined successfully`);
          resolve();
        })
        .on('error', (err) => {
          console.error(`[Task ${taskId}] [FFMPEG] Error combining video and audio:`, err);
          reject(err);
        })
        .run();
    });
    
    return outputPath;
  } catch (error: unknown) {
    console.error(`[Task ${taskId}] Error combining video with audio:`, error);
    throw new Error(error instanceof Error ? error.message : String(error));
  }
}