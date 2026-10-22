<template>
  <!-- IP Infos -->
  <div class="ip-data-section mb-4 mt-4">
    <div class="jn-title2">
      <h2 id="IPInfo" class="col-4" :class="{ 'mobile-h2': isMobile }">🔎 {{ t('ipInfos.Title') }}</h2>
    </div>
    <div class="text-secondary">
      <p>{{ t('ipInfos.Notes') }}</p>
    </div>
    <div class="row" v-if="visibleCards.length > 0">
      <div v-for="(card, index) in visibleCards" :key="card.id" :ref="card.id"
        :class="colClass">
        <IPCard :card="card" :index="index" :isDarkMode="isDarkMode" :isMobile="isMobile" :ipGeoSource="ipGeoSource"
          :isMapShown="isMapShown" :isCardsCollapsed="isCardsCollapsed" :copiedStatus="copiedStatus" :configs="configs"
          :asnInfos="asnInfos" @refresh-card="refreshCard" />
      </div>
    </div>
    <div v-else-if="store.loadingStatus.ipcheck" class="col-12 text-center py-4">
      <div class="alert alert-warning d-inline-block px-4 py-3" role="alert">
        <i class="bi bi-exclamation-triangle-fill me-2"></i> {{ t('ipInfos.IPv4Error') }}
      </div>
    </div>
  </div>
</template>


<script setup>
import { ref, computed, onMounted, reactive, watch } from 'vue';
import { useMainStore } from '@/store';
import { useI18n } from 'vue-i18n';
import { trackEvent } from '@/utils/use-analytics';
import { isValidIP } from '@/utils/valid-ip.js';
import { transformDataFromIPapi } from '@/utils/transform-ip-data.js';
import { getIPFromIpify_V4, getIPFromCloudflare_V4, getIPFromCloudflare_V6, getIPFromIPChecking64, getIPFromIPChecking4, getIPFromIPChecking6, fetchFnMap } from '@/utils/getips';
import { speedTestAndSortDetectors, loadDetectorCache } from '@/store';
import { authenticatedFetch } from '@/utils/authenticated-fetch';
import IPCard from './ip-infos/IPCard.vue';


const { t } = useI18n();

// Store
const store = useMainStore();
const isDarkMode = computed(() => store.isDarkMode);
const isMobile = computed(() => store.isMobile);
const configs = computed(() => store.configs);
const userPreferences = computed(() => store.userPreferences);
const lang = computed(() => store.lang);

// 页面的动态配置
const isMapShown = computed(() => userPreferences.value.showMap);
const isCardsCollapsed = computed(() => userPreferences.value.simpleMode);
const hideUnavailableIPStack = computed(() => userPreferences.value.hideUnavailableIPStack);
const ipCardsToShow = computed(() => userPreferences.value.ipCardsToShow || 6);

// 检查卡片是否加载失败或不可用
const isCardError = (card) => {
  if (!card) return true;
  if (card.status === 'failed' || card.status === 'unavailable') return true;
  if (!card.ip) return false;
  return card.ip === t('ipInfos.IPv4Error') ||
         card.ip === t('ipInfos.IPv6Error') ||
         card.ip.includes('Error') ||
         card.ip.includes('失敗') ||
         card.ip.includes('不存在') ||
         !isValidIP(card.ip);
};

// 动态计算真正要显示的卡片（若偵測不到，徹底消失隱藏，不要佔位）
const visibleCards = computed(() => {
  const isAllFetched = store.loadingStatus?.ipcheck;
  const slice = ipDataCards.slice(0, ipCardsToShow.value);

  return slice.filter(card => {
    // 1. 如果已獲取失敗、超時、或明確無效，徹底隱藏，不佔位
    if (card.status === 'failed' || card.status === 'unavailable' || isCardError(card) || card.ip === null) {
      return false;
    }
    // 2. 如果整個 IP 檢測已經全部完成，只保留成功抓取到有效 IP 的卡片
    if (isAllFetched) {
      return card.ip && isValidIP(card.ip);
    }
    // 3. 在檢測進行中時，未失敗的卡片保留顯示
    return true;
  });
});

// 響應式優化網格欄位寬度（依據有效卡片數量自動平分 12 欄，杜絕空位）
const colClass = computed(() => {
  const numCards = visibleCards.value.length;
  if (numCards === 1) {
    return 'col-xl-6 col-lg-8 col-md-10 mx-auto mb-4';
  } else if (numCards === 2) {
    return 'col-xl-6 col-lg-6 col-md-6 mb-4';
  } else if (numCards === 3) {
    return 'col-xl-4 col-lg-4 col-md-4 mb-4';
  } else if (numCards === 4) {
    return 'col-xl-3 col-lg-6 col-md-6 mb-4';
  } else if (numCards >= 5) {
    return 'col-xl-4 col-lg-4 col-md-6 mb-4';
  }
  return 'col-xl-4 col-lg-6 col-md-6 mb-4';
});

