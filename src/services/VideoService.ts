import axios from 'axios';

// Import Service Layer Classes
import { IFileService } from './FileService';
import { IPostService } from './PostService';
import { ITaskService } from './TaskService';
import { IEmailService } from './EmailService';
import { IGPTService } from './GPTService';

// Import DAL Interfaces
import { IVideoDAL } from '../dal/VideoDAL';
import { ITaskDAL } from '../dal/TaskDAL';

// Import Models
import ITask from '../models/ITask'
import IPost from '@/models/IPost';
import { IPostWithMetadata } from '@/models/IPost';
import { VideoType } from '@/models/VideoType';
import ICaptionTiming from '@/models/ICaptionTiming'

// Import Utilities
import { stripToContent } from '@/utils/stripToContent';



const BASE_URL = process.env.NEXT_PUBLIC_APP_ENV === 'development' 
    ? 'https://dev.jlangdesigns.com' 
    : 'https://www.jlangdesigns.com';

// Define a consistent response type for video operations
export interface VideoServiceResponse {
    success: boolean;
    message: string;
    taskId?: string;
    postId?: string;
    videoId?: string;
    videoUrl?: string;
    error?: string;
    status?: string;
    duration?: number;
    fileSize?: number;
    fileName?: string;
}

interface ScriptGenerationResponse {
    success: boolean;
    script: string;
    imageQueries: string[];
    error?: string;
}

interface ImageSearchResponse {
    success: boolean;
    images: Array<{
        url: string;
        title: string;
        source: string;
    }>;
    error?: string;
}

export interface IVideoService {
    generateScrollingVideo(): Promise<VideoServiceResponse>;
    generateScriptedVideo(language?: string, voiceStyle?: string): Promise<VideoServiceResponse>;
    getVideoStatus(idParam: string): Promise<VideoServiceResponse>;
    generateVideoForPost(post: IPostWithMetadata, videoType: 'scrolling' | 'scripted', language: string,voiceStyle: string): Promise<VideoServiceResponse & { videoId?: string }>;
}

export default class VideoService implements IVideoService {
    private fileService: IFileService;
    private postService: IPostService;
    private taskService: ITaskService;
    private emailService: IEmailService;
    private gptService: IGPTService;
    private videoDAL: IVideoDAL;
    private taskDAL: ITaskDAL;

    constructor(
        fileService: IFileService, 
        postService: IPostService, 
        taskService: ITaskService, 
        emailService: IEmailService, 
        gptService: IGPTService,
        videoDAL: IVideoDAL,
        taskDAL: ITaskDAL
    ) {
        this.fileService = fileService;
        this.postService = postService;
        this.taskService = taskService;
        this.emailService = emailService;
        this.gptService = gptService;
        this.videoDAL = videoDAL;
        this.taskDAL = taskDAL;
    }

    /**
     * Generate video for a specific post ID (for dashboard use)
     * @param postId - The specific post ID to generate video for
     * @param videoType - Type of video ('scrolling' or 'scripted')
     * @param language - Language for scripted videos
     * @param voiceStyle - Voice style for audio generation
     * @returns Promise with video generation result
     */
    public async generateVideoForPost(
        post: IPostWithMetadata, 
        videoType: 'scrolling' | 'scripted', 
        language: string = 'en-US',
        voiceStyle: string = 'studio'
    ): Promise<VideoServiceResponse & { videoId?: string }> {
        try {
            console.log(`[VideoService] Generating ${videoType} video for specific post: ${post.postId} in ${language}`);

            // Check if post has content
            if (!post.content) {
                return {
                    success: false,
                    message: `Post ${post.id} has no content to generate video from`
                };
            }

            console.log(`[VideoService] Found post ${post.postId}, generating ${videoType} video...`);

            try {
                if (videoType === 'scrolling') {
                    // Generate scrolling video for specific post
                    return await this.generateScrollingVideoForPost(post);
                } else {
                    // Generate scripted video for specific post
                    return await this.generateScriptedVideoForPost(post, language, voiceStyle);
                }
            } catch (processError: any) {
                console.error(`[VideoService] Error during ${videoType} video processing for post ${post.postId}:`, processError);
                return {
                    success: false,
                    message: `Failed during ${videoType} video preparation`,
                    error: processError.message || 'Unknown processing error'
                };
            }
        } catch (error: any) {
            console.error(`[VideoService] Error generating video for post ${post.postId}:`, error);
            return {
                success: false,
                message: 'An unexpected error occurred',
                error: error.message || 'Unknown error'
            };
        }
    }

