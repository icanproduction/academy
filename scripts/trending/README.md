# Trending Content Sync

Script untuk mengambil video trending dari TikTok dan menyimpannya ke Notion database.

## Setup

### 1. Buat Notion Database

Buat database baru di Notion dengan properti berikut:

| Property Name | Type | Description |
|--------------|------|-------------|
| Video ID | Title | ID unik video TikTok |
| Video URL | URL | Link ke video TikTok |
| Thumbnail | URL | Link ke thumbnail video |
| Author Username | Text | Username creator |
| Author Nickname | Text | Display name creator |
| Author Avatar | URL | Link ke avatar creator |
| Description | Text | Caption/deskripsi video |
| Views | Number | Jumlah views |
| Likes | Number | Jumlah likes |
| Comments | Number | Jumlah komentar |
| Shares | Number | Jumlah shares |
| Duration | Number | Durasi video (detik) |
| Sound Title | Text | Judul sound/music |
| Sound URL | URL | Link ke sound |
| Hashtags | Multi-select | Hashtags video |
| Category | Select | Kategori video |
| Fetched At | Date | Waktu data di-fetch |
| Embed HTML | Text | HTML embed (optional) |

### 2. Environment Variables

Tambahkan ke `.env.local` atau GitHub Secrets:

```bash
# Required
NOTION_API_KEY=ntn_xxxxxxxxxxxxx
NOTION_TRENDING_CONTENT_DB_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

# Optional (untuk full TikTok API access)
TIKTOK_MS_TOKEN=xxxxx
```

### 3. Install Dependencies

```bash
cd scripts/trending
pip install -r requirements.txt
playwright install chromium
```

### 4. Run Manual Sync

```bash
python run_daily.py
```

## GitHub Actions (Auto Sync)

Script akan berjalan otomatis setiap hari jam 6 AM UTC (1 PM WIB) melalui GitHub Actions.

### Setup GitHub Secrets

Tambahkan secrets berikut di repository settings:

- `NOTION_API_KEY`
- `NOTION_TRENDING_CONTENT_DB_ID`
- `TIKTOK_MS_TOKEN` (optional)

### Manual Trigger

Bisa juga trigger manual dari tab Actions di GitHub.

## Catatan

- Tanpa `TIKTOK_MS_TOKEN`, script akan menggunakan mock data untuk testing
- Video yang lebih dari 7 hari akan otomatis dihapus
- Maksimal 30 video baru per sync untuk menghindari rate limit

## Troubleshooting

### "Trending database not configured"
Pastikan `NOTION_TRENDING_CONTENT_DB_ID` sudah di-set dengan benar.

### "Failed to fetch from TikTok API"
TikTok API memerlukan ms_token yang valid. Tanpa token, script akan fallback ke mock data.

### Rate Limit
Jika terkena rate limit, tunggu beberapa jam sebelum mencoba lagi.
