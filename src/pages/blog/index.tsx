// pages/blog.tsx
import React from 'react';
import Link from 'next/link';
import { getBlogPosts } from './blogData';
import '../../app/globals.css'
import Navigation from "../../components/Navigation"
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
interface BlogProps {
  posts: BlogPost[];
}

const Blog: React.FC<BlogProps> = ({ posts }) => {
  return (
    <div>
      <Navigation />
      <div>
        <h1 className="text-3xl font-bold underline">Blog</h1>
        <ul>
          {posts.map((post) => (
            <li key={post.id}>
              <Link href={`/blog/${post.slug}`}>
                {post.title} | {post.date} 
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
    
  );
};

export async function getStaticProps() {
  // Fetch your blog posts from an API or a file system
  // For example, assuming you have a function getBlogPosts() that fetches posts
  const posts: BlogPost[] = await getBlogPosts();

  return {
    props: {
      posts,
    },
  };
}

export default Blog;