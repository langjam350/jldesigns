// pages/blog/[slug].tsx
import React from 'react';
import IBlogPost from '../../models/IBlogPost'
import '../../app/globals.css'
import Link from "next/link";
import BlogPostService from '../../services/BlogPostService'

// Define the type for the props
interface BlogPostProps {
  post: IBlogPost;
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

  const apiDataPaths = await blogPostService.getAllStaticPaths();
  // Empty arr to build new paths
  const newPaths = [];
  // Add params to every slug obj returned from api
  for (let slug of apiDataPaths) {
    newPaths.push({ params: { slug } });
  }
  // Return paths to render components
  return {
    paths: newPaths,
    fallback: true
  };
}

export async function getStaticProps({ params }: { params: { slug: string } }) {
  var blogPostService = new BlogPostService()

  // Fetch a specific blog post based on the slug
  const post: IBlogPost | undefined = await blogPostService.getBlogPostBySlug(params.slug);

  if (!post) {
    return {
      notFound: true,
    }
  }

  return {
    props: {
      post,
    },
  };
}

export default BlogPost;

