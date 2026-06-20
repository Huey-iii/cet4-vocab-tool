-- CET-4 词汇工具 数据库迁移
-- 在 Supabase SQL Editor 中执行此脚本

-- 用户词库表
CREATE TABLE IF NOT EXISTS words (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  word TEXT NOT NULL,
  part_of_speech TEXT DEFAULT '',
  source TEXT DEFAULT 'upload' CHECK (source IN ('upload', 'manual', 'cet4_builtin')),
  created_at TIMESTAMPTZ DEFAULT now(),
  last_reviewed_at TIMESTAMPTZ DEFAULT now()
);

-- 听写记录表
CREATE TABLE IF NOT EXISTS dictation_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mode TEXT NOT NULL CHECK (mode IN ('handwrite', 'typing')),
  word_ids UUID[] NOT NULL DEFAULT '{}',
  results JSONB DEFAULT '{"items": []}',
  score FLOAT DEFAULT 0,
  duration_seconds INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_words_user_id ON words(user_id);
CREATE INDEX IF NOT EXISTS idx_words_word ON words(word);
CREATE INDEX IF NOT EXISTS idx_dictation_user_id ON dictation_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_dictation_created ON dictation_sessions(created_at DESC);

-- Row Level Security
ALTER TABLE words ENABLE ROW LEVEL SECURITY;
ALTER TABLE dictation_sessions ENABLE ROW LEVEL SECURITY;

-- RLS 策略：用户只能访问自己的数据
CREATE POLICY "Users can read own words" ON words
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own words" ON words
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own words" ON words
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own words" ON words
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can read own dictation_sessions" ON dictation_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own dictation_sessions" ON dictation_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 手写批改图片存储 Bucket
-- 在 Supabase Dashboard > Storage 中手动创建 bucket: handwriting-images
-- 然后执行以下 RLS：
-- CREATE POLICY "Users can upload own handwriting" ON storage.objects
--   FOR INSERT WITH CHECK (bucket_id = 'handwriting-images' AND auth.uid()::text = (storage.foldername(name))[1]);
-- CREATE POLICY "Users can read own handwriting" ON storage.objects
--   FOR SELECT USING (bucket_id = 'handwriting-images' AND auth.uid()::text = (storage.foldername(name))[1]);
