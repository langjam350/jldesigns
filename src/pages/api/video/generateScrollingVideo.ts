import type { NextApiRequest, NextApiResponse } from 'next';
import puppeteer from 'puppeteer';
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import { uploadFileToFirebase } from '@/utils/firebaseUpload';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { articleUrl, audioFile, durationInSeconds, videoFile, taskId } = req.body;

    // Validate required parameters
    if (!articleUrl || !audioFile || !durationInSeconds) {
      return res.status(400).json({ 
        success: false,
        message: 'Missing required parameters' 
      });
    }

    // Validate URL before attempting to use Puppeteer
    if (articleUrl.includes('undefined')) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid article URL. URL contains "undefined"' 
      });
    }

    console.log(`[Video Generation] Initiating processing for article: ${articleUrl}`);
    console.log(`[Video Generation] Audio file: ${audioFile}`);
    
    // If taskId is provided, use it for directory naming
    const processId = taskId || uuidv4();
    
    console.log(`[Video Generation] Starting synchronous video generation for task: ${processId}`);
    
    try {
      // Process video generation synchronously and return the result
      const result = await processVideoGeneration({
        articleUrl,
        audioFile,
        durationInSeconds,
        videoFile,
        taskId: processId
      });
      
      // Return success with video data
      return res.status(200).json({
        success: true,
        message: 'Video generation completed successfully',
        taskId: processId,
        videoUrl: result.videoUrl,
        duration: result.duration,
        fileSize: result.fileSize,
        fileName: result.fileName
      });
    } catch (error: any) {
      console.error(`[Video Generation] Error during video generation:`, error);
      return res.status(500).json({
        success: false,
        message: 'Video generation failed',
        error: error.message || 'Unknown error',
        taskId: processId
      });
    }
  } catch (error: unknown) {
    console.error('Error initiating video generation:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to initiate video generation', 
      error: error instanceof Error ? error.message : String(error) 
    });
  }
}

