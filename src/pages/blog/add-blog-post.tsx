import { useState } from 'react';
import { useRouter } from 'next/router';
import BlogPostService from '@/services/BlogPostService';
import IBlogPost from '@/models/IBlogPost';

const AddBlogPost: React.FC = () => {
    const router = useRouter();
    const [id, setId] = useState('');
    const [title, setTitle] = useState('');
    const [slug, setSlug] = useState('');
    const [content, setContent] = useState('');
    const [date, setDate] = useState('');
    const [styles, setStyles] = useState('');
    const [author, setAuthor] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    try {
        var blogPostService = new BlogPostService();
        const newBlogPost: IBlogPost = {
            id,
            title,
            slug,
            content,
            date,
            styles,
            author,
        };

      // Call the addBlogPost method from BlogPostService to add the new blog post
      var success = await blogPostService.addBlogPost(newBlogPost);
      if (success) {
        router.push('/');
      }
    } catch (error) {
      console.error('Error adding document: ', error);
    }
  };

  return (
    (
        <div className="max-w-3xl mx-auto mt-8 p-4">
          <h1 className="text-2xl font-bold mb-4">Add New Blog Post</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block mb-2">ID:</label>
              <input
                type="text"
                value={id}
                onChange={(e) => setId(e.target.value)}
                required
                className="w-full border border-gray-300 rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block mb-2">Title:</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full border border-gray-300 rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block mb-2">Slug:</label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                required
                className="w-full border border-gray-300 rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block mb-2">Content:</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                className="w-full border border-gray-300 rounded px-3 py-2"
                rows={6}
              />
            </div>
            <div>
              <label className="block mb-2">Date:</label>
              <input
                type="text"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full border border-gray-300 rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block mb-2">Styles:</label>
              <input
                type="text"
                value={styles}
                onChange={(e) => setStyles(e.target.value)}
                required
                className="w-full border border-gray-300 rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block mb-2">Author:</label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                required
                className="w-full border border-gray-300 rounded px-3 py-2"
              />
            </div>
            <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
              Submit
            </button>
          </form>
        </div>
  ))
};

export default AddBlogPost;