    /**
     * Generate scrolling video for a specific post (helper method)
     */
    private async generateScrollingVideoForPost(post: IPostWithMetadata): Promise<VideoServiceResponse & { videoId?: string }> {
        let videoId: string | null = null;
        
        try {
            console.log(`[VideoService] Generating scrolling video for post: ${post.postId}`);
            
            // Generate and upload audio
            if(!post.content) {
                throw new Error(`No content to generate audio with'}`);
            }
            const audioFileUrl = await this.generateAndUploadAudio(post.content, post.postId);
            console.log(`[Audio File] URL of Audio File Generated: ${audioFileUrl}`);

            // Get audio duration for scroll timing
            const audioDuration = await this.getAudioDuration(audioFileUrl);
            
            // Use the URL from the post object if it exists, otherwise construct it
            let articleUrl = '';
            if (!post.URL) {
                articleUrl = this.getArticleUrl(post.postId);
            } else if (post.URL && post.URL.includes("undefined")) {
                articleUrl = this.getArticleUrl(post.postId);
            } else {
                articleUrl = post.URL;
            }
            
            const videoFile = `videos/${post.postId}-dashboard-scrolling.mp4`;

            console.log('[VideoService] Creating video generation task...');
            
            // Create a task record via the task service
            const task = await this.taskService.createTask('video-generation', {
                articleUrl,
                audioFile: audioFileUrl,
                durationInSeconds: audioDuration,
                videoFile,
                postId: post.postId,
            });
            
            // 🚀 CREATE VIDEO RECORD IN DATABASE
            videoId = await this.createVideoRecord(
                post.postId,
                task.id,
                'scrolling',
                'en-US',
                audioFileUrl
            );
            
            console.log(`[VideoService] Created video record ${videoId} and task ${task.id}, now initiating video generation...`);
            
            // Call the generateScrollingVideo API
            const response = await axios.post(
                `${BASE_URL}/api/video/generateScrollingVideo`, 
                {
                    audioFile: audioFileUrl,
                    articleUrl: articleUrl,
                    durationInSeconds: audioDuration,
                    videoFile,
                    taskId: task.id
                },
                {
                    timeout: 300000 // 5 minute timeout for actual generation
                }
            );

            if (!response.data.success) {
                await this.updateVideoRecord(videoId, { status: 'failed' });
                throw new Error(`Video generation API request failed: ${response.data.message || 'Unknown error'}`);
            }

            // 🚀 API RETURNED SUCCESS - NOW HANDLE THE COMPLETED VIDEO
            const { videoUrl, duration, fileSize, fileName } = response.data;
            
            if (videoUrl) {
                // Update video record with completion data
                await this.updateVideoRecord(videoId, {
                    status: 'completed',
                    downloadUrl: videoUrl,
                    duration: duration || audioDuration,
                    fileSize: fileSize || 0,
                    filePath: fileName || videoFile
                });
                
                console.log(`[VideoService] Scrolling video generation completed successfully: ${videoUrl}`);
            } else {
                // API succeeded but no video URL - this is a problem
                await this.updateVideoRecord(videoId, { status: 'failed' });
                throw new Error('Video generation completed but no video URL returned');
            }

            // Update post status after successful completion
            await this.postService.addVideoToPost(post.id, videoId); // Add video ID instead of task ID
            
            console.log(`[VideoService] Scrolling video generation completed successfully: ${task.id}`);
            return {
                success: true,
                message: 'Scrolling video generation completed',
                taskId: task.id,
                videoId: videoId, // Return actual video ID
                postId: post.postId,
                videoUrl: videoUrl,
                status: 'completed'
            };
        } catch (apiError: any) {
            console.error('[VideoService] Error in scrolling video generation:', apiError);
            
            // Update video status to failed if we created a record
            if (videoId) {
                try {
                    await this.updateVideoRecord(videoId, { status: 'failed' });
                } catch (updateError) {
                    console.error('[VideoService] Failed to update video status to failed:', updateError);
                }
            }
            
            return {
                success: false,
                message: 'Failed to start scrolling video generation process',
                error: apiError.message || 'Unknown API error',
                postId: post.postId,
                videoId: videoId || undefined
            };
        }
    }

