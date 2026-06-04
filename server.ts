import express from 'express';
import path from 'path';
import fs from 'fs/promises';
import { createServer as createViteServer } from 'vite';
import multer from 'multer';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(process.cwd(), 'data.json');
const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');

async function ensureUploadsDir() {
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
}

// Multer setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOADS_DIR);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 30 * 1024 * 1024 } 
});

async function loadData() {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // Return default data if file doesn't exist
    return {
      artistName: 'A.C Xuân Tài',
      artistBio: 'Nơi mình chia sẻ các demo nhạc mới',
      homeCoverUrl: '',
      faviconUrl: '',
      ogImageUrl: '',
      youtubePlaylistUrl: '',
      spotifyUrl: '',
      releasedSongs: [],
      demos: []
    };
  }
}

async function saveData(data: any) {
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

async function startServer() {
  await ensureUploadsDir();
  const app = express();
  
  // AI Studio bắt buộc dùng port 3000 để preview hoạt động.
  // Khi chạy trên VPS CloudPanel của bạn, bạn có thể truyền biến PORT=1994
  // hoặc thiết lập App Port: 1994 trực tiếp trên giao diện CloudPanel.
  const PORT = process.env.PORT || 3000;

  app.use(express.json());

  // API Routes
  app.get('/api/data', async (req, res) => {
    const data = await loadData();
    // Do not leak passwords
    const publicDemos = data.demos.map((d: any) => ({ ...d, password: !!(d.password || data.globalPassword) })); 
    // We send back both for simplicity, but let's just make it simple
    res.json({ ...data, demos: publicDemos });
  });

  // Admin access to real data (including passwords for editing)
  app.get('/api/admin/data', async (req, res) => {
    const data = await loadData();
    res.json(data);
  });

  app.post('/api/profile', async (req, res) => {
    const data = await loadData();
    data.artistName = req.body.artistName ?? data.artistName;
    data.artistBio = req.body.artistBio ?? data.artistBio;
    data.homeCoverUrl = req.body.homeCoverUrl ?? data.homeCoverUrl;
    data.faviconUrl = req.body.faviconUrl ?? data.faviconUrl;
    data.ogImageUrl = req.body.ogImageUrl ?? data.ogImageUrl;
    data.youtubePlaylistUrl = req.body.youtubePlaylistUrl ?? data.youtubePlaylistUrl;
    data.spotifyUrl = req.body.spotifyUrl ?? data.spotifyUrl;
    data.globalPassword = req.body.globalPassword ?? data.globalPassword;
    await saveData(data);
    res.json(data);
  });

  app.get('/api/youtube-playlist', async (req, res) => {
    try {
      const plId = req.query.plId as string;
      const chId = req.query.chId as string;
      
      let fetchUrl = '';
      if (plId) {
        fetchUrl = `https://www.youtube.com/playlist?list=${plId}`;
      } else if (chId) {
        fetchUrl = `https://www.youtube.com/channel/${chId}/videos`;
      }
      
      if (!fetchUrl) return res.json([]);
      
      const response = await fetch(fetchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9'
        }
      });
      if (!response.ok) return res.json([]);
      const text = await response.text();
      const match = text.match(/var ytInitialData = (\{.*?\});<\/script>/);

      let videos: any[] = [];
      if (match) {
        const data = JSON.parse(match[1]);
        JSON.stringify(data, (key, value) => {
          if (key === 'playlistVideoRenderer' && value.videoId) {
            videos.push({
              title: value.title?.runs?.[0]?.text || 'Unknown',
              videoId: value.videoId,
              youtubeUrl: `https://www.youtube.com/watch?v=${value.videoId}`
            });
          }
          if (key === 'gridVideoRenderer' && value.videoId) {
            videos.push({
              title: value.title?.runs?.[0]?.text || 'Unknown',
              videoId: value.videoId,
              youtubeUrl: `https://www.youtube.com/watch?v=${value.videoId}`
            });
          }
          if (key === 'richItemRenderer' && value.content?.videoRenderer?.videoId) {
             videos.push({
               title: value.content.videoRenderer.title?.runs?.[0]?.text || 'Unknown',
               videoId: value.content.videoRenderer.videoId,
               youtubeUrl: `https://www.youtube.com/watch?v=${value.content.videoRenderer.videoId}`
             })
          }
          return value;
        });
      }

      // Deduplicate
      const unique = [];
      const ids = new Set();
      for (const v of videos) {
        if (!ids.has(v.videoId)) {
          ids.add(v.videoId);
          unique.push(v);
        }
      }
      
      // Fallback to RSS if scraping failed
      if (unique.length === 0 && plId) {
        const rssRes = await fetch(`https://www.youtube.com/feeds/videos.xml?playlist_id=${plId}`);
        const rssText = await rssRes.text();
        const entries = rssText.split('<entry>').slice(1);
        unique.push(...entries.map(entry => {
          const titleMatch = entry.match(/<title>(.*?)<\/title>/);
          const idMatch = entry.match(/<yt:videoId>(.*?)<\/yt:videoId>/);
          return {
            title: titleMatch ? titleMatch[1].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>') : 'Unknown',
            videoId: idMatch ? idMatch[1] : '',
            youtubeUrl: idMatch ? `https://www.youtube.com/watch?v=${idMatch[1]}` : ''
          };
        }).filter(v => v.videoId));
      }

      res.json(unique);
    } catch (err) {
      res.json([]);
    }
  });

  app.get('/api/spotify-profile', async (req, res) => {
    try {
      const url = req.query.url as string;
      if (!url) return res.json(null);
      const parts = url.split('/');
      const idStr = parts[parts.length - 1].split('?')[0]; // artist id
      const fetchUrl = `https://open.spotify.com/artist/${idStr}`;
      const response = await fetch(fetchUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }
      });
      const html = await response.text();
      
      const imageMatch = html.match(/<meta property="?og:image"? content="([^"]+)"/i);
      const titleMatch = html.match(/<meta property="?og:title"? content="([^"]+)"/i);
      const descMatch = html.match(/<meta property="?og:description"? content="([^"]+)"/i);
      
      if (!titleMatch && !descMatch) return res.json(null);
      
      res.json({
        name: titleMatch ? titleMatch[1] : '',
        image: imageMatch ? imageMatch[1] : '',
        description: descMatch ? descMatch[1] : '' // Usually contains monthly listeners
      });
    } catch(err) {
      res.json(null);
    }
  });

  app.post('/api/released', async (req, res) => {
    const data = await loadData();
    data.releasedSongs = req.body.releasedSongs || [];
    await saveData(data);
    res.json(data);
  });

  const processDriveLink = (url: string) => {
    if (!url) return url;
    const matchFileD = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    const matchIdParam = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    const id = matchFileD ? matchFileD[1] : (matchIdParam ? matchIdParam[1] : null);
    if (id) {
      return `https://drive.google.com/thumbnail?id=${id}&sz=w1000`;
    }
    return url;
  };

  app.post('/api/demos', upload.fields([{ name: 'audio', maxCount: 1 }, { name: 'cover', maxCount: 1 }]), async (req, res) => {
    const data = await loadData();
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const audioFile = files['audio']?.[0];
    const coverFile = files['cover']?.[0];
    
    // Ensure unique slug
    let slug = req.body.slug || req.body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    let existingSlug = data.demos.find((d: any) => d.slug === slug);
    if (existingSlug) slug = slug + '-' + Date.now().toString().slice(-4);

    const newDemo = {
      id: Date.now().toString(),
      slug: slug,
      title: req.body.title,
      author: req.body.author || '',
      audioUrl: audioFile ? `/uploads/${audioFile.filename}` : (req.body.audioUrl || ''),
      coverUrl: coverFile ? `/uploads/${coverFile.filename}` : processDriveLink(req.body.coverUrl || ''),
      lyrics: req.body.lyrics || '',
      template: req.body.template || '1',
      status: req.body.status || 'public',
      password: req.body.password || '',
      createdAt: Date.now(),
      composer: req.body.composer || 'A.C Xuân Tài',
      singer: req.body.singer || 'A.C Xuân Tài'
    };
    data.demos.push(newDemo);
    await saveData(data);
    res.json(newDemo);
  });
  
  app.post('/api/demos/:id/update', upload.fields([{ name: 'audio', maxCount: 1 }, { name: 'cover', maxCount: 1 }]), async (req, res) => {
     const data = await loadData();
     const idx = data.demos.findIndex((d: any) => d.id === req.params.id || d.slug === req.params.id);
     if (idx >= 0) {
        const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
        const audioFile = files?.['audio']?.[0];
        const coverFile = files?.['cover']?.[0];

        let updatedData = { ...req.body };
        if (audioFile) updatedData.audioUrl = `/uploads/${audioFile.filename}`;
        if (coverFile) {
            updatedData.coverUrl = `/uploads/${coverFile.filename}`;
        } else if (req.body.coverUrl !== undefined) {
            updatedData.coverUrl = processDriveLink(req.body.coverUrl);
        }
        
        if (updatedData.composer === '') updatedData.composer = 'A.C Xuân Tài';
        if (updatedData.singer === '') updatedData.singer = 'A.C Xuân Tài';
        if (!updatedData.composer && !data.demos[idx].composer) updatedData.composer = 'A.C Xuân Tài';
        if (!updatedData.singer && !data.demos[idx].singer) updatedData.singer = 'A.C Xuân Tài';

        data.demos[idx] = { ...data.demos[idx], ...updatedData };
        await saveData(data);
        res.json(data.demos[idx]);
     } else {
        res.status(404).json({ error: 'Not found' });
     }
  });
  
  app.post('/api/demos/:id/delete', async (req, res) => {
     const data = await loadData();
     data.demos = data.demos.filter((d: any) => d.id !== req.params.id && d.slug !== req.params.id);
     await saveData(data);
     res.json({ success: true });
  });

  app.post('/api/demos/:id/verify', async (req, res) => {
    const data = await loadData();
    const demo = data.demos.find((d: any) => d.id === req.params.id || d.slug === req.params.id);
    if (!demo) return res.status(404).json({ error: 'Not found' });
    const expectedPassword = demo.password || data.globalPassword;
    if (expectedPassword && expectedPassword === req.body.password) {
      // Send back the audio template securely, or just success
      res.json({ success: true, demo });
    } else {
      res.status(401).json({ error: 'Sai mật khẩu' });
    }
  });

  app.get('/api/demos/:id', async (req, res) => {
      const data = await loadData();
      const demo = data.demos.find((d: any) => d.id === req.params.id || d.slug === req.params.id);
      if (!demo) return res.status(404).json({ error: 'Not found' });
      
      const expectedPassword = demo.password || data.globalPassword;
      // If it requires password, only return basic metadata without audio/lyrics
      if (expectedPassword && expectedPassword !== req.query.pwd) {
          return res.json({ 
              id: demo.id, 
              title: demo.title,
              singer: demo.singer,
              author: demo.author,
              template: demo.template,
              coverUrl: demo.coverUrl,
              requiresPassword: true 
          });
      }
      res.json(demo);
  });

  // Serve static files from public/uploads
  app.use('/uploads', express.static(path.join(process.cwd(), 'public', 'uploads')));

  app.post('/api/upload', upload.single('file'), (req, res) => {
    if (req.file) {
      res.json({ url: `/uploads/${req.file.filename}` });
    } else {
      res.status(400).json({ error: 'Upload failed' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
