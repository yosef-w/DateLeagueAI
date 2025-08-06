/**
 * Call backend endpoint to analyze an image using Gemini.
 * @param imagePath gs:// path of image in Firebase Storage
 * @returns feedback string returned from backend
 */
const API_KEY = 'a19d25dff543b631f6cfdf31313ef5b6d61301e7';

export async function callGeminiApi(imagePath: string): Promise<string> {
  const response = await fetch('https://your-backend.com/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({ imagePath }),
  });

  if (!response.ok) {
    throw new Error('Failed to analyze image');
  }

  const data = await response.json();
  return data.feedback as string;
}

