// pages/blog/[slug].tsx
import React from 'react';
import { BlogPost } from './blogPost'
import '../../app/globals.css'
import Link from "next/link";
import { BlogPostService } from './blogPostService'

// Define the type for the props
interface BlogPostProps {
  post: BlogPost;
}

const BlogPost: React.FC<BlogPostProps> = ({ post }) => {
  
  return (
    <div>
      <div className="mb-4">
        <h1 className="text-3xl font-bold text-primary">{post.title}</h1>
        <p className="text-sm text-secondary">{post.date} | {post.author}</p>
      </div>
      <p className="text-base text-primary" >{post.content}</p>
      <br />
      <Link href="../blog" className="text-accent text-2xl font-bold border-primary w-full">Back to Blog</Link>
    </div>
  );
};

export async function getStaticPaths() {
  var blogPostService = new BlogPostService()
  // Fetch the paths for all blog posts
  const paths = await blogPostService.getAllStaticPaths();

  return {
    paths,
    fallback: false,
  };
}

export async function getStaticProps({ params }: { params: { slug: string } }) {
  var blogPostService = new BlogPostService()

  // Fetch a specific blog post based on the slug
  const post: BlogPost | undefined = await blogPostService.getBlogPostBySlug(params.slug);

  return {
    props: {
      post,
    },
  };
}

export default BlogPost;