    /**
     * Generate scripted video for a specific post (helper method)
     */
    /**
 * Generate scripted video for a specific post (PROPER ORCHESTRATION)
 */
private async generateScriptedVideoForPost(
    post: IPostWithMetadata, 
    language: string = 'en-US', 
    voiceStyle: string = 'studio'
): Promise<VideoServiceResponse & { videoId?: string }> {
    let videoId: string | null = null;
    
    try {
        console.log(`[VideoService] Generating scripted video for post: ${post.postId} in ${language}`);
        
        if(!post.content) {
            throw new Error(`No content to generate audio with`);
        }

        // Steps 1-6: Generate all the assets
        const scriptResult = await this.generateScriptAndImageQueries(post.content, post.id || 'Blog Post', language);
        if (!scriptResult.success) throw new Error(`Script generation failed: ${scriptResult.error}`);

        const imageResult = await this.searchImages(scriptResult.imageQueries);
        const audioFileUrl = await this.generateAndUploadAudio(scriptResult.script, `${post.postId}-scripted-${language.replace('-', '_')}`, language, voiceStyle);
        const audioDuration = await this.getAudioDuration(audioFileUrl);
        const captionResult = await this.generateCaptionsWithTiming(audioFileUrl, post.postId, language);
        const videoFile = `videos/${post.postId}-scripted-${language.replace('-', '_')}.mp4`;

        // Create task record
        const task = await this.taskService.createTask('scripted-video-generation', {
            script: scriptResult.script,
            images: imageResult.images,
            audioFile: audioFileUrl,
            durationInSeconds: audioDuration,
            videoFile,
            postId: post.postId,
            language,
            captions: captionResult.success ? captionResult.captions : undefined,
        });
        
        // 🚀 CREATE VIDEO RECORD IN DATABASE
        videoId = await this.createVideoRecord(
            post.postId,
            task.id,
            'scripted',
            language,
            audioFileUrl
        );
        
        console.log(`[VideoService] Created video record ${videoId}, now starting video generation...`);
        
        // Call the API to generate the video (API just processes and returns the file data)
        const response = await axios.post(
            `${BASE_URL}/api/video/generateScriptedVideo`, 
            {
                script: scriptResult.script,
                images: imageResult.images,
                audioFile: audioFileUrl,
                durationInSeconds: audioDuration,
                videoFile,
                taskId: task.id,
                language,
                captions: captionResult.success ? captionResult.captions : undefined
            },
            {
                timeout: 300000 // 5 minute timeout for actual generation
            }
        );

        if (!response.data.success) {
            await this.updateVideoRecord(videoId, { status: 'failed' });
            throw new Error(`Video generation failed: ${response.data.message || 'Unknown error'}`);
        }

        // 🚀 API RETURNED SUCCESS - NOW HANDLE THE COMPLETED VIDEO
        const { videoUrl, duration, fileSize, fileName } = response.data;
        
        if (videoUrl) {
            // Update video record with completion data
            await this.updateVideoRecord(videoId, {
                status: 'completed',
                downloadUrl: videoUrl,
                duration: duration || audioDuration,
                fileSize: fileSize || 0,
                filePath: fileName || videoFile
            });
            
            console.log(`[VideoService] Scripted video generation completed successfully: ${videoUrl}`);
        } else {
            // API succeeded but no video URL - this is a problem
            await this.updateVideoRecord(videoId, { status: 'failed' });
            throw new Error('Video generation completed but no video URL returned');
        }

        // Update post with video ID
        await this.postService.addVideoToPost(post.id, videoId);
        
        return {
            success: true,
            message: `Scripted video generation completed in ${language}`,
            taskId: task.id,
            videoId: videoId,
            postId: post.postId,
            videoUrl: videoUrl,
            status: 'completed'
        };
        
    } catch (error: any) {
        console.error('[VideoService] Error in scripted video generation:', error);
        
        // Update video status to failed if we created a record
        if (videoId) {
            try {
                await this.updateVideoRecord(videoId, { status: 'failed' });
            } catch (updateError) {
                console.error('[VideoService] Failed to update video status to failed:', updateError);
            }
        }
        
        return {
            success: false,
            message: 'Failed to generate scripted video',
            error: error.message || 'Unknown error',
            postId: post.postId,
            videoId: videoId || undefined
        };
    }
}
    public async generateAndUploadAudio(text: string, videoId: string, language: string = 'en-US', voiceStyle: string = 'neural'): Promise<string> {
        // Apply the text processing
        const processedText = stripToContent(text);
        
        // Ensure we're not sending empty text
        if (!processedText || processedText.trim().length < 10) {
            console.log(`[VideoService] Warning: Text too short after processing: "${processedText}"`);
            // Use original text if processed text is too short
            text = text.trim();
        } else {
            text = processedText;
        }
        
        console.log(`[VideoService] Sending TTS request with text length: ${text.length} chars, videoId: ${videoId}, language: ${language}, voiceStyle: ${voiceStyle}`);
    
        // Call enhanced TTS API with language and voice style
        const ttsResponse = await axios.post(`${BASE_URL}/api/video/generateTextToSpeech`, 
            { 
                text, 
                videoId,
                language,
                voiceStyle
            },
            { headers: { 'Content-Type': 'application/json' } }
        );        
    
        if (!ttsResponse.data || !ttsResponse.data.audioBase64) {
            throw new Error('Failed to generate speech.');
        }
    
        console.log(`[TTS] Speech generated using ${ttsResponse.data.voiceType || 'unknown'} voice (${ttsResponse.data.voiceName || 'unknown'}). Uploading to Firebase...`);
        
        // Use fileService.uploadFile to upload the audio
        const uploadResponse = await this.fileService.uploadFile(
            { name: videoId + '.mp3', data: ttsResponse.data.audioBase64 },
            { type: 'audio/mp3', category: 'audio' }
        );
        
        if (!uploadResponse || !uploadResponse.url) {
            throw new Error('File upload failed or URL not returned.');
        }
        
        return uploadResponse.url;
    }

