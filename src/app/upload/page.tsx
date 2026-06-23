"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileWarning, Loader2, Camera, Sparkles, CheckCircle2 } from "lucide-react";
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
    <div className="mx-auto max-w-xl px-5 py-8 animate-fade-in">
      <div className="mb-6">
        <h2 className="text-xl font-extrabold text-slate-900">上传单词</h2>
        <p className="mt-0.5 text-xs text-slate-400">拍照或选择图片，AI 自动识别其中的单词</p>
      </div>

      {/* ── 上传区 ── */}
      {step === "upload" && (
        <>
          <div
            {...getRootProps()}
            className={`relative cursor-pointer overflow-hidden rounded-3xl border-2 border-dashed p-12 text-center transition-all duration-300 ${
              isDragActive
                ? "border-indigo-400 bg-indigo-50/50 scale-[1.02]"
                : "border-slate-200 bg-white/50 hover:border-slate-300 hover:bg-white/80"
            }`}
          >
            {/* 背景装饰 */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/40 via-transparent to-purple-50/40 opacity-0 transition-opacity duration-300 pointer-events-none" />

            <input {...getInputProps()} />
            {recognizing ? (
              <div className="relative flex flex-col items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50">
                  <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700">AI 正在识别...</p>
                  <p className="mt-0.5 text-xs text-slate-400">请稍候，正在分析图片中的单词</p>
                </div>
              </div>
            ) : (
              <div className="relative flex flex-col items-center gap-4">
                <div
                  className={`flex h-16 w-16 items-center justify-center rounded-2xl transition-all duration-300 ${
                    isDragActive
                      ? "bg-indigo-100 scale-110"
                      : "bg-slate-50"
                  }`}
                >
                  <Upload className={`h-7 w-7 transition-all duration-300 ${
                    isDragActive ? "text-indigo-500" : "text-slate-300"
                  }`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600">
                    {isDragActive ? "松手上传" : "拖拽图片或 PDF 到此处"}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400">或点击选择 · JPG、PNG、PDF · 最大 10MB</p>
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="mt-4 flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50/80 p-4 animate-fade-in">
              <FileWarning className="h-5 w-5 shrink-0 text-amber-500" />
              <p className="text-sm text-amber-700">{error}</p>
            </div>
          )}
        </>
      )}

      {/* ── 确认编辑 ── */}
      {step === "confirm" && (
        <div className="animate-slide-up">
          {/* 预览 */}
          <div className="mb-5 glass-card overflow-hidden">
            {preview && (
              <img
                src={preview}
                alt="预览"
                className="h-40 w-full object-contain bg-slate-50"
              />
            )}
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50">
                <Sparkles className="h-4 w-4 text-indigo-500" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-700">{file?.name}</p>
                <p className="text-[11px] text-slate-400">
                  识别到 {editingWords.length} 个单词，请确认或编辑
                </p>
              </div>
            </div>
          </div>

          {/* 单词编辑列表 */}
          <div className="space-y-2">
            {editingWords.map((w, i) => (
              <div
                key={i}
                className="glass-card flex items-center gap-2 px-3 py-2 transition-all hover:shadow-md"
              >
                <span className="w-5 text-center text-xs font-medium text-slate-400">{i + 1}</span>
                <input
                  value={w.word}
                  onChange={(e) => updateWord(i, "word", e.target.value)}
                  className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 placeholder:text-slate-300 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  placeholder="单词"
                />
                <input
                  value={w.partOfSpeech}
                  onChange={(e) => updateWord(i, "partOfSpeech", e.target.value)}
                  className="w-16 rounded-xl border border-slate-200 bg-slate-50 px-2 py-2 text-sm text-slate-600 placeholder:text-slate-300 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  placeholder="词性"
                />
                <input
                  value={w.chineseMeaning}
                  onChange={(e) => updateWord(i, "chineseMeaning", e.target.value)}
                  className="w-24 rounded-xl border border-slate-200 bg-slate-50 px-2 py-2 text-sm text-slate-600 placeholder:text-slate-300 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  placeholder="释义"
                />
                <button
                  onClick={() => removeWord(i)}
                  className="rounded-lg p-1.5 text-slate-300 transition-colors hover:bg-red-50 hover:text-red-400"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          {/* 底部操作 */}
          <div className="mt-4 flex items-center justify-between">
            <button
              onClick={addWord}
              className="rounded-xl px-3 py-2 text-xs font-medium text-indigo-600 transition-all hover:bg-indigo-50"
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
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-500 transition-all hover:bg-slate-50"
              >
                取消
              </button>
              <button
                onClick={saveWords}
                disabled={saving || editingWords.filter((w) => w.word.trim()).length === 0}
                className="btn-gradient rounded-xl px-5 py-2.5 text-sm disabled:opacity-50 disabled:shadow-none"
              >
                {saving ? "保存中..." : "存入我的词库"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 保存成功 ── */}
      {step === "saved" && (
        <div className="glass-card flex flex-col items-center py-16 animate-bounce-in">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
            <CheckCircle2 className="h-9 w-9 text-emerald-500" />
          </div>
          <p className="text-lg font-bold text-slate-800">已保存到我的词库</p>
          <p className="mt-1 text-xs text-slate-400">即将跳转回上传页...</p>
        </div>
      )}
    </div>
  );
}
