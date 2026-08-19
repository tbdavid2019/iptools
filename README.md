# 8888IP

8888IP 是一個開源的 IP 與網絡工具箱，提供 IP 查詢、地理資訊、WebRTC、DNS 洩漏、網速、連通性、Whois、DNS 解析與網絡診斷工具。

線上服務：[https://ip.david888.com](https://ip.david888.com)

## 主要功能

- 查看本機 IPv4／IPv6 與 IP 歸屬資訊（自動隱藏不可用 IP 棧卡片）
- 瀏覽器資訊、User Agent、裝置指紋、GPU 與 CPU 檢閱（直接顯示於首頁 IP 資訊下方）
- 免登入隱身測試 (Invisibility Test)，快速評估代理/VPN 風險與時區/WebRTC 洩漏
- 國際優先網絡連通性測試（Google、Cloudflare、YouTube、GitHub、ChatGPT 優先；中國服務置底）
- WebRTC、Surfshark DNS 洩漏與全球延遲測試
- 分流規則測試 (Rule Test)，支援平滑 fallback 備援
- DNS 解析、Whois、MAC 地址查詢與安全檢查清單
- **AI Agent 原生支援**：支援 Model Context Protocol (MCP) 與 W3C / Cloudflare WebMCP 標準 (`document.modelContext`)
- PWA、深色模式、正體中文／英文／法文介面
- 100% Cloudflare Worker Serverless 部署與 `curl` 命令列 IP 查詢

## AI Agent & WebMCP / MCP 整合

8888IP 提供標準 **Model Context Protocol (JSON-RPC 2.0)** 與 **WebMCP** 介面，AI Agent 與瀏覽器助理可直接調用各項診斷工具：

- **端點路徑**: `https://ip.david888.com/mcp`
- **協定版本**: `2024-11-05`
- **支援工具**:
  - `get_client_ip`: 取得當前訪客公開 IP 與地理位置
  - `lookup_ip_geo`: 查詢指定 IP 地理位置、ASN 與代理/託管偵測
  - `resolve_dns`: 跨多節點 DoH DNS 解析
  - `whois_lookup`: 查詢 RDAP / WHOIS 網域及 IP 註冊資訊
  - `mac_lookup`: 查詢 MAC 位址與 OUI 製造商
  - `cf_radar_lookup`: 查詢 ASN 之 Cloudflare Radar 統計數據

範例調用 (JSON-RPC 2.0)：
```bash
curl -X POST https://ip.david888.com/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"lookup_ip_geo","arguments":{"ip":"1.1.1.1"}}}'
```

## 命令列 API

最短用法：

```bash
curl ip.david888.com
```

回傳目前請求端的公開 IP。也可以使用明確的 HTTPS 或 API 路徑：

```bash
curl https://ip.david888.com
curl https://ip.david888.com/api/ip
```

一般瀏覽器開啟根路徑時會顯示完整的 8888IP 網站；`curl`／`wget` 請求則回傳純文字 IP。

## Cloudflare Worker / Pages 部署

1. 將本 repository 連結至 Cloudflare Pages 或設定 Cloudflare Worker。
2. Build Command 使用 `npm run build`。
3. Output Directory 使用 `dist`。
4. 在 Cloudflare Settings 設定需要的環境變數。
5. 將 `ip.david888.com` 綁定至 Custom Domain。

## Node.js 部署

需要 Node.js 22 或更新版本：

```bash
>>>>>>> Stashed changes
git clone https://github.com/tbdavid2019/iptools.git
cd iptools
npm install
npm run build
npm start
```

本機預設前端埠號為 `6001`。

## Docker 部署

```bash
docker compose up -d
```

或自行建置：

```bash
docker build -t ghcr.io/tbdavid2019/8888ip:latest .
docker run -d --name 8888ip --restart unless-stopped \
  --env-file .env -p 6001:6001 ghcr.io/tbdavid2019/8888ip:latest
```

## 環境變數

可先建立設定檔：

```bash
cp .env.example .env
```

常用設定：

| 變數 | 用途 |
| --- | --- |
| `BACKEND_PORT` | 本機後端服務埠號，預設 `11966` |
| `FRONTEND_PORT` | 本機前端服務埠號，預設 `6001` |
| `ALLOWED_DOMAINS` | 允許前端呼叫後端 API 的網域清單 |
| `IPCHECKING_API_KEY` | IP 地理資料服務 API Key；保留此名稱以相容既有設定 |
| `IPCHECKING_API_ENDPOINT` | IP 地理資料服務 API 端點；保留此名稱以相容既有設定 |
| `IPINFO_API_TOKEN` | IPinfo API Token |
| `IPAPIIS_API_KEY` | IPAPI.is API Key |
| `IP2LOCATION_API_KEY` | IP2Location API Key |
| `GOOGLE_MAP_API_KEY` | 地圖顯示用 API Key |
| `VITE_DEFAULT_IP_GEO_SOURCE` | 預設 IP 資料來源 |
| `VITE_CURL_IPV4_DOMAIN` | 前端顯示用 IPv4 CURL 網域 |
| `VITE_CURL_IPV6_DOMAIN` | 前端顯示用 IPv6 CURL 網域 |
| `VITE_CURL_IPV64_DOMAIN` | 前端顯示用雙棧 CURL 網域 |
| `VITE_GOOGLE_ANALYTICS_ID` | Google Analytics ID |

`VITE_*` 變數會在 build 時注入，修改後需要重新部署。

## 開發

```bash
npm install
npm run dev
```

## 授權

本專案使用 AGPL-3.0 授權。詳見 [LICENSE](LICENSE)。
