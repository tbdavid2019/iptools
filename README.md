# 8888IP

8888IP 是一個開源的 IP 與網絡工具箱，提供 IP 查詢、地理資訊、WebRTC、DNS 洩漏、網速、連通性、Whois、DNS 解析與網絡診斷工具。

線上服務：[https://ip.david888.com](https://ip.david888.com)

## 主要功能

- 查看本機 IPv4／IPv6 與 IP 歸屬資訊
- 查詢任意 IP 的地理位置、ASN 與組織
- WebRTC、DNS 洩漏、網速與全球延遲測試
- DNS 解析、Whois、MAC 與網絡連通性工具
- PWA、深色模式、中文／英文／法文介面
- Cloudflare Worker / Pages 部署與命令列 IP 查詢

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
git clone https://github.com/tbdavid2019/IPtools.git
cd IPtools
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
