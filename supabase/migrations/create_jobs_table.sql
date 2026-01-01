-- jobs テーブル: ポスター生成ジョブの管理
-- Vercelサーバーレス環境でもジョブ状態を永続化するため

CREATE TABLE IF NOT EXISTS jobs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    progress INTEGER NOT NULL DEFAULT 0,
    image_url TEXT,
    error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- 制約
    CONSTRAINT valid_status CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    CONSTRAINT valid_progress CHECK (progress >= 0 AND progress <= 100)
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_jobs_user_id ON jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at);

-- RLS (Row Level Security)
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- サービスロールはすべての操作が可能
CREATE POLICY "Service role can do anything" ON jobs
    FOR ALL USING (auth.role() = 'service_role');

-- 古いジョブの自動削除用（1時間以上前）
-- ※ Supabaseのcronジョブで定期実行することも可能
