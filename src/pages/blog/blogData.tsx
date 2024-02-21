// Mock data for demonstration purposes
export const blogPosts = [
    {
        id: '1',
        title: 'Data Improvement',
        slug: '20240126-1',
        content: 'We should work on transfering this blog data to a database to link to this service',
        date: '2024-01-26',
        styles: '',
        author: 'James Lang'
    },
    {
        id: '2',
        title: 'Fitness Guides',
        slug: '20240126-2',
        content: 'I should work on some guides on how to work out / do calisthenics at home while balancing different muscle groups. For what I actually know / can do. At least start compiling materials on site',
        date: '2024-01-26',
        styles: '',
        author: 'James Lang'
    },
    {
        id: '3',
        title: 'The Double Delight: Unveiling the Merits of Hangboarding Twice a Day',
        slug: '20240126-3',
        content: `In the world of climbing and finger strength training, hangboarding has emerged as a staple exercise, pushing climbers to new heights—quite literally. Traditionally performed once a day, some climbers have started to explore the benefits of doubling down on hangboarding, undertaking sessions both in the morning and evening. In this post, we delve into the merits of this intensified hangboarding routine.

        **1. Accelerated Strength Gains:
        One of the primary advantages of hangboarding twice a day is the potential for accelerated strength gains. By splitting your training into two sessions, you provide your fingers with more frequent stimuli, promoting faster adaptation and muscle development. This can be particularly beneficial for climbers aiming to break through plateaus in their finger strength.
        
        **2. Improved Finger Endurance:
        Hangboarding twice a day allows for a more targeted approach to improving finger endurance. Morning sessions can focus on maximum hangs to enhance strength, while evening sessions might incorporate repeaters or longer duration hangs to build endurance. This dual strategy can be effective in preparing your fingers for sustained climbing challenges.
        
        **3. Enhanced Recovery:
        Contrary to concerns about overtraining, incorporating two hangboarding sessions can actually enhance recovery. By spreading the workload throughout the day, you allow for shorter, more focused training sessions, reducing the strain on your fingers in each session. Additionally, the time gap between morning and evening sessions provides ample recovery time.
        
        **4. Skill Acquisition:
        Hangboarding twice a day offers the opportunity for skill acquisition and refinement. Morning sessions may target specific grips and holds, while evening sessions can focus on finger movement and technique. This dual-pronged approach contributes to a more well-rounded and nuanced finger strength development.
        
        **5. Cognitive Engagement:
        Engaging in two hangboarding sessions a day provides climbers with increased cognitive engagement. By breaking the routine into smaller, more frequent segments, climbers can maintain higher levels of focus and concentration, potentially leading to improved technique and form.
        
        Conclusion:
        While hangboarding twice a day may not be suitable for everyone and should be approached with caution, those seeking to expedite finger strength gains and enhance overall climbing performance might find merit in this intensified routine. As with any training regimen, it's crucial to listen to your body, monitor fatigue levels, and adjust the frequency and intensity of hangboarding sessions accordingly. With thoughtful planning, dedication, and proper recovery, the double delight of hangboarding could be the key to unlocking new heights in your climbing journey.`,
        date: '2024-01-26',
        styles: '',
        author: 'James Lang & Chat GPT'
    },
    {
        id: '3',
        title: 'Thoughts On The 4 Generation Rule From The Muqaddimah',
        slug: '20240220-1',
        content: `The book the Muqaddimah discusses the 4 generation theory.
                The theory reads: "Prestige lasts at best four generations in one lineage". Though written in the 1400s, I think this book still has many themes worth exploring, and this is one I found particularly interesting. I intend to research a few case studies and see if 1. There is truth to the idea that generational wealth or success does not persist and 2. Examine a couple case studies of families to succeed past 4 generations.`,
        date: '2024-02-20',
        styles: '',
        author: 'James Lang'
    },
    {
        id: '4',
        title: 'Adding a create post screen',
        slug: '20240220-2',
        content: 'I should develop a screen to create a blog post and add its information to the list of exisiting posts',
        date: '2024-02-20',
        styles: '',
        author: 'James Lang'
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