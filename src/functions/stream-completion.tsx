export async function streamCompletion(
  prompt: string,
  onData: (value: string) => void
) {
  const res = await fetch('/api/v1/ai', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt: [
        {
          content: prompt,
          role: 'user',
        },
      ],
    }),
  });

  const reader = res.body!.getReader();
  const decoder = new TextDecoder('utf-8');
  let fullString = '';

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { value, done } = await reader.read();
    if (done) {
      break;
    }

    const text = decoder.decode(value, { stream: true });
    const strings = text
      .split('\n\n')
      .map((str) => str.trim())
      .filter(Boolean);
    let newString = '';
    for (const string of strings) {
      fullString += string;
      const prefix = 'data: ';
      if (string.startsWith(prefix)) {
        const json = string.slice(prefix.length);
        if (json === '[DONE]') {
          break;
        }
        const content = JSON.parse(json);
        newString += content.choices[0].delta.content ?? '';
      }
    }
    onData(newString);
  }
  return fullString;
}