    // NEW: Generate captions with word-level timing using dedicated API endpoint
    private async generateCaptionsWithTiming(audioUrl: string, taskId: string, language: string = 'en-US'): Promise<{
        success: boolean;
        captions?: ICaptionTiming[];
        error?: string;
    }> {
        try {
            console.log(`[VideoService] Generating captions with timing from audio: ${audioUrl}, language: ${language}`);
            
            // Call the dedicated Whisper API endpoint with language
            const response = await axios.post(`${BASE_URL}/api/video/generateCaptions`, {
                audioUrl,
                taskId,
                language  // Pass language to Whisper for better accuracy
            }, {
                timeout: 120000 // 2 minute timeout for Whisper processing
            });
            
            if (!response.data.success) {
                throw new Error(`Caption generation failed: ${response.data.error || 'Unknown error'}`);
            }
            
            console.log(`[VideoService] Generated ${response.data.captionCount || response.data.wordCount} captions in ${language}`);
            
            return {
                success: true,
                captions: response.data.captions
            };
            
        } catch (error: any) {
            console.error(`[VideoService] Caption generation error:`, error);
            return {
                success: false,
                error: error.response?.data?.details || error.message || 'Failed to generate captions'
            };
        }
    }
    
    private getArticleUrl(slug: string): string {
        const baseUrl = BASE_URL || 'https://www.wellnessworldwideweb.com';
        return `${baseUrl}/blog/${slug}`;
    }

    private async getAudioDuration(audioUrl: string): Promise<number> {
        try {
            const response = await axios.post(`${BASE_URL}/api/video/getAudioDuration`, {
                audioUrl
            });
            
            return response.data.durationInSeconds;
        } catch (error) {
            console.error('Failed to get audio duration:', error);
            // Return a default duration if the API fails
            return 30; // 30 seconds as fallback
        }
    }
    
