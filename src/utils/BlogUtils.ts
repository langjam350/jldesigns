import IBlogPost from '@/models/IBlogPost';

export class BlogUtils {
    public static extractContentAndPrompt(promptAndResult: string | undefined, defaultPrompt: string): [string, string] {
        if (!promptAndResult) {
            console.error('Received undefined promptAndResult');
            return ['', defaultPrompt];
        }
        const newPromptIndex = promptAndResult.lastIndexOf("New Prompt:");
        if (newPromptIndex !== -1) {
            return [
                promptAndResult.slice(0, newPromptIndex).trim(),
                promptAndResult.slice(newPromptIndex + "New Prompt:".length).trim()
            ];
        }
        return [promptAndResult, defaultPrompt];
    }   
    
    public static formatDate(date: Date): string {
        return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    }  
    
    public static swapTitles(posts: IBlogPost[]): void {
        for (let i = 0; i < posts.length - 1; i++) {
            posts[i].title = posts[i + 1].title.replace(/^["']|["']$/g, ''); // Strip quotes
        }
        // Strip quotes from the last post's title as well
        if (posts.length > 0) {
            posts[posts.length - 1].title = posts[posts.length - 1].title.replace(/^["']|["']$/g, '');
        }
    }

    public static isBlogPostArray(data: any): data is IBlogPost[] {
        return Array.isArray(data) && data.every(item => 
          typeof item === 'object' &&
          'id' in item &&
          'title' in item &&
          'content' in item &&
          'isPublic' in item &&
          'slug' in item &&
          'date' in item &&
          'author' in item &&
          'category' in item
        );
    }
    
    public static stripHTML = (html: string): string => {
        return html.replace(/<[^>]+>/g, ''); 
    };

    public static trim = (stripped: string, maxLength: number = 100): string => {
        return stripped.length > maxLength ? stripped.slice(0, maxLength) + '...' : stripped;
    }

    public static slugify(text: string): string {
        return text
            .toString()
            .toLowerCase()
            .replace(/\s+/g, '-')        // Replace spaces with -
            .replace(/[^\w\-]+/g, '')    // Remove all non-word chars
            .replace(/\-\-+/g, '-')      // Replace multiple - with single -
            .replace(/^-+/, '')          // Trim - from start of text
            .replace(/-+$/, '');         // Trim - from end of text
    }
}