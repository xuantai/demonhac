import express from 'express';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import multer from 'multer';
import sharp from 'sharp';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import ffmpeg from 'fluent-ffmpeg';

ffmpeg.setFfmpegPath(ffmpegInstaller.path);
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

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
const firebaseStorage = getStorage(firebaseApp);
const DOC_REF = doc(db, 'app_data', 'main');

const DATA_FILE = path.join(process.cwd(), 'data.json');
const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');

async function ensureUploadsDir() {
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
}

async function uploadLocalToCloud(localPath: string, filename: string, mimetype: string): Promise<string> {
  try {
    const fileBuffer = await fs.readFile(localPath);
    const storageRef = ref(firebaseStorage, `uploads/${filename}`);
    await uploadBytes(storageRef, fileBuffer, { contentType: mimetype });
    const cloudUrl = await getDownloadURL(storageRef);
    // Nhờ sự điều chỉnh: Chúng tôi KHÔNG XÓA file cục bộ ở localPath để đảm bảo cả 2 nơi (Local + Firebase) đều có backup!
    return cloudUrl;
  } catch (error) {
    console.error("Lỗi upload file lên Cloud Storage:", error);
    return `/uploads/${filename}`;
  }
}

async function uploadUrlOrFileToCloud(urlOrPath: string, globalBaseUrl?: string): Promise<string> {
  if (!urlOrPath) return '';
  if (urlOrPath.includes('firebasestorage.googleapis.com')) return urlOrPath;
  if (urlOrPath.startsWith('data:')) return urlOrPath;

  let fileBuffer: Buffer | null = null;
  let mimetype = 'image/jpeg';
  let filename = '';

  // 1. Thử đọc từ tệp tin cục bộ trên server trước
  if (urlOrPath.startsWith('/uploads/') || urlOrPath.startsWith('uploads/')) {
    const relativePath = urlOrPath.startsWith('/') ? urlOrPath.substring(1) : urlOrPath;
    const localFullPath = path.join(process.cwd(), 'public', relativePath);
    try {
      fileBuffer = await fs.readFile(localFullPath);
      console.log(`Đọc thành công file cục bộ: ${localFullPath}`);
      filename = path.basename(localFullPath);
      
      const ext = path.extname(filename).toLowerCase();
      if (ext === '.mp3') {
        mimetype = 'audio/mpeg';
      } else if (ext === '.wav') {
        mimetype = 'audio/wav';
      } else if (ext === '.webp') {
        mimetype = 'image/webp';
      } else if (ext === '.png') {
        mimetype = 'image/png';
      } else if (ext === '.gif') {
        mimetype = 'image/gif';
      } else {
        mimetype = 'image/jpeg';
      }
    } catch (err) {
      console.log(`Không tìm thấy file cục bộ: ${localFullPath}, chuẩn bị tải về...`);
    }
  }

  // 2. Tải về từ HTTP nếu đọc tệp cục bộ thất bại hoặc là liên kết bên ngoài
  if (!fileBuffer) {
    let fullUrl = urlOrPath;
    if (urlOrPath.startsWith('/')) {
      const baseUrl = globalBaseUrl || 'https://xn--ti-jia.com';
      fullUrl = `${baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl}${urlOrPath}`;
    } else if (!urlOrPath.startsWith('http')) {
      const baseUrl = globalBaseUrl || 'https://xn--ti-jia.com';
      fullUrl = `${baseUrl.endsWith('/') ? baseUrl : baseUrl + '/'}${urlOrPath}`;
    }

    // Xác định tên tệp và định dạng tệp từ URL
    const urlWithoutQuery = fullUrl.split('?')[0];
    const originalFilename = path.basename(urlWithoutQuery);
    const ext = path.extname(urlWithoutQuery).toLowerCase();
    
    if (ext === '.mp3') {
      mimetype = 'audio/mpeg';
      filename = originalFilename.includes('.') ? originalFilename : `sync-${Date.now()}.mp3`;
    } else if (ext === '.wav') {
      mimetype = 'audio/wav';
      filename = originalFilename.includes('.') ? originalFilename : `sync-${Date.now()}.wav`;
    } else if (ext === '.webp') {
      mimetype = 'image/webp';
      filename = originalFilename.includes('.') ? originalFilename : `sync-${Date.now()}.webp`;
    } else if (ext === '.png') {
      mimetype = 'image/png';
      filename = originalFilename.includes('.') ? originalFilename : `sync-${Date.now()}.png`;
    } else if (ext === '.gif') {
      mimetype = 'image/gif';
      filename = originalFilename.includes('.') ? originalFilename : `sync-${Date.now()}.gif`;
    } else {
      mimetype = 'image/jpeg';
      filename = originalFilename.includes('.') ? originalFilename : `sync-${Date.now()}.jpg`;
    }

    try {
      console.log(`Đang tải tệp tin từ: ${fullUrl}`);
      const res = await fetch(fullUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' }
      });

      if (res.ok) {
        const arrayBuffer = await res.arrayBuffer();
        fileBuffer = Buffer.from(arrayBuffer);
        const contentType = res.headers.get('content-type');
        if (contentType) mimetype = contentType;
        console.log(`Tải thành công ${fullUrl} (${fileBuffer.length} bytes)`);
      } else {
        throw new Error(`HTTP status ${res.status}`);
      }
    } catch (downloadErr: any) {
      console.error(`Không thể tải tệp tin từ ${fullUrl}:`, downloadErr.message);
    }
  }

  // 3. Đưa lên Firebase Storage
  if (fileBuffer && filename) {
    try {
      const storageRef = ref(firebaseStorage, `uploads/${filename}`);
      await uploadBytes(storageRef, fileBuffer, { contentType: mimetype });
      const cloudUrl = await getDownloadURL(storageRef);
      console.log(`Đã đồng bộ lên Firebase Storage: ${cloudUrl}`);
      return cloudUrl;
    } catch (uploadErr) {
      console.error(`Lỗi upload đồng bộ lên Firebase Storage:`, uploadErr);
    }
  }

  return urlOrPath;
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
  limits: { fileSize: 100 * 1024 * 1024 } 
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

  app.post('/api/admin/sync-covers-to-cloud', async (req, res) => {
    if (!isRequestAdmin(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const data = await loadData();
      const logs: string[] = [];
      let updatedCount = 0;

      logs.push("Bắt đầu đồng bộ hóa toàn bộ ảnh bìa cũ lên Firebase Storage...");

      // 1. Sync homeCoverUrl
      if (data.homeCoverUrl && !data.homeCoverUrl.includes('firebasestorage.googleapis.com')) {
        logs.push(`Đang xử lý Ảnh trang chủ (Home Cover): ${data.homeCoverUrl}`);
        const newUrl = await uploadUrlOrFileToCloud(data.homeCoverUrl, data.globalBaseUrl);
        if (newUrl !== data.homeCoverUrl) {
          data.homeCoverUrl = newUrl;
          updatedCount++;
          logs.push(`-> Đồng bộ thành công Home Cover: ${newUrl}`);
        }
      }

      // 2. Sync ogImageUrl
      if (data.ogImageUrl && !data.ogImageUrl.includes('firebasestorage.googleapis.com')) {
        logs.push(`Đang xử lý Ảnh giới thiệu Facebook (OG Image): ${data.ogImageUrl}`);
        const newUrl = await uploadUrlOrFileToCloud(data.ogImageUrl, data.globalBaseUrl);
        if (newUrl !== data.ogImageUrl) {
          data.ogImageUrl = newUrl;
          updatedCount++;
          logs.push(`-> Đồng bộ thành công OG Image: ${newUrl}`);
        }
      }

      // 3. Sync Demos (Song Cover & Song Audio)
      if (data.demos && data.demos.length > 0) {
        for (let i = 0; i < data.demos.length; i++) {
          const demo = data.demos[i];
          
          // Đồng bộ ảnh bìa bài hát
          if (demo.coverUrl && !demo.coverUrl.includes('firebasestorage.googleapis.com')) {
            logs.push(`Đang xử lý Ảnh Bìa bài hát [${demo.title}]: ${demo.coverUrl}`);
            const newUrl = await uploadUrlOrFileToCloud(demo.coverUrl, data.globalBaseUrl);
            if (newUrl !== demo.coverUrl) {
              demo.coverUrl = newUrl;
              updatedCount++;
              logs.push(`-> Đồng bộ xong Ảnh Bìa bài [${demo.title}] thành: ${newUrl}`);
            }
          }

          // Đồng bộ file nhạc audio bài hát
          if (demo.audioUrl && !demo.audioUrl.includes('firebasestorage.googleapis.com')) {
            logs.push(`Đang xử lý file nhạc [${demo.title}]: ${demo.audioUrl}`);
            const newUrl = await uploadUrlOrFileToCloud(demo.audioUrl, data.globalBaseUrl);
            if (newUrl !== demo.audioUrl) {
              demo.audioUrl = newUrl;
              updatedCount++;
              logs.push(`-> Đồng bộ xong Nhạc (Audio) bài [${demo.title}] thành: ${newUrl}`);
            }
          }
        }
      }

      // 4. Sync Playlists
      if (data.playlists && data.playlists.length > 0) {
        for (let i = 0; i < data.playlists.length; i++) {
          const playlist = data.playlists[i];
          if (playlist.coverUrl && !playlist.coverUrl.includes('firebasestorage.googleapis.com')) {
            logs.push(`Đang xử lý Danh sách phát [${playlist.title}]: ${playlist.coverUrl}`);
            const newUrl = await uploadUrlOrFileToCloud(playlist.coverUrl, data.globalBaseUrl);
            if (newUrl !== playlist.coverUrl) {
              playlist.coverUrl = newUrl;
              updatedCount++;
              logs.push(`-> Đồng bộ xong Playlist [${playlist.title}] thành: ${newUrl}`);
            }
          }
        }
      }

      if (updatedCount > 0) {
        await saveData(data);
        logs.push(`Đã lưu dữ liệu mới cập nhật vào Firestore! Đã đồng bộ thành công ${updatedCount} tệp tin.`);
      } else {
        logs.push("Không phát hiện ảnh bìa cũ nào cần nạp. Toàn bộ ảnh bìa đều đã được lưu trữ trên Firebase Storage rồi!");
      }

      res.json({ success: true, updatedCount, logs });
    } catch (err: any) {
      console.error("Lỗi đồng bộ ảnh bìa:", err);
      res.status(500).json({ error: err.message || "Lỗi đồng bộ trong quá trình xử lý" });
    }
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

  const parseLyricsBeforeSave = (rawLyrics: string) => {
  if (!rawLyrics) return '';
  const lines = rawLyrics.split(/\r?\n/);
  const cleanedLines: string[] = [];
  let skipBlank = false;

  for (let i = 0; i < lines.length; i++) {
    let textLine = lines[i];
    let trimmed = textLine.trim();
    let lower = trimmed.toLowerCase();

    // Standardize headers
    if (/^\[?ver\s*(\d+)\]?[:]*\s*$/i.test(lower)) {
      textLine = trimmed.replace(/^\[?ver\s*(\d+)\]?[:]*\s*/i, "Verse $1:");
      trimmed = textLine.trim();
      lower = trimmed.toLowerCase();
    } else if (/^\[?rap\]?[:]*\s*$/i.test(lower)) {
      textLine = "Rap:";
      trimmed = textLine.trim();
      lower = trimmed.toLowerCase();
    } else if (/^\[?(pre-chorus|chorus|verse|bridge|drop|ending|coda)\]?[:]*\s*$/i.test(lower) || 
               /^\[?verse\s+(\d+)\]?[:]*\s*$/i.test(lower)) {
      if (!trimmed.startsWith('[')) {
         if (!trimmed.endsWith(':')) {
           textLine = trimmed + ':';
         }
      }
      trimmed = textLine.trim();
      lower = trimmed.toLowerCase();
    }

    const isHeader = lower.includes("pre-chorus") || 
                     lower.includes("chorus") || 
                     lower.includes("verse") || 
                     lower.includes("bridge") || 
                     lower.includes("drop") ||
                     lower.includes("ending") ||
                     lower.includes("coda") ||
                     lower.includes("rap");

    const isActuallyHeader = isHeader && (trimmed.endsWith(':') || (trimmed.startsWith('[') && trimmed.endsWith(']')));

    if (isActuallyHeader) {
      cleanedLines.push(textLine);
      skipBlank = true;
    } else {
      if (trimmed === "") {
        if (skipBlank) continue;
        cleanedLines.push(textLine);
      } else {
        cleanedLines.push(textLine);
        skipBlank = false;
      }
    }
  }
  return cleanedLines.join('\n');
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
      coverUrl = await uploadLocalToCloud(coverFile.path, coverFile.filename, coverFile.mimetype);
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

    let audioUrl = '';
    if (audioFile) {
      audioUrl = await uploadLocalToCloud(audioFile.path, audioFile.filename, audioFile.mimetype);
    } else {
      audioUrl = req.body.audioUrl || '';
    }

    const newDemo = {
      id: Date.now().toString(),
      slug: slug,
      title: req.body.title,
      author: req.body.author || '',
      audioUrl: audioUrl,
      coverUrl: coverUrl,
      secretKey: crypto.randomBytes(8).toString('hex'),
      backgroundUrl: processDriveLink(req.body.backgroundUrl || ''),
      lyrics: parseLyricsBeforeSave(req.body.lyrics || ''),
      template: req.body.template || '1',
      status: req.body.status || 'public',
      password: req.body.password || '',
      createdAt: Date.now(),
      composer: req.body.composer || 'A.C Xuân Tài',
      singer: req.body.singer || 'A.C Xuân Tài',
      isReleased: req.body.isReleased === 'true',
      isDraft: req.body.isDraft === 'true',
      releaseYear: req.body.releaseYear || '',
      playlistIds: req.body.playlistIds ? JSON.parse(req.body.playlistIds) : [],
      achievements: req.body.achievements ? JSON.parse(req.body.achievements) : []
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
        if (updatedData.lyrics) {
           updatedData.lyrics = parseLyricsBeforeSave(updatedData.lyrics);
        }
        if (audioFile) {
           updatedData.audioUrl = await uploadLocalToCloud(audioFile.path, audioFile.filename, audioFile.mimetype);
        }
        if (coverFile) {
           updatedData.coverUrl = await uploadLocalToCloud(coverFile.path, coverFile.filename, coverFile.mimetype);
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
        if (req.body.achievements !== undefined) {
            updatedData.achievements = JSON.parse(req.body.achievements);
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
           
           // Xóa file raw gốc chưa qua tối ưu hóa để giải phóng dung lượng rác
           await fs.unlink(req.file.path).catch(() => {});
           
           // Upload to Firebase Storage
           try {
              const fileBuffer = await fs.readFile(optimizedPath);
              const storageRef = ref(firebaseStorage, `uploads/${optimizedFilename}`);
              await uploadBytes(storageRef, fileBuffer, { contentType: 'image/webp' });
              const cloudUrl = await getDownloadURL(storageRef);
              
              // Nhờ sự điều chỉnh của bạn: CHÚNG TÔI KHÔNG XÓA file optimized cục bộ ở đây!
              // Tệp tin WebP đã tối ưu luôn được lưu trữ song song tại cả server và trong Cloud!
              res.json({ url: cloudUrl });
           } catch (firebaseErr) {
              console.error("Lỗi upload Cloud Storage cho ảnh optimized, chuyển sang lưu cục bộ:", firebaseErr);
              res.json({ url: `/uploads/${optimizedFilename}` });
           }
        } catch (error) {
           console.error("Lỗi nén ảnh:", error);
           try {
              const fileBuffer = await fs.readFile(req.file.path);
              const storageRef = ref(firebaseStorage, `uploads/${req.file.filename}`);
              await uploadBytes(storageRef, fileBuffer, { contentType: req.file.mimetype });
              const cloudUrl = await getDownloadURL(storageRef);
              // CHÚNG TÔI KHÔNG XÓA file gốc cục bộ để duy trì backup 2 nơi song song!
              res.json({ url: cloudUrl });
           } catch (firebaseErr) {
              console.error("Lỗi upload ảnh gốc lên Cloud Storage:", firebaseErr);
              res.json({ url: `/uploads/${req.file.filename}` });
           }
        }
      } else {
        // Tệp không phải là ảnh (Nhạc hoặc tài liệu khác)
        const isWav = req.file.originalname.toLowerCase().endsWith('.wav') || 
                      req.file.mimetype.includes('wav') || 
                      req.file.mimetype.includes('wave') ||
                      req.file.mimetype.includes('x-wav');

        if (isWav) {
          try {
            console.log(`Đang chạy cơ chế tự chuyển đổi: File WAV được phát hiện (${req.file.originalname}). Khởi động FFmpeg để convert thành MP3.`);
            const wavPath = req.file.path;
            const mp3Filename = `${req.file.filename.split('.')[0]}-${Date.now()}.mp3`;
            const mp3Path = path.join(process.cwd(), 'public', 'uploads', mp3Filename);

            // Chuyển đổi WAV sang MP3 bằng ffmpeg
            await new Promise<void>((resolve, reject) => {
              ffmpeg(wavPath)
                .toFormat('mp3')
                .audioBitrate(192) // 192kbps chất lượng rất tốt & dung lượng siêu nhẹ
                .on('end', () => {
                  console.log(`Đã chuyển đổi thành công WAV sang MP3 cục bộ: ${mp3Path}`);
                  resolve();
                })
                .on('error', (err) => {
                  console.error("Lỗi FFmpeg chuyển đổi:", err);
                  reject(err);
                })
                .save(mp3Path);
            });

            // Xóa file WAV gốc cục bộ để tránh rác server (vì WAV quá nặng, up thành MP3 rồi thì xóa WAV đi)
            try {
              await fs.unlink(wavPath);
            } catch (unlinkErr) {
              console.error("Không thể xóa file WAV tạm:", unlinkErr);
            }

            // Upload tệp tin MP3 đã được tạo lên Firebase Storage
            try {
              const fileBuffer = await fs.readFile(mp3Path);
              const storageRef = ref(firebaseStorage, `uploads/${mp3Filename}`);
              await uploadBytes(storageRef, fileBuffer, { contentType: 'audio/mpeg' });
              const cloudUrl = await getDownloadURL(storageRef);
              
              // Nhờ sự điều chỉnh của bạn: CHÚNG TÔI GIỮ LẠI file MP3 cục bộ để làm backup song song!
              res.json({ url: cloudUrl });
            } catch (firebaseErr) {
              console.error("Lỗi upload file MP3 đã chuyển đổi lên Cloud Storage, dùng url cục bộ:", firebaseErr);
              res.json({ url: `/uploads/${mp3Filename}` });
            }
          } catch (convertErr: any) {
            console.error("Lỗi chuyển đổi (.wav -> .mp3): Khôi phục cơ chế mặc định.", convertErr);
            // Fallback: nếu lỗi convert thì vẫn tải bản gốc lên
            try {
               const fileBuffer = await fs.readFile(req.file.path);
               const storageRef = ref(firebaseStorage, `uploads/${req.file.filename}`);
               await uploadBytes(storageRef, fileBuffer, { contentType: req.file.mimetype });
               const cloudUrl = await getDownloadURL(storageRef);
               // CHÚNG TÔI GIỮ LẠI file gốc cục bộ để làm backup song song!
               res.json({ url: cloudUrl });
            } catch (firebaseErr) {
               console.error("Lỗi upload file gốc lên Cloud Storage sau khi convert thất bại:", firebaseErr);
               res.json({ url: `/uploads/${req.file.filename}` });
            }
          }
        } else {
          // File khác (vẫn giữ nguyên logic: upload trực tiếp lên Storage, nếu thất bại trả về url cục bộ)
          try {
             const fileBuffer = await fs.readFile(req.file.path);
             const storageRef = ref(firebaseStorage, `uploads/${req.file.filename}`);
             await uploadBytes(storageRef, fileBuffer, { contentType: req.file.mimetype });
             const cloudUrl = await getDownloadURL(storageRef);
             // CHÚNG TÔI GIỮ LẠI file gốc cục bộ để làm backup song song!
             res.json({ url: cloudUrl });
          } catch (firebaseErr) {
             console.error("Lỗi upload file không phải ảnh lên Cloud Storage:", firebaseErr);
             res.json({ url: `/uploads/${req.file.filename}` });
          }
        }
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
      
      // Upload to Firebase Storage
      try {
         const storageRef = ref(firebaseStorage, `uploads/${filename}`);
         await uploadBytes(storageRef, buffer, { contentType: 'image/png' });
         const cloudUrl = await getDownloadURL(storageRef);
         
         // Xóa file cục bộ sau khi đã upload lên cloud thành công
         await fs.unlink(filepath);
         res.json({ url: cloudUrl });
      } catch (firebaseErr) {
         console.error("Lỗi upload base64 lên Cloud Storage:", firebaseErr);
         res.json({ url: `/uploads/${filename}` });
      }
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
      
      const initialOgImage = data.ogImageUrl || data.homeCoverUrl || (data.slideshowImages && data.slideshowImages.length > 0 ? data.slideshowImages[0] : "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&q=80");
      let ogImage = formatUrl(initialOgImage, data.globalBaseUrl) || '';
      
      const cleanPath = url.split('?')[0];
      const isHomepage = cleanPath === '/' || cleanPath === '/index.html' || cleanPath === '';
      let ogDesc = isHomepage 
        ? `Nơi cập nhật sản phẩm và demo của ${data.artistName || 'A.C Xuân Tài'}`
        : defaultDesc;

      // Extract active song slug / query robustly (case-insensitive)
      let querySongSlug = (req.query.song as string) || (req.query.demo as string) || '';
      let activeSong: any = null;
      
      if (querySongSlug) {
        const decodedSlug = decodeURIComponent(querySongSlug).trim().toLowerCase();
        activeSong = data.demos.find((d: any) => {
          const fid = String(d.id || '').toLowerCase();
          const fslug = String(d.slug || '').toLowerCase();
          return (fid === decodedSlug || fslug === decodedSlug) && !d.deleted;
        });
      }

      if (!activeSong) {
        const songPathMatch = cleanPath.match(/^\/(?:demo|song)\/([^\/?]+)/i);
        if (songPathMatch) {
          const slug = decodeURIComponent(songPathMatch[1]).trim().toLowerCase();
          activeSong = data.demos.find((d: any) => {
            const fid = String(d.id || '').toLowerCase();
            const fslug = String(d.slug || '').toLowerCase();
            return (fid === slug || fslug === slug) && !d.deleted;
          });
        }
      }

      if (activeSong) {
        const titleSuffix = activeSong.singer || activeSong.author || activeSong.composer || 'A.C Xuân Tài';
        ogTitle = activeSong.isReleased 
          ? `${activeSong.title} - ${titleSuffix}`
          : `${activeSong.title} - ${titleSuffix} ( demo )`;
        
        let coverToUse = activeSong.coverUrl || activeSong.ogImageUrl;
        if (!coverToUse && data.slideshowImages && data.slideshowImages.length > 0) {
            const idStr = String(activeSong.id || '');
            let hash = 0;
            for (let i = 0; i < idStr.length; i++) {
               hash += idStr.charCodeAt(i);
            }
            coverToUse = data.slideshowImages[hash % data.slideshowImages.length];
        }
        
        if (!coverToUse) {
            coverToUse = "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&q=80";
        }
        
        ogImage = formatUrl(coverToUse, data.globalBaseUrl) || '';
        ogDesc = defaultDesc;
      }

      const playlistMatch = cleanPath.match(/^\/playlist\/([^\/?]+)/i);
      if (playlistMatch && !activeSong) {
        const playlistId = decodeURIComponent(playlistMatch[1]).trim().toLowerCase();
        if (data.playlists) {
          const playlist = data.playlists.find((p: any) => String(p.id || '').toLowerCase() === playlistId && !p.deleted);
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
            
            if (!pCover) {
              pCover = "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&q=80";
            }
            ogImage = formatUrl(pCover, data.globalBaseUrl) || '';
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
      // Enforce ASCII punycode hostname in ogUrl for reliable DNS crawls
      if (ogUrl) {
         ogUrl = ogUrl.replace(/tài\.com/gi, 'xn--ti-jia.com');
         ogUrl = ogUrl.replace(/ta\u0300i\.com/gi, 'xn--ti-jia.com');
         ogUrl = ogUrl.replace(/t%C3%A0i\.com/gi, 'xn--ti-jia.com');
         ogUrl = ogUrl.replace(/t%c3%a0i\.com/gi, 'xn--ti-jia.com');
         ogUrl = ogUrl.replace(/t\u0300?a\u0300?i\.com/gi, 'xn--ti-jia.com');
      }

      // Escape tag attributes carefully to prevent broken HTML on double/single quotes or ampersands
      const escapeHtmlAttr = (str: string | undefined | null) => {
        if (!str) return '';
        return str
          .replace(/&/g, '&amp;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
      };

      const escapedTitle = escapeHtmlAttr(ogTitle);
      const escapedDesc = escapeHtmlAttr(ogDesc);
      const escapedImage = escapeHtmlAttr(ogImage);
      const escapedUrl = escapeHtmlAttr(ogUrl);

      // Inject tags
      html = html.replace(/<title>.*?<\/title>/i, `<title>${escapedTitle}</title>`);
      
      const metaTags = `
        <meta property="og:title" content="${escapedTitle}" />
        <meta property="og:description" content="${escapedDesc}" />
        <meta property="og:image" content="${escapedImage}" />
        <meta property="og:image:secure_url" content="${escapedImage}" />
        <meta property="og:url" content="${escapedUrl}" />
        <meta property="og:site_name" content="tài.com" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="${escapedTitle}" />
        <meta name="twitter:description" content="${escapedDesc}" />
        <meta name="twitter:image" content="${escapedImage}" />
      `;
      html = html.replace(/<\/head>/i, `${metaTags}</head>`);

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
