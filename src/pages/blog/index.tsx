// pages/blog.tsx
import React from 'react';
import Link from 'next/link';
import { getBlogPosts } from './blogData';
// Define the type for your blog post
export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
}

// Define the type for the props
interface BlogProps {
  posts: BlogPost[];
}

const Blog: React.FC<BlogProps> = ({ posts }) => {
  return (
    <div>
      <h1>Blog</h1>
      <ul>
        {posts.map((post) => (
          <li key={post.id}>
            <Link href={`/blog/${post.slug}`}>
              <a>{post.title}</a>
            </Link>
          </li>
        ))}
      </ul>
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