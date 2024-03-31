// Import necessary modules
import React from 'react';
import Link from 'next/link';
import BlogPostService from '../../services/BlogPostService';
import '../../app/globals.css';
import Navigation from '../../components/Navigation';
import IBlogPost from '../../models/IBlogPost';
import AuthService from '@/services/AuthService';

// Define the type for the props
interface BlogProps {
  posts: IBlogPost[];
}

const Blog: React.FC<BlogProps> = ({ posts }) => {
  const [isAuthenticated, setIsAuthenticated] = React.useState<boolean | null>(null);
  const [searchTerm, setSearchTerm] = React.useState<string>('');
  const [searchResults, setSearchResults] = React.useState<IBlogPost[]>(posts); // Initialize search results with all posts

  React.useEffect(() => {
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

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const searchTerm = e.target.value.toLowerCase();
    setSearchTerm(searchTerm);

    // Filter posts based on search term
    const results = posts.filter(post =>
      post.content.toLowerCase().includes(searchTerm)
    );
    setSearchResults(results);
  };

  return (
    <div>
      <Navigation />
      <div>
        <h1 className="text-3xl font-bold underline">Blog</h1>
        <p className="text-sm text-gray-600 mb-4">The intention of this portion of the site is to serve as a completely searchable information database. Here we have many articles, some generated with the help of AI, but all discussing important health or other topics. Use this as you would google or another search engine, and ensure you check the information you see. The pro of generating AI is that it&apos;s easy to generate multiple articles with certain perspectives and points of view on topics. Use the search feature below to find posts by their content. In the future we&apos;re hoping to add comments and categories to better show the relevant topics here as well.</p>
        <div className="search-container mb-4">
          <input
            type="text"
            placeholder="Search by content..."
            value={searchTerm}
            onChange={handleSearch}
            className="border border-gray-300 px-3 py-2 rounded-md w-full"
          />
        </div>
        <div className="blog-container">
          {searchResults.map((post) => (
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

// Fetch blog posts statically at build time
export async function getStaticProps() {
  const blogPostService = new BlogPostService();
  const posts: IBlogPost[] = await blogPostService.getAllBlogPosts();

  return {
    props: {
      posts,
    },
    revalidate: 60, // Re-generate the page every 60 seconds to fetch new data
  };
}

export default Blog;