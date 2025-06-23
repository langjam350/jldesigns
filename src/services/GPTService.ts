const BASE_URL = process.env.NEXT_PUBLIC_APP_ENV === 'development' ? 'https://dev.wellnessworldwideweb.com' : 'https://www.wellnessworldwideweb.com';

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second delay between retries

// Making this an interface allows for switching out for other AI Units
export interface IGPTService {
    communicateWithGPT(prompt: string, model: string): Promise<string>;
}

export default class GPTService implements IGPTService {
    private async delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    private async attemptCommunication(prompt: string, model: string, attempt: number = 1): Promise<string> {
        try {
            const response = await fetch(`${BASE_URL}/api/blog/communicateWithGPT`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ prompt, model })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data.content;
        } catch (error) {
            if (attempt >= MAX_RETRIES) {
                console.error(`Final attempt (${attempt}) failed:`, error);
                throw new Error('Failed to communicate with GPT after maximum retries');
            }

            console.warn(`Attempt ${attempt} failed, retrying after ${RETRY_DELAY}ms...`);
            await this.delay(RETRY_DELAY);
            return this.attemptCommunication(prompt, model, attempt + 1);
        }
    }

    public async communicateWithGPT(prompt: string, model: string = "text-davinci-003"): Promise<string> {
        try {
            return await this.attemptCommunication(prompt, model);
        } catch (error) {
            console.error('All communication attempts failed:', error);
            throw error;
        }
    }
}