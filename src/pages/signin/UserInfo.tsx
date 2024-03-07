// Define the type for your blog post
export interface UserInfo {
    id: number;
    email: string;
    password: string;
    resetPassword: boolean;
    resetUsername: boolean
}
  
  // Define the type for the props
export interface UserProps {
    posts: UserInfo[];
}