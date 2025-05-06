# 🧰 IP 工具箱 | MyIP - A Better IP Toolbox

<div align="center">


👉 在這裡體驗：[https://ip.david888.com](https://ip.david888.com)

你可以直接用我已經搭建好的服務，也可以自行搭建。


</div>

> **注意**：此專案 fork 自 [https://github.com/jason5ng32/MyIP](https://github.com/jason5ng32/MyIP)

## 👀 主要功能

* 🛜 **看自己的 IP**：從多個 IPv4 和 IPv6 來源檢測顯示本機的 IP
* 🔍 **查任意 IP 信息**：可以通過小工具查詢任意 IP 的信息
* 🕵️ **看 IP 信息**：顯示所有 IP 的相關信息，包括國家、地區、ASN、地理位置等
* 🚦 **可用性檢測**：檢測一些網站的可用性：Google, Github, Youtube, 網易, 百度等
* 🚥 **WebRTC 檢測**：查看使用 WebRTC 連接時使用的 IP
* 🛑 **DNS 洩露檢測**：查看 DNS 出口信息，以便查看在 VPN/代理的情況下，是否存在 DNS 洩露隱私的風險
* 🚀 **網速測試**：利用邊緣網絡進行網速測試
* 🚏 **代理規則測試**：配合代理軟件的規則設置，測試規則設置是否正常
* ⏱️ **全球延遲測試**：從分佈在全球的多個服務器進行延遲測試，了解你與全球網絡的連接速度
* 📡 **MTR 測試**：從分佈在全球的多個服務器進行 MTR 測試，了解你與全球的連接路徑
* 🔦 **DNS 解析器**：從多個渠道對域名進行 DNS 解析，獲取實時的解析結果，可用於污染判斷
* 🚧 **封鎖測試**：檢查特定的網站在部分國家是否被封鎖
* 📓 **Whois 查詢**：對域名或 IP 進行 whois 信息查詢
* 📀 **MAC 地址查詢**：查詢物理地址的歸屬信息
* 🖥️ **瀏覽器指紋**：多種方式查看瀏覽器指紋
* 📋 **網絡安全檢查清單**：一共有 258 項的，全面的網絡安全檢查清單

## 💪 同時還支持

* 🌗 **暗黑模式**：根據系統設置自動切換暗黑/白天模式，也可以手動切換
* 📱 **簡約模式**：為移動版提供的專門模式，縮短頁面長度，快速查看最重要的信息
* 📲 **支持 PWA**：可以添加為手機應用以及電腦裡的桌面應用，方便使用
* ⌨️ **支持快捷鍵**：可以隨時輸入 `?` 查看快捷鍵菜單
* 🌍 根據可用性檢測結果，返回目前是否可以訪問全世界網絡的提示
* 🇺🇸 🇨🇳 🇫🇷 支持中文、英文、法文

## 📕 如何使用

### 在 Node 環境部署

確保你系統裡已經有 Node.js 環境。

克隆代碼:

```bash
git clone https://github.com/tbdavid2019/IPtools.git
```

安裝與編譯:

```bash
npm install && npm run build
```

運行:

```bash
npm start
```

程序會運行在 18966 端口。

### 使用 Docker

點擊頂部的部署到 Docker 按鈕，即可完成部署，又或者，直接輸入下面的命令：

```bash
docker run -d -p 18966:18966 --name myip --restart always tbdavid2019/iptools:latest
```

## 📚 環境變量

你可以不添加環境變量直接使用，但是如果你想使用一些高級功能，可以添加下面的環境變量：

| 變量名 | 是否必須 | 默認值 | 說明 |
| --- | --- | --- | --- |
| `BACKEND_PORT` | 否 | `"11966"` | 程序後端部分的運行端口 |
| `FRONTEND_PORT` | 否 | `"6001"` | 程序前端部分的運行端口 |
| `SECURITY_RATE_LIMIT` | 否 | `"0"` | 控制每 60 分鐘一個 IP 可以對後端服務器請求的次數（設置為 0 則為不限制） |
| `SECURITY_DELAY_AFTER` | 否 | `"0"` | 控制每 20 分鐘一個 IP 的前 X 次請求不受速度限制，超過 X 次後會逐次增加延遲 |
| `SECURITY_BLACKLIST_LOG_FILE_PATH` | 否 | `"logs/blacklist-ip.log"` | 路徑設置。記錄由 SECURITY_RATE_LIMIT 開啟後，觸發限制的 IP 列表 |
| `GOOGLE_MAP_API_KEY=` | 否 | `""` | Google 地圖的 API Key，用於展示 IP 所在地的地圖 |
| `ALLOWED_DOMAINS` | 否 | `""` | 允許訪問的域名，用逗號分隔，用於防止後端 API 被濫用。例如：example.com,myip.com |
| `IPCHECKING_API_KEY` | 否 | `""` | IPCheck.ing 的 API Key，用於獲取精準的 IP 歸屬地信息 |
| `IPINFO_API_TOKEN` | 否 | `""` | IPInfo.io 的 API Token，用於通過 IPInfo.io 獲取 IP 歸屬地信息 |
| `IPAPIIS_API_KEY` | 否 | `""` | IPAPI.is 的 API Key，用於通過 IPAPI.is 獲取 IP 歸屬地信息 |
| `IP2LOCATION_API_KEY` | 否 | `""` | IP2Location.io 的 API Key，用於通過 IP2Location.io 獲取 IP 歸屬地信息 |
| `CLOUDFLARE_API` | 否 | `""` | Cloudflare 的 API Key，用於通過 Cloudflare 獲取 AS 系統的信息 |
| `MAC_LOOKUP_API_KEY` | 否 | `""` | MAC 查詢的 API Key，用於通過 MAC Lookup 獲取 MAC 地址的歸屬信息 |
| `IPCHECKING_API_ENDPOINT` | **是** | `""` | IPCheck.ing 的 API 端點 URL |
| `VITE_GOOGLE_ANALYTICS_ID` | **是** | `""` | Google Analytics 的 ID，用於統計訪問量 |
| `VITE_CURL_IPV4_DOMAIN` | 否 | `""` | 為用戶提供 CURL API 的 IPv4 域名 |
| `VITE_CURL_IPV6_DOMAIN` | 否 | `""` | 為用戶提供 CURL API 的 IPv6 域名 |
| `VITE_CURL_IPV64_DOMAIN` | 否 | `""` | 為用戶提供 CURL API 的雙網絡棧域名 |
| `VITE_DEFAULT_IP_GEO_SOURCE` | 否 | `"3"` | 預設 IP 地理位置信息來源 (0=IPCheck.ing, 1=IPinfo.io, 3=IPAPI.is) |

需要注意的是，如果 CURL 系列的環境變量任意一個缺失，都不會啟用 CURL API。

### 在 Node 環境裡使用環境變量

創建環境變量：

```bash
cp .env.example .env
```

修改 `.env` 裡的內容，比如：

```bash
BACKEND_PORT=11966
FRONTEND_PORT=6001
ALLOWED_DOMAINS="localhost,127.0.0.1,46.51.245.98,ip.david888.com"
IPINFO_API_TOKEN="YOUR_TOKEN_HERE"
IPAPIIS_API_KEY="YOUR_KEY_HERE"
VITE_DEFAULT_IP_GEO_SOURCE="3"
```

然後重新啟動後端服務。

### 在 Docker 裡使用環境變量

你可以在運行 Docker 的時候，添加環境變量，比如：

```bash
docker run -d -p 18966:18966 \
  -e GOOGLE_MAP_API_KEY="YOUR_KEY_HERE" \
  -e ALLOWED_DOMAINS="example.com" \
  -e IPCHECKING_API="YOUR_TOKEN_HERE" \
  --name myip \
  tbdavid2019/iptools:latest

```

## 👩🏻‍💻 高級用法

如果你在通過代理上網，可以考慮在你的代理配置裡，增加下面的規則（請根據你使用的客戶端進行修改），這樣就可以實現同時查詢真實 IP 和代理後的 IP：

```ini
# IP Testing
IP-CIDR,1.0.0.2/32,Proxy,no-resolve
IP-CIDR6,2606:4700:4700::1111/128,Proxy,no-resolve
DOMAIN,4.ipcheck.ing,DIRECT
DOMAIN,6.ipcheck.ing,DIRECT
# Rule Testing
DOMAIN,ptest-1.ipcheck.ing,Proxy1
DOMAIN,ptest-2.ipcheck.ing,Proxy2
DOMAIN,ptest-3.ipcheck.ing,Proxy3
DOMAIN,ptest-4.ipcheck.ing,Proxy4
DOMAIN,ptest-5.ipcheck.ing,Proxy5
DOMAIN,ptest-6.ipcheck.ing,Proxy6
DOMAIN,ptest-7.ipcheck.ing,Proxy7
DOMAIN,ptest-8.ipcheck.ing,Proxy8
```

## 😶‍🌫️ 額外說明

在 V2.0 發布的時候，我曾經說：這個程序的 70% 的代碼不是我寫的，是通過 ChatGPT 寫的。大概來回 90 個回合，外加一些細微的手動修改，完成了全部代碼。

當然，程序的架構和 UI 還是需要自己進行設計。

隨著 V3.0 及後續的代碼發布，ChatGPT 幫助我寫代碼的比例逐漸下降，估計現在在 40% - 50% 之間。相反，在這個過程中，我從完全不會 JavaScript 和 Vue ，與 AI 結對編程後，我現在已經能看懂大部分的 JS 代碼了，並且也已經能手撸一些。

感謝 AI ，給了我這樣一個失業產品經理快速學習編程的機會。

## 🌟 Star History

[![Star History Chart](https://api.star-history.com/svg?repos=tbdavid2019/IPtools&type=Date)](https://star-history.com/#tbdavid2019/IPtools&Date)

---

# 🧰 MyIP - A Better IP Toolbox

## 👀 Main Features

* 🛜 **View Your IPs**: Detects and displays your local IPs, sourcing from multiple IPv4 and IPv6 providers.
* 🔍 **Search IP Information**: Provides a tool for querying information about any IP address. 
* 🕵️ **IP Information**: Presents detailed information for all IP addresses, including country, region, ASN, geographic location, and more.
* 🚦 **Availability Check**: Tests the accessibility of various websites, such as Google, GitHub, YouTube, ChatGPT, and others.
* 🚥 **WebRTC Detection**: Identifies the IP address used during WebRTC connections.
* 🛑 **DNS Leak Test**: Shows DNS endpoint data to evaluate the risk of DNS leaks when using VPNs or proxies.
* 🚀 **Speed Test**：Test your network speed with edge networks.
* 🚏 **Proxy Rule Testing**: Test the rule settings of proxy software to ensure their correctness.
* ⏱️ **Global Latency Test**: Performe lantency tests on servers located in different regions around the world.
* 📡 **MTR Test**: Perform MTR tests on servers located in different regions around the world.
* 🔦 **DNS Resolver**: Performs DNS resolution of a domain name from multiple sources and obtains real-time resolution results that can be used for contamination determination.
* 🚧 **Censorship Check**: Check if a website is blocked in some countries.
* 📓 **Whois Search**: Perform whois information search for domain names or IP addresses
* 📀 **MAC Lookup**: Query information of a physical address
* 🖥️ **Browser Fingerprints**：Multiple ways to caculate your browser fingerprint
* 📋 **Cybersecurity Checklist**：A comprehensive cybersecurity checklist with a total of 258 items

## 💪 Also

* 🌗 **Dark Mode**: Automatically toggles between dark and daylight modes based on system settings, with an option for manual switching.
* 📱 **Minimalist Mode**: A mobile-optimized mode that shortens page length for quick access to essential information..
* 📲 **PWA Supported**：Can be added as a desktop app on your phone as well as a Chrome app on your computer.
* ⌨️ **Keyboard Shortcuts**: Supports keyboard shortcuts for all functions, press `?` to view the shortcut list.
* 🌍 Based on availability test results, it indicates whether global internet access is currently feasible.
* 🇺🇸 🇨🇳 🇫🇷 English, Chinese, and French support.

## 📕 How to Use

### Deploying in a Node Environment

Make sure you have Node.js installed.

Clone the code:

```bash
git clone https://github.com/tbdavid2019/IPtools.git
```

Install and build:

```bash
npm install && npm run build
```

Run:

```bash
npm start
```

The program will run on port 18966.

### Using Docker

Click the 'Deploy to Docker' button at the top to complete the deployment. Or, use the following shell:

```bash
docker run -d -p 18966:18966 --name myip --restart always tbdavid2019/iptools:latest
```

## 📚 Environment Variable

You can use the program without adding any environment variables, but if you want to use some advanced features, you can add the following environment variables:

| Variable Name | Required | Default Value | Description |
| --- | --- | --- | --- |
| `BACKEND_PORT` | No | `"11966"` | The running port of the backend part of the program |
| `FRONTEND_PORT` | No | `"6001"` | The running port of the frontend part of the program |
| `SECURITY_RATE_LIMIT` | No | `"0"` | Controls the number of requests an IP can make to the backend server every 60 minutes (set to 0 for no limit) |
| `SECURITY_DELAY_AFTER` | No | `"0"` | Controls the first X requests from an IP every 20 minutes that are not subject to speed limits, and after X requests, the delay will increase |
| `SECURITY_BLACKLIST_LOG_FILE_PATH` | No | `"logs/blacklist-ip.log"` | Path setting. Records the list of IPs that triggered the limit after SECURITY_RATE_LIMIT is enabled |
| `GOOGLE_MAP_API_KEY=` | No | `""` | API Key for Google Maps, used to display the location of the IP on a map |
| `ALLOWED_DOMAINS` | No | `""` | Allowed domains for access, separated by commas, used to prevent misuse of the backend API. Example: example.com,myip.com |
| `IPCHECKING_API_KEY` | No | `""` | API Key for IPCheck.ing, used to obtain accurate IP geolocation information |
| `IPINFO_API_TOKEN` | No | `""` | API Token for IPInfo.io, used to obtain IP geolocation information through IPInfo.io |
| `IPAPIIS_API_KEY` | No | `""` | API Key for IPAPI.is, used to obtain IP geolocation information through IPAPI.is |
| `IP2LOCATION_API_KEY` | No | `""` | API Key for IP2Location.io, used to obtain IP geolocation information through IP2Location.io |
| `CLOUDFLARE_API` | No | `""` | API Key for Cloudflare, used to obtain AS system information through Cloudflare |
| `MAC_LOOKUP_API_KEY` | No | `""` | API Key for MAC Lookup, used to obtain MAC address information |
| `IPCHECKING_API_ENDPOINT` | **Yes** | `""` | IPCheck.ing API endpoint |
| `VITE_GOOGLE_ANALYTICS_ID` | **Yes** | `""` | Google Analytics ID, used to track user behavior |
| `VITE_CURL_IPV4_DOMAIN` | No | `""` | Provides the IPv4 domain for the CURL API to users |
| `VITE_CURL_IPV6_DOMAIN` | No | `""` | Provides the IPv6 domain for the CURL API to users |
| `VITE_CURL_IPV64_DOMAIN` | No | `""` | Provides the dual-stack domain for the CURL API to users |
| `VITE_DEFAULT_IP_GEO_SOURCE` | No | `"3"` | Default IP geolocation information source (0=IPCheck.ing, 1=IPinfo.io, 3=IPAPI.is) |

Note that if any of the CURL series environment variables are missing, the CURL API will not be enabled.

### Using Environment Variables in a Node Environment

Create environment variables:

```bash
cp .env.example .env
```

Modify `.env`, and for example, add the following:

```bash
BACKEND_PORT=11966
FRONTEND_PORT=6001
ALLOWED_DOMAINS="localhost,127.0.0.1,46.51.245.98,ip.david888.com"
IPINFO_API_TOKEN="YOUR_TOKEN_HERE"
IPAPIIS_API_KEY="YOUR_KEY_HERE"
VITE_DEFAULT_IP_GEO_SOURCE="3"
```

Then restart the backend service.

### Using Environment Variables in Docker

You can add environment variables when running Docker, for example:

```bash
docker run -d -p 6001:6001 \
  -e FRONTEND_PORT="6001" \
  -e BACKEND_PORT="11966" \
  -e ALLOWED_DOMAINS="localhost,127.0.0.1,46.51.245.98,ip.david888.com" \
  -e IPINFO_API_TOKEN="YOUR_TOKEN_HERE" \
  -e IPAPIIS_API_KEY="YOUR_KEY_HERE" \
  -e VITE_DEFAULT_IP_GEO_SOURCE="3" \
  --name myip \
  tbdavid2019/iptools:latest

```

## 👩🏻‍💻 Advanced Usage

If you're using a proxy for internet access, consider adding this rule to your proxy configuration (modify it according to your client). This setup lets you check both your real IP and the IP when using the proxy:

```ini
# IP Testing
IP-CIDR,1.0.0.2/32,Proxy,no-resolve
IP-CIDR6,2606:4700:4700::1111/128,Proxy,no-resolve
DOMAIN,4.ipcheck.ing,DIRECT
DOMAIN,6.ipcheck.ing,DIRECT
# Rule Testing
DOMAIN,ptest-1.ipcheck.ing,Proxy1
DOMAIN,ptest-2.ipcheck.ing,Proxy2
DOMAIN,ptest-3.ipcheck.ing,Proxy3
DOMAIN,ptest-4.ipcheck.ing,Proxy4
DOMAIN,ptest-5.ipcheck.ing,Proxy5
DOMAIN,ptest-6.ipcheck.ing,Proxy6
DOMAIN,ptest-7.ipcheck.ing,Proxy7
DOMAIN,ptest-8.ipcheck.ing,Proxy8
```

## 😶‍🌫️ Additional Notes

When version 2.0 was released, I said that 70% of the code for this program was not written by me, but by ChatGPT. After about 90 interactions, plus some minor manual adjustments, the entire codebase was completed.

Of course, the architecture and UI still required my own design.

With the release of version 3.0 and subsequent versions, the proportion of code written with the help of ChatGPT has gradually decreased, now estimated to be between 40% and 50%. On the contrary, in this process, I went from having no knowledge of JavaScript and Vue to being able to understand most of the JS code, and I can now write some on my own.

Thanks to AI, it has given me, an unemployed product manager, a rapid opportunity to learn programming.

## 🌟 Star History

[![Star History Chart](https://api.star-history.com/svg?repos=tbdavid2019/IPtools&type=Date)](https://star-history.com/#tbdavid2019/IPtools&Date)

> **Note**: This project is forked from [https://github.com/tbdavid2019/IPtools](https://github.com/tbdavid2019/IPtools)
