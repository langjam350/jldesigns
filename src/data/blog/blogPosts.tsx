// In a separate file, e.g., blogData.ts

// Mock data for demonstration purposes
export const blogPosts = [
    {
      id: '1',
      title: 'First Blog Post',
      slug: 'first-blog-post',
      content: 'This is the content of the first blog post.',
    },
    {
      id: '2',
      title: 'Second Blog Post',
      slug: 'second-blog-post',
      content: 'This is the content of the second blog post.',
    },
  ];
  
// Function to get all blog posts
export const getBlogPosts = async () => {
// In a real-world scenario, you might fetch data from an API or database here
return blogPosts;
};

// Function to get paths for all blog posts
export const getAllBlogPostPaths = async () => {
return blogPosts.map((post) => ({ params: { slug: post.slug } }));
};

// Function to get a specific blog post by slug
export const getBlogPostBySlug = async (slug: string) => {
// In a real-world scenario, you might filter or fetch data based on the provided slug
return blogPosts.find((post) => post.slug === slug);
};