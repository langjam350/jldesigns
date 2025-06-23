// ServiceProvider.ts
import { IGPTService } from './GPTService';
import GPTService from './GPTService';
import { IAuthService } from './AuthService';
import AuthService from './AuthService';
import { ILoginService } from './LoginService';
import LoginService from './LoginService';
import { IPostService } from './PostService';
import PostService from './PostService'
import { IVideoService } from './VideoService';
import VideoService from './VideoService';
import { ITaskService } from './TaskService';
import TaskService from './TaskService';
import { IEmailService } from './EmailService';
import EmailService from './EmailService';
import { IFileService } from './FileService';
import FileService from './FileService';

// Import DAL classes
import VideoDAL, { IVideoDAL } from '../dal/VideoDAL';
import TaskDAL, { ITaskDAL } from '../dal/TaskDAL';
import FileDAL, { IFileDAL } from '../dal/FileDAL';
import PostDAL, { IPostDAL } from '../dal/PostDAL';
import AuthDAL, { IAuthDAL } from '../dal/AuthDAL';
import EmailDAL, { IEmailDAL } from '../dal/EmailDAL';

export interface IServiceProvider {
    getGPTService(): IGPTService;
    getAuthService(): IAuthService;
    getLoginService(): ILoginService;
    getFileService(): IFileService;
    getPostService(): IPostService;
    getVideoService(): IVideoService;
    getTaskService(): ITaskService;
    getEmailService(): IEmailService;
    
    // DAL access methods
    getVideoDAL(): IVideoDAL;
    getTaskDAL(): ITaskDAL;
    getFileDAL(): IFileDAL;
    getPostDAL(): IPostDAL;
    getAuthDAL(): IAuthDAL;
    getEmailDAL(): IEmailDAL;
  }

export default class ServiceProvider implements IServiceProvider {
  private static instance: ServiceProvider;
  private gptService: IGPTService;
  private authService: IAuthService;
  private loginService: ILoginService;
  private fileService: IFileService;
  private postService: IPostService;
  private taskService: ITaskService;
  private emailService: IEmailService;
  private videoService: IVideoService;

  // DAL instances
  private videoDAL: IVideoDAL;
  private taskDAL: ITaskDAL;
  private fileDAL: IFileDAL;
  private postDAL: IPostDAL;
  private authDAL: IAuthDAL;
  private emailDAL: IEmailDAL;

  private constructor() {
    // Initialize DAL instances first
    this.videoDAL = new VideoDAL();
    this.taskDAL = new TaskDAL();
    this.fileDAL = new FileDAL();
    this.postDAL = new PostDAL();
    this.authDAL = new AuthDAL();
    this.emailDAL = new EmailDAL();
    
    // Initialize services
    this.gptService = new GPTService();
    this.postService = new PostService();
    this.authService = new AuthService();
    this.loginService = new LoginService(this.authService);
    this.fileService = new FileService();
    this.taskService = new TaskService();
    this.emailService = new EmailService();
    this.videoService = new VideoService(
      this.fileService,
      this.postService,
      this.taskService,
      this.emailService,
      this.gptService,
      this.videoDAL,
      this.taskDAL
    );
  }

  public static getInstance(): ServiceProvider {
    if (!ServiceProvider.instance) {
      ServiceProvider.instance = new ServiceProvider();
    }
    return ServiceProvider.instance;
  }


  public getGPTService(): IGPTService {
    return this.gptService;
  }

  public getAuthService(): IAuthService {
    return this.authService;
  }

  public getLoginService(): ILoginService {
    return this.loginService;
  }

  public getFileService(): IFileService {
    return this.fileService;
  }

  public getPostService(): IPostService {
    return this.postService;
  }

  public getVideoService(): IVideoService {
    return this.videoService;
  }

  public getTaskService(): ITaskService {
    return this.taskService;
  }

  public getEmailService(): IEmailService {
    return this.emailService;
  }
  
  public getVideoDAL(): IVideoDAL {
    return this.videoDAL;
  }
  
  public getTaskDAL(): ITaskDAL {
    return this.taskDAL;
  }
  
  
  public getFileDAL(): IFileDAL {
    return this.fileDAL;
  }
  
  public getPostDAL(): IPostDAL {
    return this.postDAL;
  }
  
  public getAuthDAL(): IAuthDAL {
    return this.authDAL;
  }
  
  public getEmailDAL(): IEmailDAL {
    return this.emailDAL;
  }
}