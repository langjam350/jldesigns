// pages/blog/[slug].tsx
import React from 'react';
import { BlogPost } from '.'
import { getAllBlogPostPaths, getBlogPostBySlug } from './blogData';
import '../../app/globals.css'
import Link from "next/link";

// Define the type for the props
interface BlogPostProps {
  post: BlogPost;
}

const BlogPost: React.FC<BlogPostProps> = ({ post }) => {
  return (
    <div>
      <div className="mb-4">
        <h1 className="text-3xl font-bold text-gray-800">{post.title}</h1>
        <p className="text-sm text-gray-500">{post.date} | {post.author}</p>
      </div>
      <p className="text-base text-gray-600" >{post.content}</p>
      <Link href="../blog">Back to Blog</Link>
    </div>
  );
};

export async function getStaticPaths() {
  // Fetch the paths for all blog posts
  const paths = await getAllBlogPostPaths();

  return {
    paths,
    fallback: false,
  };
}

export async function getStaticProps({ params }: { params: { slug: string } }) {
  // Fetch a specific blog post based on the slug
  const post: BlogPost | undefined = await getBlogPostBySlug(params.slug);

  return {
    props: {
      post,
    },
  };
}

export default BlogPost;

