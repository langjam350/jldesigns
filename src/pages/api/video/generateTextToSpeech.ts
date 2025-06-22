import { NextApiRequest, NextApiResponse } from 'next';
import { TextToSpeechClient, protos } from '@google-cloud/text-to-speech';

const client = new TextToSpeechClient();

export const config = {
    api: {
        bodyParser: true, // Ensures Next.js parses JSON body
    },
};

// Define supported language codes
type SupportedLanguage = 'en-US' | 'en-GB' | 'en-AU' | 'es-US' | 'es-ES' | 'fr-FR' | 'de-DE' | 'it-IT' | 'pt-BR' | 'ja-JP' | 'ko-KR' | 'zh-CN' | 'hi-IN';

// Best neural voice options for each language
const NEURAL_VOICES: Record<SupportedLanguage, string[]> = {
    'en-US': [
        'en-US-Neural2-A', 'en-US-Neural2-C', 'en-US-Neural2-D', 'en-US-Neural2-E', 
        'en-US-Neural2-F', 'en-US-Neural2-G', 'en-US-Neural2-H', 'en-US-Neural2-I', 'en-US-Neural2-J'
    ],
    'en-GB': ['en-GB-Neural2-A', 'en-GB-Neural2-B', 'en-GB-Neural2-C', 'en-GB-Neural2-D'],
    'en-AU': ['en-AU-Neural2-A', 'en-AU-Neural2-B', 'en-AU-Neural2-C', 'en-AU-Neural2-D'],
    'es-US': ['es-US-Neural2-A', 'es-US-Neural2-B', 'es-US-Neural2-C'],
    'es-ES': ['es-ES-Neural2-A', 'es-ES-Neural2-B', 'es-ES-Neural2-C', 'es-ES-Neural2-D'],
    'fr-FR': ['fr-FR-Neural2-A', 'fr-FR-Neural2-B', 'fr-FR-Neural2-C', 'fr-FR-Neural2-D'],
    'de-DE': ['de-DE-Neural2-A', 'de-DE-Neural2-B', 'de-DE-Neural2-C', 'de-DE-Neural2-D'],
    'it-IT': ['it-IT-Neural2-A', 'it-IT-Neural2-C'],
    'pt-BR': ['pt-BR-Neural2-A', 'pt-BR-Neural2-B', 'pt-BR-Neural2-C'],
    'ja-JP': ['ja-JP-Neural2-B', 'ja-JP-Neural2-C', 'ja-JP-Neural2-D'],
    'ko-KR': ['ko-KR-Neural2-A', 'ko-KR-Neural2-B', 'ko-KR-Neural2-C'],
    'zh-CN': ['cmn-CN-Wavenet-A', 'cmn-CN-Wavenet-B', 'cmn-CN-Wavenet-C', 'cmn-CN-Wavenet-D'],
    'hi-IN': ['hi-IN-Neural2-A', 'hi-IN-Neural2-B', 'hi-IN-Neural2-C', 'hi-IN-Neural2-D']
};

// Studio voices for more conversational/engaging content
const STUDIO_VOICES: Partial<Record<SupportedLanguage, string[]>> = {
    'en-US': ['en-US-Studio-M', 'en-US-Studio-O', 'en-US-Studio-Q']
};

function getRandomVoice(languageCode: string, useStudio: boolean = false): string {
    const langCode = languageCode as SupportedLanguage;
    
    // Try Studio voices first if requested (most engaging for content)
    if (useStudio && STUDIO_VOICES[langCode]) {
        const studioVoices = STUDIO_VOICES[langCode]!;
        return studioVoices[Math.floor(Math.random() * studioVoices.length)];
    }
    
    // Fall back to Neural2 voices (most human-like)
    if (NEURAL_VOICES[langCode]) {
        const neuralVoices = NEURAL_VOICES[langCode];
        return neuralVoices[Math.floor(Math.random() * neuralVoices.length)];
    }
    
    // Ultimate fallback to standard voice with gender selection
    const useFemaleVoice = Math.random() < 0.5;
    return useFemaleVoice ? 'FEMALE' : 'MALE';
}

