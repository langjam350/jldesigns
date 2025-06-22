import axios from 'axios';

// Import DAL Interfaces
import { IVideoDAL } from '../dal/VideoDAL';

// Import Models
import { IVideo } from '../models/IVideo';
import { VideoType } from '../models/VideoType';
import ICaptionTiming from '../models/ICaptionTiming';
import IPost from '../models/IPost';

const BASE_URL = process.env.NEXT_PUBLIC_APP_ENV === 'development' 
    ? 'http://localhost:4000' 
    : 'https://jldesigns.vercel.app';

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
    generateScrollingVideo(post: IPost): Promise<VideoServiceResponse>;
    generateScriptedVideo(post: IPost, language?: string, voiceStyle?: string): Promise<VideoServiceResponse>;
    getVideoStatus(videoId: string): Promise<VideoServiceResponse>;
    generateVideoForPost(post: IPost, videoType: 'scrolling' | 'scripted', language: string, voiceStyle: string): Promise<VideoServiceResponse & { videoId?: string }>;
}

export default class VideoService implements IVideoService {
    private videoDAL: IVideoDAL;

    constructor(videoDAL: IVideoDAL) {
        this.videoDAL = videoDAL;
    }

    /**
     * Generate video for a specific blog post
     */
    public async generateVideoForPost(
        post: IPost, 
        videoType: 'scrolling' | 'scripted', 
        language: string = 'en-US',
        voiceStyle: string = 'studio'
    ): Promise<VideoServiceResponse & { videoId?: string }> {
        try {
            console.log(`[VideoService] Generating ${videoType} video for post: ${post.postId} in ${language}`);

            if (!post.content) {
                return {
                    success: false,
                    message: `Post ${post.postId} has no content to generate video from`
                };
            }

            if (videoType === 'scrolling') {
                return await this.generateScrollingVideo(post);
            } else {
                return await this.generateScriptedVideo(post, language, voiceStyle);
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
     * Generate scrolling video for a blog post
     */
    public async generateScrollingVideo(post: IPost): Promise<VideoServiceResponse> {
        let videoId: string | null = null;
        
        try {
            console.log(`[VideoService] Generating scrolling video for post: ${post.postId}`);
            
            // Generate and upload audio
            const audioFileUrl = await this.generateAndUploadAudio(post.content!, post.postId);
            console.log(`[Audio File] URL of Audio File Generated: ${audioFileUrl}`);

            // Get audio duration for scroll timing
            const audioDuration = await this.getAudioDuration(audioFileUrl);
            
            // Use existing URL or construct article URL
            const articleUrl = post.URL || `${BASE_URL}/posts/${post.slug || post.postId}`;
            const videoFile = `videos/${post.postId}-scrolling.mp4`;
            
            // Create video record in database
            videoId = await this.createVideoRecord(
                post.postId,
                'scrolling',
                'en-US',
                audioFileUrl
            );
            
            console.log(`[VideoService] Created video record ${videoId}, now initiating scrolling video generation...`);
            
            // Call the generateScrollingVideo API
            const response = await axios.post(
                `${BASE_URL}/api/video/generateScrollingVideo`, 
                {
                    audioFile: audioFileUrl,
                    articleUrl: articleUrl,
                    durationInSeconds: audioDuration,
                    videoFile,
                    videoId: videoId
                },
                {
                    timeout: 300000 // 5 minute timeout
                }
            );

            if (!response.data.success) {
                await this.updateVideoRecord(videoId, { status: 'failed' });
                throw new Error(`Video generation API request failed: ${response.data.message || 'Unknown error'}`);
            }

            // Update video record with completion data
            const { videoUrl, duration, fileSize, fileName } = response.data;
            
            if (videoUrl) {
                await this.updateVideoRecord(videoId, {
                    status: 'completed',
                    downloadUrl: videoUrl,
                    duration: duration || audioDuration,
                    fileSize: fileSize || 0,
                    filePath: fileName || videoFile
                });
                
                console.log(`[VideoService] Scrolling video generation completed successfully: ${videoUrl}`);
            } else {
                await this.updateVideoRecord(videoId, { status: 'failed' });
                throw new Error('Video generation completed but no video URL returned');
            }
            
            return {
                success: true,
                message: 'Scrolling video generation completed',
                videoId: videoId,
                postId: post.postId,
                videoUrl: videoUrl,
                status: 'completed'
            };
        } catch (error: any) {
            console.error('[VideoService] Error in scrolling video generation:', error);
            
            if (videoId) {
                try {
                    await this.updateVideoRecord(videoId, { status: 'failed' });
                } catch (updateError) {
                    console.error('[VideoService] Failed to update video status to failed:', updateError);
                }
            }
            
            return {
                success: false,
                message: 'Failed to generate scrolling video',
                error: error.message || 'Unknown error',
                postId: post.postId,
                videoId: videoId || undefined
            };
        }
    }

    /**
     * Generate scripted video for a blog post
     */
    public async generateScriptedVideo(
        post: IPost, 
        language: string = 'en-US', 
        voiceStyle: string = 'studio'
    ): Promise<VideoServiceResponse> {
        let videoId: string | null = null;
        
        try {
            console.log(`[VideoService] Generating scripted video for post: ${post.postId} in ${language}`);
            
            if (!post.content) {
                throw new Error('No content to generate video from');
            }

            // Generate script and image queries
            const scriptResult = await this.generateScriptAndImageQueries(post.content, post.title || post.postId, language);
            if (!scriptResult.success) {
                throw new Error(`Script generation failed: ${scriptResult.error}`);
            }

            // Search for images
            const imageResult = await this.searchImages(scriptResult.imageQueries);

            // Generate audio from script
            const audioFileUrl = await this.generateAndUploadAudio(
                scriptResult.script, 
                `${post.postId}-scripted-${language.replace('-', '_')}`,
                language,
                voiceStyle
            );

            // Get audio duration
            const audioDuration = await this.getAudioDuration(audioFileUrl);

            // Generate captions
            const captionResult = await this.generateCaptionsWithTiming(audioFileUrl, post.postId, language);

            const videoFile = `videos/${post.postId}-scripted-${language.replace('-', '_')}.mp4`;
            
            // Create video record
            videoId = await this.createVideoRecord(
                post.postId,
                'scripted',
                language,
                audioFileUrl
            );
            
            console.log(`[VideoService] Created video record ${videoId}, now starting scripted video generation...`);
            
            // Call the API to generate the video
            const response = await axios.post(
                `${BASE_URL}/api/video/generateScriptedVideo`, 
                {
                    script: scriptResult.script,
                    images: imageResult.images,
                    audioFile: audioFileUrl,
                    durationInSeconds: audioDuration,
                    videoFile,
                    videoId: videoId,
                    language,
                    captions: captionResult.success ? captionResult.captions : undefined
                },
                {
                    timeout: 300000 // 5 minute timeout
                }
            );

            if (!response.data.success) {
                await this.updateVideoRecord(videoId, { status: 'failed' });
                throw new Error(`Video generation failed: ${response.data.message || 'Unknown error'}`);
            }

            // Update video record with completion data
            const { videoUrl, duration, fileSize, fileName } = response.data;
            
            if (videoUrl) {
                await this.updateVideoRecord(videoId, {
                    status: 'completed',
                    downloadUrl: videoUrl,
                    duration: duration || audioDuration,
                    fileSize: fileSize || 0,
                    filePath: fileName || videoFile
                });
                
                console.log(`[VideoService] Scripted video generation completed successfully: ${videoUrl}`);
            } else {
                await this.updateVideoRecord(videoId, { status: 'failed' });
                throw new Error('Video generation completed but no video URL returned');
            }
            
            return {
                success: true,
                message: `Scripted video generation completed in ${language}`,
                videoId: videoId,
                postId: post.postId,
                videoUrl: videoUrl,
                status: 'completed'
            };
            
        } catch (error: any) {
            console.error('[VideoService] Error in scripted video generation:', error);
            
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

    /**
     * Get video status
     */
    public async getVideoStatus(videoId: string): Promise<VideoServiceResponse> {
        try {
            const video = await this.videoDAL.getVideoById(videoId);
            
            if (!video) {
                return {
                    success: false,
                    message: `Video ${videoId} not found`
                };
            }
            
            return {
                success: true,
                message: `Video status: ${video.status}`,
                videoId: video.id,
                status: video.status,
                videoUrl: video.downloadUrl,
                postId: video.postId
            };
        } catch (error: any) {
            console.error(`[VideoService] Error getting video status for ${videoId}:`, error);
            return {
                success: false,
                message: 'Failed to get video status',
                error: error.message || 'Unknown error'
            };
        }
    }

    // Helper methods
    private async generateAndUploadAudio(
        text: string, 
        videoId: string, 
        language: string = 'en-US', 
        voiceStyle: string = 'neural'
    ): Promise<string> {
        console.log(`[VideoService] Generating TTS for ${videoId} in ${language}`);
        
        const ttsResponse = await axios.post(`${BASE_URL}/api/video/generateTextToSpeech`, {
            text,
            videoId,
            language,
            voiceStyle
        });
        
        if (!ttsResponse.data || !ttsResponse.data.audioUrl) {
            throw new Error('Failed to generate speech');
        }
        
        return ttsResponse.data.audioUrl;
    }

    private async getAudioDuration(audioUrl: string): Promise<number> {
        try {
            const response = await axios.post(`${BASE_URL}/api/video/getAudioDuration`, {
                audioUrl
            });
            
            return response.data.durationInSeconds;
        } catch (error) {
            console.error('Failed to get audio duration:', error);
            return 30; // Default fallback
        }
    }

    private async generateScriptAndImageQueries(
        content: string, 
        title: string, 
        language: string = 'en-US'
    ): Promise<ScriptGenerationResponse> {
        try {
            const response = await axios.post(`${BASE_URL}/api/video/generateScript`, {
                content,
                title,
                language
            });
            
            if (!response.data.success) {
                throw new Error(response.data.error || 'Script generation failed');
            }
            
            return {
                success: true,
                script: response.data.script,
                imageQueries: response.data.imageQueries
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

    private async searchImages(queries: string[]): Promise<ImageSearchResponse> {
        try {
            const response = await axios.post(`${BASE_URL}/api/video/searchImages`, {
                queries
            });
            
            if (!response.data.success) {
                throw new Error(response.data.error || 'Image search failed');
            }
            
            return {
                success: true,
                images: response.data.images
            };
        } catch (error: any) {
            console.error('[VideoService] Image search error:', error);
            
            // Fallback to placeholder images
            return {
                success: true,
                images: Array.from({length: 10}, (_, index) => ({
                    url: `https://picsum.photos/1080/1920?random=${Date.now() + index}`,
                    title: `Placeholder Image ${index + 1}`,
                    source: 'Lorem Picsum'
                }))
            };
        }
    }

    private async generateCaptionsWithTiming(
        audioUrl: string, 
        taskId: string, 
        language: string = 'en-US'
    ): Promise<{
        success: boolean;
        captions?: ICaptionTiming[];
        error?: string;
    }> {
        try {
            const response = await axios.post(`${BASE_URL}/api/video/generateCaptions`, {
                audioUrl,
                taskId,
                language
            });
            
            if (!response.data.success) {
                throw new Error(response.data.error || 'Caption generation failed');
            }
            
            return {
                success: true,
                captions: response.data.captions
            };
        } catch (error: any) {
            console.error('[VideoService] Caption generation error:', error);
            return {
                success: false,
                error: error.message || 'Failed to generate captions'
            };
        }
    }

    private async createVideoRecord(
        postId: string,
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
                status: 'processing' as const,
                createdAt: new Date(),
                updatedAt: new Date(),
                fileName: `${postId}-${type}-${language?.replace('-', '_') || 'en_US'}.mp4`,
                format: 'mp4',
                resolution: '1080x1920'
            };

            await this.videoDAL.createVideo(videoData);
            return videoId;
        } catch (error: any) {
            console.error('[VideoService] Error creating video record:', error);
            throw error;
        }
    }

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

            await this.videoDAL.updateVideo(videoId, updateData);
        } catch (error: any) {
            console.error(`[VideoService] Error updating video record ${videoId}:`, error);
            throw error;
        }
    }
}