"""
Import data from Google Sheets to the new Prisma database
Run this after creating your account in the Next.js app
"""

import sys
import os
import json
from datetime import datetime
import gspread
from oauth2client.service_account import ServiceAccountCredentials
from gspread_dataframe import get_as_dataframe
import pandas as pd

# Add parent directory to path to import Prisma client
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def import_from_sheets(user_id: str):
    """Import entries from Google Sheets to Prisma database"""
    
    # Load Google credentials
    creds_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'google-credentials.json')
    if not os.path.exists(creds_path):
        print(f"Error: google-credentials.json not found at {creds_path}")
        return
    
    scope = ["https://spreadsheets.google.com/feeds", "https://www.googleapis.com/auth/drive"]
    creds = ServiceAccountCredentials.from_json_keyfile_name(creds_path, scope)
    client = gspread.authorize(creds)
    sheet = client.open("sotd").sheet1
    df = get_as_dataframe(sheet).dropna(how="all")
    
    print(f"Found {len(df)} entries in Google Sheets")
    print(f"Columns found: {list(df.columns)}")
    
    # Normalize column names (handle case sensitivity and spaces)
    df.columns = df.columns.str.strip()
    
    # Try to find the date column (case-insensitive)
    # Check for common date column names including "blis" which seems to be the actual column name
    date_col = None
    for col in df.columns:
        col_lower = col.lower()
        if col_lower in ['date', 'dates', 'blis']:
            date_col = col
            break
    
    if not date_col:
        print("Error: Could not find date column")
        print(f"Available columns: {list(df.columns)}")
        print("Trying first column as date...")
        date_col = df.columns[0]  # Use first column as fallback
    
    # Convert date column
    df[date_col] = pd.to_datetime(df[date_col], errors="coerce").dt.strftime("%Y-%m-%d")
    
    # Helper function to get column value (case-insensitive)
    def get_col(df, row, possible_names, default=None):
        for name in possible_names:
            if name in df.columns:
                val = row.get(name)
                if pd.notna(val):
                    return val
        return default
    
    # Prepare data for API
    entries = []
    for _, row in df.iterrows():
        date_val = get_col(df, row, [date_col, "Date", "date", "DATE", "blis"])
        song_title = get_col(df, row, ["Song Title", "song title", "Song title", "SONG TITLE"])
        
        if pd.isna(date_val) or pd.isna(song_title):
            continue
            
        entry = {
            "date": str(date_val),
            "songTitle": str(song_title),
            "artist": str(get_col(df, row, ["Artist", "artist", "ARTIST"], "Unknown")),
            "albumTitle": str(get_col(df, row, ["Album Title", "album title", "Album title"], "Unknown")),
            "albumArt": str(get_col(df, row, ["Album Art", "album art", "Album art"], "")),
            "durationMs": int(get_col(df, row, ["Duration (ms)", "duration (ms)", "Duration"], 0)) if pd.notna(get_col(df, row, ["Duration (ms)", "duration (ms)", "Duration"], 0)) else 0,
            "explicit": str(get_col(df, row, ["Explicit", "explicit", "EXPLICIT"], "No")).lower() == "yes",
            "popularity": int(get_col(df, row, ["Popularity", "popularity", "POPULARITY"], 0)) if pd.notna(get_col(df, row, ["Popularity", "popularity", "POPULARITY"], 0)) else 0,
            "releaseDate": str(get_col(df, row, ["Release Date", "release date", "Release date"], "")) if pd.notna(get_col(df, row, ["Release Date", "release date", "Release date"], "")) else None,
            "trackId": str(get_col(df, row, ["Track ID", "track id", "Track id", "Track ID"], "")),
            "uri": str(get_col(df, row, ["URI", "uri", "Uri"], "")),
            "notes": str(get_col(df, row, ["Notes", "notes", "NOTES"], "")) if pd.notna(get_col(df, row, ["Notes", "notes", "NOTES"], "")) else None,
        }
        entries.append(entry)
    
    print(f"\nPrepared {len(entries)} entries for import")
    print(f"\nTo import these entries, you have two options:")
    print(f"\nOption 1: Use the API (Recommended)")
    print(f"1. Make sure your Next.js server is running (npm run dev)")
    print(f"2. Sign in to get your session cookie")
    print(f"3. Run this script with: python scripts/import_from_sheets.py {user_id}")
    print(f"\nOption 2: Direct database import")
    print(f"Run: npx tsx scripts/import-direct.ts {user_id}")
    
    # Save entries to JSON file for the TypeScript script
    output_path = os.path.join(os.path.dirname(__file__), 'entries_to_import.json')
    with open(output_path, 'w') as f:
        json.dump(entries, f, indent=2)
    
    print(f"\n[OK] Saved entries to: {output_path}")
    print(f"\nNow run: npm run import:direct {user_id}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python scripts/import_from_sheets.py <your-user-id>")
        print("\nTo find your user ID:")
        print("1. Sign up and log in to the app at http://127.0.0.1:3000")
        print("2. Open Prisma Studio: npx prisma studio")
        print("3. Look at the 'User' table to find your ID")
        sys.exit(1)
    
    user_id = sys.argv[1]
    import_from_sheets(user_id)

