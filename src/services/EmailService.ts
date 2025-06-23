// src/services/EmailService.ts
import axios from 'axios';

export interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  videoUrl?: string;
  postId?: string;
}

export interface IEmailService {
  sendEmail(options: EmailOptions): Promise<boolean>;
  sendVideoCompletionEmail(to: string, videoUrl: string, postId: string): Promise<boolean>;
}

export default class EmailService implements IEmailService {
  private apiUrl: string;
  
  constructor() {
    const baseUrl = process.env.NEXT_PUBLIC_APP_ENV === 'development' 
      ? 'https://dev.wellnessworldwideweb.com' 
      : 'https://www.wellnessworldwideweb.com';
    
    this.apiUrl = `${baseUrl}/api/email/sendEmail`;
  }

  public async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const response = await axios.post(this.apiUrl, options);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to send email');
      }
      
      console.log('[EmailService] Email queued successfully');
      return true;
    } catch (error) {
      console.error('[EmailService] Error sending email:', error);
      return false;
    }
  }

  public async sendVideoCompletionEmail(to: string, videoUrl: string, postId: string): Promise<boolean> {
    const subject = `Video Generation Complete: ${postId}`;
    const html = `
      <h1>Video Generation Complete</h1>
      <p>Your video for post <strong>${postId}</strong> has been successfully generated.</p>
      <div style="margin: 20px 0;">
        <a href="${videoUrl}" 
           style="padding: 10px 15px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 4px;">
          View Video
        </a>
      </div>
      <p>Direct link: <a href="${videoUrl}">${videoUrl}</a></p>
      <hr>
      <p style="color: #666; font-size: 0.8em;">
        This is an automated message from Wellness World Wide Web video generation service.
      </p>
    `;
    
    return this.sendEmail({
      to,
      subject,
      html,
      videoUrl,
      postId
    });
  }
}