    public async generateScrollingVideo(): Promise<VideoServiceResponse> {
        let videoId: string | null = null;
        
        try {
            console.log('[VideoService] Fetching next post...');
            const post = await this.postService.getNextPost();
            
            if (!post) {
                console.log('[VideoService] No posts available.');
                return { 
                    success: false, 
                    message: 'No posts available for video generation'
                };
            }

            console.log(`[VideoService] Generating speech for post: ${post.postId}`);
            
            // Check if post has content
            if (!post.content) {
                return {
                    success: false,
                    message: `Post ${post.postId} has no content to generate speech from`,
                    postId: post.postId
                };
            }
            
            console.log(`[Debug] Post Content length: ${post.content.length} characters`);
            
            try {
                // Generate and upload audio
                const audioFileUrl = await this.generateAndUploadAudio(post.content, post.postId);
                console.log(`[Audio File] URL of Audio File Generated: ${audioFileUrl}`);

                // Get audio duration for scroll timing
                const audioDuration = await this.getAudioDuration(audioFileUrl);
                
                // Use the URL from the post object if it exists, otherwise construct it
                var articleUrl = '';
                if(!post.URL) {
                    articleUrl = this.getArticleUrl(post.postId);
                } else if(post.URL && post.URL.includes("undefined")) {
                    articleUrl = this.getArticleUrl(post.postId);
                } else {
                    articleUrl = post.URL;
                }
                
                const videoFile = `videos/${post.postId}.mp4`;

                console.log('[VideoService] Creating video generation task...');
                
                // First, create a task record via the task service
                const task = await this.taskService.createTask('video-generation', {
                    articleUrl,
                    audioFile: audioFileUrl,
                    durationInSeconds: audioDuration,
                    videoFile,
                    postId: post.postId
                });
                
                // 🚀 CREATE VIDEO RECORD IN DATABASE
                videoId = await this.createVideoRecord(
                    post.postId,
                    task.id,
                    'scrolling',
                    'en-US',
                    audioFileUrl
                );
                
                console.log(`[VideoService] Created video record ${videoId} and task ${task.id}, now initiating video generation...`);
                
                try {
                    // Now call the generateScrollingVideo API to start processing,
                    // but pass the task ID for tracking
                    const response = await axios.post(
                        `${BASE_URL}/api/video/generateScrollingVideo`, 
                        {
                            audioFile: audioFileUrl,
                            articleUrl: articleUrl,
                            durationInSeconds: audioDuration,
                            videoFile,
                            taskId: task.id
                        },
                        {
                            timeout: 300000 // 5 minute timeout for actual generation
                        }
                    );
            
                    if (!response.data.success) {
                        await this.updateVideoRecord(videoId, { status: 'failed' });
                        throw new Error(`Video generation API request failed: ${response.data.message || 'Unknown error'}`);
                    }
            
                    // 🚀 API RETURNED SUCCESS - NOW HANDLE THE COMPLETED VIDEO
                    const { videoUrl, duration, fileSize, fileName } = response.data;
                    
                    if (videoUrl) {
                        // Update video record with completion data
                        await this.updateVideoRecord(videoId, {
                            status: 'completed',
                            downloadUrl: videoUrl,
                            duration: duration || audioDuration,
                            fileSize: fileSize || 0,
                            filePath: fileName || videoFile
                        });
                        
                        console.log(`[VideoService] Scrolling video generation completed successfully: ${videoUrl}`);
                    } else {
                        // API succeeded but no video URL - this is a problem
                        await this.updateVideoRecord(videoId, { status: 'failed' });
                        throw new Error('Video generation completed but no video URL returned');
                    }
            
                    // Update post status after successful completion
                    await this.postService.addVideoToPost(post.postId, videoId);
            
                    console.log(`[VideoService] Video generation completed successfully: ${task.id}`);
                    return {
                        success: true,
                        message: 'Video generation completed',
                        taskId: task.id,
                        videoId: videoId,
                        postId: post.postId,
                        videoUrl: videoUrl,
                        status: 'completed'
                    };
                } catch (apiError: any) {
                    console.error('[VideoService] Error calling video generation API:', apiError);
                    
                    // Update task status to failed since API call failed
                    await this.taskService.updateTaskStatus(task.id, 'failed', {
                        error: apiError.message || 'API Error during task initiation'
                    });
                    
                    // Update video status to failed if we created a record
                    if (videoId) {
                        try {
                            await this.updateVideoRecord(videoId, { status: 'failed' });
                        } catch (updateError) {
                            console.error('[VideoService] Failed to update video status to failed:', updateError);
                        }
                    }
                    
                    return {
                        success: false,
                        message: 'Failed to start video generation process',
                        error: apiError.message || 'Unknown API error',
                        taskId: task.id,
                        videoId: videoId || undefined,
                        postId: post.postId
                    };
                }
            } catch (processError: any) {
                console.error('[VideoService] Error during pre-processing:', processError);
                
                // Update video status to failed if we created a record
                if (videoId) {
                    try {
                        await this.updateVideoRecord(videoId, { status: 'failed' });
                    } catch (updateError) {
                        console.error('[VideoService] Failed to update video status to failed:', updateError);
                    }
                }
                
                return {
                    success: false,
                    message: 'Failed during video preparation',
                    error: processError.message || 'Unknown processing error',
                    postId: post.postId,
                    videoId: videoId || undefined
                };
            }
        } catch (error: any) {
            console.error('[VideoService] Error:', error);
            
            // Update video status to failed if we created a record
            if (videoId) {
                try {
                    await this.updateVideoRecord(videoId, { status: 'failed' });
                } catch (updateError) {
                    console.error('[VideoService] Failed to update video status to failed:', updateError);
                }
            }
            
            return {
                success: false,
                message: 'An unexpected error occurred',
                error: error.message || 'Unknown error',
                videoId: videoId || undefined
            };
        }
    }

    // Method to get the status of a video generation task
    // Can accept either taskId or postId
    public async getVideoStatus(idParam: string): Promise<VideoServiceResponse> {
        try {
            // Get tasks for this post/task
            let tasks: ITask[] = [];
            
            // Check if the parameter is a task ID or post ID
            if (idParam.length === 36) { // Assuming UUID length for task IDs
                const task = await this.taskService.getTaskById(idParam);
                if (task) tasks = [task];
            } else {
                // Treat as post ID
                tasks = await this.taskService.getTasksByPostId(idParam);
            }
            
            if (!tasks || tasks.length === 0) {
                return {
                    success: false,
                    message: `No video generation tasks found for ID: ${idParam}`,
                    postId: idParam
                };
            }
            
            // Get the most recent task
            const latestTask = tasks.sort((a, b) => 
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            )[0];
            
            // If the task is completed, get the video URL
            const videoUrl = latestTask.result?.videoUrl;
            
            // If the task is completed but we have no record of sending an email, send it
            if (latestTask.status === 'completed' && videoUrl && !latestTask?.emailSent) {
                // Send completion email
                const emailSent = await this.emailService.sendVideoCompletionEmail(
                    process.env.EMAIL_USER ? process.env.EMAIL_USER : 'bobshirley27@gmail.com',
                    videoUrl,
                    latestTask.config.postId
                );
                
                if (emailSent) {
                    // Update task to indicate email was sent
                    await this.taskService.updateTaskStatus(latestTask.id, 'completed', {
                        ...latestTask.result,
                        emailSent: true
                    });
                    
                    console.log(`[VideoService] Email notification sent for task ${latestTask.id}`);
                }
            }
            
            // If we have no video URL but the task is completed, log a warning
            if (latestTask.status === 'completed' && !videoUrl) {
                console.warn(`[VideoService] Task ${latestTask.id} is completed but has no video URL`);
            }
            
            return {
                success: true,
                taskId: latestTask.id,
                status: latestTask.status,
                videoUrl,
                error: latestTask.result?.error,
                message: `Video status: ${latestTask.status}`,
                postId: latestTask.config.postId
            };
        } catch (error: any) {
            console.error(`[VideoService] Error getting video status for ID ${idParam}:`, error);
            return {
                success: false,
                message: 'Failed to get video status',
                error: error.message || 'Unknown error'
            };
        }
    }

