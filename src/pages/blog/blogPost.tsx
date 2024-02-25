// Define the type for your blog post
export interface BlogPost {
    id: string;
    title: string;
    slug: string;
    content: string;
    date: string;
    styles: string;
    author: string;
  }
  
  // Define the type for the props
export interface BlogProps {
    posts: BlogPost[];
}