async function processVideoGeneration(
  params: {
    articleUrl: string;
    audioFile: string;
    durationInSeconds: number;
    videoFile?: string;
    taskId: string;
  }
): Promise<{
  success: boolean;
  videoUrl: string;
  duration: number;
  fileSize: number;
  fileName: string;
}> {
  const { articleUrl, audioFile, durationInSeconds, videoFile, taskId } = params;
  let tempDir = '';
  
  // Keep-alive mechanism to prevent container from idling
  let isProcessing = true;
  const keepAliveInterval = setInterval(() => {
    if (isProcessing) {
      console.log(`[Task ${taskId}] Still processing... keeping container active`);
      // Perform some small CPU work to ensure the container stays active
      for (let i = 0; i < 1000; i++) {
        Math.random() * Math.random();
      }
    }
  }, 20000); // Ping every 20 seconds
  
  try {
    console.log(`[Task ${taskId}] Starting video generation process`);
    
    // Create temporary directory for processing
    tempDir = path.join(process.cwd(), 'tmp', taskId);
    fs.mkdirSync(tempDir, { recursive: true });
    
    // Capture scrolling video of the article
    const videoPath = await captureScrollingVideo(articleUrl, durationInSeconds, tempDir, taskId);
    
    // Combine video with audio
    const finalVideoPath = await combineVideoWithAudio(videoPath, audioFile, tempDir, taskId);
    
    // Upload final video using your existing API endpoint
    const videoBuffer = fs.readFileSync(finalVideoPath);
    const base64Video = videoBuffer.toString('base64');
    const fileName = path.basename(videoFile || `video_${taskId}.mp4`);
    
    const uploadResult = await uploadFileToFirebase(base64Video, fileName, 'videos');
    
    if (!uploadResult.success) {
      throw new Error(`Failed to upload video: ${uploadResult.error || 'Unknown error'}`);
    }
    
    if (!uploadResult.url) {
      throw new Error('Upload successful but no URL returned');
    }
    
    const videoUrl = uploadResult.url;
    console.log(`[Task ${taskId}] Video uploaded successfully: ${videoUrl}`);
    
    // Get video file stats for metadata
    const videoStats = fs.statSync(finalVideoPath);
    const fileSize = videoStats.size;
    
    // Get video duration (approximate based on durationInSeconds)
    const videoDuration = durationInSeconds;
    
    return {
      success: true,
      videoUrl: videoUrl,
      duration: videoDuration,
      fileSize: fileSize,
      fileName: fileName
    };
  } catch (error: unknown) {
    console.error(`[Task ${taskId}] Error generating scrolling video:`, error);
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

async function captureScrollingVideo(url: string, durationInSeconds: number, tempDir: string, taskId: string): Promise<string> {
  console.log(`[Task ${taskId}] [Puppeteer] Launching browser to capture: ${url}`);
  
  const browser = await puppeteer.launch({ 
    headless: process.env.PUPPETEER_HEADLESS === 'false' ? false : 'shell',
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium-browser',
    args: [
      '--no-sandbox', 
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-extensions',
      '--disable-software-rasterizer',
      '--disable-web-security',
      '--disable-features=site-per-process',
      '--disable-infobars',
      '--window-position=0,0',
      '--ignore-certificate-errors',
      '--ignore-certificate-errors-spki-list',
      '--disable-accelerated-2d-canvas',
      '--disable-features=TranslateUI',
      '--disable-speech-api'
    ],
    timeout: 300000,
    protocolTimeout: 240000
  });
  
  try {
    const page = await browser.newPage();
    await page.setDefaultNavigationTimeout(60000);
    
    // Increased viewport height to show more text at once
    await page.setViewport({
      width: 480,
      height: 1200,  // Increased from 776 to show ~50% more content
      deviceScaleFactor: 1.5
    });
    
    console.log(`[Task ${taskId}] [Puppeteer] Navigating to: ${url}`);
    let pageHeight = 0;
    
    try {
      await page.goto(url, { 
        waitUntil: 'networkidle2',
        timeout: 60000
      });
      
      await page.waitForSelector('body', { timeout: 100000 });

      // Enhanced CSS for better text display and spacing
      await page.evaluate(() => {
        const style = document.createElement('style');
        style.textContent = `
          body {
            font-size: 140% !important;
            line-height: 1.4 !important;
            color: #333 !important;
            background-color: white !important;
            margin: 0 !important;
            padding: 20px !important;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
          }
          
          /* Ensure all text elements are readable */
          p, div, span, li, td, th, a {
            font-size: 1em !important;
            line-height: 1.4 !important;
            margin-bottom: 12px !important;
            color: #333 !important;
          }
          
          h1, h2, h3, h4, h5, h6 {
            font-weight: bold !important;
            margin-top: 20px !important;
            margin-bottom: 15px !important;
            color: #111 !important;
          }
          
          h1 { font-size: 1.6em !important; }
          h2 { font-size: 1.4em !important; }
          h3, h4, h5, h6 { font-size: 1.2em !important; }
          
          /* Hide elements that don't contribute to reading */
          header nav, .navigation, .nav-menu, .navbar, [role="banner"], [role="navigation"],
          footer, .footer, [role="contentinfo"],
          .ad, .advertisement, .banner, .sidebar, aside, .aside, .related,
          .cookie-banner, .consent-banner, .popup, .modal, .dialog,
          button, .button, [type="button"], [role="button"] {
            display: none !important;
          }
          
          /* Optimize content containers */
          article, main, .content, .post-content, .entry-content {
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          
          /* Ensure images don't break layout */
          img {
            max-width: 100% !important;
            height: auto !important;
            margin: 10px 0 !important;
          }
        `;
        document.head.appendChild(style);
      });

      await new Promise(resolve => setTimeout(resolve, 3000));
      
      pageHeight = await page.evaluate(() => {
        const bodyHeight = document.body ? document.body.scrollHeight : 0;
        const htmlHeight = document.documentElement ? document.documentElement.scrollHeight : 0;
        const offsetHeight = document.body ? document.body.offsetHeight : 0;
        
        console.log(`Body scrollHeight: ${bodyHeight}, HTML scrollHeight: ${htmlHeight}, offsetHeight: ${offsetHeight}`);
        
        return Math.max(bodyHeight, htmlHeight, offsetHeight, 1000);
      });
      
      console.log(`[Task ${taskId}] [Puppeteer] Page height determined: ${pageHeight}px`);
    } catch (navError) {
      console.error(`[Task ${taskId}] [Puppeteer] Navigation error:`, navError);
    }

    if (pageHeight < 500) {
      console.warn(`[Task ${taskId}] [Puppeteer] Warning: Page height still seems too small, using larger fallback`);
      pageHeight = 5000;
    }
    
    const framesDir = path.join(tempDir, 'frames');
    fs.mkdirSync(framesDir, { recursive: true });
    
    // Slower scrolling to better match TTS pacing
    const fps = 2; // Reduced to 2 fps for slower, more deliberate scrolling
    const totalScrollSteps = Math.min(Math.floor(durationInSeconds * fps), 200);
    
    // Calculate scroll increment with overlap to ensure smoother coverage
    // This reduces the scroll distance per frame to avoid jumping past content
    const effectivePageHeight = Math.max(pageHeight - 1200, pageHeight * 0.7); // Account for viewport height
    const scrollIncrement = effectivePageHeight / totalScrollSteps;
    
    console.log(`[Task ${taskId}] [Puppeteer] Capturing ${totalScrollSteps} frames while scrolling`);
    console.log(`[Task ${taskId}] [Puppeteer] Scroll increment: ${scrollIncrement}px per frame`);
    
    const batchSize = 10;
    for (let i = 0; i < totalScrollSteps; i += batchSize) {
      const endIndex = Math.min(i + batchSize, totalScrollSteps);
      
      for (let j = i; j < endIndex; j++) {
        try {
          // Calculate scroll position with easing for more natural movement
          const scrollProgress = j / totalScrollSteps;
          const easedProgress = scrollProgress * scrollProgress * (3 - 2 * scrollProgress); // Smooth step function
          const scrollPos = easedProgress * effectivePageHeight;
          
          await page.evaluate((pos) => {
            window.scrollTo({
              top: pos,
              behavior: 'auto'
            });
          }, scrollPos);
          
          // Longer delay to allow content to settle and be readable
          await new Promise(resolve => setTimeout(resolve, 200));
          
          await page.screenshot({ 
            path: path.join(framesDir, `frame_${j.toString().padStart(5, '0')}.jpg`) as `${string}.jpeg`,
            type: 'jpeg',
            quality: 85
          });
        } catch (frameError: unknown) {
          console.error(`[Task ${taskId}] [Puppeteer] Error capturing frame ${j}:`, frameError);
          
          if (frameError instanceof Error) {
            if (frameError.message.includes('detached Frame') || 
                frameError.message.includes('Target closed')) {
              console.log(`[Task ${taskId}] [Puppeteer] Frame detached or target closed, stopping capture`);
              break;
            }
          }
        }
        
        if (j % 10 === 0) {
          console.log(`[Task ${taskId}] [Puppeteer] Progress: Captured ${j}/${totalScrollSteps} frames (${Math.round(j/totalScrollSteps*100)}%)`);
        }
      }
      
      if (global.gc) {
        global.gc();
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    await browser.close();
    
    const outputPath = path.join(tempDir, 'screen_recording.mp4');
    console.log(`[Task ${taskId}] [FFMPEG] Creating video from frames at ${outputPath}`);
    
    const frameFiles = fs.readdirSync(framesDir);
    if (frameFiles.length === 0) {
      throw new Error('No frames were captured, cannot create video');
    }
    
    console.log(`[Task ${taskId}] [FFMPEG] Found ${frameFiles.length} frames to process`);
    
    await new Promise<void>((resolve, reject) => {
      ffmpeg()
        .input(path.join(framesDir, 'frame_%05d.jpg'))
        .inputFPS(fps)
        .outputOptions('-c:v', 'libx264')
        .outputOptions('-preset', 'ultrafast')
        .outputOptions('-crf', '23')
        .outputOptions('-pix_fmt', 'yuv420p')
        .output(outputPath)
        .on('end', () => {
          console.log(`[Task ${taskId}] [FFMPEG] Video creation complete`);
          resolve();
        })
        .on('error', (err) => {
          console.error(`[Task ${taskId}] [FFMPEG] Error creating video:`, err);
          reject(err);
        })
        .run();
    });
    
    return outputPath;
  } catch (error) {
    console.error(`[Task ${taskId}] [Puppeteer] Error during page capture:`, error);
    throw error;
  } finally {
    try {
      await browser.close();
    } catch (closeError) {
      console.error(`[Task ${taskId}] [Puppeteer] Error closing browser:`, closeError);
    }
  }
}

async function combineVideoWithAudio(videoPath: string, audioUrl: string, tempDir: string, taskId: string): Promise<string> {
  try {
    console.log(`[Task ${taskId}] [Audio] Downloading audio from: ${audioUrl}`);
    
    let audioResponse;
    try {
      audioResponse = await axios.get(audioUrl, { 
        responseType: 'arraybuffer',
        timeout: 100000,
        validateStatus: status => status < 500
      });
      
      if (audioResponse.status !== 200) {
        console.error(`[Task ${taskId}] [Audio] Failed to download audio file. Status: ${audioResponse.status}`);
        throw new Error(`Failed to download audio file. Status: ${audioResponse.status}`);
      }
    } catch (axiosError) {
      console.error(`[Task ${taskId}] [Audio] Error downloading audio:`, axiosError);
      throw new Error(`Audio download failed: ${axiosError instanceof Error ? axiosError.message : String(axiosError)}`);
    }
    
    const audioPath = path.join(tempDir, 'audio.mp3');
    
    await fs.promises.writeFile(audioPath, new Uint8Array(audioResponse.data));
    console.log(`[Task ${taskId}] [Audio] Audio downloaded and saved to: ${audioPath}`);
    
    const audioStats = await fs.promises.stat(audioPath);
    if (audioStats.size === 0) {
      throw new Error('Downloaded audio file is empty');
    }
    
    const outputPath = path.join(tempDir, 'final_video.mp4');
    console.log(`[Task ${taskId}] [FFMPEG] Combining video and audio to: ${outputPath}`);
    
    await new Promise<void>((resolve, reject) => {
      ffmpeg()
        .input(videoPath)
        .input(audioPath)
        .outputOptions('-c:v', 'copy')
        .outputOptions('-c:a', 'aac')
        .outputOptions('-shortest')
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