    // Generate script and image queries from blog post content
    private async generateScriptAndImageQueries(content: string, title: string, language: string = 'en-US'): Promise<ScriptGenerationResponse> {
        try {
            // Determine script language and style based on language code
            const isEnglish = language.startsWith('en');
            const languageName = this.getLanguageName(language);
            
            const prompt = `
Based on the following blog post content, create a compelling video script and suggest relevant image search queries.

Title: ${title}
Content: ${content}
Target Language: ${languageName}

Please provide:
1. A conversational video script (60-90 seconds when spoken) that captures the key points${isEnglish ? '' : ` in ${languageName}`}
2. 5-7 specific image search queries that would provide relevant, real images for this content

Format your response as JSON:
{
    "script": "Your video script here...",
    "imageQueries": ["query1", "query2", "query3", ...]
}

The script should be engaging, informative, and suitable for narration${isEnglish ? '' : ` in ${languageName}`}. The image queries should be specific enough to find relevant, high-quality real images (not generic stock photos).
            `.trim();
    
            // Use your existing GPT service instead of creating a new API endpoint
            const response = await this.gptService.communicateWithGPT(prompt, "gpt-4");
    
            if (!response) {
                throw new Error('No response from GPT service');
            }
    
            // Parse the JSON response
            const parsed = JSON.parse(response);
            
            return {
                success: true,
                script: parsed.script,
                imageQueries: parsed.imageQueries
            };
        } catch (error: any) {
            console.error('[VideoService] Script generation error:', error);
            return {
                success: false,
                script: '',
                imageQueries: [],
                error: error.message || 'Failed to generate script'
            };
        }
    }

    // Helper method to get language name from code
    private getLanguageName(languageCode: string): string {
        const languageMap: Record<string, string> = {
            'en-US': 'English (US)',
            'en-GB': 'English (UK)',
            'en-AU': 'English (Australia)',
            'es-US': 'Spanish (US)',
            'es-ES': 'Spanish (Spain)',
            'fr-FR': 'French',
            'de-DE': 'German',
            'it-IT': 'Italian',
            'pt-BR': 'Portuguese (Brazil)',
            'ja-JP': 'Japanese',
            'ko-KR': 'Korean',
            'zh-CN': 'Chinese (Mandarin)',
            'hi-IN': 'Hindi'
        };
        return languageMap[languageCode] || 'English';
    }

    // Search for real images using Unsplash API
    private async searchImages(queries: string[]): Promise<ImageSearchResponse> {
        try {
            const allImages: Array<{url: string, title: string, source: string}> = [];
            const unsplashKey = process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY;
            
            if (!unsplashKey) {
                console.warn('[VideoService] No Unsplash API key found, using more placeholder images');
                // Return more placeholder images for longer videos
                return {
                    success: true,
                    images: Array.from({length: 20}, (_, index) => ({
                        url: `https://picsum.photos/1080/1920?random=${index + Date.now()}`,
                        title: `Image ${index + 1}`,
                        source: 'Lorem Picsum'
                    }))
                };
            }
    
            // Use the first query as the main search term, or combine a few
            const mainQuery = queries.length > 0 ? queries.slice(0, 3).join(' ') : 'wellness health';
            
            console.log(`[VideoService] Searching for 20 images with query: "${mainQuery}"`);
    
            try {
                const response = await axios.get(`https://api.unsplash.com/search/photos`, {
                    params: {
                        query: mainQuery,
                        per_page: 20, // Get 20 images in one request
                        orientation: 'portrait' // Better for TikTok vertical format
                    },
                    headers: {
                        'Authorization': `Client-ID ${unsplashKey}`
                    }
                });
    
                if (response.data.results && response.data.results.length > 0) {
                    response.data.results.forEach((img: any) => {
                        allImages.push({
                            url: img.urls.regular,
                            title: img.alt_description || mainQuery,
                            source: `Unsplash - ${img.user.name}`
                        });
                    });
                    
                    console.log(`[VideoService] Successfully found ${allImages.length} images from Unsplash`);
                } else {
                    console.warn(`[VideoService] No images found for query: ${mainQuery}`);
                }
            } catch (queryError) {
                console.warn(`[VideoService] Failed to search images for query: ${mainQuery}`, queryError);
            }
    
            // If we didn't get enough images, fall back to placeholder images
            if (allImages.length < 10) {
                console.warn(`[VideoService] Only got ${allImages.length} images, adding placeholder images`);
                const placeholderCount = 20 - allImages.length;
                for (let i = 0; i < placeholderCount; i++) {
                    allImages.push({
                        url: `https://picsum.photos/1080/1920?random=${Date.now() + i}`,
                        title: `Placeholder Image ${i + 1}`,
                        source: 'Lorem Picsum'
                    });
                }
            }
    
            return {
                success: true,
                images: allImages.slice(0, 20) // Ensure we return exactly 20 images
            };
        } catch (error: any) {
            console.error('[VideoService] Image search error:', error);
            
            // Fallback to placeholder images on any error
            return {
                success: true,
                images: Array.from({length: 20}, (_, index) => ({
                    url: `https://picsum.photos/1080/1920?random=${Date.now() + index}`,
                    title: `Fallback Image ${index + 1}`,
                    source: 'Lorem Picsum'
                }))
            };
        }
    }

