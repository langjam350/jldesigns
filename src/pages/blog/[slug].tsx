import React from 'react';
import Head from 'next/head';
import IBlogPost from '../../models/IBlogPost';
import '../../app/globals.css';
import Link from "next/link";
import BlogPostService from '../../services/BlogPostService';

interface BlogPostProps {
  post: IBlogPost;
}

const BlogPost: React.FC<BlogPostProps> = ({ post }) => {
  // Method to extract keywords from content and title
  const extractKeywords = (): Set<string[]>[] => {
    const contentKeywords = post.content.split(' ').slice(0, 5).filter(Boolean); // Extract first 5 words from content and remove empty strings
    const titleKeywords = post.title.split(' ').filter(Boolean); // Split title into words and remove empty strings
  
    // Combine content and title keywords and remove duplicates
    const allKeywords = [new Set([contentKeywords, titleKeywords])];
  
    return allKeywords;
  };

  const keywords = extractKeywords();

  return (
    <div className="bg-accent">
      <Head>
        <title>{post.title}</title>
        <meta name="description" content={post.content.substring(0, 150)} />
        <meta name="keywords" content={keywords.join(', ')} />
      </Head>
      <div className="container mx-auto px-4 ">
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h1 className="text-3xl font-bold text-primary mb-4">{post.title}</h1>
          <p className="text-sm text-secondary mb-4">{post.date} | {post.author}</p>
          <div className="text-base text-primary" dangerouslySetInnerHTML={{ __html: post.content.replaceAll('\n', '<br/>') }}></div>
        </div>
        <Link href="../blog" className="block text-accent text-2xl font-bold border-primary w-full text-center py-2 rounded-md bg-primary text-white hover:bg-primary-dark transition duration-300">Back to Blog</Link>
      </div>
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
    fallback: false
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
