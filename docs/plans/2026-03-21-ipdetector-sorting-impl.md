# IP Detector 動態排序與自動停用實作計畫

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 頁面載入時自動測速各 IP 檢測 Provider，按延遲排序；失敗的 Provider 自動從 UI 隱藏

**Architecture:** 在 store.js 建立 ipDetectors state 管理 Provider 狀態與排序；IpInfos.vue 改為動態渲染；加入快取機制避免每次都要測速

**Tech Stack:** Vue 3 + Pinia + localStorage

---

## Task 1: 在 store.js 加入 ipDetectors state 與測速函式

**Files:**
- Modify: `frontend/utils/store.js`
- Test: `frontend/utils/store.spec.js` (如不存在則建立)

**Step 1: 新增 state 結構**

在 `store.js` 的 `defineStore` 中加入：

```javascript
const defaultIpDetectors = [
  { id: 0, name: 'CN Source', fetchFn: 'getIPFromIPIP', status: 'pending', latency: null },
  { id: 1, name: 'Cloudflare IPv4', fetchFn: 'getIPFromCloudflare_V4', status: 'pending', latency: null },
  { id: 2, name: 'Cloudflare IPv6', fetchFn: 'getIPFromCloudflare_V6', status: 'pending', latency: null },
  { id: 3, name: '8888IP IPv6/4', fetchFn: 'getIPFromIPChecking64', status: 'pending', latency: null },
  { id: 4, name: '8888IP IPv4', fetchFn: 'getIPFromIPChecking4', status: 'pending', latency: null },
  { id: 5, name: '8888IP IPv6', fetchFn: 'getIPFromIPChecking6', status: 'pending', latency: null },
];

const CACHE_KEY = 'iptools_ipdetectors_cache';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
```

**Step 2: 加入快取讀寫函式**

```javascript
function loadDetectorCache() {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const { timestamp, detectors } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_TTL) {
        return detectors;
      }
    }
  } catch (e) { /* ignore */ }
  return null;
}

function saveDetectorCache(detectors) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      timestamp: Date.now(),
      detectors
    }));
  } catch (e) { /* ignore */ }
}
```

**Step 3: 加入測速與排序函式**

```javascript
async function speedTestAndSortDetectors() {
  const results = await Promise.allSettled(
    defaultIpDetectors.map(async (detector) => {
      const start = performance.now();
      const fetchFn = window[detector.fetchFn];
      if (!fetchFn) throw new Error('Function not found');
      await Promise.race([
        fetchFn(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000))
      ]);
      return { ...detector, status: 'success', latency: performance.now() - start };
    })
  );

  const sorted = results
    .map((r, i) => r.status === 'fulfilled' ? r.value : { ...defaultIpDetectors[i], status: 'failed', latency: null })
    .filter(d => d.status === 'success')
    .sort((a, b) => a.latency - b.latency);

  saveDetectorCache(sorted);
  return sorted;
}
```

**Step 4: Commit**

```bash
git add frontend/utils/store.js
git commit -m "feat(store): add ipDetectors state with speed test and cache"
```

---

## Task 2: 修改 IpInfos.vue 改為動態渲染

**Files:**
- Modify: `frontend/components/IpInfos.vue`

**Step 1: 讀取當前檔案，找到 `ipFunctions` 定義處 (約 line 163)**

原本：
```javascript
const ipFunctions = [
  () => fetchIP(0, getIPFromIPIP),
  () => fetchIP(1, getIPFromCloudflare_V4),
  ...
];
```

**Step 2: 改為從 store 讀取已排序的 detectors**

在 `checkAllIPs` 函式開頭加入測速邏輯：
```javascript
const checkAllIPs = async () => {
  // Try cache first
  let detectors = store.ipDetectors;
  
  if (!detectors || detectors.length === 0) {
    const cached = loadDetectorCache();
    if (cached) {
      store.setIpDetectors(cached);
      detectors = cached;
    } else {
      // Speed test all providers
      detectors = await speedTestAndSortDetectors();
      store.setIpDetectors(detectors);
    }
  }

  // Build fetch functions from sorted detectors
  const ipFunctions = detectors.map((detector, idx) => {
    const fetchFn = window[detector.fetchFn];
    return () => fetchIP(idx, fetchFn);
  });
  // ... rest of existing logic
};
```

**Step 3: Commit**

```bash
git add frontend/components/IpInfos.vue
git commit -m "feat(IpInfos): dynamic rendering from sorted detectors"
```

---

## Task 3: 加入「刷新測速」按鈕到 Preferences.vue

**Files:**
- Modify: `frontend/components/widgets/Preferences.vue`

**Step 1: 在 Preferences.vue 的合適位置加入按鈕**

在現有設定項目附近加入：
```html
<div class="setting-item">
  <span>{{ t('refreshDetectorTest') }}</span>
  <button @click="refreshDetectorTest" class="refresh-btn">
    {{ t('refresh') }}
  </button>
</div>
```

**Step 2: 加入點擊處理函式**

```javascript
async function refreshDetectorTest() {
  localStorage.removeItem(CACHE_KEY);
  const detectors = await speedTestAndSortDetectors();
  store.setIpDetectors(detectors);
  // Reload page to re-detect IPs
  window.location.reload();
}
```

**Step 3: Commit**

```bash
git add frontend/components/widgets/Preferences.vue
git commit -m "feat(prefs): add refresh detector test button"
```

---

## Task 4: 加入 i18n 翻譯

**Files:**
- Modify: `frontend/locales/*.json` (各語言檔案)

**Step 1: 加入翻譯 key**

```json
{
  "refreshDetectorTest": "重新測速",
  "refresh": "刷新"
}
```

**Step 2: Commit**

```bash
git add frontend/locales/
git commit -m "i18n: add refresh detector test translations"
```

---

## Task 5: 測試驗證

**Step 1: 開啟瀏覽器 DevTools，檢查**

1. localStorage 是否有 `iptools_ipdetectors_cache`
2. 頁面載入後卡片是否按延遲排序
3. 嘗試斷網或模擬某 Provider 失敗，是否隱藏該卡片

**Step 2: 點擊「刷新測速」按鈕**

確認：
- 快取清除
- 重新測速
- 頁面重新載入並重新排序

---

**Plan complete and saved to `docs/plans/2026-03-21-ipdetector-sorting-design.md`.**

**Two execution options:**

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

**Which approach?**
