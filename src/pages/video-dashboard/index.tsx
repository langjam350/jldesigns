import { useState, useEffect } from "react";
import IPost from "../../models/IPost";
import { IPostWithMetadata } from "../../models/IPost";
import PostDAL from "../../dal/PostDAL";
import VideoService from "../../services/VideoService";
import VideoDAL from "../../dal/VideoDAL";

// Initialize services
const postDAL = new PostDAL();
const videoDAL = new VideoDAL();
const videoService = new VideoService(videoDAL);

const LANGUAGE_OPTIONS = [
  { code: 'en-US', name: 'English (US)', flag: '🇺🇸' },
  { code: 'en-GB', name: 'English (UK)', flag: '🇬🇧' },
  { code: 'es-ES', name: 'Spanish (Spain)', flag: '🇪🇸' },
  { code: 'fr-FR', name: 'French', flag: '🇫🇷' },
  { code: 'de-DE', name: 'German', flag: '🇩🇪' },
  { code: 'ja-JP', name: 'Japanese', flag: '🇯🇵' },
  { code: 'zh-CN', name: 'Chinese (Mandarin)', flag: '🇨🇳' }
];

type VideoType = 'scrolling' | 'scripted';

const VideoManagementDashboard = () => {
  const [posts, setPosts] = useState<IPostWithMetadata[]>([]);
  const [selectedPost, setSelectedPost] = useState<IPost | null>(null);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [filter, setFilter] = useState<'all' | 'with-videos' | 'without-videos'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Generation states
  const [selectedVideoType, setSelectedVideoType] = useState<VideoType>('scrolling');
  const [selectedLanguage, setSelectedLanguage] = useState('en-US');
  const [generatingPostId, setGeneratingPostId] = useState<string | null>(null);

  // Load posts from database
  useEffect(() => {
    const loadPosts = async () => {
      try {
        setLoadingPosts(true);
        console.log('Loading posts from database...');
        
        const postsData = await postDAL.getPostsWithMetadata();
        console.log('Posts loaded:', postsData.length);
        
        setPosts(postsData);
      } catch (error) {
        console.error('Error loading posts:', error);
        setPosts([]);
      } finally {
        setLoadingPosts(false);
      }
    };

    loadPosts();
  }, []);

  const filteredPosts = posts?.filter(post => {
    const matchesSearch = post.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.postId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (post.title && post.title.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (!matchesSearch) return false;
    
    switch (filter) {
      case 'with-videos':
        return post.videos && post.videos.length > 0;
      case 'without-videos':
        return !post.videos || post.videos.length === 0;
      default:
        return true;
    }
  }) || [];

  const handleGenerateVideo = async (postId: string) => {
    setGeneratingPostId(postId);
    setLoading(true);
    
    try {
      console.log('Generating video for post:', postId)
      
      const post = posts.find(p => p.id === postId);
      if(!post) {
        throw new Error("No post found matching postId");
      }

      const result = await videoService.generateVideoForPost(
        post, 
        selectedVideoType, 
        selectedLanguage,
        "studio"
      );
      
      if (!result.success) {
        console.error('Failed to generate video:', result.message);
        alert(`Failed to generate video: ${result.message}`);
        return;
      }
      
      console.log('Video generation started:', result);
      
      const newVideoId = result.videoId || `vid-${Date.now()}`;
  
      setPosts(prev => prev.map(post => 
        post.id === postId 
          ? { 
              ...post, 
              videos: [...(post.videos || []), newVideoId]
            }
          : post
      ));
      
    } catch (error) {
      console.error('Error generating video:', error);
      alert(`Error generating video: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
      setGeneratingPostId(null);
      setShowGenerateModal(false);
      setSelectedPost(null);
    }
  };

  const openGenerateModal = (post: IPost) => {
    setSelectedPost(post);
    setShowGenerateModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Video Management Dashboard</h1>
          <p className="text-gray-600">Manage and generate videos for your posts</p>
        </div>

        {/* Loading State */}
        {loadingPosts && (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <div className="text-gray-500">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <h3 className="text-lg font-medium mb-2">Loading posts...</h3>
              <p>Fetching your posts from the database</p>
            </div>
          </div>
        )}

        {/* Main Content */}
        {!loadingPosts && (
          <>
            {/* Filters and Search */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex flex-col md:flex-row gap-4 flex-1">
                  <input
                    type="text"
                    placeholder="Search posts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  
                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value as any)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Posts</option>
                    <option value="with-videos">With Videos</option>
                    <option value="without-videos">Without Videos</option>
                  </select>
                </div>
                
                <div className="text-sm text-gray-500">
                  {filteredPosts.length} posts found
                </div>
              </div>
            </div>

            {/* Posts List */}
            <div className="space-y-4">
              {filteredPosts.map((post) => (
                <div key={post.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
                  <div className="p-6">
                    {/* Post Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                          {post.title || `Post ${post.postId}`}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>ID: {post.postId}</span>
                          <span>Created: {post.createdAt instanceof Date ? post.createdAt.toLocaleDateString() : new Date().toLocaleDateString()}</span>
                          {post.URL && (
                            <a 
                              href={post.URL} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 underline"
                            >
                              View Post
                            </a>
                          )}
                        </div>
                        {post.excerpt && (
                          <p className="text-gray-600 mt-2 text-sm">{post.excerpt}</p>
                        )}
                      </div>
                      
                      <button
                        onClick={() => openGenerateModal(post)}
                        disabled={generatingPostId === post.id}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {generatingPostId === post.id ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Generating...
                          </>
                        ) : (
                          <>
                            <span>+</span>
                            Generate Video
                          </>
                        )}
                      </button>
                    </div>

                    {/* Videos Section */}
                    {post.videos && post.videos.length > 0 && (
                      <div className="border-t pt-4">
                        <h4 className="font-medium text-gray-900 mb-3">Videos ({post.videos.length})</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {post.videos.map((videoId: string, index: number) => (
                            <div key={videoId} className="border rounded-lg p-3 bg-gray-50">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-lg">🎥</span>
                                  <span className="font-medium text-sm">Video {index + 1}</span>
                                </div>
                                <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                                  Generated
                                </span>
                              </div>
                              <div className="text-xs text-gray-600 mb-2">
                                <div>Video ID: {videoId}</div>
                              </div>
                              <div className="flex gap-2">
                                <button className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 transition">
                                  View Details
                                </button>
                                <button className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200 transition">
                                  Download
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {(!post.videos || post.videos.length === 0) && (
                      <div className="border-t pt-4">
                        <div className="text-center py-4 text-gray-500 bg-gray-50 rounded-lg">
                          <span className="text-2xl mb-2 block">🎥</span>
                          No videos generated yet
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {filteredPosts.length === 0 && (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <div className="text-gray-500">
                  <span className="text-4xl mb-4 block">🔍</span>
                  <h3 className="text-lg font-medium mb-2">No posts found</h3>
                  <p>Try adjusting your search or filter criteria</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Generate Video Modal */}
      {showGenerateModal && selectedPost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Generate Video</h2>
                <button
                  onClick={() => setShowGenerateModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              {/* Selected Post Info */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="font-medium text-gray-900 mb-2">Selected Post:</h3>
                <p className="text-gray-700 font-medium">{selectedPost.title || `Post ${selectedPost.postId}`}</p>
                <p className="text-sm text-gray-600">ID: {selectedPost.postId}</p>
                {selectedPost.URL && (
                  <a 
                    href={selectedPost.URL} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-800 underline"
                  >
                    View Original Post
                  </a>
                )}
              </div>

              {/* Video Type Selection */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-700 mb-3">Video Type:</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div 
                    className={`p-4 border-2 rounded-lg cursor-pointer transition ${
                      selectedVideoType === 'scrolling' 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedVideoType('scrolling')}
                  >
                    <div className="flex items-center mb-2">
                      <input
                        type="radio"
                        checked={selectedVideoType === 'scrolling'}
                        onChange={() => setSelectedVideoType('scrolling')}
                        className="mr-3"
                      />
                      <label className="font-semibold text-gray-800">
                        📜 Scrolling TTS Video
                      </label>
                    </div>
                    <p className="text-sm text-gray-600">
                      Scrolling webpage with text-to-speech narration
                    </p>
                  </div>

                  <div 
                    className={`p-4 border-2 rounded-lg cursor-pointer transition ${
                      selectedVideoType === 'scripted' 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedVideoType('scripted')}
                  >
                    <div className="flex items-center mb-2">
                      <input
                        type="radio"
                        checked={selectedVideoType === 'scripted'}
                        onChange={() => setSelectedVideoType('scripted')}
                        className="mr-3"
                      />
                      <label className="font-semibold text-gray-800">
                        🎬 Scripted Image Video
                      </label>
                    </div>
                    <p className="text-sm text-gray-600">
                      AI-generated script with relevant images and narration
                    </p>
                  </div>
                </div>
              </div>

              {/* Language Selection */}
              {selectedVideoType === 'scripted' && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-700 mb-3">Language:</h3>
                  <select
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {LANGUAGE_OPTIONS.map((language) => (
                      <option key={language.code} value={language.code}>
                        {language.flag} {language.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Generate Button */}
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowGenerateModal(false)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleGenerateVideo(selectedPost.id)}
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Generating...
                    </>
                  ) : (
                    'Generate Video'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoManagementDashboard;