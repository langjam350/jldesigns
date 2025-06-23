import { useState, useEffect } from 'react';
import ServiceProvider from '@/services/ServiceProvider';
import '../../app/globals.css';
import { useAuth } from '@/context/AuthContext';
import IPost from '@/models/IPost';
import { ChangeEvent } from 'react';

const PostGenerator = () => {
    const { user, loading } = useAuth();

    console.log('PostGenerator - Auth state:', { loading, user: !!user, email: user?.email });
    const [topic, setTopic] = useState('');
    const [numPosts, setNumPosts] = useState(1);
    const [categories, setCategories] = useState<string[]>([]);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedPosts, setGeneratedPosts] = useState<IPost[]>([]);
    const [approvingPosts, setApprovingPosts] = useState<{ [key: string]: boolean }>({});
    const [deletingPosts, setDeletingPosts] = useState<{ [key: string]: boolean }>({});
    const [showCustomCategoryInput, setShowCustomCategoryInput] = useState(false);
    const [customCategory, setCustomCategory] = useState('');

    const postService = ServiceProvider.getInstance().getPostService();
    // Fetch categories on component mount
    useEffect(() => {
        const postService = ServiceProvider.getInstance().getPostService();
        const fetchCategories = async () => {
            try {
                const categories = await postService.getCategories();
                setCategories(categories);
            } catch (error) {
                console.error('Error fetching post categories:', error);
                // Handle error as needed
            }
        };

        fetchCategories();
    }, []);

    /**
     * Generates new social media posts based on user input
     */
    const generatePosts = async () => {
        setIsGenerating(true);
        try {
            const generatedPostsArray = await postService.generatePosts(topic, numPosts, selectedCategory);
            if (Array.isArray(generatedPostsArray)) {
                setGeneratedPosts(prevPosts => {
                    // Filter out any duplicate posts
                    const newPosts = generatedPostsArray.filter(newPost => 
                        !prevPosts.some(existingPost => existingPost.id === newPost.id)
                    );
                    return [...prevPosts, ...newPosts];
                });
            } else {
                throw new Error("Invalid response from Post Service");
            }
        } catch (error) {
            console.error('Error generating posts:', error);
            alert('Error generating posts. Please try again later.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCategoryChange = (e: ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        setSelectedCategory(value);
        setShowCustomCategoryInput(value === 'other');
        if (value !== 'other') {
            setCustomCategory('');
        }
    };

    /**
     * Toggles the public status of a post
     * @param {IPost} post - The post to be approved/unapproved
     */
    const approvePost = async (post: IPost) => {
        setApprovingPosts(prev => ({ ...prev, [post.id]: true }));
        try {
            console.log('Toggling public status for post:', post);
            const updatedPost = { ...post, isPublic: !post.isPublic };
            await postService.approvePost(updatedPost);
            console.log('Post updated in database:', updatedPost);
            setGeneratedPosts(prevPosts => 
                prevPosts.map(p => p.id === post.id ? {...p, isPublic: !p.isPublic} : p)
            );
            console.log('Updated posts');
        } catch (error) {
            console.error('Error toggling public status: ', error);
            // ... error handling ...
        } finally {
            setApprovingPosts(prev => ({ ...prev, [post.id]: false }));
        }
    };

    /**
     * Deletes a post from the generated posts list
     * @param {IPost} post - The post to be deleted
     */
    const deletePost = async (post: IPost) => {
        setDeletingPosts(prev => ({ ...prev, [post.id]: true }));
        try {
            await postService.deleteExperimentalPost(post.id);
            setGeneratedPosts(prevPosts => prevPosts.filter(p => p.id !== post.id));
        } catch (error) {
            console.error('Error deleting post: ', error);
        } finally {
            setDeletingPosts(prev => ({ ...prev, [post.id]: false }));
        }
    };

    // Show loading state while authentication is in progress
    if (loading) {
        return <div>Loading...</div>;
    }

    // Prevent unauthorized access
    if (!user) {
        return <div>You do not have the required permissions to access this page.</div>;
    }

    // Main component render
    return (
        <div className="max-w-3xl mx-auto mt-8 p-4">
            <h1 className="text-2xl font-bold mb-4">Generate Social Media Posts</h1>
            {/* Form for post generation */}
            <form onSubmit={(e) => { e.preventDefault(); generatePosts(); }} className="space-y-4">
                {/* Topic input field */}
                <div>
                    <label className="block mb-2">Topic:</label>
                    <input
                        type="text"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        required
                        className="w-full border border-gray-300 rounded px-3 py-2"
                        placeholder="Enter topic for social media posts"
                    />
                </div>
                {/* Category selection dropdown */}
                <div>
                <label className="block mb-2">Category:</label>
                <select
                    value={selectedCategory}
                    onChange={handleCategoryChange}
                    required
                    className="w-full border border-gray-300 rounded px-3 py-2"
                >
                    <option value="">Select category</option>
                    {categories.map(category => (
                        <option key={category} value={category}>{category}</option>
                    ))}
                    <option value="other">Other (Custom)</option>
                </select>
            </div>
            {showCustomCategoryInput && (
                <div className="mt-2">
                    <input
                        type="text"
                        value={customCategory}
                        onChange={(e) => setCustomCategory(e.target.value)}
                        required
                        className="w-full border border-gray-300 rounded px-3 py-2"
                        placeholder="Enter custom category"
                    />
                </div>
            )}
            {/* Number of posts input field */}
            <div>
                <label className="block mb-2">Number of Posts:</label>
                <input
                    type="number"
                    value={numPosts}
                    onChange={(e) => setNumPosts(parseInt(e.target.value))}
                    required
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    placeholder="Enter number of posts to generate"
                />
            </div>
            {/* Generate button */}
            <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                {isGenerating ? (
                    <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                ) : (
                    'Generate Posts'
                )}
                </button>
            </form>
            {/* Display generated posts */}
            {generatedPosts.length > 0 && (
                <div className="mt-8">
                    <h2 className="text-xl font-bold mb-4">Generated Posts</h2>
                    <ul>
                        {generatedPosts.map((post) => (
                            <li key={post.id} className="border-b border-gray-300 py-2">
                                <div><strong>Title:</strong> {post.title}</div>
                                <div><strong>Content:</strong><div dangerouslySetInnerHTML={{ __html: post.content }}></div></div>
                                <div><strong>Slug:</strong> {post.slug}</div>
                                {/* Approve/Unapprove button */}
                                <button
                                    onClick={() => approvePost(post)}
                                    className={`mt-2 px-4 py-2 rounded ${post.isPublic ? 'bg-green-500 text-white' : 'bg-blue-500 text-white hover:bg-blue-600'} ${approvingPosts[post.id] ? 'cursor-wait' : ''}`}
                                    disabled={post.isPublic || approvingPosts[post.id]}
                                >
                                    {approvingPosts[post.id] ? (
                                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                                        </svg>
                                    ) : (
                                        post.isPublic ? 'Approved' : 'Approve'
                                    )}
                                </button>
                                {/* Delete button */}
                                <button
                                    onClick={() => deletePost(post)}
                                    className={`mt-2 ml-2 px-4 py-2 rounded bg-red-500 text-white hover:bg-red-600 ${deletingPosts[post.id] ? 'cursor-wait' : ''}`}
                                    disabled={deletingPosts[post.id]}
                                >
                                    {deletingPosts[post.id] ? (
                                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                                        </svg>
                                    ) : (
                                        'Delete'
                                    )}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

/**
 * Server-side props function
 * Currently not used for data fetching, but can be expanded if needed
 */
export async function getServerSideProps() {
    return {
        props: {}
    };
}

export default PostGenerator;