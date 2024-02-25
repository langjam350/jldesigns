// pages/blog.tsx
import React from 'react';
import Link from 'next/link';
import { BlogPostService } from './blogData';
import '../../app/globals.css'
import Navigation from "../../components/Navigation"
import { BlogPost, BlogProps } from "./blogPost"


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
                {post.title} | <span className="text-accent">{post.date}</span>
              </Link>
              <p className="text-secondary text-xs">
                {post.content.substring(0, 100)}...
              </p>
              <br/>
            </li>
          ))}
        </ul>
      </div>
    </div>
    
  );
};

export async function getStaticProps() {
  const blogPostService: BlogPostService = new BlogPostService() 
  const posts: BlogPost[] = await blogPostService.getAllBlogPosts();

  return {
    props: {
      posts,
    },
  };
}

export default Blog;