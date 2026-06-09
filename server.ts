import express from 'express';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import multer from 'multer';
import sharp from 'sharp';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "nice-momentum-trwfn",
  appId: "1:439820764953:web:abcf8a172f204668bc2788",
  apiKey: "AIzaSyAz8j_0SLubaQMiNw2ZnugPyzWPrvGYQyE",
  authDomain: "nice-momentum-trwfn.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-55e9d594-1864-4eda-b3a6-811c2fea9f04",
  storageBucket: "nice-momentum-trwfn.firebasestorage.app",
  messagingSenderId: "439820764953",
  measurementId: ""
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp, "ai-studio-55e9d594-1864-4eda-b3a6-811c2fea9f04");
const DOC_REF = doc(db, 'app_data', 'main');

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

let currentAdminPassword = 'MatKhauDay123';
let currentMemberPassword = 'XuanTaiDepTrai';

async function loadData() {
  try {
    const docSnap = await getDoc(DOC_REF);
    if (docSnap.exists()) {
      const data = docSnap.data();
      
      if (data.adminPassword) {
        currentAdminPassword = data.adminPassword;
      } else {
        data.adminPassword = currentAdminPassword;
      }
      if (data.memberPassword) {
        currentMemberPassword = data.memberPassword;
      } else {
        data.memberPassword = currentMemberPassword;
      }

      const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
      const now = Date.now();
      let changed = false;

      if (data.demos) {
         const lenBefore = data.demos.length;
         let draftChanged = false;
         data.demos = data.demos.filter((d: any) => {
            if (d.deleted && d.deletedAt && (now - d.deletedAt > thirtyDaysMs)) {
               return false;
            }
            // Sanitize isDraft values
            if (d.isDraft === 'false' || d.isDraft === '0') {
               d.isDraft = false;
               draftChanged = true;
            } else if (d.isDraft === 'true' || d.isDraft === '1') {
               d.isDraft = true;
               draftChanged = true;
            }
            if (!d.secretKey) {
               d.secretKey = crypto.randomBytes(8).toString('hex');
               draftChanged = true;
            }
            return true;
         });
         if (data.demos.length !== lenBefore || draftChanged) changed = true;
      }
      if (data.playlists) {
         const lenBefore = data.playlists.length;
         data.playlists = data.playlists.filter((p: any) => {
            if (p.deleted && p.deletedAt && (now - p.deletedAt > thirtyDaysMs)) {
               return false;
            }
            return true;
         });
         if (data.playlists.length !== lenBefore) changed = true;
      }

      if (changed) {
         await setDoc(DOC_REF, JSON.parse(JSON.stringify(data)));
         try {
            await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
         } catch (e) {}
      }

      return data;
    }
  } catch (error) {
    console.error("Firebase load error:", error);
  }
  
  // Migrate from local if Firebase fails or is empty
  try {
    const data = await fs.readFile(DATA_FILE, 'utf-8');
    const parsedData = JSON.parse(data);
    
    if (parsedData.adminPassword) {
      currentAdminPassword = parsedData.adminPassword;
    } else {
      parsedData.adminPassword = currentAdminPassword;
    }
    if (parsedData.memberPassword) {
      currentMemberPassword = parsedData.memberPassword;
    } else {
      parsedData.memberPassword = currentMemberPassword;
    }

    if (parsedData.demos) {
      parsedData.demos = parsedData.demos.map((d: any) => {
        if (d.isDraft === 'false' || d.isDraft === '0') {
          d.isDraft = false;
        } else if (d.isDraft === 'true' || d.isDraft === '1') {
          d.isDraft = true;
        }
        if (!d.secretKey) {
          d.secretKey = crypto.randomBytes(8).toString('hex');
        }
        return d;
      });
    }

    await setDoc(DOC_REF, parsedData); // upload to firebase for next time
    return parsedData;
  } catch (error) {}

  // Return default data
  return {
    pageTitle: '',
    artistName: 'A.C Xuân Tài',
    artistBio: 'Nơi mình chia sẻ các demo nhạc mới',
    homeCoverUrl: '',
    faviconUrl: '',
    ogImageUrl: '',
    youtubePlaylistUrl: '',
    spotifyUrl: '',
    releasedSongs: [],
    demos: [],
    playlists: [],
    adminPassword: currentAdminPassword,
    memberPassword: currentMemberPassword
  };
}

