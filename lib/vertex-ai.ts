import { VertexAI } from '@google-cloud/vertexai';
import { readFileSync } from 'fs';
import path from 'path';

/**
 * Vertex AI クライアントの初期化
 * 
 * Google Cloud の Vertex AI を使用するためのクライアントを作成します。
 * 認証は vertex-key.json ファイルを使用します。
 */
export function getVertexAIClient() {
    // プロジェクトIDと場所
    const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID || 'gen-lang-client-0942966762';
    const location = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';

    // 認証情報ファイルのパス
    const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS ||
        path.join(process.cwd(), 'vertex-key.json');

    // JSONキーを読み込み
    const credentials = JSON.parse(readFileSync(keyPath, 'utf8'));

    // Vertex AI クライアントを初期化
    const vertexAI = new VertexAI({
        project: projectId,
        location: location,
        googleAuthOptions: {
            credentials: credentials,
        },
    });

    return vertexAI;
}

/**
 * Imagen 4.0 モデルの取得
 * 
 * ポスター生成用の Imagen 4.0 モデルを取得します。
 * コスト: 約 $0.04/画像 = 約6円/回（2K解像度）
 */
export function getImagen4Model() {
    const vertexAI = getVertexAIClient();

    // Imagen 4.0 モデルを取得
    const model = vertexAI.preview.getGenerativeModel({
        model: 'imagen-4.0-generate-001',
    });

    return model;
}

/**
 * テスト用関数
 * 
 * Vertex AI の接続をテストします。
 */
export async function testVertexAIConnection() {
    try {
        const vertexAI = getVertexAIClient();
        console.log('✅ Vertex AI クライアント初期化成功');
        return true;
    } catch (error) {
        console.error('❌ Vertex AI クライアント初期化失敗:', error);
        return false;
    }
}
