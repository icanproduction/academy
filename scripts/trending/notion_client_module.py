"""
Notion Client for Trending Content
Handles all interactions with Notion database for storing TikTok trending videos.
"""

import os
import requests
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from dotenv import load_dotenv

load_dotenv()

class TrendingNotionClient:
    def __init__(self):
        self.api_key = os.environ.get("NOTION_API_KEY")
        self.database_id = os.environ.get("NOTION_TRENDING_CONTENT_DB_ID", "").strip()
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "Notion-Version": "2022-06-28"
        }

        if not self.database_id:
            raise ValueError("NOTION_TRENDING_CONTENT_DB_ID environment variable is not set")

    def create_video_entry(self, video: Dict) -> Optional[str]:
        """
        Create a new video entry in Notion database.
        Returns the page ID if successful, None otherwise.
        """
        try:
            properties = {
                "Video ID": {"title": [{"text": {"content": video.get("video_id", "")}}]},
                "Video URL": {"url": video.get("video_url", "")},
                "Thumbnail": {"url": video.get("thumbnail_url", "")},
                "Author Username": {"rich_text": [{"text": {"content": video.get("author_username", "")}}]},
                "Author Nickname": {"rich_text": [{"text": {"content": video.get("author_nickname", "")}}]},
                "Description": {"rich_text": [{"text": {"content": video.get("description", "")[:2000]}}]},
                "Views": {"number": video.get("views", 0)},
                "Likes": {"number": video.get("likes", 0)},
                "Comments": {"number": video.get("comments", 0)},
                "Shares": {"number": video.get("shares", 0)},
                "Duration": {"number": video.get("duration", 0)},
                "Sound Title": {"rich_text": [{"text": {"content": video.get("sound_title", "")[:2000]}}]},
                "Hashtags": {"multi_select": [{"name": tag[:100]} for tag in video.get("hashtags", [])[:10]]},
                "Category": {"select": {"name": video.get("category", "Entertainment")}},
                "Fetched At": {"date": {"start": datetime.utcnow().isoformat()}},
            }

            url = "https://api.notion.com/v1/pages"
            payload = {
                "parent": {"database_id": self.database_id},
                "properties": properties
            }

            response = requests.post(url, headers=self.headers, json=payload)

            if response.status_code == 200:
                return response.json().get("id")
            else:
                print(f"Error creating video entry: {response.status_code} - {response.text}")
                return None
        except Exception as e:
            print(f"Error creating video entry: {e}")
            return None

    def video_exists(self, video_id: str) -> bool:
        """Check if a video with the given ID already exists in the database."""
        try:
            url = f"https://api.notion.com/v1/databases/{self.database_id}/query"
            payload = {
                "filter": {
                    "property": "Video ID",
                    "title": {"equals": video_id}
                }
            }

            response = requests.post(url, headers=self.headers, json=payload)

            if response.status_code == 200:
                results = response.json().get("results", [])
                return len(results) > 0
            return False
        except Exception as e:
            print(f"Error checking video existence: {e}")
            return False

    def get_all_videos(self, limit: int = 100) -> List[Dict]:
        """Retrieve all videos from the database."""
        try:
            url = f"https://api.notion.com/v1/databases/{self.database_id}/query"
            payload = {
                "page_size": min(limit, 100),
                "sorts": [{"timestamp": "created_time", "direction": "descending"}]
            }

            response = requests.post(url, headers=self.headers, json=payload)

            if response.status_code != 200:
                print(f"Error fetching videos: {response.status_code}")
                return []

            videos = []
            for page in response.json().get("results", []):
                props = page.get("properties", {})
                videos.append({
                    "id": page.get("id"),
                    "video_id": self._get_title(props.get("Video ID")),
                    "video_url": props.get("Video URL", {}).get("url", ""),
                    "thumbnail_url": props.get("Thumbnail", {}).get("url", ""),
                    "views": props.get("Views", {}).get("number", 0),
                    "likes": props.get("Likes", {}).get("number", 0),
                    "category": self._get_select(props.get("Category")),
                    "fetched_at": self._get_date(props.get("Fetched At")),
                })

            return videos
        except Exception as e:
            print(f"Error fetching videos: {e}")
            return []

    def delete_old_videos(self, days: int = 7) -> int:
        """Delete videos older than specified days. Returns count of deleted videos."""
        try:
            cutoff_date = (datetime.utcnow() - timedelta(days=days)).isoformat()

            url = f"https://api.notion.com/v1/databases/{self.database_id}/query"
            payload = {
                "filter": {
                    "property": "Fetched At",
                    "date": {"before": cutoff_date}
                }
            }

            response = requests.post(url, headers=self.headers, json=payload)

            if response.status_code != 200:
                return 0

            deleted_count = 0
            for page in response.json().get("results", []):
                try:
                    page_id = page.get("id")
                    archive_url = f"https://api.notion.com/v1/pages/{page_id}"
                    archive_response = requests.patch(
                        archive_url,
                        headers=self.headers,
                        json={"archived": True}
                    )
                    if archive_response.status_code == 200:
                        deleted_count += 1
                except Exception as e:
                    print(f"Error deleting page: {e}")

            return deleted_count
        except Exception as e:
            print(f"Error deleting old videos: {e}")
            return 0

    def _get_title(self, prop: Dict) -> str:
        """Extract text from title property."""
        if not prop or prop.get("type") != "title":
            return ""
        title_arr = prop.get("title", [])
        return title_arr[0].get("plain_text", "") if title_arr else ""

    def _get_select(self, prop: Dict) -> str:
        """Extract value from select property."""
        if not prop or prop.get("type") != "select":
            return ""
        select = prop.get("select")
        return select.get("name", "") if select else ""

    def _get_date(self, prop: Dict) -> str:
        """Extract date from date property."""
        if not prop or prop.get("type") != "date":
            return ""
        date = prop.get("date")
        return date.get("start", "") if date else ""


if __name__ == "__main__":
    # Test the client
    client = TrendingNotionClient()
    print(f"Database ID: {client.database_id}")

    # Test fetching videos
    videos = client.get_all_videos(limit=5)
    print(f"Found {len(videos)} videos")
    for v in videos:
        print(f"  - {v['video_id']}: {v['views']} views")
