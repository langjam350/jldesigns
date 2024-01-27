// pages/blog/[slug].tsx
import React from 'react';
import { BlogPost } from '../blog'
import { getAllBlogPostPaths, getBlogPostBySlug } from './blogData';

// Define the type for the props
interface BlogPostProps {
  post: BlogPost;
}

const BlogPost: React.FC<BlogPostProps> = ({ post }) => {
  return (
    <div>
      <h1>{post.title}</h1>
      <p>{post.content}</p>
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

