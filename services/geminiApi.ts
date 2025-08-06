/**
 * Call backend endpoint to analyze an image using Gemini.
 * @param imagePath gs:// path of image in Firebase Storage
 * @returns feedback string returned from backend
 */
export async function callGeminiApi(imagePath: string): Promise<string> {
  const response = await fetch('https://your-backend.com/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ imagePath }),
  });

  if (!response.ok) {
    throw new Error('Failed to analyze image');
  }

  const data = await response.json();
  return data.feedback as string;
}

