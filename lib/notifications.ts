/**
 * ブラウザ通知を表示するユーティリティ関数
 */

/**
 * 通知の許可をリクエスト
 */
export async function requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
        console.warn('このブラウザは通知をサポートしていません')
        return false
    }

    console.log('現在の通知許可状態:', Notification.permission)

    if (Notification.permission === 'granted') {
        console.log('通知許可済み')
        return true
    }

    if (Notification.permission !== 'denied') {
        console.log('通知許可をリクエスト中...')
        const permission = await Notification.requestPermission()
        console.log('通知許可結果:', permission)
        return permission === 'granted'
    }

    console.warn('通知が拒否されています')
    return false
}

/**
 * ブラウザ通知を表示
 */
export function showNotification(title: string, options?: NotificationOptions) {
    console.log('通知を表示:', title, options)

    if (!('Notification' in window)) {
        console.warn('Notification API非対応 - alertにフォールバック')
        // フォールバック: alert
        alert(title)
        return
    }

    console.log('通知許可状態:', Notification.permission)

    if (Notification.permission === 'granted') {
        try {
            const notification = new Notification(title, {
                icon: '/posterai-logo.svg',
                badge: '/posterai-logo.svg',
                ...options
            })
            console.log('通知を作成しました:', notification)
        } catch (error) {
            console.error('通知の表示に失敗しました:', error)
            // フォールバック: alert
            alert(title)
        }
    } else {
        console.warn('通知が許可されていません - alertにフォールバック')
        // 許可されていない場合はalert
        alert(title)
    }
}

/**
 * ポスター生成完了通知
 */
export function notifyPosterComplete() {
    showNotification('✨ ポスター生成完了！', {
        body: 'ポスターの生成が完了しました。結果を確認してください。',
        tag: 'poster-complete',
        requireInteraction: false,
        silent: false // 音を鳴らす
    })
}

/**
 * ファイルアップロード完了通知
 */
export function notifyFileUploaded(fileName: string) {
    showNotification('📁 ファイルアップロード完了', {
        body: `${fileName} のアップロードが完了しました。`,
        tag: 'file-upload',
        requireInteraction: false
    })
}

/**
 * デザイン要素抽出完了通知
 */
export function notifyAnalysisComplete() {
    showNotification('🔍 解析完了！', {
        body: 'デザイン要素の抽出が完了しました。フォームを確認してください。',
        tag: 'analysis-complete',
        requireInteraction: false,
        silent: false
    })
}