    // NEW METHOD: Generate scripted videos with images
    public async generateScriptedVideo(language: string = 'en-US', voiceStyle: string = 'studio'): Promise<VideoServiceResponse> {
        let videoId: string | null = null;
        
        try {
            console.log(`[VideoService] Fetching next post for scripted video in ${language}...`);
            const post = await this.postService.getNextPost();
            
            if (!post) {
                console.log('[VideoService] No posts available.');
                return { 
                    success: false, 
                    message: 'No posts available for video generation'
                };
            }

            if (!post.content) {
                return {
                    success: false,
                    message: `Post ${post.postId} has no content to generate script from`,
                    postId: post.postId
                };
            }

            console.log(`[VideoService] Generating scripted video for post: ${post.postId} in ${language} with ${voiceStyle} voice`);
            
            try {
                // Step 1: Generate script and image queries with language consideration
                console.log('[VideoService] Step 1: Generating script and image queries...');
                const scriptResult = await this.generateScriptAndImageQueries(
                    post.content, 
                    post.id || 'Blog Post',
                    language
                );
                
                if (!scriptResult.success) {
                    throw new Error(`Script generation failed: ${scriptResult.error}`);
                }

                // Step 2: Search for relevant images
                console.log('[VideoService] Step 2: Searching for relevant images...');
                const imageResult = await this.searchImages(scriptResult.imageQueries);
                
                if (!imageResult.success) {
                    console.warn('[VideoService] Image search failed, proceeding with script only');
                }

                // Step 3: Generate audio from script with specified language and voice style
                console.log('[VideoService] Step 3: Generating audio from script...');
                const audioFileUrl = await this.generateAndUploadAudio(
                    scriptResult.script, 
                    `${post.postId}-scripted-${language.replace('-', '_')}`,
                    language,
                    voiceStyle
                );
                
                // Step 4: Get audio duration
                const audioDuration = await this.getAudioDuration(audioFileUrl);
                
                // Step 5: Generate word-level captions from audio with language
                console.log('[VideoService] Step 5: Generating word-level captions...');
                const captionResult = await this.generateCaptionsWithTiming(audioFileUrl, post.postId, language);
                
                // Step 6: Prepare video file path with language suffix
                const videoFile = `videos/${post.postId}-v2-${language.replace('-', '_')}.mp4`;

                console.log('[VideoService] Creating scripted video generation task...');
                
                // Create a task record for scripted video including captions and language info
                const task = await this.taskService.createTask('scripted-video-generation', {
                    script: scriptResult.script,
                    images: imageResult.images,
                    audioFile: audioFileUrl,
                    durationInSeconds: audioDuration,
                    videoFile,
                    postId: post.postId,
                    language,
                    captions: captionResult.success ? captionResult.captions : undefined
                });
                
                // 🚀 CREATE VIDEO RECORD IN DATABASE
                videoId = await this.createVideoRecord(
                    post.postId,
                    task.id,
                    'scripted',
                    language,
                    audioFileUrl
                );
                
                console.log(`[VideoService] Created video record ${videoId} and scripted video task ${task.id}, now initiating video generation...`);
                
                try {
                    // Call the new scripted video generation API endpoint with captions and language
                    const response = await axios.post(
                        `${BASE_URL}/api/video/generateScriptedVideo`, 
                        {
                            script: scriptResult.script,
                            images: imageResult.images,
                            audioFile: audioFileUrl,
                            durationInSeconds: audioDuration,
                            videoFile,
                            taskId: task.id,
                            language,
                            captions: captionResult.success ? captionResult.captions : undefined
                        },
                        {
                            timeout: 300000 // 5 minute timeout for actual generation
                        }
                    );
            
                    if (!response.data.success) {
                        await this.updateVideoRecord(videoId, { status: 'failed' });
                        throw new Error(`Scripted video generation API request failed: ${response.data.message || 'Unknown error'}`);
                    }
            
                    // 🚀 API RETURNED SUCCESS - NOW HANDLE THE COMPLETED VIDEO
                    const { videoUrl, duration, fileSize, fileName } = response.data;
                    
                    if (videoUrl) {
                        // Update video record with completion data
                        await this.updateVideoRecord(videoId, {
                            status: 'completed',
                            downloadUrl: videoUrl,
                            duration: duration || audioDuration,
                            fileSize: fileSize || 0,
                            filePath: fileName || videoFile
                        });
                        
                        console.log(`[VideoService] Scripted video generation completed successfully: ${videoUrl}`);
                    } else {
                        // API succeeded but no video URL - this is a problem
                        await this.updateVideoRecord(videoId, { status: 'failed' });
                        throw new Error('Video generation completed but no video URL returned');
                    }
            
                    // Update post status after successful completion
                    await this.postService.addVideoToPost(post.postId, videoId);
            
                    console.log(`[VideoService] Scripted video generation completed successfully: ${task.id}`);
                    return {
                        success: true,
                        message: `Scripted video generation completed in ${language}`,
                        taskId: task.id,
                        videoId: videoId,
                        postId: post.postId,
                        videoUrl: videoUrl,
                        status: 'completed'
                    };
                } catch (apiError: any) {
                    console.error('[VideoService] Error calling scripted video generation API:', apiError);
                    
                    // Update task status to failed since API call failed
                    await this.taskService.updateTaskStatus(task.id, 'failed', {
                        error: apiError.message || 'API Error during scripted video task initiation'
                    });
                    
                    // Update video status to failed if we created a record
                    try {
                        await this.updateVideoRecord(videoId, { status: 'failed' });
                    } catch (updateError) {
                        console.error('[VideoService] Failed to update video status to failed:', updateError);
                    }
                    
                    return {
                        success: false,
                        message: 'Failed to start scripted video generation process',
                        error: apiError.message || 'Unknown API error',
                        taskId: task.id,
                        videoId: videoId,
                        postId: post.postId
                    };
                }
            } catch (processError: any) {
                console.error('[VideoService] Error during scripted video pre-processing:', processError);
                
                // Update video status to failed if we created a record
                if (videoId) {
                    try {
                        await this.updateVideoRecord(videoId, { status: 'failed' });
                    } catch (updateError) {
                        console.error('[VideoService] Failed to update video status to failed:', updateError);
                    }
                }
                
                return {
                    success: false,
                    message: 'Failed during scripted video preparation',
                    error: processError.message || 'Unknown processing error',
                    postId: post.postId,
                    videoId: videoId || undefined
                };
            }
        } catch (error: any) {
            console.error('[VideoService] Scripted video error:', error);
            
            // Update video status to failed if we created a record
            if (videoId) {
                try {
                    await this.updateVideoRecord(videoId, { status: 'failed' });
                } catch (updateError) {
                    console.error('[VideoService] Failed to update video status to failed:', updateError);
                }
            }
            
            return {
                success: false,
                message: 'An unexpected error occurred during scripted video generation',
                error: error.message || 'Unknown error',
                videoId: videoId || undefined
            };
        }
    }

