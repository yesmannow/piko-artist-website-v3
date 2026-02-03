# Phase VII Quick Reference

## 🚀 Quick Start

### 1. Environment Setup
```bash
# .env.local
R2_ACCESS_KEY_ID=your_key_id
R2_SECRET_ACCESS_KEY=your_secret
R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
R2_BUCKET_NAME=your-bucket-name
NEXT_PUBLIC_R2_PUBLIC_URL=https://your-bucket.r2.dev
```

### 2. Upload Audio
```bash
# Using AWS CLI (S3 compatible)
aws s3 cp "Artist - Track.mp3" s3://bucket/audio/ --endpoint-url=$R2_ENDPOINT
```

### 3. Access Library
```tsx
import { TrackLibrary } from '@/components/studio/ui/TrackLibrary';

<TrackLibrary isOpen={true} onClose={() => {}} />
```

## 📚 Key APIs

### Database
```typescript
import { db } from '@/lib/db';

// Get all tracks
const tracks = await db.tracks.toArray();

// Search
const results = await db.tracks.filter(t =>
  t.title.includes('Remix')
).toArray();

// Update
await db.tracks.where('url').equals(url).modify({
  bpm: 128,
  status: 'analyzed'
});
```

### Sync Hook
```tsx
const { isLoading, error, stats, refetch } = useLibrarySync();

// stats: { total, analyzed, unanalyzed, percentAnalyzed, newTracksAdded }
```

## 🎨 Artwork Images (18 total)

Located in: `/public/images/tracks/`

- abstract-1846847_1280.jpg
- architecture-3189972_1280.jpg
- aurora-borealis-9267515_1280.jpg
- background-1833056_1280.jpg
- bicycle-3045580_1280.jpg
- dj-2581269_1280.jpg
- gong-8255081_1280.jpg
- graffiti-1476119_1280.jpg
- graffiti-3750912_1280.jpg
- hamburg-2718329_1280.jpg
- skateboard-447147_1280.jpg
- skull-and-crossbones-414207_1280.jpg
- starry-sky-1655503_1280.jpg
- street-art-1499524_1280.jpg
- tube-7260586_1280.jpg
- vinyl-1595847_1280.jpg
- wall-2583885_1280.jpg
- woman-3633737_1280.jpg

## 🔧 Debugging

### Check IndexedDB
1. Open DevTools → Application
2. IndexedDB → PikoDJ → tracks
3. Verify tracks are synced

### Test API
```bash
curl http://localhost:3000/api/tracks | jq
```

### Clear Database
```typescript
import { clearAllTracks } from '@/lib/db';
await clearAllTracks(); // Use with caution!
```

## 📊 Track Schema

```typescript
interface Track {
  id?: number;
  url: string; // R2 URL (unique)
  title: string;
  artist: string;
  bpm?: number;
  key?: string;
  artwork: string; // Local image path
  analysisData?: string; // JSON
  dateAdded: Date;
  status: 'unanalyzed' | 'analyzing' | 'analyzed' | 'error';
  genre?: string;
  mood?: string;
  duration?: number;
  fileSize?: number;
  stemUrls?: string[];
}
```

## 🎯 Next Steps

1. **Upload tracks to R2** (use naming: `Artist - Title.mp3`)
2. **Open TrackLibrary** (auto-syncs on mount)
3. **Verify artwork** (should be assigned round-robin)
4. **Phase VIII:** Implement auto-analysis (BPM/Key detection)