// 默认卡片数据
const createDefaultCard = () => ({
  ip: "",
  status: "pending",
  country_name: "",
  region: "",
  city: "",
  latitude: "",
  longitude: "",
  isp: "",
  asn: "",
  asnlink: "",
  mapUrl: '/res/defaultMap.webp',
  mapUrl_dark: '/res/defaultMap_dark.webp',
});

// IP 数据卡片
const ipDataCards = reactive([
  {
    ...createDefaultCard(),
    id: "ipify_v4",
    source: "IPify IPv4",
  },
  {
    ...createDefaultCard(),
    id: "cloudflare_v4",
    source: "Cloudflare IPv4",
  },
  {
    ...createDefaultCard(),
    id: "cloudflare_v6",
    source: "Cloudflare IPv6",
  },
  {
    ...createDefaultCard(),
    id: "ipchecking_v64",
    source: "888IP IPv6/4",
  },
  {
    ...createDefaultCard(),
    id: "ipchecking_v4",
    source: "888IP IPv4",
  },
  {
    ...createDefaultCard(),
    id: "ipchecking_v6",
    source: "888IP IPv6",
  },
]);

// 默认 ASN 信息
const asnInfos = ref({
  "AS888888": {
    "asnName": "Google", "asnOrgName": "GOGL-ARIN", "estimatedUsers": "888888", "IPv4_Pct": "95.35", "IPv6_Pct": "4.65", "HTTP_Pct": "3.16", "HTTPS_Pct": "96.84", "Desktop_Pct": "58.88", "Mobile_Pct": "41.12", "Bot_Pct": "98.46", "Human_Pct": "1.54"
  }
});

// 其它数据
const ipDetectors = ref([]);
const copiedStatus = ref({});
const IPArray = ref([]);
const ipGeoSource = ref(userPreferences.value.ipGeoSource);
const usingSource = ref(userPreferences.value.ipGeoSource);
const fetchStatus = reactive([]);

// 中间件
let pendingIPDetailsRequests = new Map();
let ipDataCache = new Map();

// 公共获取 IP 地址方法
const fetchIP = async (cardID, getFromSource) => {
  try {
    // 3.5秒超時保護：如果當前網路環境不支援（例如 IPv6 不通），避免長時間卡住
    const timeoutPromise = new Promise(resolve =>
      setTimeout(() => resolve({ ip: null, source: ipDataCards[cardID]?.source || '' }), 3500)
    );
    const { ip, source } = await Promise.race([
      getFromSource(configs.value?.originalSite),
      timeoutPromise
    ]);

    if (ip && isValidIP(ip)) {
      ipDataCards[cardID].ip = ip;
      ipDataCards[cardID].source = source;
      ipDataCards[cardID].status = 'success';
      IPArray.value = [...IPArray.value, ip];
      await fetchIPDetails(cardID, ip);
    } else {
      // 偵測不到或無有效 IP，設為 null 並標記 failed，visibleCards 會自動徹底隱藏，不佔位
      ipDataCards[cardID].ip = null;
      ipDataCards[cardID].status = 'failed';
    }
  } catch (error) {
    ipDataCards[cardID].ip = null;
    ipDataCards[cardID].status = 'failed';
  } finally {
    fetchStatus[cardID] = { [cardID]: true };
    trackFetchStatus(fetchStatus);
  }
};

// 上报数据获取状态，并发送到 store
const trackFetchStatus = (status) => {
  let allHasFetched = true;
  for (let i = 0; i < ipCardsToShow.value; i++) {
    if (status[i] === undefined) {
      allHasFetched = false;
    } else {
      allHasFetched = allHasFetched && status[i][i];
    }
  }
  if (allHasFetched) {
    store.setLoadingStatus('ipcheck', true);
  }
};

// 检查所有 IP 地址
const checkAllIPs = async () => {
  let detectors = ipDetectors.value;

  if (!detectors || detectors.length === 0) {
    const cached = loadDetectorCache();
    if (cached && cached.length > 0) {
      ipDetectors.value = cached;
      detectors = cached;
    } else {
      detectors = await speedTestAndSortDetectors();
      ipDetectors.value = detectors;
    }
  }

  if (detectors.length === 0) {
    store.setLoadingStatus('ipcheck', true);
    return;
  }

  const ipFunctions = detectors.map((detector, idx) => {
    const fetchFn = fetchFnMap[detector.fetchFnName];
    return () => fetchIP(idx, fetchFn);
  });

  const maxIndex = Math.min(ipCardsToShow.value, detectors.length);

  let index = 0;
  const interval = setInterval(() => {
    if (index < maxIndex && ipFunctions[index]) {
      ipFunctions[index].call(this);
      index++;
    } else {
      clearInterval(interval);
    }
  }, 500);
};