function detectVoiceGender(voiceName: string): string {
    // Neural2 and Studio voice naming patterns
    if (voiceName.includes('-A') || voiceName.includes('-C') || voiceName.includes('-E') || 
        voiceName.includes('-G') || voiceName.includes('-I') || voiceName.includes('-Studio-M') ||
        voiceName.includes('-Studio-O')) {
        return 'MALE';
    } else if (voiceName.includes('-B') || voiceName.includes('-D') || voiceName.includes('-F') || 
               voiceName.includes('-H') || voiceName.includes('-J') || voiceName.includes('-Studio-Q')) {
        return 'FEMALE';
    }
    return 'UNKNOWN';
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    console.log(`[TTS API] Received request:`, req.body);

    try {
        const { text, videoId, language = 'en-US', voiceStyle = 'neural' } = req.body;
        
        if (!text || !videoId) {
            console.error(`[TTS API] Missing text or videoId in request.`);
            return res.status(400).json({ error: 'Missing text or videoId' });
        }

        const textToSpeech = text.replace(/Resources[\s\S]*$/, '');
        const languageCode = language || 'en-US';
        const useStudio = voiceStyle === 'studio' || voiceStyle === 'conversational';
        
        // Get the best voice for the language and style
        const selectedVoice = getRandomVoice(languageCode, useStudio);
        const voiceGender = detectVoiceGender(selectedVoice);
        
        console.log(`[TTS] Language: ${languageCode}, Voice: ${selectedVoice}, Gender: ${voiceGender}`);

        let request: protos.google.cloud.texttospeech.v1.ISynthesizeSpeechRequest;

        // Use specific voice name for Neural2/Studio voices
        if (selectedVoice.includes('Neural2') || selectedVoice.includes('Studio') || selectedVoice.includes('Wavenet')) {
            request = {
                input: { text: textToSpeech },
                voice: { 
                    languageCode: languageCode,
                    name: selectedVoice  // Use specific neural/studio voice
                },
                audioConfig: { 
                    audioEncoding: protos.google.cloud.texttospeech.v1.AudioEncoding.MP3,
                    speakingRate: 1.0,  // Natural pace
                    pitch: 0.0          // Natural pitch
                },
            };
        } else {
            // Fallback to gender-based selection for standard voices
            const gender = selectedVoice === 'FEMALE' 
                ? protos.google.cloud.texttospeech.v1.SsmlVoiceGender.FEMALE
                : protos.google.cloud.texttospeech.v1.SsmlVoiceGender.MALE;
                
            request = {
                input: { text: textToSpeech },
                voice: { 
                    languageCode: languageCode,
                    ssmlGender: gender
                },
                audioConfig: { 
                    audioEncoding: protos.google.cloud.texttospeech.v1.AudioEncoding.MP3,
                    speakingRate: 1.0,
                    pitch: 0.0
                },
            };
        }

        console.log(`[TTS] Generating ${languageCode} speech for: "${textToSpeech.slice(0, 50)}..."`);
        const [audioResponse] = await client.synthesizeSpeech(request);

        if (!audioResponse.audioContent) {
            throw new Error('No audio content received from TTS API.');
        }

        const audioBase64 = Buffer.from(audioResponse.audioContent).toString('base64');
        
        res.status(200).json({ 
            audioBase64, 
            fileName: `${videoId}.mp3`,
            voiceGender: voiceGender,
            voiceName: selectedVoice,
            language: languageCode,
            voiceType: selectedVoice.includes('Neural2') ? 'Neural2' : 
                      selectedVoice.includes('Studio') ? 'Studio' : 
                      selectedVoice.includes('Wavenet') ? 'WaveNet' : 'Standard'
        });
    } catch (error) {
        console.error(`[TTS Error]`, error);
        res.status(500).json({ error: 'Failed to generate speech' });
    }
}