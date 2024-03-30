// Import necessary modules
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import BlogPostService from '../../services/BlogPostService';
import '../../app/globals.css';
import Navigation from '../../components/Navigation';
import IBlogPost from '../../models/IBlogPost';
import AuthService from '@/services/AuthService';

// Define the type for the props
export interface BlogProps {
  posts: IBlogPost[];
}

const Blog: React.FC<BlogProps> = ({ posts }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        const authenticated = await AuthService.isAuthenticated();
        setIsAuthenticated(authenticated);
      } catch (error) {
        console.error('Error checking authentication:', error);
        setIsAuthenticated(false);
      }
    };

    if (typeof window !== 'undefined') {
      checkAuthentication();
    }
  }, []);

  return (
    <div>
      <Navigation />
      <div>
        <h1 className="text-3xl font-bold underline">Blog</h1>
        <div className="blog-container">
          {posts.map((post) => (
            <div key={post.id} className="blog-post">
              <Link href={`/blog/${post.slug}`}>
                  <h2 className="text-xl font-semibold">{post.title}</h2>
              </Link>
              <p className="text-accent">{post.date}</p>
              <p className="text-secondary text-sm">{post.content.substring(0, 100)}...</p>
            </div>
          ))}
          {isAuthenticated && (
            <div className="blog-post">
              <Link href={'/blog/addBlogPost'} className="text-accent font-bold italic">
                <h2>Add Blog Post</h2>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Fetch blog posts statically
export async function getStaticProps() {
  var blogPostService = new BlogPostService();
  const posts: IBlogPost[] = await blogPostService.getAllBlogPosts();

  return {
    props: {
      posts,
    },
  };
}

export default Blog;