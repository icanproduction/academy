"""
TikTok Trending Video Fetcher
Fetches trending videos from TikTok and stores them in Notion database.
"""

import asyncio
import os
import random
from datetime import datetime
from typing import List, Dict, Optional
from dotenv import load_dotenv

load_dotenv()

# Try to import TikTokApi, fallback to mock data if not available
try:
    from TikTokApi import TikTokApi
    TIKTOK_API_AVAILABLE = True
except ImportError:
    TIKTOK_API_AVAILABLE = False
    print("Warning: TikTokApi not installed. Using mock data.")

from notion_client_module import TrendingNotionClient


class TikTokFetcher:
    def __init__(self):
        self.notion_client = TrendingNotionClient()
        self.categories = [
            "Entertainment",
            "Education",
            "Lifestyle",
            "Comedy",
            "Music",
            "Dance",
            "Food",
            "Fashion",
            "Sports",
            "Technology"
        ]

    async def fetch_trending_videos(self, count: int = 30) -> List[Dict]:
        """
        Fetch trending videos from TikTok.
        Returns list of video data dictionaries.
        """
        if not TIKTOK_API_AVAILABLE:
            return self._get_mock_data(count)

        videos = []

        try:
            async with TikTokApi() as api:
                # Create sessions for the API (requires Playwright)
                await api.create_sessions(
                    ms_tokens=[os.environ.get("TIKTOK_MS_TOKEN", "")],
                    num_sessions=1,
                    sleep_after=3
                )

                # Fetch trending videos
                async for video in api.trending.videos(count=count):
                    try:
                        video_data = {
                            "video_id": video.id,
                            "video_url": f"https://www.tiktok.com/@{video.author.username}/video/{video.id}",
                            "thumbnail_url": video.video.cover or "",
                            "author_username": video.author.username,
                            "author_nickname": video.author.nickname or video.author.username,
                            "author_avatar": video.author.avatar_thumb or "",
                            "description": video.desc or "",
                            "views": video.stats.play_count,
                            "likes": video.stats.digg_count,
                            "comments": video.stats.comment_count,
                            "shares": video.stats.share_count,
                            "duration": video.video.duration,
                            "sound_title": video.sound.title if video.sound else "",
                            "sound_url": video.sound.play_url if video.sound else "",
                            "hashtags": [tag.name for tag in video.hashtags] if video.hashtags else [],
                            "category": self._categorize_video(video.desc, video.hashtags),
                        }
                        videos.append(video_data)
                    except Exception as e:
                        print(f"Error processing video: {e}")
                        continue

        except Exception as e:
            print(f"Error fetching from TikTok API: {e}")
            # Fallback to mock data if API fails
            return self._get_mock_data(count)

        return videos

    def _categorize_video(self, description: str, hashtags: list) -> str:
        """
        Attempt to categorize a video based on its description and hashtags.
        """
        if not hashtags:
            hashtags = []

        all_text = (description or "").lower()
        for tag in hashtags:
            all_text += " " + (tag.name if hasattr(tag, 'name') else str(tag)).lower()

        # Simple keyword matching for categories
        category_keywords = {
            "Education": ["tutorial", "howto", "learn", "tips", "educational", "belajar", "edukasi"],
            "Comedy": ["funny", "comedy", "humor", "lucu", "ngakak", "jokes"],
            "Music": ["music", "song", "singing", "cover", "musik", "lagu"],
            "Dance": ["dance", "dancing", "choreography", "joget", "tari"],
            "Food": ["food", "cooking", "recipe", "masak", "makan", "kuliner"],
            "Fashion": ["fashion", "ootd", "style", "outfit", "beauty", "makeup"],
            "Sports": ["sports", "fitness", "workout", "gym", "olahraga"],
            "Technology": ["tech", "gadget", "coding", "programming", "teknologi"],
            "Lifestyle": ["lifestyle", "daily", "routine", "vlog", "gaya hidup"],
        }

        for category, keywords in category_keywords.items():
            for keyword in keywords:
                if keyword in all_text:
                    return category

        return "Entertainment"  # Default category

    def _get_mock_data(self, count: int) -> List[Dict]:
        """
        Generate mock data for testing when TikTok API is not available.
        """
        mock_videos = []
        mock_authors = [
            ("creativecontent", "Creative Content"),
            ("funnyvideos", "Funny Videos"),
            ("dancemoves", "Dance Moves"),
            ("techguru", "Tech Guru"),
            ("foodielover", "Foodie Lover"),
        ]

        for i in range(min(count, 10)):
            author = random.choice(mock_authors)
            category = random.choice(self.categories)

            mock_videos.append({
                "video_id": f"mock_{datetime.utcnow().timestamp()}_{i}",
                "video_url": f"https://www.tiktok.com/@{author[0]}/video/123456789{i}",
                "thumbnail_url": f"https://picsum.photos/720/1280?random={i}",
                "author_username": author[0],
                "author_nickname": author[1],
                "author_avatar": f"https://i.pravatar.cc/150?img={i}",
                "description": f"This is a sample {category.lower()} video #{i+1}! #fyp #viral #{category.lower()}",
                "views": random.randint(10000, 10000000),
                "likes": random.randint(1000, 500000),
                "comments": random.randint(100, 50000),
                "shares": random.randint(50, 10000),
                "duration": random.randint(10, 60),
                "sound_title": f"Trending Sound #{i+1}",
                "sound_url": "",
                "hashtags": ["fyp", "viral", category.lower(), "trending"],
                "category": category,
            })

        return mock_videos

    async def sync_to_notion(self, videos: List[Dict]) -> Dict[str, int]:
        """
        Sync fetched videos to Notion database.
        Returns statistics about the sync operation.
        """
        stats = {
            "total": len(videos),
            "created": 0,
            "skipped": 0,
            "failed": 0
        }

        for video in videos:
            try:
                # Check if video already exists
                if self.notion_client.video_exists(video["video_id"]):
                    stats["skipped"] += 1
                    continue

                # Create new entry
                page_id = self.notion_client.create_video_entry(video)
                if page_id:
                    stats["created"] += 1
                    print(f"Created: {video['video_id']} - {video['views']} views")
                else:
                    stats["failed"] += 1
            except Exception as e:
                print(f"Error syncing video {video.get('video_id', 'unknown')}: {e}")
                stats["failed"] += 1

        return stats


async def main():
    """Main function to fetch and sync trending videos."""
    print(f"\n{'='*50}")
    print(f"TikTok Trending Fetcher")
    print(f"Started at: {datetime.utcnow().isoformat()}")
    print(f"{'='*50}\n")

    fetcher = TikTokFetcher()

    # Fetch trending videos
    print("Fetching trending videos...")
    videos = await fetcher.fetch_trending_videos(count=30)
    print(f"Fetched {len(videos)} videos\n")

    # Sync to Notion
    print("Syncing to Notion...")
    stats = await fetcher.sync_to_notion(videos)

    print(f"\n{'='*50}")
    print("Sync Complete!")
    print(f"  Total: {stats['total']}")
    print(f"  Created: {stats['created']}")
    print(f"  Skipped (exists): {stats['skipped']}")
    print(f"  Failed: {stats['failed']}")
    print(f"{'='*50}\n")

    return stats


if __name__ == "__main__":
    asyncio.run(main())
