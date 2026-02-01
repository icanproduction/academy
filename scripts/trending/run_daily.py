"""
Daily Runner for TikTok Trending Content Sync
This script is designed to be run by a cron job (e.g., GitHub Actions) daily.
"""

import asyncio
import os
import sys
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Add the current directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fetch_trending import TikTokFetcher
from notion_client_module import TrendingNotionClient


async def run_daily_sync():
    """
    Run the daily sync process:
    1. Fetch new trending videos
    2. Sync to Notion
    3. Clean up old videos (older than 7 days)
    """
    print("=" * 60)
    print("DAILY TRENDING CONTENT SYNC")
    print(f"Timestamp: {datetime.utcnow().isoformat()}Z")
    print("=" * 60)

    # Check required environment variables
    required_vars = ["NOTION_API_KEY", "NOTION_TRENDING_CONTENT_DB_ID"]
    missing_vars = [var for var in required_vars if not os.environ.get(var)]

    if missing_vars:
        print(f"\nERROR: Missing environment variables: {', '.join(missing_vars)}")
        print("Please set these variables before running.")
        return False

    try:
        # Initialize fetcher
        fetcher = TikTokFetcher()

        # Step 1: Fetch trending videos
        print("\n[1/3] Fetching trending videos from TikTok...")
        videos = await fetcher.fetch_trending_videos(count=30)
        print(f"      Fetched {len(videos)} videos")

        # Step 2: Sync to Notion
        print("\n[2/3] Syncing videos to Notion database...")
        stats = await fetcher.sync_to_notion(videos)
        print(f"      Created: {stats['created']}")
        print(f"      Skipped: {stats['skipped']}")
        print(f"      Failed: {stats['failed']}")

        # Step 3: Cleanup old videos
        print("\n[3/3] Cleaning up old videos (>7 days)...")
        notion_client = TrendingNotionClient()
        deleted_count = notion_client.delete_old_videos(days=7)
        print(f"      Deleted: {deleted_count} old videos")

        # Summary
        print("\n" + "=" * 60)
        print("SYNC COMPLETED SUCCESSFULLY")
        print("=" * 60)
        print(f"  New videos added: {stats['created']}")
        print(f"  Videos skipped: {stats['skipped']}")
        print(f"  Old videos removed: {deleted_count}")
        print(f"  Completed at: {datetime.utcnow().isoformat()}Z")
        print("=" * 60)

        return True

    except Exception as e:
        print(f"\nERROR: Sync failed with error: {e}")
        import traceback
        traceback.print_exc()
        return False


def main():
    """Entry point for the daily sync."""
    success = asyncio.run(run_daily_sync())
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