// 从 IP 地址获取 IP 详细信息
const fetchIPDetails = async (cardIndex, ip, sourceID = null) => {
  console.log('fetchIPDetails 被調用，cardIndex:', cardIndex, 'ip:', ip, 'sourceID:', sourceID);
  console.log('當前 ipGeoSource.value:', ipGeoSource.value);
  sourceID = sourceID || ipGeoSource.value;
  console.log('使用的 sourceID:', sourceID);
  const card = ipDataCards[cardIndex];
  card.ip = ip;
  let setLang = lang.value;
  if (setLang === 'zh') {
    setLang = 'zh-CN';
  }

  // 检查缓存中是否已有该 IP 的数据
  if (ipDataCache.has(ip)) {
    const cachedData = ipDataCache.get(ip);
    Object.assign(card, cachedData);
    return;
  }

  // 检查是否有正在进行的查询，如果有，则等待该查询完成
  if (pendingIPDetailsRequests.has(ip)) {
    await pendingIPDetailsRequests.get(ip);
    const cachedData = ipDataCache.get(ip);
    if (cachedData) {
      Object.assign(card, cachedData);
    }
    return;
  }

  const fetchPromise = (async () => {
    console.log('store.ipDBs:', JSON.stringify(store.ipDBs));
    const sources = store.ipDBs.filter(source => source.enabled);
    console.log('啟用的數據源:', JSON.stringify(sources));

    let currentSourceIndex = sourceID !== null ? sources.findIndex(source => source.id === sourceID) : 0;
    console.log('當前數據源索引:', currentSourceIndex);
    let attempts = 0;

    while (attempts < sources.length) {
      const source = sources[currentSourceIndex];
      try {
        const url = store.getDbUrl(source.id, ip, setLang);
        console.log('構建的 URL:', url, '數據源 ID:', source.id);
        console.log('發送請求到:', url);
        const response = await authenticatedFetch(url);
        console.log('收到響應:', JSON.stringify(response));
        const cardData = transformDataFromIPapi(response, source.id, t, lang.value);

        if (cardData) {
          ipGeoSource.value = source.id;
          usingSource.value = source.id;
          store.updatePreference('ipGeoSource', source.id);
          Object.assign(card, cardData);
          ipDataCache.set(ip, cardData);
          return;
        }
      } catch (error) {
        console.error("Error fetching IP details from source " + source.id + ":", error);
        store.updateIPDBs({ id: source.id, enabled: false });
        currentSourceIndex = (currentSourceIndex + 1) % sources.length;
        attempts++;
      }
    }

    throw new Error("All sources failed to fetch IP details for IP: " + ip);
  })();

  // 将此 Promise 存储在 pendingIPDetailsRequests 中，以避免重复查询
  pendingIPDetailsRequests.set(ip, fetchPromise);

  try {
    await fetchPromise;
  } catch (error) {
    console.error(error);
    throw error;
  } finally {
    // 完成后，从 pendingIPDetailsRequests 中移除
    pendingIPDetailsRequests.delete(ip);
  }
};

// 在重新选择 IP 数据库源时，更新 IP 地理数据
const selectIPGeoSource = () => {
  // 清空部分数据
  ipDataCards.forEach((card) => {
    const { ip, mapUrl, mapUrl_dark } = card;
    Object.assign(card, createDefaultCard(), { ip, mapUrl, mapUrl_dark });
  });

  ipDataCache.clear();

  // 尝试更新一次，成功后再获取其他 IP 数据
  let runningSource = fetchIPDetails(0, ipDataCards[0].ip, ipGeoSource.value);

  // 重新获取 IP 数据
  let index = 1;
  const interval = setInterval(() => {
    if (index < ipDataCards.length) {
      const card = ipDataCards[index];
      if (isValidIP(card.ip)) {
        fetchIPDetails(index, card.ip, parseInt(runningSource));
      }
      index++;
    } else {
      clearInterval(interval);
    }
  }, 500);
};

// 刷新某张卡片
const refreshCard = (card, index) => {
  clearCardData(card);
  switch (index) {
    case 0:
      fetchIP(0, getIPFromIpify_V4);
      break;
    case 1:
      fetchIP(1, getIPFromCloudflare_V4);
      break;
    case 2:
      fetchIP(2, getIPFromCloudflare_V6);
      break;
    case 3:
      fetchIP(3, getIPFromIPChecking64);
      break;
    case 4:
      fetchIP(4, getIPFromIPChecking4);
      break;
    case 5:
      fetchIP(5, getIPFromIPChecking6);
      break;
    default:
      console.error("Undefind Source:");
  }
  trackEvent('IPCheck', 'RefreshClick', 'IPInfos');
};

// 清空卡片数据
const clearCardData = (card) => {
  Object.assign(card, createDefaultCard());
};

watch(() => userPreferences.value.ipGeoSource, (newVal, oldVal) => {
  ipGeoSource.value = newVal;
  if (newVal !== usingSource.value) {
    selectIPGeoSource();
  }
});

watch(ipCardsToShow, (newVal) => {
  if (newVal > 0) {
    checkAllIPs();
  }
});


watch(IPArray, () => {
  store.updateAllIPs(IPArray.value);
});

onMounted(() => {
  store.setMountingStatus('ipcheck', true);
});

defineExpose({
  checkAllIPs,
  ipDataCards,
  refreshCard,
});

</script>

<style scoped>
</style>