    /**
     * Create a video record in the database
     */
    private async createVideoRecord(
        postId: string,
        taskId: string,
        type: 'scrolling' | 'scripted',
        language?: string,
        audioFileUrl?: string
    ): Promise<string> {
        try {
            const videoId = `vid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            
            const videoData = {
                id: videoId,
                postId,
                type,
                language: language || 'en-US',
                audioFile: audioFileUrl,
                taskId,
                status: 'processing' as const,
                createdAt: new Date(),
                updatedAt: new Date(),
                fileName: `${postId}-${type}-${language?.replace('-', '_') || 'en_US'}.mp4`,
                format: 'mp4',
                resolution: '1080x1920'
            };

            // Use the injected VideoDAL
            await this.videoDAL.createVideo(videoData);

            console.log(`[VideoService] Created video record: ${videoId}`);
            return videoId;
        } catch (error: any) {
            console.error('[VideoService] Error creating video record:', error);
            throw error;
        }
    }

    /**
     * Update video record status and metadata
     */
    private async updateVideoRecord(
        videoId: string, 
        updates: {
            status?: 'pending' | 'processing' | 'completed' | 'failed';
            downloadUrl?: string;
            duration?: number;
            fileSize?: number;
            filePath?: string;
        }
    ): Promise<void> {
        try {
            const updateData = {
                ...updates,
                updatedAt: new Date()
            };

            // Use the injected VideoDAL
            await this.videoDAL.updateVideo(videoId, updateData);

            console.log(`[VideoService] Updated video record: ${videoId}`);
        } catch (error: any) {
            console.error(`[VideoService] Error updating video record ${videoId}:`, error);
            throw error;
        }
    }
}