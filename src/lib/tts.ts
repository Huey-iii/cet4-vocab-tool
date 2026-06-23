/** 音色名称 -> 语言区域映射 */
export const VOICE_MAP: Record<string, string> = {
  Samantha: "en-US",
  Karen: "en-US",
  Daniel: "en-GB",
  Alex: "en-US",
  Tom: "en-US",
  Oliver: "en-GB",
};

/** 可用的 TTS 音色列表 */
export const VOICES: { label: string; name: string }[] = [
  { label: "美式女声 A", name: "Samantha" },
  { label: "美式女声 B", name: "Karen" },
  { label: "美式男声 A", name: "Alex" },
  { label: "美式男声 B", name: "Tom" },
  { label: "英式男声 A", name: "Daniel" },
  { label: "英式男声 B", name: "Oliver" },
];

/** 根据音色名称获取浏览器语音对象，失败时返回默认语音 */
export function resolveVoice(
  voiceName: string,
  voices: SpeechSynthesisVoice[]
): SpeechSynthesisVoice | null {
  const lang = VOICE_MAP[voiceName] || "en-US";
  return (
    voices.find((v) => v.name.includes(voiceName) && v.lang.startsWith(lang)) ||
    voices.find((v) => v.lang.startsWith(lang)) ||
    voices[0] ||
    null
  );
}

/** 朗读单词（使用浏览器内置 Web Speech API） */
export function speakWord(
  word: string,
  voice: SpeechSynthesisVoice | null,
  rate = 0.85
): SpeechSynthesisUtterance {
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(word);
  u.rate = rate;
  if (voice) u.voice = voice;
  speechSynthesis.speak(u);
  return u;
}
