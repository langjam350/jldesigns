// pages/blog.tsx
import React from 'react';
import Link from 'next/link';
import BlogPostService from '../../services/BlogPostService';
import '../../app/globals.css'
import Navigation from "../../components/Navigation"
import IBlogPost, { BlogProps } from "../../models/IBlogPost"

const Blog: React.FC<BlogProps> = ({ posts }) => {
  console.log(process.env.USER_EMAIL)
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
          {process.env.USER_EMAIL && (
            <li>
              <Link href="/blog/addBlogPost">
                Add Blog Post
              </Link>
            </li>
          )}
        </ul>
      </div>
    </div>
    
  );
};

export async function getStaticProps() {
  var blogPostService = new BlogPostService()
  const posts: IBlogPost[] = await blogPostService.getAllBlogPosts();

  return {
    props: {
      posts,
    },
  };
}

export default Blog;