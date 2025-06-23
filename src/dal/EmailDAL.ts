// src/dal/EmailDAL.ts
import axios from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_APP_ENV === 'development' 
  ? 'https://dev.wellnessworldwideweb.com' 
  : 'https://www.wellnessworldwideweb.com';

export interface IEmailDAL {
  sendEmail(to: string, subject: string, text: string, html?: string): Promise<boolean>;
  sendVideoCompletionEmail(to: string, videoUrl: string, postId: string): Promise<boolean>;
}

export default class EmailDAL implements IEmailDAL {
  public async sendEmail(to: string, subject: string, text: string, html?: string): Promise<boolean> {
    try {
      const response = await axios.post(`${BASE_URL}/api/email/sendEmail`, {
        to,
        subject,
        text,
        html
      });
      
      if (!response.data.success) {
        throw new Error(`Failed to send email: ${response.data.message}`);
      }
      
      return true;
    } catch (error: any) {
      console.error('Error sending email in DAL:', error);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  public async sendVideoCompletionEmail(to: string, videoUrl: string, postId: string): Promise<boolean> {
    try {
      const subject = 'Video Generation Complete';
      const text = `Your video for post ${postId} is now ready.\nView it here: ${videoUrl}`;
      const html = `
        <h1>Video Generation Complete</h1>
        <p>Your video for post <strong>${postId}</strong> is now ready.</p>
        <p><a href="${videoUrl}">View your video</a></p>
      `;
      
      return await this.sendEmail(to, subject, text, html);
    } catch (error: any) {
      console.error('Error sending video completion email in DAL:', error);
      throw new Error(`Failed to send video completion email: ${error.message}`);
    }
  }
}