async function saveData(data: any) {
  try {
    // Remove undefined fields to prevent Firestore errors
    const cleanedData = JSON.parse(JSON.stringify(data));
    await setDoc(DOC_REF, cleanedData);
  } catch (error) {
    console.error("Firebase save error:", error);
  }
  
  // Keep local backup just in case
  try {
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {}
}

async function startServer() {
  await ensureUploadsDir();
  const app = express();
  app.set('trust proxy', 1);
  app.use(cors());
  
  // AI Studio bắt buộc dùng port 3000 để preview hoạt động.
  // Khi chạy trên VPS CloudPanel của bạn, mặc định sẽ dùng port 3333
  // hoặc thiết lập App Port: 3333 trực tiếp trên giao diện CloudPanel.
  const PORT = process.env.NODE_ENV === 'production' 
    ? (process.env.PORT ? parseInt(process.env.PORT) : 3333) 
    : 3000;

  app.use(express.json());

  const isRequestAdmin = (req: express.Request): boolean => {
    // 1. Check authorization header or x-admin-token header
    const authHeader = req.headers.authorization || req.headers['x-admin-token'];
    if (authHeader) {
      const token = typeof authHeader === 'string' && authHeader.startsWith('Bearer ') 
        ? authHeader.slice(7) 
        : String(authHeader);
      
      if (token === currentAdminPassword) return true;
    }

    // 2. Check cookies
    const cookieHeader = req.headers.cookie;
    if (!cookieHeader) return false;
    
    const cookies: Record<string, string> = {};
    cookieHeader.split(';').forEach(c => {
      const parts = c.split('=');
      if (parts.length >= 2) {
        cookies[parts[0].trim()] = decodeURIComponent(parts[1].trim());
      }
    });
    
    return cookies['adminToken'] === currentAdminPassword;
  };

  const isRequestMember = (req: express.Request): boolean => {
    if (isRequestAdmin(req)) return true;

    // 1. Check authorization header or x-admin-token header
    const authHeader = req.headers.authorization || req.headers['x-admin-token'];
    if (authHeader) {
      const token = typeof authHeader === 'string' && authHeader.startsWith('Bearer ') 
        ? authHeader.slice(7) 
        : String(authHeader);
      
      if (token === currentMemberPassword) return true;
    }

    // 2. Check cookies
    const cookieHeader = req.headers.cookie;
    if (!cookieHeader) return false;
    
    const cookies: Record<string, string> = {};
    cookieHeader.split(';').forEach(c => {
      const parts = c.split('=');
      if (parts.length >= 2) {
        cookies[parts[0].trim()] = decodeURIComponent(parts[1].trim());
      }
    });
    
    return cookies['memberToken'] === currentMemberPassword;
  };

  // API Routes
  const injectCoverUrl = (demos: any[], slideshowImages?: string[]) => {
      const imagesToUse = (slideshowImages && slideshowImages.length > 0) 
          ? slideshowImages 
          : ["https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&q=80"];
      return demos.map(d => {
         if (!d.coverUrl) {
            const idStr = String(d.id || '');
            const hash = Array.from(idStr).reduce((sum: number, char: string) => sum + char.charCodeAt(0), 0);
            return { ...d, coverUrl: imagesToUse[hash % imagesToUse.length] };
         }
         return d;
      });
  };

  const formatUrl = (url: string | undefined, baseUrl: string | undefined) => {
    if (!url) return url;
    
    // Normalize baseUrl if provided
    let finalBaseUrl = baseUrl;
    if (finalBaseUrl) {
      finalBaseUrl = finalBaseUrl.trim();
      if (!/^https?:\/\//i.test(finalBaseUrl)) {
        finalBaseUrl = 'https://' + finalBaseUrl;
      }
      finalBaseUrl = finalBaseUrl.replace(/\/$/, '');
    }

    // If the URL is an uploaded file (contains /uploads/)
    const uploadMatch = url.match(/\/uploads\/[^/]+$/);
    if (uploadMatch) {
      if (finalBaseUrl) return finalBaseUrl + uploadMatch[0];
      if (url.startsWith('http')) return url;
      return uploadMatch[0];
    }
    if (url.startsWith('/uploads/') || url.startsWith('uploads/')) {
      let normalized = url.startsWith('/') ? url : '/' + url;
      if (finalBaseUrl) return finalBaseUrl + normalized;
      return normalized;
    }

    // Replace any absolute ais-dev or ais-pre URLs with the global base URL if set
    if (finalBaseUrl && url.includes('run.app')) {
       url = url.replace(/https?:\/\/[a-zA-Z0-9-]+\.run\.app/g, finalBaseUrl);
    }
    
    // Also replace absolute xtpro domains just in case
    if (finalBaseUrl && url.includes('xtpro.vn')) {
        url = url.replace(/https?:\/\/[a-zA-Z0-9-]+\.xtpro\.vn/g, finalBaseUrl);
    }

    if (url.startsWith('/') && finalBaseUrl) {
      return finalBaseUrl + url;
    }
    
    return url;
  };

  const getPlaylistCover = (p: any, data: any, baseUrl: string) => {
    let pCover = p.coverUrl || '';
    if (!pCover) {
       const songsInPlaylist = (data.demos || []).filter((d: any) => d.playlistIds && d.playlistIds.includes(p.id));
       if (p.songIds && p.songIds.length > 0) {
          songsInPlaylist.sort((a: any, b: any) => {
             const indexA = p.songIds.indexOf(a.id);
             const indexB = p.songIds.indexOf(b.id);
             if (indexA === -1 && indexB === -1) return 0;
             if (indexA === -1) return 1;
             if (indexB === -1) return -1;
             return indexA - indexB;
          });
       }
       const firstSong = songsInPlaylist[0];
       if (firstSong && firstSong.coverUrl) {
          pCover = firstSong.coverUrl;
       }
    }
    return formatUrl(pCover, baseUrl || '');
  };

  const applyBaseUrl = (data: any) => {

    const cloned = { ...data };
    
    cloned.homeCoverUrl = formatUrl(cloned.homeCoverUrl, cloned.globalBaseUrl);
    cloned.faviconUrl = formatUrl(cloned.faviconUrl, cloned.globalBaseUrl);
    cloned.ogImageUrl = formatUrl(cloned.ogImageUrl, cloned.globalBaseUrl);
    
    if (cloned.slideshowImages) {
       cloned.slideshowImages = cloned.slideshowImages.map((s: string) => formatUrl(s, cloned.globalBaseUrl));
    }
    
    if (cloned.playlists) {
       cloned.playlists = cloned.playlists.map((p: any) => ({
         ...p,
         coverUrl: getPlaylistCover(p, cloned, cloned.globalBaseUrl || '')
       }));
    }
    
    if (cloned.demos) {
      cloned.demos = cloned.demos.map((d: any) => ({
        ...d,
        audioUrl: formatUrl(d.audioUrl, cloned.globalBaseUrl),
        coverUrl: formatUrl(d.coverUrl, cloned.globalBaseUrl),
        backgroundUrl: formatUrl(d.backgroundUrl, cloned.globalBaseUrl)
      }));
    }
    return cloned;
  };

  app.get('/api/data', async (req, res) => {
    let data = await loadData();
    data = applyBaseUrl(data);
    
    if (data.demos) {
       data.demos = data.demos.filter((d: any) => !d.deleted);
    }
    if (data.playlists) {
       data.playlists = data.playlists.filter((p: any) => !p.deleted);
    }

    // Do not leak passwords
    let publicDemos = data.demos.map((d: any) => ({ ...d, password: !!(d.password || data.globalPassword) })); 
    publicDemos = injectCoverUrl(publicDemos, data.slideshowImages);
    // We send back both for simplicity, but let's just make it simple
    res.json({ ...data, demos: publicDemos });
  });

  // Admin authentication endpoints
  app.post('/api/admin/login', (req, res) => {
    const { password } = req.body;
    if (password === currentAdminPassword) {
      res.setHeader('Set-Cookie', `adminToken=${currentAdminPassword}; Path=/; HttpOnly; SameSite=None; Secure; Max-Age=2592000`); // 30 days
      res.json({ success: true, token: currentAdminPassword });
    } else {
      res.status(401).json({ error: 'Sai mật khẩu!' });
    }
  });

  app.post('/api/admin/logout', (req, res) => {
    res.setHeader('Set-Cookie', [
      'adminToken=; Path=/; HttpOnly; SameSite=None; Secure; Max-Age=0',
      'adminToken=; Path=/; HttpOnly; Max-Age=0'
    ]);
    res.json({ success: true });
  });

  app.get('/api/admin/check', (req, res) => {
    if (isRequestAdmin(req)) {
      res.json({ isAdmin: true, memberPassword: currentMemberPassword });
    } else {
      res.json({ isAdmin: false });
    }
  });

  // Admin changing admin password
  app.post('/api/admin/change-password', async (req, res) => {
    if (!isRequestAdmin(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const { oldPassword, newPassword, confirmPassword } = req.body;
    if (!oldPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ error: 'Vui lòng cung cấp đầy đủ thông tin!' });
    }
    if (oldPassword !== currentAdminPassword) {
      return res.status(400).json({ error: 'Mật khẩu cũ không chính xác!' });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'Xác nhận mật khẩu mới không khớp!' });
    }
    if (newPassword.length < 4) {
      return res.status(400).json({ error: 'Mật khẩu mới phải từ 4 ký tự trở lên!' });
    }

    const data = await loadData();
    data.adminPassword = newPassword;
    await saveData(data);
    currentAdminPassword = newPassword;
    
    // Update cookies
    res.setHeader('Set-Cookie', `adminToken=${newPassword}; Path=/; HttpOnly; SameSite=None; Secure; Max-Age=2592000`); // 30 days
    res.json({ success: true, token: newPassword });
  });

  // Admin setting member password
  app.post('/api/admin/set-member-password', async (req, res) => {
    if (!isRequestAdmin(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const { memberPassword } = req.body;
    if (!memberPassword || memberPassword.length < 4) {
      return res.status(400).json({ error: 'Mật khẩu thành viên tối thiểu 4 ký tự!' });
    }

    const data = await loadData();
    data.memberPassword = memberPassword;
    await saveData(data);
    currentMemberPassword = memberPassword;
    res.json({ success: true });
  });

  // Member authentication endpoints
  app.post('/api/member/login', (req, res) => {
    const { password } = req.body;
    if (password === currentMemberPassword) {
      res.setHeader('Set-Cookie', `memberToken=${currentMemberPassword}; Path=/; HttpOnly; SameSite=None; Secure; Max-Age=2592000`); // 30 days
      res.json({ success: true, token: currentMemberPassword });
    } else {
      res.status(401).json({ error: 'Mật khẩu thành viên không chính xác!' });
    }
  });

  app.post('/api/member/logout', (req, res) => {
    res.setHeader('Set-Cookie', [
      'memberToken=; Path=/; HttpOnly; SameSite=None; Secure; Max-Age=0',
      'memberToken=; Path=/; HttpOnly; Max-Age=0'
    ]);
    res.json({ success: true });
  });

  app.get('/api/member/check', (req, res) => {
    if (isRequestMember(req)) {
      res.json({ isMember: true });
    } else {
      res.json({ isMember: false });
    }
  });

  // Admin access to real data (including passwords for editing)
  app.get('/api/admin/data', async (req, res) => {
    if (!isRequestAdmin(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const data = await loadData();
    res.json({ ...data, memberPassword: currentMemberPassword });
  });

  app.post('/api/profile', async (req, res) => {
    if (!isRequestAdmin(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const data = await loadData();
    data.pageTitle = req.body.pageTitle ?? data.pageTitle;
    data.artistName = req.body.artistName ?? data.artistName;
    data.artistBio = req.body.artistBio ?? data.artistBio;
    data.homeCoverUrl = req.body.homeCoverUrl ?? data.homeCoverUrl;
    data.faviconUrl = req.body.faviconUrl ?? data.faviconUrl;
    data.ogImageUrl = req.body.ogImageUrl ?? data.ogImageUrl;
    data.youtubePlaylistUrl = req.body.youtubePlaylistUrl ?? data.youtubePlaylistUrl;
    data.spotifyUrl = req.body.spotifyUrl ?? data.spotifyUrl;
    data.socialFacebook = req.body.socialFacebook ?? data.socialFacebook;
    data.socialInstagram = req.body.socialInstagram ?? data.socialInstagram;
    data.socialYoutube = req.body.socialYoutube ?? data.socialYoutube;
    data.socialTiktok = req.body.socialTiktok ?? data.socialTiktok;
    data.globalPassword = req.body.globalPassword ?? data.globalPassword;
    data.globalBaseUrl = req.body.globalBaseUrl !== undefined ? req.body.globalBaseUrl : data.globalBaseUrl;
    if (req.body.slideshowImages) data.slideshowImages = req.body.slideshowImages;
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
    if (!isRequestAdmin(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
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
    if (!isRequestAdmin(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const data = await loadData();
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    const audioFile = files['audio']?.[0];
    const coverFile = files['cover']?.[0];
    
    // Ensure unique slug
    let slug = req.body.slug || req.body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    let existingSlug = data.demos.find((d: any) => d.slug === slug);
    if (existingSlug) slug = slug + '-' + Date.now().toString().slice(-4);

    let coverUrl = '';
    if (coverFile) {
      coverUrl = `/uploads/${coverFile.filename}`;
    } else {
      const inputCover = req.body.coverUrl ? processDriveLink(req.body.coverUrl) : '';
      if (inputCover) {
        coverUrl = inputCover;
      } else if (data.slideshowImages && data.slideshowImages.length > 0) {
        const hashSource = req.body.title || Date.now().toString();
        let hash = 0;
        for (let i = 0; i < hashSource.length; i++) {
          hash += hashSource.charCodeAt(i);
        }
        coverUrl = data.slideshowImages[hash % data.slideshowImages.length];
      } else {
        coverUrl = "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&q=80";
      }
    }

    const newDemo = {
      id: Date.now().toString(),
      slug: slug,
      title: req.body.title,
      author: req.body.author || '',
      audioUrl: audioFile ? `/uploads/${audioFile.filename}` : (req.body.audioUrl || ''),
      coverUrl: coverUrl,
      secretKey: crypto.randomBytes(8).toString('hex'),
      backgroundUrl: processDriveLink(req.body.backgroundUrl || ''),
      lyrics: req.body.lyrics || '',
      template: req.body.template || '1',
      status: req.body.status || 'public',
      password: req.body.password || '',
      createdAt: Date.now(),
      composer: req.body.composer || 'A.C Xuân Tài',
      singer: req.body.singer || 'A.C Xuân Tài',
      isReleased: req.body.isReleased === 'true',
      isDraft: req.body.isDraft === 'true',
      playlistIds: req.body.playlistIds ? JSON.parse(req.body.playlistIds) : []
    };
    data.demos.push(newDemo);
    await saveData(data);
    res.json(newDemo);
  });
  
  app.post('/api/demos/:id/update', upload.fields([{ name: 'audio', maxCount: 1 }, { name: 'cover', maxCount: 1 }]), async (req, res) => {
     if (!isRequestAdmin(req)) {
        return res.status(401).json({ error: 'Unauthorized' });
     }
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
            const inputCover = processDriveLink(req.body.coverUrl);
            if (!inputCover) {
                if (data.slideshowImages && data.slideshowImages.length > 0) {
                     const hashSource = (req.body.title || data.demos[idx].title || Date.now().toString());
                     let hash = 0;
                     for (let i = 0; i < hashSource.length; i++) {
                       hash += hashSource.charCodeAt(i);
                     }
                     updatedData.coverUrl = data.slideshowImages[hash % data.slideshowImages.length];
                } else {
                     updatedData.coverUrl = "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&q=80";
                }
            } else {
                updatedData.coverUrl = inputCover;
            }
        }
        if (req.body.backgroundUrl !== undefined) {
            updatedData.backgroundUrl = processDriveLink(req.body.backgroundUrl);
        }
        
        if (updatedData.composer === '') updatedData.composer = 'A.C Xuân Tài';
        if (updatedData.singer === '') updatedData.singer = 'A.C Xuân Tài';
        if (!updatedData.composer && !data.demos[idx].composer) updatedData.composer = 'A.C Xuân Tài';
        if (!updatedData.singer && !data.demos[idx].singer) updatedData.singer = 'A.C Xuân Tài';
        if (req.body.isReleased !== undefined) {
             updatedData.isReleased = req.body.isReleased === 'true';
        }
        if (req.body.isDraft !== undefined) {
             updatedData.isDraft = req.body.isDraft === 'true';
        }
        if (req.body.playlistIds !== undefined) {
            updatedData.playlistIds = JSON.parse(req.body.playlistIds);
        }

        data.demos[idx] = { ...data.demos[idx], ...updatedData };
        await saveData(data);
        res.json(data.demos[idx]);
     } else {
        res.status(404).json({ error: 'Not found' });
     }
  });
  
  app.post('/api/admin/reset-secret-links', express.json(), async (req, res) => {
     if (!isRequestAdmin(req)) {
        return res.status(401).json({ error: 'Unauthorized' });
     }
     const data = await loadData();
     data.demos = data.demos.map((d: any) => ({
        ...d,
        secretKey: crypto.randomBytes(8).toString('hex')
     }));
     await saveData(data);
     res.json({ success: true });
  });

  app.post('/api/demos/:id/reset-secret', express.json(), async (req, res) => {
     if (!isRequestAdmin(req)) {
        return res.status(401).json({ error: 'Unauthorized' });
     }
     const data = await loadData();
     let found = false;
     data.demos = data.demos.map((d: any) => {
        if (d.id === req.params.id || d.slug === req.params.id) {
           d.secretKey = crypto.randomBytes(8).toString('hex');
           found = true;
        }
        return d;
     });
     if (found) {
        await saveData(data);
        res.json({ success: true });
     } else {
        res.status(404).json({ error: 'Not found' });
     }
  });

  app.post('/api/demos/:id/delete', async (req, res) => {
     if (!isRequestAdmin(req)) {
        return res.status(401).json({ error: 'Unauthorized' });
     }
     const data = await loadData();
     const idx = data.demos.findIndex((d: any) => d.id === req.params.id || d.slug === req.params.id);
     if (idx >= 0) {
        data.demos[idx].deleted = true;
        data.demos[idx].deletedAt = Date.now();
        await saveData(data);
        res.json({ success: true });
     } else {
        res.status(404).json({ error: 'Not found' });
     }
  });

  app.post('/api/demos/:id/restore', async (req, res) => {
     if (!isRequestAdmin(req)) {
        return res.status(401).json({ error: 'Unauthorized' });
     }
     const data = await loadData();
     const idx = data.demos.findIndex((d: any) => d.id === req.params.id || d.slug === req.params.id);
     if (idx >= 0) {
        data.demos[idx].deleted = false;
        delete data.demos[idx].deletedAt;
        await saveData(data);
        res.json({ success: true });
     } else {
        res.status(404).json({ error: 'Not found' });
     }
  });

  app.post('/api/admin/reorder-demos', express.json(), async (req, res) => {
     if (!isRequestAdmin(req)) {
        return res.status(401).json({ error: 'Unauthorized' });
     }
     const { demoIds } = req.body;
     if (!Array.isArray(demoIds)) {
        return res.status(400).json({ error: 'Invalid payload' });
     }
     const data = await loadData();
     const demosMap = new Map(data.demos.map((d: any) => [d.id, d]));
     const orderedDemos: any[] = [];
     
     demoIds.forEach((id: string) => {
        const demo = demosMap.get(id);
        if (demo) {
           orderedDemos.push(demo);
           demosMap.delete(id);
        }
     });
     
     demosMap.forEach((demo) => {
        orderedDemos.push(demo);
     });
     
     data.demos = orderedDemos;
     await saveData(data);
     res.json({ success: true, demos: data.demos });
  });

  app.post('/api/playlists', express.json(), async (req, res) => {
    if (!isRequestAdmin(req)) {
       return res.status(401).json({ error: 'Unauthorized' });
    }
    const data = await loadData();
    const newPlaylist = {
       id: Date.now().toString(),
       title: req.body.title || 'Untitled Playlist'
    };
    if (!data.playlists) data.playlists = [];
    data.playlists.push(newPlaylist);
    await saveData(data);
    res.json(newPlaylist);
  });

  app.post('/api/playlists/:id/update', express.json(), async (req, res) => {
    if (!isRequestAdmin(req)) {
       return res.status(401).json({ error: 'Unauthorized' });
    }
    const data = await loadData();
    if (!data.playlists) data.playlists = [];
    const idx = data.playlists.findIndex((p: any) => p.id === req.params.id);
    if (idx >= 0) {
       if (req.body.title !== undefined) data.playlists[idx].title = req.body.title;
       if (req.body.coverUrl !== undefined) data.playlists[idx].coverUrl = req.body.coverUrl;
       if (req.body.songIds !== undefined) data.playlists[idx].songIds = req.body.songIds;
       await saveData(data);
       res.json(data.playlists[idx]);
    } else {
       res.status(404).json({ error: 'Not found' });
    }
  });

  app.post('/api/playlists/:id/delete', async (req, res) => {
    if (!isRequestAdmin(req)) {
       return res.status(401).json({ error: 'Unauthorized' });
    }
    const data = await loadData();
    if (!data.playlists) data.playlists = [];
    const idx = data.playlists.findIndex((p: any) => p.id === req.params.id);
    if (idx >= 0) {
       data.playlists[idx].deleted = true;
       data.playlists[idx].deletedAt = Date.now();
       await saveData(data);
       res.json({ success: true });
    } else {
       res.status(404).json({ error: 'Not found' });
    }
  });

  app.post('/api/playlists/:id/restore', async (req, res) => {
    if (!isRequestAdmin(req)) {
       return res.status(401).json({ error: 'Unauthorized' });
    }
    const data = await loadData();
    if (!data.playlists) data.playlists = [];
    const idx = data.playlists.findIndex((p: any) => p.id === req.params.id);
    if (idx >= 0) {
       data.playlists[idx].deleted = false;
       delete data.playlists[idx].deletedAt;
       await saveData(data);
       res.json({ success: true });
    } else {
       res.status(404).json({ error: 'Not found' });
    }
  });

  app.post('/api/admin/reorder-playlists', express.json(), async (req, res) => {
    if (!isRequestAdmin(req)) {
       return res.status(401).json({ error: 'Unauthorized' });
    }
    const { playlistIds } = req.body;
    if (!Array.isArray(playlistIds)) {
       return res.status(400).json({ error: 'Invalid payload' });
    }
    const data = await loadData();
    const playlistsMap = new Map((data.playlists || []).map((p: any) => [p.id, p]));
    const orderedPlaylists: any[] = [];
    
    playlistIds.forEach((id: string) => {
       const pl = playlistsMap.get(id);
       if (pl) {
          orderedPlaylists.push(pl);
          playlistsMap.delete(id);
       }
    });
    
    playlistsMap.forEach((pl) => {
       orderedPlaylists.push(pl);
    });
    
    data.playlists = orderedPlaylists;
    await saveData(data);
    res.json({ success: true, playlists: data.playlists });
  });

  app.post('/api/admin/save-templates', express.json(), async (req, res) => {
    if (!isRequestAdmin(req)) {
       return res.status(401).json({ error: 'Unauthorized' });
    }
    const { configs } = req.body;
    if (!Array.isArray(configs)) {
       return res.status(400).json({ error: 'Invalid payload' });
    }
    
    const data = await loadData();
    data.templateConfigs = configs;
    await saveData(data);
    res.json({ success: true });
  });

  app.post('/api/demos/:id/verify', async (req, res) => {
    const data = await loadData();
    let demo = data.demos.find((d: any) => d.id === req.params.id || d.slug === req.params.id);
    if (!demo) return res.status(404).json({ error: 'Not found' });
    const expectedPassword = demo.isReleased ? null : (demo.password || data.globalPassword);
    if (expectedPassword && expectedPassword === req.body.password) {
      if (!demo.coverUrl) {
          const imagesToUse = (data.slideshowImages && data.slideshowImages.length > 0)
              ? data.slideshowImages
              : ["https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&q=80"];
          const idStr = String(demo.id || '');
          const hash = Array.from(idStr).reduce((sum: number, char: string) => sum + char.charCodeAt(0), 0);
          demo = { ...demo, coverUrl: imagesToUse[hash % imagesToUse.length] };
      }
      
      const formattedDemo = {
        ...demo,
        audioUrl: formatUrl(demo.audioUrl, data.globalBaseUrl),
        coverUrl: formatUrl(demo.coverUrl, data.globalBaseUrl),
        backgroundUrl: formatUrl(demo.backgroundUrl, data.globalBaseUrl),
        globalCoverUrl: formatUrl(data.homeCoverUrl, data.globalBaseUrl)
      };
      res.json({ success: true, demo: formattedDemo });
    } else {
      res.status(401).json({ error: 'Sai mật khẩu' });
    }
  });

  app.get('/api/playlists/:id', async (req, res) => {
      const data = await loadData();
      const playlist = data.playlists?.find((p: any) => p.id === req.params.id && !p.deleted);
      if (!playlist) return res.status(404).json({ error: 'Playlist not found' });
      
      const isUserAdmin = isRequestAdmin(req);
      const isUserMember = isRequestMember(req);
      let songs = data.demos.filter((d: any) => {
         if (d.deleted) return false;
         if (d.status !== 'public' && !isUserAdmin) return false;
         return d.playlistIds && d.playlistIds.includes(playlist.id);
      });

      if (playlist.songIds && playlist.songIds.length > 0) {
         songs.sort((a: any, b: any) => {
            const indexA = playlist.songIds.indexOf(a.id);
            const indexB = playlist.songIds.indexOf(b.id);
            if (indexA === -1 && indexB === -1) return 0;
            if (indexA === -1) return 1;
            if (indexB === -1) return -1;
            return indexA - indexB;
         });
      }

      songs = songs.map((d: any) => {
         let coverToUse = d.coverUrl || '';
         if (!coverToUse && data.slideshowImages && data.slideshowImages.length > 0) {
            const idStr = String(d.id || '');
            let hash = 0;
            for (let i = 0; i < idStr.length; i++) {
               hash += idStr.charCodeAt(i);
            }
            coverToUse = data.slideshowImages[hash % data.slideshowImages.length];
         }
         if (!coverToUse) {
            coverToUse = "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&q=80";
         }
         return {
            id: d.id,
            slug: d.slug,
            title: d.title,
            singer: d.singer,
            author: d.author,
            composer: d.composer,
            coverUrl: formatUrl(coverToUse, data.globalBaseUrl),
            requiresPassword: isUserMember ? false : !!(!d.isReleased && (d.password || data.globalPassword))
         };
      });

      const formattedPlaylist = {
         ...playlist,
         coverUrl: playlist.coverUrl ? formatUrl(playlist.coverUrl, data.globalBaseUrl) : (songs[0]?.coverUrl || '')
      };

      res.json({ playlist: formattedPlaylist, songs });
  });

  app.get('/api/demos/:id', async (req, res) => {
      const data = await loadData();
      let demo = data.demos.find((d: any) => (d.id === req.params.id || d.slug === req.params.id) && !d.deleted);
      if (!demo) return res.status(404).json({ error: 'Not found' });
      
      // Inject random cover if missing
      if (!demo.coverUrl) {
          const imagesToUse = (data.slideshowImages && data.slideshowImages.length > 0)
              ? data.slideshowImages
              : ["https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&q=80"];
          const idStr = String(demo.id || '');
          let hash = 0;
          for (let i = 0; i < idStr.length; i++) {
             hash += idStr.charCodeAt(i);
          }
          demo = { ...demo, coverUrl: imagesToUse[hash % imagesToUse.length] };
      }
      
      demo = {
        ...demo,
        audioUrl: formatUrl(demo.audioUrl, data.globalBaseUrl),
        coverUrl: formatUrl(demo.coverUrl, data.globalBaseUrl),
        backgroundUrl: formatUrl(demo.backgroundUrl, data.globalBaseUrl),
        templateConfigs: data.templateConfigs || []
      };

      const expectedPassword = demo.isReleased ? null : (demo.password || data.globalPassword);
      const isUserAdmin = isRequestAdmin(req);
      const isUserMember = isRequestMember(req);
      const fromPlaylist = req.query.fromPlaylist === 'true';
      const providedSecret = req.query.secret as string | undefined;
      const isValidSecret = !!(demo.secretKey && providedSecret && demo.secretKey === providedSecret);
      
      // If it requires password, only return basic metadata without audio/lyrics
      if (expectedPassword && expectedPassword !== req.query.pwd && !isValidSecret && !isUserAdmin && !isUserMember) {
          return res.json({ 
              id: demo.id, 
              title: demo.title,
              singer: demo.singer,
              author: demo.author,
              composer: demo.composer,
              template: demo.template,
              coverUrl: demo.coverUrl,
              backgroundUrl: demo.backgroundUrl,
              globalCoverUrl: formatUrl(data.homeCoverUrl, data.globalBaseUrl),
              slideshowImages: data.slideshowImages || [],
              requiresPassword: true 
          });
      }
      res.json({ ...demo, slideshowImages: data.slideshowImages || [], globalCoverUrl: formatUrl(data.homeCoverUrl, data.globalBaseUrl), requiresPassword: !!expectedPassword && !isValidSecret && !isUserMember });
  });

  // Serve static files from public/uploads
  app.use('/uploads', express.static(path.join(process.cwd(), 'public', 'uploads')));

  app.post('/api/upload', upload.single('file'), async (req, res) => {
    if (!isRequestAdmin(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (req.file) {
      if (req.file.mimetype.startsWith('image/')) {
        try {
           const optimizedFilename = `${req.file.filename.split('.')[0]}-${Date.now()}.webp`;
           const optimizedPath = path.join(process.cwd(), 'public', 'uploads', optimizedFilename);
           
           await sharp(req.file.path)
            .webp({ quality: 80 })
            .resize({ width: 1920, withoutEnlargement: true })
            .toFile(optimizedPath);
           
           // Xóa file gốc
           await fs.unlink(req.file.path);
           res.json({ url: `/uploads/${optimizedFilename}` });
        } catch (error) {
           console.error("Lỗi nén ảnh:", error);
           res.json({ url: `/uploads/${req.file.filename}` });
        }
      } else {
        res.json({ url: `/uploads/${req.file.filename}` });
      }
    } else {
      res.status(400).json({ error: 'Upload failed' });
    }
  });

  app.post('/api/upload-base64', express.json({limit: '50mb'}), async (req, res) => {
    if (!isRequestAdmin(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    try {
      const { image, name } = req.body;
      if (!image) return res.status(400).json({ error: 'No image provided' });
      
      const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      
      const filename = `thumb-${Date.now()}.png`;
      const filepath = path.join(process.cwd(), 'public', 'uploads', filename);
      
      await fs.writeFile(filepath, buffer);
      res.json({ url: `/uploads/${filename}` });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Failed to upload image' });
    }
  });

  app.post('/api/demos/:id/thumbnail', express.json(), async (req, res) => {
    if (!isRequestAdmin(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const data = await loadData();
    const idx = data.demos.findIndex((d: any) => d.id === req.params.id || d.slug === req.params.id);
    if (idx >= 0) {
       data.demos[idx].ogImageUrl = req.body.ogImageUrl;
       await saveData(data);
       return res.json({ success: true });
    }
    res.status(404).json({ error: 'Not found' });
  });

  app.post('/api/translate', express.json(), async (req, res) => {
    const { text, targetLang } = req.body;
    if (!text) return res.json({ translated: '' });
    
    try {
       const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
       const targetLanguageName = targetLang === 'en' ? 'English' : 
                                  targetLang === 'ko' ? 'Korean' : 
                                  targetLang === 'ja' ? 'Japanese' : 
                                  targetLang === 'th' ? 'Thai' : 
                                  targetLang === 'zh' ? 'Chinese' : 'Vietnamese';
       
       if (targetLanguageName === 'Vietnamese') return res.json({ translated: text });
  
       const response = await ai.models.generateContent({
         model: 'gemini-2.5-flash',
         contents: [
           {
             role: 'user', 
             parts: [{ text: `Translate the following short text (like a song title or bio) into ${targetLanguageName}. Only output the translation, do not include any quotes, extra words, or markdown. Text to translate:\n\n${text}` }]
           }
         ]
       });
       
       const translated = response.text?.trim() || text;
       res.json({ translated });
    } catch (error) {
       console.log('Translation fallback (quota or network error):', (error as any)?.message);
       res.json({ translated: text });
    }
  });

  // Serve runtime uploads folder
  const uploadsPath = path.join(process.cwd(), 'public', 'uploads');
  app.use('/uploads', express.static(uploadsPath));

  let vite: any;
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "custom",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files but DON'T serve index.html by default
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath, { index: false }));
  }

  app.get('/demo/:id', (req, res) => {
    const query = req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : '';
    res.redirect(301, `/song/${req.params.id}${query}`);
  });

  app.get('*', async (req, res, next) => {
    try {
      const url = req.originalUrl;
      const data = await loadData();
      
      let html = '';
      if (process.env.NODE_ENV !== 'production') {
        html = await fs.readFile(path.join(process.cwd(), 'index.html'), 'utf-8');
        html = await vite.transformIndexHtml(url, html);
      } else {
        html = await fs.readFile(path.join(process.cwd(), 'dist', 'index.html'), 'utf-8');
      }

      const defaultDesc = data.pageTitle || `Kho nhạc của ${data.artistName || 'A.C Xuân Tài'}`;
      let ogTitle = data.pageTitle || `Thiên đường âm nhạc của ${data.artistName || 'A.C Xuân Tài'}`;
      let ogImage = data.ogImageUrl || data.homeCoverUrl || (data.slideshowImages && data.slideshowImages.length > 0 ? data.slideshowImages[0] : '');
      
      const cleanPath = url.split('?')[0];
      const isHomepage = cleanPath === '/' || cleanPath === '/index.html' || cleanPath === '';
      let ogDesc = isHomepage 
        ? `Nơi cập nhật sản phẩm và demo của ${data.artistName || 'A.C Xuân Tài'}`
        : defaultDesc;

      const match = url.match(/^\/(?:demo|song)\/([^\/?]+)/);
      if (match) {
        const slug = match[1];
        const demo = data.demos.find((d: any) => (d.id === slug || d.slug === slug) && !d.deleted);
        if (demo) {
          const titleSuffix = demo.singer || demo.author || demo.composer || 'Unknown';
          ogTitle = demo.isReleased 
            ? `${demo.title} - ${titleSuffix}`
            : `${demo.title} - ${titleSuffix} ( demo )`;
          
          let coverToUse = demo.coverUrl;
          if (!coverToUse && data.slideshowImages && data.slideshowImages.length > 0) {
              const idStr = String(demo.id || '');
              let hash = 0;
              for (let i = 0; i < idStr.length; i++) {
                 hash += idStr.charCodeAt(i);
              }
              coverToUse = data.slideshowImages[hash % data.slideshowImages.length];
          }
          
          ogImage = demo.ogImageUrl || coverToUse || data.homeCoverUrl || data.ogImageUrl || '';
          ogDesc = defaultDesc;
        }
      }

      const playlistMatch = url.match(/^\/playlist\/([^\/?]+)/);
      if (playlistMatch) {
        const playlistId = playlistMatch[1];
        if (data.playlists) {
          const playlist = data.playlists.find((p: any) => p.id === playlistId && !p.deleted);
          if (playlist) {
            ogTitle = `${playlist.title} - A.C Xuân Tài`;
            
            let pCover = playlist.coverUrl;
            if (!pCover) {
              const pSongs = data.demos.filter((d: any) => !d.deleted && d.status === 'public' && d.playlistIds && d.playlistIds.includes(playlist.id));
              if (playlist.songIds && playlist.songIds.length > 0) {
                 pSongs.sort((a: any, b: any) => {
                    const indexA = playlist.songIds.indexOf(a.id);
                    const indexB = playlist.songIds.indexOf(b.id);
                    if (indexA === -1 && indexB === -1) return 0;
                    if (indexA === -1) return 1;
                    if (indexB === -1) return -1;
                    return indexA - indexB;
                 });
              }
              if (pSongs.length > 0) {
                 let firstSong = pSongs[0];
                 let firstSongCover = firstSong.coverUrl;
                 if (!firstSongCover && data.slideshowImages && data.slideshowImages.length > 0) {
                    const idStr = String(firstSong.id || '');
                    const hash = Array.from(idStr).reduce((sum: number, char: string) => sum + char.charCodeAt(0), 0);
                    firstSongCover = data.slideshowImages[hash % data.slideshowImages.length];
                 }
                 pCover = firstSongCover;
              }
            }
            ogImage = pCover || data.homeCoverUrl || data.ogImageUrl || '';
            ogDesc = defaultDesc;
          }
        }
      }

      const host = req.get('x-forwarded-host') || req.get('host') || '';
      if (ogImage && ogImage.startsWith('/')) {
         ogImage = `https://${host}${ogImage}`;
      } else if (ogImage && !ogImage.startsWith('http')) {
         // ensure it's a full URL if it doesn't have http
         ogImage = `https://${host}${ogImage.startsWith('/') ? '' : '/'}${ogImage}`;
      }

      if (ogImage) {
         // Enforce punycode hostname in ogImage
         ogImage = ogImage.replace(/tài\.com/gi, 'xn--ti-jia.com');
         ogImage = ogImage.replace(/ta\u0300i\.com/gi, 'xn--ti-jia.com');
         ogImage = ogImage.replace(/t%C3%A0i\.com/gi, 'xn--ti-jia.com');
         ogImage = ogImage.replace(/t%c3%a0i\.com/gi, 'xn--ti-jia.com');
         ogImage = ogImage.replace(/t\u0300?a\u0300?i\.com/gi, 'xn--ti-jia.com');
      }

      let ogUrl = `https://${host}${url}`;
      if (ogUrl.includes('xn--ti-jia.com')) {
         ogUrl = ogUrl.replace(/xn--ti-jia\.com/gi, 'tài.com');
      }

      // Inject tags
      html = html.replace(/<title>.*?<\/title>/i, `<title>${ogTitle}</title>`);
      
      const metaTags = `
        <meta property="og:title" content="${ogTitle}" />
        <meta property="og:description" content="${ogDesc.replace(/"/g, '&quot;')}" />
        <meta property="og:image" content="${ogImage}" />
        <meta property="og:url" content="${ogUrl}" />
        <meta property="og:site_name" content="tài.com" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="${ogTitle}" />
        <meta name="twitter:description" content="${ogDesc.replace(/"/g, '&quot;')}" />
        <meta name="twitter:image" content="${ogImage}" />
      `;
      html = html.replace('</head>', `${metaTags}</head>`);

      res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
    } catch (e: any) {
      if (process.env.NODE_ENV !== 'production' && vite) {
          vite.ssrFixStacktrace(e);
      }
      console.error(e);
      res.status(500).end(e.message);
    }
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
