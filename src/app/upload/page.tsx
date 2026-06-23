"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileWarning, Loader2 } from "lucide-react";
import { compressAndToBase64 } from "@/lib/image";

interface RecognizedWord {
  word: string;
  partOfSpeech: string;
  chineseMeaning: string;
}

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [recognizing, setRecognizing] = useState(false);
  const [words, setWords] = useState<RecognizedWord[]>([]);
  const [editingWords, setEditingWords] = useState<RecognizedWord[]>([]);
  const [error, setError] = useState("");
  const [step, setStep] = useState<"upload" | "confirm" | "saved">("upload");
  const [saving, setSaving] = useState(false);

  const onDrop = useCallback(async (accepted: File[]) => {
    const f = accepted[0];
    if (!f) return;
    setError("");
    setFile(f);

    if (f.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result as string);
      reader.readAsDataURL(f);
    }

    setRecognizing(true);
    try {
      const base64 = await compressAndToBase64(f);
      const res = await fetch("/api/recognize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64 }),
      });
      const data = await res.json();

      if (data.error) {
        setError(data.error);
        return;
      }

      const result: RecognizedWord[] = data.words || [];
      if (data.warning) setError(data.warning);

      setWords(result);
      setEditingWords(structuredClone(result));
      if (result.length > 0) setStep("confirm");
    } catch {
      setError("识别失败，请检查网络后重试");
    } finally {
      setRecognizing(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [], "application/pdf": [".pdf"] },
    maxSize: 10 * 1024 * 1024,
    multiple: false,
  });

  function updateWord(index: number, field: "word" | "partOfSpeech" | "chineseMeaning", value: string) {
    setEditingWords((prev) =>
      prev.map((w, i) => (i === index ? { ...w, [field]: value } : w))
    );
  }

  function removeWord(index: number) {
    setEditingWords((prev) => prev.filter((_, i) => i !== index));
  }

  function addWord() {
    setEditingWords((prev) => [...prev, { word: "", partOfSpeech: "", chineseMeaning: "" }]);
  }

  async function saveWords() {
    setSaving(true);
    const valid = editingWords.filter((w) => w.word.trim());
    try {
      const res = await fetch("/api/words", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ words: valid }),
      });
      if (!res.ok) throw new Error();
      setStep("saved");
      setTimeout(() => {
        setStep("upload");
        setFile(null);
        setPreview(null);
        setWords([]);
        setEditingWords([]);
      }, 2000);
    } catch {
      setError("保存失败，请重试");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h2 className="mb-6 text-xl font-bold text-gray-900">上传单词</h2>

      {step === "upload" && (
        <>
          <div
            {...getRootProps()}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 transition ${
              isDragActive
                ? "border-blue-400 bg-blue-50"
                : "border-gray-300 hover:border-gray-400"
            }`}
          >
            <input {...getInputProps()} />
            {recognizing ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                <p className="text-sm text-gray-500">正在识别单词...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <Upload className="h-8 w-8 text-gray-400" />
                <p className="text-sm text-gray-500">
                  {isDragActive ? "松手上传" : "拖拽图片或 PDF 到此处，或点击选择"}
                </p>
                <p className="text-xs text-gray-400">支持 JPG、PNG、PDF，最大 10MB</p>
              </div>
            )}
          </div>

          {error && (
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-700">
              <FileWarning size={16} />
              {error}
            </div>
          )}
        </>
      )}

      {step === "confirm" && (
        <div>
          <div className="mb-4 flex items-center gap-4">
            {preview && (
              <img
                src={preview}
                alt="预览"
                className="h-32 w-auto rounded-lg border object-contain"
              />
            )}
            <div>
              <p className="text-sm text-gray-600">{file?.name}</p>
              <p className="text-xs text-gray-400">
                识别到 {editingWords.length} 个单词，请确认或编辑
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {editingWords.map((w, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-6 text-center text-xs text-gray-400">{i + 1}</span>
                <input
                  value={w.word}
                  onChange={(e) => updateWord(i, "word", e.target.value)}
                  className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm"
                  placeholder="单词"
                />
                <input
                  value={w.partOfSpeech}
                  onChange={(e) => updateWord(i, "partOfSpeech", e.target.value)}
                  className="w-16 rounded-md border border-gray-300 px-2 py-1.5 text-sm"
                  placeholder="词性"
                />
                <input
                  value={w.chineseMeaning}
                  onChange={(e) => updateWord(i, "chineseMeaning", e.target.value)}
                  className="w-24 rounded-md border border-gray-300 px-2 py-1.5 text-sm"
                  placeholder="中文释义"
                />
                <button
                  onClick={() => removeWord(i)}
                  className="rounded p-1 text-gray-400 hover:text-red-500"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <div className="mt-4 flex justify-between">
            <button
              onClick={addWord}
              className="text-sm text-blue-600 hover:underline"
            >
              + 添加单词
            </button>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setStep("upload");
                  setWords([]);
                  setEditingWords([]);
                }}
                className="rounded-lg border px-4 py-2 text-sm text-gray-600"
              >
                取消
              </button>
              <button
                onClick={saveWords}
                disabled={saving || editingWords.filter((w) => w.word.trim()).length === 0}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white disabled:opacity-50"
              >
                {saving ? "保存中..." : "存入我的词库"}
              </button>
            </div>
          </div>
        </div>
      )}

      {step === "saved" && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="mb-3 text-4xl">✓</div>
          <p className="text-lg font-medium text-green-600">已保存到我的词库</p>
        </div>
      )}
    </div>
  );
}

