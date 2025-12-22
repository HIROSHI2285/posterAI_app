/**
 * Canvas APIを使用してテキストをオーバーレイ
 */
export function overlayTextOnImage(
    backgroundImageData: string,
    textData: {
        mainTitle: string;
        subTitle?: string;
        freeText?: string;
        mainFont: string;
        subFont: string;
        mainColor: string;
        layout: string;
        orientation: string;
    },
    dimensions: { width: number; height: number }
): Promise<string> {
    return new Promise((resolve, reject) => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d")!;

        canvas.width = dimensions.width;
        canvas.height = dimensions.height;

        const img = new Image();
        img.crossOrigin = "anonymous";

        img.onload = () => {
            // 背景画像を描画
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            // テキストをオーバーレイ
            drawText(ctx, textData, dimensions);

            // Base64として返す
            resolve(canvas.toDataURL("image/png"));
        };

        img.onerror = () => {
            reject(new Error("背景画像の読み込みに失敗しました"));
        };

        img.src = backgroundImageData;
    });
}

/**
 * Canvas上にテキストを描画
 */
function drawText(
    ctx: CanvasRenderingContext2D,
    textData: {
        mainTitle: string;
        subTitle?: string;
        freeText?: string;
        mainFont: string;
        subFont: string;
        mainColor: string;
        layout: string;
        orientation: string;
    },
    dimensions: { width: number; height: number }
) {
    const { mainTitle, subTitle, freeText, mainFont, subFont, mainColor, layout } = textData;
    const { width, height } = dimensions;

    // テキストの配置を決定
    const positions = calculateTextPositions(layout, width, height);

    // メインタイトル
    ctx.save();
    ctx.font = `bold ${Math.floor(width / 15)}px ${mainFont}, sans-serif`;
    ctx.fillStyle = "#FFFFFF";
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 8;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // 影を追加
    ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
    ctx.shadowBlur = 15;
    ctx.shadowOffsetX = 4;
    ctx.shadowOffsetY = 4;

    // アウトライン
    ctx.strokeText(mainTitle, positions.mainTitle.x, positions.mainTitle.y);
    // テキスト
    ctx.fillText(mainTitle, positions.mainTitle.x, positions.mainTitle.y);
    ctx.restore();

    // サブタイトル
    if (subTitle) {
        ctx.save();
        ctx.font = `${Math.floor(width / 25)}px ${subFont}, sans-serif`;
        ctx.fillStyle = "#FFFFFF";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 4;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;

        ctx.strokeText(subTitle, positions.subTitle.x, positions.subTitle.y);
        ctx.fillText(subTitle, positions.subTitle.x, positions.subTitle.y);
        ctx.restore();
    }

    // フリーテキスト
    if (freeText) {
        ctx.save();
        ctx.font = `${Math.floor(width / 35)}px ${subFont}, sans-serif`;
        ctx.fillStyle = "#FFFFFF";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 3;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
        ctx.shadowBlur = 8;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;

        // 複数行対応
        const lines = freeText.split('\n');
        lines.forEach((line, index) => {
            const y = positions.freeText.y + (index * Math.floor(width / 25));
            ctx.strokeText(line, positions.freeText.x, y);
            ctx.fillText(line, positions.freeText.x, y);
        });
        ctx.restore();
    }
}

/**
 * レイアウトに応じたテキスト位置を計算
 */
function calculateTextPositions(
    layout: string,
    width: number,
    height: number
): {
    mainTitle: { x: number; y: number };
    subTitle: { x: number; y: number };
    freeText: { x: number; y: number };
} {
    const centerX = width / 2;
    const centerY = height / 2;

    switch (layout) {
        case 'center':
            return {
                mainTitle: { x: centerX, y: centerY },
                subTitle: { x: centerX, y: centerY + height / 8 },
                freeText: { x: centerX, y: height * 0.8 },
            };

        case 'split-vertical':
            return {
                mainTitle: { x: centerX, y: height * 0.25 },
                subTitle: { x: centerX, y: height * 0.35 },
                freeText: { x: centerX, y: height * 0.75 },
            };

        case 'split-horizontal':
            return {
                mainTitle: { x: width * 0.3, y: centerY },
                subTitle: { x: width * 0.3, y: centerY + height / 10 },
                freeText: { x: width * 0.7, y: centerY },
            };

        default:
            return {
                mainTitle: { x: centerX, y: centerY },
                subTitle: { x: centerX, y: centerY + height / 8 },
                freeText: { x: centerX, y: height * 0.8 },
            };
    }
}
