# IP 檢測 Provider 動態排序與自動停用設計

## 目標

1. **動態測速排序**：頁面載入時自動測速，按延遲由快到慢排序
2. **失敗自動隱藏**：檢測失敗的 Provider 自動從 UI 隱藏

## 行為規格

### 測速流程

- 頁面載入時，對所有 IP 檢測 Provider **同時並發**發送測速請求
- 使用 `Promise.allSettled` 確保一個失敗不影響其他
- 每個 Provider 最多等 **3 秒** timeout
- 失敗 Threshold：3 秒無回應視為失敗
- 測速成功後記錄延遲（毫秒）

### 排序邏輯

- 成功 Provider：按延遲由快到慢排序
- 失敗 Provider：從 UI 隱藏（不刪除，仍在 state 中標記為 failed）
- 結果快取至 localStorage，避免每次都要測速

### Provider 狀態

| 狀態 | 說明 |
|------|------|
| `pending` | 測速中 |
| `success` | 成功，記錄 latency |
| `failed` | 失敗，隱藏卡片 |

### 重新測速

- 提供「刷新測速」按鈕，讓用戶手動重新測速
- 按鈕位置：Preferences.vue 或 IpInfos.vue 附近

## 資料結構

```javascript
// store.js
ipDetectors: [
  {
    id: 0,
    name: 'CN Source',
    fetchFn: getIPFromIPIP,
    status: 'pending', // 'pending' | 'success' | 'failed'
    latency: null,    // ms
  },
  // ...
]
```

## 改動檔案

| 檔案 | 變動 |
|------|------|
| `frontend/store.js` | 加入 `ipDetectors` state、測速邏輯、快取讀寫 |
| `frontend/components/IpInfos.vue` | 改為動態讀取 `ipDetectors`，失敗自動隱藏 |
| `frontend/components/widgets/Preferences.vue` | 加入「刷新測速」按鈕 |
| `frontend/utils/getips/*.js` | 各 provider 加上 timeout wrapper |

## 實作細節

### 測速函式

```javascript
async function speedTest(provider) {
  const start = performance.now();
  try {
    await Promise.race([
      provider.fetchFn(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000))
    ]);
    return { status: 'success', latency: performance.now() - start };
  } catch {
    return { status: 'failed', latency: null };
  }
}
```

### 快取策略

- Key: `iptools_ipdetectors_cache`
- Value: `{ timestamp, detectors: [...] }`
- TTL: 24 小時（避免 Provider 狀態永遠不更新）

### UI 渲染

- 只渲染 `status === 'success'` 的 Provider
- 依 `latency` 排序
