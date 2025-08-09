const API_KEY = 'AIzaSyD2pnYFF6ho3t-xm3E4KSpq8zAFBnd_z3g'; // ✅ Safe in dev, use env in prod

/**
 * Convert Blob to base64
 */
const blobToBase64 = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64data = (reader.result as string).split(',')[1];
      resolve(base64data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

/**
 * Convert image URL to base64-encoded string and extract mime type
 */
async function convertImageUrlToBase64(imageUrl: string): Promise<{ base64: string; mimeType: string }> {
  console.log('📥 Fetching image from:', imageUrl);
  const response = await fetch(imageUrl);
  const blob = await response.blob();
  console.log('📦 Blob type:', blob.type, 'size:', blob.size);
  const base64 = await blobToBase64(blob);
  console.log('📦 Base64 image length:', base64.length);
  return { base64, mimeType: blob.type };
}

/**
 * Call Gemini API with image URL
 */
export async function callGeminiApi(imageUrl: string): Promise<string> {
  try {
    const { base64, mimeType } = await convertImageUrlToBase64(imageUrl);

    const payload = {
      contents: [
        {
          parts: [
            { text: 'Give detailed feedback about this dating profile photo.' },
            {
              inline_data: {
                mime_type: mimeType,
                data: base64,
              },
            },
          ],
        },
      ],
    };

    console.log('🔍 Calling Gemini API with model: gemini-2.5-pro');

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-pro:generateContent?key=${API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    );

    const data = await response.json();
    console.log('🤖 Gemini API response:', data);

    if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
      return data.candidates[0].content.parts[0].text;
    }

    return 'No valid response from Gemini.';
  } catch (error) {
    console.error('❌ Gemini API error:', error);
    return 'Error analyzing the image.';
  }
}
