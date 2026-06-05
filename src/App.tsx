import React, { useState, useEffect, useRef, createContext, useContext, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Link, useParams, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Settings, Play, Music, Lock, ArrowLeft, Upload, Disc3, Plus, Trash2, Edit3, Globe, Camera, X, FileAudio, Share2 } from 'lucide-react';
import { toPng } from 'html-to-image';
import { AppData, DemoSong } from './types';
import { motion, AnimatePresence } from 'motion/react';

function formatText(text: string | null | undefined) {
  if (!text) return null;
  const lines = text.replace(/\s+\(/g, '\n(').split('\n');
  return (
    <>
      {lines.map((line, lineIdx) => {
        const parts = line.split(/(A\.C Xuân Tài|AC Xuân Tài)/gi);
        return (
          <React.Fragment key={lineIdx}>
            {lineIdx > 0 && <br />}
            {parts.map((part, i) => {
              const lower = part.toLowerCase();
              if (lower === 'a.c xuân tài' || lower === 'ac xuân tài') {
                return (
                  <a key={`${lineIdx}-${i}`} href="https://acxuantai.com" target="_blank" rel="noreferrer" className="transition-colors hover:opacity-80">
                    {part}
                  </a>
                );
              }
              return <span key={`${lineIdx}-${i}`}>{part}</span>;
            })}
          </React.Fragment>
        );
      })}
    </>
  );
}


// Global styles added in index.css

const translations: Record<string, Record<string, string>> = {
  vi: { dDesc: "Thiên đường demo của", btnSpot: "Nghe trên Spotify", lDemos: "Đề Mô", lReleased: "Ra Rồi", lDemoMark: "DEMO", lReleasedMark: "RELEASED", pReq: "Cần Mật Khẩu", pNow: "Nghe Ngay", nDemo: "Chưa có demo nào.", rMv: "MV Đã Phát Hành", nMv: "Chưa có MV nào.", lMore: "Hiển thị thêm", mList: "người nghe hàng tháng", load: "Đang tải...", back: "Trở về", adm: "AdminCP", edit: "Chỉnh sửa", pPrompt: "Cần mật khẩu", pPrompt2: "Nhập mật khẩu để nghe demo này", unlock: "Mở khóa", wPass: "Sai mật khẩu", lyric: "Lời bài hát", nLyric: "Chưa cập nhật lời bài hát", sAuth: "Sáng tác:", lang: "Tiếng Việt", lDemosMobile: "Đề mô", lReleasedMobile: "Ra Rồi" },
  en: { dDesc: "Demo paradise of", btnSpot: "Listen on Spotify", lDemos: "Unreleased Demos", lReleased: "Released Music", lDemoMark: "DEMO", lReleasedMark: "RELEASED", pReq: "Password", pNow: "Play Now", nDemo: "No demos yet.", rMv: "Released Music Videos", nMv: "No MVs yet.", lMore: "Load more", mList: "monthly listeners", load: "Loading...", back: "Back", adm: "Admin", edit: "Edit", pPrompt: "Password required", pPrompt2: "Enter password to listen to this demo", unlock: "Unlock", wPass: "Wrong password", lyric: "Lyrics", nLyric: "No lyrics yet", sAuth: "Composer:", lang: "English" },
  ko: { dDesc: "데모 파라다이스", btnSpot: "Spotify에서 듣기", lDemos: "최신 데모", lReleased: "발매된 음악", lDemoMark: "데모", lReleasedMark: "발매됨", pReq: "비밀번호", pNow: "지금 듣기", nDemo: "데모 없음", rMv: "발매된 뮤직비디오", nMv: "MV 없음", lMore: "더 보기", mList: "월간 청취자", load: "로딩 중...", back: "뒤로", adm: "관리자", edit: "편집", pPrompt: "비밀번호 필요", pPrompt2: "이 데모를 들으려면 비밀번호를 입력하세요", unlock: "잠금 해제", wPass: "잘못된 비밀번호", lyric: "가사", nLyric: "가사 없음", sAuth: "작곡가:", lang: "한국어" },
  ja: { dDesc: "デモパラダイス", btnSpot: "Spotifyで聴く", lDemos: "最新のデモ", lReleased: "リリースされた音楽", lDemoMark: "デモ", lReleasedMark: "リリース済", pReq: "パスワード", pNow: "今すぐ聴く", nDemo: "デモなし", rMv: "リリースされたMV", nMv: "MVなし", lMore: "もっと見る", mList: "月間リスナー", load: "読み込み中...", back: "戻る", adm: "管理者", edit: "編集", pPrompt: "パスワードが必要", pPrompt2: "このデモを聴くにはパスワードを入力してください", unlock: "ロック解除", wPass: "パスワードが間違っています", lyric: "歌詞", nLyric: "歌詞なし", sAuth: "作曲:", lang: "日本語" },
  th: { dDesc: "สวรรค์แห่งเพลงเดโม่ของ", btnSpot: "ฟังบน Spotify", lDemos: "ตัวอย่างล่าสุด", lReleased: "เพลงที่ปล่อยแล้ว", lDemoMark: "เดโม่", lReleasedMark: "ปล่อยแล้ว", pReq: "รหัสผ่าน", pNow: "ฟังเลย", nDemo: "ไม่มีตัวอย่าง", rMv: "มิวสิควิดีโอ", nMv: "ไม่มี MV", lMore: "โหลดเพิ่ม", mList: "ผู้ฟังรายเดือน", load: "กำลังโหลด...", back: "กลับ", adm: "แอดมิน", edit: "แก้ไข", pPrompt: "ต้องใช้รหัสผ่าน", pPrompt2: "ใส่รหัสผ่านเพื่อฟังเดโม่นี้", unlock: "ปลดล็อค", wPass: "รหัสผ่านผิด", lyric: "เนื้อเพลง", nLyric: "ไม่มีเนื้อเพลง", sAuth: "แต่งโดย:", lang: "ไทย" },
  zh: { dDesc: "的演示天堂", btnSpot: "在Spotify收听", lDemos: "最新演示", lReleased: "已发行的音乐", lDemoMark: "演示", lReleasedMark: "已发行", pReq: "需要密码", pNow: "立即收听", nDemo: "暂无演示", rMv: "已发行的视频", nMv: "暂无视频", lMore: "加载更多", mList: "月度听众", load: "载入中...", back: "返回", adm: "管理", edit: "编辑", pPrompt: "需要密码", pPrompt2: "输入密码收听此演示", unlock: "解锁", wPass: "密码错误", lyric: "歌词", nLyric: "暂无歌词", sAuth: "作曲:", lang: "中文" }
};

interface LangContextType {
  lang: string;
  setLang: (l: string) => void;
}
const LanguageContext = createContext<LangContextType>({ lang: 'vi', setLang: () => {} });

// Thumbnail fallback handled server-side now

// ---- ADMIN LOGIN & REQUIRE ADMIN ----
function AdminLogin() {
  const [pwd, setPwd] = useState('');
  const [err, setErr] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pwd === 'MatKhauDay123') {
      localStorage.setItem('adminToken', pwd);
      window.location.reload();
    } else {
      setErr('Sai mật khẩu!');
    }
  };

  return (
    <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4 text-stone-900 font-sans">
      <div className="bg-white p-8 rounded-3xl shadow-xl max-w-sm w-full border border-stone-200">
        <h2 className="text-2xl font-black mb-2 text-center text-stone-800">Admin Login</h2>
        <p className="text-stone-500 mb-6 text-center text-sm">Vui lòng nhập mật khẩu quản trị viên</p>
        <form onSubmit={handleLogin} className="space-y-4">
          <input 
            type="password" 
            autoFocus
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
            className="w-full border border-stone-300 px-4 py-3 rounded-xl focus:border-stone-900 focus:outline-none"
            placeholder="***"
          />
          {err && <p className="text-red-500 text-sm font-bold text-center">{err}</p>}
          <button type="submit" className="w-full bg-stone-900 text-white font-bold py-3 rounded-xl hover:bg-stone-800 transition-colors">
            Đăng nhập
          </button>
        </form>
      </div>
    </div>
  );
}

function RequireAdmin({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('adminToken');
  if (token !== 'MatKhauDay123') {
    return <AdminLogin />;
  }
  return <>{children}</>;
}

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      {/* @ts-ignore */}
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Home />} />
        <Route path="/demo/:id" element={<DemoPlayer />} />
        <Route path="/admin" element={<RequireAdmin><AdminDashboard /></RequireAdmin>} />
        <Route path="/admin/new" element={<RequireAdmin><AdminCreateDemo /></RequireAdmin>} />
        <Route path="/admin/edit/:id" element={<RequireAdmin><AdminEditDemo /></RequireAdmin>} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  const [lang, setLang] = useState('vi');

  useEffect(() => {
    fetch('https://get.geojs.io/v1/ip/country.json').then(r=>r.json()).then(res => {
      const code = res.country;
      if (code === 'KR') setLang('ko');
      else if (code === 'JP') setLang('ja');
      else if (code === 'TH') setLang('th');
      else if (code === 'CN' || code === 'TW') setLang('zh');
      else if (code === 'US' || code === 'GB' || code === 'AU' || code === 'CA') setLang('en');
      else setLang('vi');
    }).catch(()=>setLang('vi'));
  }, []);

  return (
    <LanguageContext.Provider value={{ lang, setLang }}>
      <BrowserRouter>
        <AnimatedRoutes />
      </BrowserRouter>
    </LanguageContext.Provider>
  );
}

// ---- HOME PAGE ----

const SpotifyIcon = ({className}: {className?: string}) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.84.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.84.241 1.2zM20.16 9.6C15.84 7.08 9.12 6.9 5.28 8.04c-.6.18-1.2-.18-1.38-.72-.18-.6.18-1.2.72-1.38 4.38-1.26 11.76-1.08 16.68 1.86.54.3.72 1.02.42 1.56-.3.54-1.02.72-1.56.42z"/>
  </svg>
);

const LanguageSwitcher = () => {
  const { lang, setLang } = useContext(LanguageContext);
  const [open, setOpen] = useState(false);
  const langs = ['vi', 'en', 'ko', 'ja', 'th', 'zh'];

  return (
    <div className="fixed top-6 right-6 z-50">
      <div 
        className="flex items-center gap-2 bg-black/30 hover:bg-black/50 border border-white/20 rounded-full px-4 py-2 backdrop-blur-xl cursor-pointer transition-all shadow-lg hover:pr-5 group"
        onClick={() => setOpen(!open)}
      >
        <Globe className="w-4 h-4 text-white/90 group-hover:text-white transition-colors" />
        <span className="text-white font-bold uppercase text-xs tracking-wider">{lang}</span>
      </div>
      
      <AnimatePresence>
        {open && (
          <motion.div 
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute right-0 top-full mt-3 flex flex-col bg-neutral-950/90 backdrop-blur-3xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl origin-top-right"
          >
            {langs.map(l => (
              <button 
                key={l}
                onClick={() => { setLang(l); setOpen(false); }}
                className={`px-6 py-3.5 text-sm font-medium transition-colors text-left flex items-center justify-between min-w-[140px] border-b border-white/5 last:border-0 ${lang === l ? 'bg-white/10 text-white' : 'text-neutral-400 hover:bg-white/5 hover:text-white'}`}
              >
                <span>{translations[l].lang}</span>
                {lang === l && <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(243,24,103,1)]"></div>}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function Home() {
  const { lang } = useContext(LanguageContext);
  const t = translations[lang] || translations['vi'];
  const [data, setData] = useState<AppData | null>(null);
  const [ytVideos, setYtVideos] = useState<any[]>([]);
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);
  const [spotifyInfo, setSpotifyInfo] = useState<any>(null);
  const [visibleMVs, setVisibleMVs] = useState(4);
  const [activeListTab, setActiveListTab] = useState<'demos'|'released'>('released');
  const [showArtist, setShowArtist] = useState(false);
  const [spotifyLoaded, setSpotifyLoaded] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [toast, setToast] = useState('');
  const observer = useRef<IntersectionObserver>();

  useEffect(() => {
    const tabInterval = setInterval(() => {
      setActiveListTab(prev => prev === 'demos' ? 'released' : 'demos');
    }, 20000);
    return () => clearInterval(tabInterval);
  }, []);

  // For slideshow
  useEffect(() => {
    if (!data?.slideshowImages?.length) return;
    const int = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % data.slideshowImages!.length);
    }, 4000); // 4 seconds
    return () => clearInterval(int);
  }, [data?.slideshowImages]);

  const lastMvElementRef = useCallback((node: HTMLButtonElement) => {
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && visibleMVs < ytVideos.length) {
        setVisibleMVs(prev => prev + 4);
      }
    });
    if (node) observer.current.observe(node);
  }, [visibleMVs, ytVideos.length]);

  useEffect(() => {
    fetch('/api/data').then(res => res.json()).then(data => {
      setData(data);
      if (data) {
        document.title = data.pageTitle || `${t.dDesc} ${data.artistName || 'A.C Xuân Tài'}`;
        if (data.faviconUrl) {
          let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
          if (!link) {
            link = document.createElement('link');
            link.rel = 'icon';
            document.head.appendChild(link);
          }
          link.href = data.faviconUrl;
        }
        if (data.ogImageUrl) {
          let meta = document.querySelector("meta[property='og:image']");
          if (!meta) {
            meta = document.createElement('meta');
            meta.setAttribute('property', 'og:image');
            document.head.appendChild(meta);
          }
          meta.setAttribute('content', data.ogImageUrl);
        }
      }
      
      if (data?.youtubePlaylistUrl) {
          const plMatch = data.youtubePlaylistUrl.match(/[?&]list=([a-zA-Z0-9_-]+)/);
          const chMatch = data.youtubePlaylistUrl.match(/channel\/([a-zA-Z0-9_-]+)/);
          let fetchUrl = '';
          if (plMatch) fetchUrl = `/api/youtube-playlist?plId=${plMatch[1]}`;
          else if (chMatch) fetchUrl = `/api/youtube-playlist?chId=${chMatch[1]}`;
          
          if (fetchUrl) {
              fetch(fetchUrl).then(r => r.json()).then(res => {
                  if (Array.isArray(res)) setYtVideos(res);
              }).catch(() => {});
          }
      }
      
      if (data?.spotifyUrl) {
          fetch(`/api/spotify-profile?url=${encodeURIComponent(data.spotifyUrl)}`)
            .then(r => r.json())
            .then(res => {
                if (res) setSpotifyInfo(res);
            }).catch(()=>{});
      }
    });
  }, [t.lDemos]);

  if (!data) return <div className="min-h-screen bg-black text-white flex items-center justify-center">{t.load}</div>;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className="min-h-screen bg-neutral-950 text-white font-sans selection:bg-rose-500 selection:text-white relative z-0 bg-notebook-dark"
    >
      {data.slideshowImages && data.slideshowImages.length > 0 ? (
        <div className="fixed inset-0 z-[-1] pointer-events-none bg-neutral-950">
          <AnimatePresence mode="popLayout">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 0.8, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
              className="absolute inset-0 bg-cover bg-center"
              style={{ 
                 backgroundImage: `url(${data.slideshowImages[currentSlide]})`, 
                 backgroundPosition: 'center 20%', 
                 maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 90%)', 
                 WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 90%)' 
              }}
            />
          </AnimatePresence>
        </div>
      ) : data.homeCoverUrl ? (
        <div className="fixed inset-0 z-[-1] pointer-events-none relative_mask bg-neutral-950">
          <div className="absolute inset-0 bg-cover bg-center opacity-80" style={{ backgroundImage: `url(${data.homeCoverUrl})`, backgroundPosition: 'center 20%', maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 90%)', WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 90%)' }}></div>
        </div>
      ) : (
        <div className="fixed inset-0 z-[-1] pointer-events-none opacity-20 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-rose-900 via-neutral-950 to-neutral-950"></div>
      )}
      <LanguageSwitcher />
      {playingVideo && (() => {
        const activeSong = ytVideos.find(song => song.videoId === playingVideo);
        const activeTitle = activeSong ? activeSong.title : "MV / Video";
        const ytLink = `https://www.youtube.com/watch?v=${playingVideo}`;
        return (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 cursor-pointer" onClick={() => setPlayingVideo(null)}>
            {/* Slideshow background behind main overlay player */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
              {data && data.slideshowImages && data.slideshowImages.length > 0 ? (
                <div 
                  className="absolute inset-0 bg-cover bg-center transition-all duration-1000"
                  style={{ 
                    backgroundImage: `url(${data.slideshowImages[currentSlide]})`,
                    backgroundPosition: 'center 20%'
                  }}
                />
              ) : data && data.homeCoverUrl ? (
                <div 
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ 
                    backgroundImage: `url(${data.homeCoverUrl})`,
                    backgroundPosition: 'center 20%'
                  }}
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-t from-rose-950/50 to-neutral-950/80" />
              )}
              {/* Soft dimming and minimal blurring of the background slideshow */}
              <div className="absolute inset-0 bg-black/75 backdrop-blur-md" />
            </div>

            <div className="relative w-full max-w-4xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/20 flex flex-col z-10 cursor-default" onClick={e => e.stopPropagation()}>
              <div className="p-3 bg-neutral-900 border-b border-white/10 flex items-center justify-between gap-3 text-xs sm:text-sm text-neutral-350 relative z-10">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse shrink-0"></span>
                  <span className="font-bold text-white text-[11px] sm:text-sm tracking-tight break-words line-clamp-2 sm:line-clamp-none leading-normal">
                    {activeTitle}
                  </span>
                </div>
                <div className="flex items-center gap-3 justify-end shrink-0">
                  <button 
                    className="text-neutral-400 hover:text-white px-2.5 py-0.5 font-bold transition-colors text-base sm:text-lg shrink-0"
                    onClick={() => setPlayingVideo(null)}
                    title={lang === 'vi' ? 'Đóng' : 'Close'}
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Clicking this thumbnail direct into the Youtube link in a new tab */}
              <a 
                href={ytLink} 
                target="_blank" 
                rel="noreferrer" 
                className="flex-1 w-full h-full relative bg-neutral-950 group overflow-hidden block"
                title="Bấm để phát trên YouTube ở tab mới"
              >
                {/* Image with fallback urls in standard CSS support structure */}
                <img 
                  src={`https://img.youtube.com/vi/${playingVideo}/maxresdefault.jpg`} 
                  onError={(e) => {
                    // Fallback to hqdefault in case maxresdefault doesn't exist (can happen for older uploads)
                    e.currentTarget.src = `https://img.youtube.com/vi/${playingVideo}/hqdefault.jpg`;
                  }}
                  alt={activeTitle} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                
                {/* Vignette Overlay shadow */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/30 group-hover:via-black/20 transition-all duration-300" />
                
                {/* Glow ring Play button in middle */}
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center select-none z-10 gap-3 sm:gap-4">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-red-650 rounded-full flex items-center justify-center text-white shadow-[0_0_30px_rgba(239,68,68,0.6)] transition-all duration-350 sm:group-hover:scale-110 sm:group-active:scale-95 border border-white/20 relative">
                    <span className="absolute inset-0 rounded-full border-2 border-white/30 animate-ping opacity-35"></span>
                    <Play className="w-8 h-8 sm:w-9 sm:h-9 text-white fill-white translate-x-0.5" />
                  </div>
                  
                  <div className="flex flex-col gap-1 sm:gap-2">
                    <h4 className="text-sm sm:text-lg font-black text-white tracking-widest uppercase drop-shadow-md sm:group-hover:text-red-400 transition-colors">
                      {lang === 'vi' ? 'Bấm để phát trên YouTube' : 'Click to Play on YouTube'}
                    </h4>
                  </div>
                </div>
              </a>
            </div>
          </div>
        );
      })()}

      {/* Hero Section */}
      <section className="relative pt-32 md:pt-48 pb-20 px-6 sm:px-12 flex flex-col items-center justify-center text-center min-h-[500px]">

        
        <div className="relative z-10 w-full max-w-5xl flex flex-col items-center mt-12">
          <div className="w-full text-center">
            {data.homeCoverUrl ? (
              <div>
                <motion.p 
                  initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  onAnimationComplete={() => setShowArtist(true)}
                  className="text-xl sm:text-2xl text-stone-200 font-medium max-w-3xl mx-auto drop-shadow-lg mb-2"
                >
                  {(data.artistBio === "Thiên đường demo của" || !data.artistBio) ? t.dDesc : data.artistBio}
                </motion.p>
                <AnimatePresence>
                  {showArtist && (
                    <motion.h1 
                      initial={{ scale: 0.9, opacity: 0, filter: 'blur(10px)' }}
                      animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      className="text-4xl sm:text-6xl md:text-[6rem] lg:text-[7rem] font-black mb-4 tracking-tighter text-white drop-shadow-2xl whitespace-nowrap"
                    >
                      {formatText(data.artistName)}
                    </motion.h1>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div 
                className="w-full max-w-3xl border border-white/10 bg-white/5 backdrop-blur-md p-10 rounded-3xl shadow-2xl mx-auto mb-8"
              >
                <motion.p 
                  initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  onAnimationComplete={() => setShowArtist(true)}
                  className="text-lg text-neutral-400 font-medium mb-4"
                >
                  {(data.artistBio === "Thiên đường demo của" || !data.artistBio) ? t.dDesc : data.artistBio}
                </motion.p>
                <AnimatePresence>
                  {showArtist && (
                    <motion.h1 
                      initial={{ scale: 0.9, opacity: 0, filter: 'blur(10px)' }}
                      animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      className="text-3xl sm:text-5xl md:text-6xl font-black mb-0 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-rose-300 whitespace-nowrap"
                    >
                      {formatText(data.artistName)}
                    </motion.h1>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>

          {data.spotifyUrl && (
            <div className="w-full relative z-10 max-w-4xl mx-auto mt-12">
              {(() => {
                const spMatch = data.spotifyUrl.match(/spotify\.com\/(artist|playlist|album|track)\/([a-zA-Z0-9]+)/);
                if (spMatch) {
                  return (
                    <motion.div 
                      key="spotify-embed"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: spotifyLoaded ? 1 : 0, y: spotifyLoaded ? 0 : 20 }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      className="w-full bg-black/20 p-2 sm:p-4 md:p-6 rounded-3xl border border-white/10 backdrop-blur-md shadow-2xl flex flex-col gap-4"
                    >
                      {spotifyInfo && (
                        <div className="flex items-center gap-4 px-2">
                           <img src={spotifyInfo.image} crossOrigin="anonymous" className="w-16 h-16 rounded-full shadow-lg border border-white/20 object-cover" alt="Spotify" />
                           <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-white text-lg">{data.artistName}</span>
                                <div className="w-4 h-4 bg-[#1DB954] rounded-full flex items-center justify-center">
                                  <svg className="w-2.5 h-2.5 text-black" fill="currentColor" viewBox="0 0 20 20"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/></svg>
                                </div>
                              </div>
                              <span className="text-sm font-medium text-stone-300">
                                {spotifyInfo.description.replace('người nghe hàng tháng', 'monthly listeners')}
                              </span>
                           </div>
                           <a href={data.spotifyUrl} target="_blank" rel="noreferrer" className="hidden sm:flex ml-auto items-center gap-2 bg-[#1DB954] text-white px-4 py-2 rounded-full hover:scale-105 transition-transform font-bold text-sm">
                             <SpotifyIcon className="w-4 h-4" /> Open Spotify
                           </a>
                        </div>
                      )}
                      
                      <div className="w-full overflow-hidden rounded-2xl relative min-h-[450px]">
                        {!spotifyLoaded && (
                           <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                             <div className="w-8 h-8 border-4 border-[#1DB954]/30 border-t-[#1DB954] rounded-full animate-spin"></div>
                           </div>
                        )}
                        <iframe 
                          src={`https://open.spotify.com/embed/${spMatch[1]}/${spMatch[2]}?utm_source=generator&theme=0`} 
                          width="100%" 
                          height="450" 
                          frameBorder="0" 
                          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
                          loading="lazy" 
                          onLoad={() => setSpotifyLoaded(true)}
                          className={`w-full bg-neutral-900 transition-opacity duration-1000 ${spotifyLoaded ? 'opacity-100' : 'opacity-0'}`}
                        ></iframe>
                      </div>
                    </motion.div>
                  );
                }
                return (
                 <div className="flex justify-center mt-6">
                   <a href={data.spotifyUrl} target="_blank" rel="noreferrer" className="inline-flex transition-transform hover:scale-105">
                     <span className="flex items-center gap-2 bg-[#1DB954] text-white px-6 py-3 rounded-full font-bold shadow-lg shadow-[#1DB954]/20 text-lg">
                       <SpotifyIcon className="w-5 h-5" /> {t.btnSpot}
                     </span>
                   </a>
                 </div>
                );
              })()}
            </div>
          )}
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 sm:px-12 pb-32 space-y-24">
        
        {/* Demos Section */}
        <section>
          <div className="flex flex-wrap items-center gap-2 mb-8 bg-neutral-900/50 p-1.5 rounded-2xl border border-white/5 w-fit">
             <button onClick={() => setActiveListTab('released')} className={`flex items-center gap-2 px-4 md:px-6 py-2 md:py-3 rounded-xl text-base md:text-xl font-bold tracking-tight transition-all duration-300 ${activeListTab === 'released' ? 'bg-emerald-500/20 text-emerald-400 shadow-[0_0_20px_-5px_rgba(16,185,129,0.3)] border border-emerald-500/20' : 'text-neutral-500 hover:text-white hover:bg-white/5 border border-transparent'}`}>
                <Music className={`w-4 h-4 md:w-5 md:h-5 ${activeListTab === 'released' ? 'text-emerald-400' : 'text-neutral-500'}`} />
                <span>{t.lReleased}</span>
             </button>
             <button onClick={() => setActiveListTab('demos')} className={`flex items-center gap-2 px-4 md:px-6 py-2 md:py-3 rounded-xl text-base md:text-xl font-bold tracking-tight transition-all duration-300 ${activeListTab === 'demos' ? 'bg-rose-500/20 text-rose-400 shadow-[0_0_20px_-5px_rgba(244,63,94,0.3)] border border-rose-500/20' : 'text-neutral-500 hover:text-white hover:bg-white/5 border border-transparent'}`}>
                <Disc3 className={`w-4 h-4 md:w-5 md:h-5 ${activeListTab === 'demos' ? 'text-rose-400' : 'text-neutral-500'}`} />
                <span>{t.lDemos}</span>
             </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.demos.filter(d => d.status === 'public').filter(d => activeListTab === 'demos' ? !d.isReleased : d.isReleased).map(demo => (
              <Link to={`/demo/${demo.slug || demo.id}`} key={demo.id} className="group relative bg-neutral-900/50 border border-white/5 hover:border-rose-500/50 rounded-2xl p-3 sm:p-4 transition-all duration-300 hover:shadow-[0_0_30px_-5px_rgba(244,63,94,0.3)] overflow-hidden flex items-center gap-3 sm:gap-4">
                <div className="absolute inset-0 bg-gradient-to-br from-rose-500/0 to-rose-500/0 group-hover:from-rose-500/10 transition-all duration-500"></div>
                <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-xl overflow-hidden relative z-10 border border-white/10 group-hover:border-rose-500/30 transition-colors">
                  {demo.coverUrl ? (
                     <img src={demo.coverUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={demo.title} />
                  ) : (
                     <div className="w-full h-full bg-neutral-800 flex items-center justify-center text-neutral-600 group-hover:text-rose-500 transition-colors">
                       <Disc3 className="w-6 h-6 sm:w-8 sm:h-8" />
                     </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full bg-rose-500 flex items-center justify-center scale-75 group-hover:scale-100 transition-transform shadow-lg">
                      <Play className="w-3 h-3 text-white ml-0.5" fill="currentColor" />
                    </div>
                  </div>
                </div>
                <div className="flex-1 min-w-0 relative z-10 pr-12">
                  <h3 className="text-base sm:text-lg font-bold group-hover:text-rose-400 transition-colors">
                    <div className="w-full break-words">
                      {formatText(demo.title)}
                    </div>
                  </h3>
                </div>
                {demo.isReleased ? (
                  <>
                    <span className="absolute top-2 right-2 rotate-[15deg] bg-emerald-600 text-[8px] font-black text-white px-1.5 py-0.5 rounded shadow-[0_0_10px_rgba(5,150,105,0.8)] tracking-widest border border-emerald-400/50 select-none flex-shrink-0 z-20 animate-released-wiggle">
                      {t.lReleasedMark || 'RELEASED'}
                    </span>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        let url = `${window.location.origin}/demo/${demo.slug || demo.id}`;
                        if (url.includes('xn--ti-jia.com')) {
                          url = url.replace(/xn--ti-jia\.com/gi, 'tài.com');
                        }
                        navigator.clipboard.writeText(url);
                        setToast('Đã copy link bài hát!');
                        setTimeout(() => setToast(''), 3000);
                      }}
                      className="absolute bottom-3 right-3 z-20 bg-black/40 hover:bg-black/70 text-white/80 hover:text-white p-2 rounded-full border border-white/10 shadow-sm opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-95 group-hover:scale-100 active:scale-90"
                      title="Chia sẻ bài hát"
                    >
                      <Share2 className="w-3.5 h-3.5 stroke-[1.5]" />
                    </button>
                  </>
                ) : (
                  <span className="absolute top-2 right-2 rotate-[15deg] bg-rose-600 text-[8px] font-black text-white px-1.5 py-0.5 rounded shadow-[0_0_10px_rgba(225,29,72,0.8)] animate-[pulse_2s_ease-in-out_infinite] tracking-widest border border-white/20 select-none flex-shrink-0 z-20">
                    {t.lDemoMark || 'DEMO'}
                  </span>
                )}
                {demo.password && !demo.isReleased && (
                  <div className="absolute bottom-3 right-3 z-20 bg-black/60 p-1.5 rounded-full border border-white/10 shadow-md">
                     <Lock className="w-3.5 h-3.5 text-yellow-500" />
                  </div>
                )}
              </Link>
            ))}
            {data.demos.filter(d => d.status === 'public').filter(d => activeListTab === 'demos' ? !d.isReleased : d.isReleased).length === 0 && (
              <div className="col-span-full py-12 text-center text-neutral-600 border border-dashed border-white/10 rounded-2xl">
                {activeListTab === 'demos' ? t.nDemo : 'Chưa có bài hát phát hành nào.'}
              </div>
            )}
          </div>
        </section>

        {/* Released Songs Section */}
        {ytVideos.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-8 px-4 border-b border-white/10 pb-4">
              <Music className="w-6 h-6 text-emerald-500" />
              <h2 className="text-2xl font-bold tracking-tight">{t.rMv}</h2>
            </div>
            <div className="space-y-4">
              {ytVideos.slice(0, visibleMVs).map((song, i) => (
                <button 
                  ref={i === visibleMVs - 1 ? lastMvElementRef : null}
                  onClick={() => setPlayingVideo(song.videoId)} key={song.videoId} 
                  className="w-full text-left flex items-center gap-4 bg-neutral-900 border border-white/5 hover:bg-neutral-800 rounded-xl p-3 transition-colors group">
                  <div className="w-24 h-16 bg-neutral-800 rounded-lg overflow-hidden flex-shrink-0 relative">
                    <img src={`https://img.youtube.com/vi/${song.videoId}/mqdefault.jpg`} alt={song.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-transparent transition-colors flex items-center justify-center">
                       <Play className="w-6 h-6 text-white drop-shadow-md opacity-70 group-hover:opacity-100" />
                    </div>
                  </div>
                  <h3 className="text-lg font-medium group-hover:text-emerald-400 transition-colors pr-2 break-words">{song.title}</h3>
                </button>
              ))}
            </div>
          </section>
        )}

      </main>

      <footer className="py-8 text-center text-sm border-t border-white/10 relative z-10">
        <a href="https://xtpro.vn" target="_blank" rel="noopener noreferrer" className="font-bold tracking-wider text-rose-500/80 hover:text-rose-400 drop-shadow-[0_0_10px_rgba(244,63,94,0.5)] transition-all">
          from XT Production
        </a>
      </footer>

      {toast && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-neutral-900/90 backdrop-blur-md text-white border border-white/20 px-5 py-3 rounded-2xl shadow-2xl z-[100] flex items-center gap-2 font-mono text-xs animate-bounce">
           <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
           {toast}
        </div>
      )}
    </motion.div>
  );
}

function CustomAudioPlayer({ src, template }: { src: string, template: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);

  useEffect(() => {
    if (audioRef.current) {
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          setIsPlaying(true);
        }).catch(error => {
          console.warn("Autoplay was prevented by browser", error);
          setIsPlaying(false);
        });
      }
    }
  }, [src]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) audioRef.current.pause();
      else audioRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = Number(e.target.value);
    if (audioRef.current) {
      audioRef.current.volume = vol;
      setVolume(vol);
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const waves = Array.from({ length: 32 });

  const isLight = ['1', '4', '6', '7'].includes(template);
  let waveColor = "bg-white";
  if (template === '1') waveColor = "bg-orange-500";
  if (template === '2') waveColor = "bg-fuchsia-300";
  if (template === '3') waveColor = "bg-slate-300";
  if (template === '4') waveColor = "bg-teal-600";
  if (template === '5') waveColor = "bg-red-100";
  if (template === '6') waveColor = "bg-pink-600";
  if (template === '7') waveColor = "bg-stone-800";
  if (template === '8') waveColor = "bg-yellow-400";
  if (template === '9') waveColor = "bg-white";
  if (template === '10') waveColor = "bg-yellow-400";
  if (template === '11') waveColor = "bg-[#d4af37]";
  if (template === '12') waveColor = "bg-[#d97706]";
  if (template === '13') waveColor = "bg-[#f43f5e]";
  if (template === '14') waveColor = "bg-[#38bdf8]";

  return (
    <div className={`flex flex-col w-full gap-2 md:gap-4 ${isLight ? 'text-stone-900 font-extrabold drop-shadow-sm' : 'text-white font-extrabold drop-shadow-md'}`}>
      <audio 
        ref={audioRef} 
        src={src} 
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
      />
      
      {/* Wave visualizer */}
      <div 
        className="flex items-end justify-between h-4 md:h-5 w-full mb-0"
      >
        {waves.map((_, i) => {
          const randDur = 0.5 + Math.random() * 0.8;
          return (
             <div 
              key={i} 
              className={`w-1 rounded-full ${waveColor} transition-all duration-300 origin-bottom opacity-90 drop-shadow-sm`}
              style={{
                height: isPlaying ? '100%' : '15%',
                animation: isPlaying ? `pulse-wave ${randDur}s ease-in-out infinite alternate` : 'none',
              }}
            ></div>
          );
        })}
      </div>

      <div className="flex items-center justify-between text-[11px] md:text-xs font-mono opacity-100">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>

      <input 
        type="range" 
        min={0} 
        max={duration || 0} 
        value={currentTime} 
        onChange={handleProgressChange}
        className={`w-full h-1 md:h-1.5 ${isLight ? 'bg-black/20' : 'bg-white/30'} rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 ${isLight ? '[&::-webkit-slider-thumb]:bg-stone-800' : '[&::-webkit-slider-thumb]:bg-white'} [&::-webkit-slider-thumb]:rounded-full hover:[&::-webkit-slider-thumb]:scale-125 transition-transform outline-none`}
      />

      <div className="flex items-center justify-between mt-1 md:mt-2">
         {/* Volume */}
         <div className="flex items-center gap-2 group w-20 md:w-24">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-90 hover:opacity-100 cursor-pointer drop-shadow-sm"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
            <input 
              type="range" 
              min={0} 
              max={1} 
              step={0.01} 
              value={volume} 
              onChange={handleVolumeChange}
              className={`w-full h-1.5 ${isLight ? 'bg-black/20' : 'bg-white/30'} rounded-lg appearance-none cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 ${isLight ? '[&::-webkit-slider-thumb]:bg-stone-800' : '[&::-webkit-slider-thumb]:bg-white'} [&::-webkit-slider-thumb]:rounded-full outline-none`}
            />
         </div>

        <button 
          onClick={togglePlay}
          className={`w-12 h-12 md:w-14 md:h-14 flex items-center justify-center ${isLight ? 'bg-stone-900 text-white shadow-[0_0_20px_rgba(0,0,0,0.15)]' : 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.3)]'} rounded-full hover:scale-105 transition-all outline-none`}
        >
          {isPlaying ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
          ) : (
             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="ml-1"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
          )}
        </button>

        <div className="w-20 md:w-24 flex justify-end"></div>
      </div>
    </div>
  );
}

function ButterflyEffect() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-[100] opacity-60">
      {Array.from({ length: 12 }).map((_, i) => (
        <div 
          key={i} 
          className="absolute animate-float-shape"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDuration: `${Math.random() * 8 + 6}s`,
            animationDelay: `${Math.random() * -10}s`
          }}
        >
          <div className="text-xl md:text-3xl animate-[spin_4s_linear_infinite]" style={{ animationDirection: i % 2 === 0 ? 'normal' : 'reverse' }}>🦋</div>
        </div>
      ))}
    </div>
  );
}

function CandyEffect() {
  const candies = ['🍬', '🍭', '🍫', '🍡'];
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 opacity-80">
      {Array.from({ length: 20 }).map((_, i) => (
        <div 
          key={i} 
          className="absolute text-xl md:text-2xl animate-snow"
          style={{
            left: `${Math.random() * 100}%`,
            animationDuration: `${Math.random() * 10 + 5}s`,
            animationDelay: `${Math.random() * -15}s`
          }}
        >
          {candies[Math.floor(Math.random() * candies.length)]}
        </div>
      ))}
    </div>
  );
}

function ElectricEffect() {
  const colors = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500', 'bg-cyan-500'];
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-[100] opacity-80">
      {Array.from({ length: 15 }).map((_, i) => (
        <div 
          key={i} 
          className={`absolute w-1 rounded-full animate-snow shadow-[0_0_10px_currentColor] ${colors[i % colors.length]}`}
          style={{
            left: `${Math.random() * 100}%`,
            height: `${Math.random() * 100 + 50}px`,
            animationDuration: `${Math.random() * 5 + 3}s`,
            animationDelay: `${Math.random() * -5}s`,
            color: 'inherit'
          }}
        ></div>
      ))}
    </div>
  );
}

function ChainEffect() {
  const chains = ['⛓️', '💎', '💰', '👑'];
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-[100] opacity-70">
      {Array.from({ length: 25 }).map((_, i) => (
        <div 
          key={i} 
          className="absolute text-2xl md:text-3xl animate-snow drop-shadow-md"
          style={{
            left: `${Math.random() * 100}%`,
            animationDuration: `${Math.random() * 8 + 4}s`,
            animationDelay: `${Math.random() * -10}s`,
            transform: `rotate(${Math.random() * 360}deg)`
          }}
        >
          {chains[Math.floor(Math.random() * chains.length)]}
        </div>
      ))}
    </div>
  );
}

function NoteEffect() {
  const notes = ['🎵', '🎼', '🎶', '♩', '♪', '♫', '♬'];
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 opacity-40">
      {Array.from({ length: 20 }).map((_, i) => (
        <div 
          key={i} 
          className="absolute text-2xl md:text-4xl animate-snow drop-shadow-sm text-stone-100"
          style={{
            left: `${Math.random() * 100}%`,
            animationDuration: `${Math.random() * 12 + 6}s`,
            animationDelay: `${Math.random() * -15}s`
          }}
        >
          {notes[Math.floor(Math.random() * notes.length)]}
        </div>
      ))}
    </div>
  );
}

function EightBitEffect() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-[100] opacity-30">
      {Array.from({ length: 30 }).map((_, i) => (
        <div 
          key={i} 
          className="absolute w-4 h-4 bg-white animate-snow"
          style={{
            left: `${Math.random() * 100}%`,
            animationDuration: `${Math.random() * 10 + 2}s`,
            animationDelay: `${Math.random() * -10}s`,
            clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)',
            boxShadow: '4px 4px 0px rgba(0,0,0,0.5)'
          }}
        ></div>
      ))}
    </div>
  );
}

function SnowEffect() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {Array.from({ length: 40 }).map((_, i) => (
        <div 
          key={i} 
          className="absolute bg-white/30 rounded-full animate-snow"
          style={{
            left: `${Math.random() * 100}%`,
            width: `${Math.random() * 5 + 2}px`,
            height: `${Math.random() * 5 + 2}px`,
            animationDuration: `${Math.random() * 15 + 5}s`,
            animationDelay: `${Math.random() * -15}s`
          }}
        ></div>
      ))}
    </div>
  );
}

function CuteEffect() {
  const shapes = ['rounded-full', 'rounded-lg rotate-45', 'rounded-tl-3xl rounded-br-3xl'];
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 opacity-20">
      {Array.from({ length: 15 }).map((_, i) => (
        <div 
          key={i} 
          className={`absolute bg-white animate-float-shape ${shapes[i % 3]}`}
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            width: `${Math.random() * 40 + 20}px`,
            height: `${Math.random() * 40 + 20}px`,
            animationDuration: `${Math.random() * 5 + 5}s`,
            animationDelay: `${Math.random() * -10}s`
          }}
        ></div>
      ))}
    </div>
  );
}

function BlossomEffect() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {Array.from({ length: 30 }).map((_, i) => (
        <div 
          key={i} 
          className="absolute bg-pink-300/40 rounded-full animate-snow shadow-[0_0_8px_rgba(244,114,182,0.6)]"
          style={{
            left: `${Math.random() * 100}%`,
            width: `${Math.random() * 8 + 4}px`,
            height: `${Math.random() * 8 + 4}px`,
            animationDuration: `${Math.random() * 10 + 5}s`,
            animationDelay: `${Math.random() * -10}s`,
            borderBottomRightRadius: '0px' // simple petal shape trick
          }}
        ></div>
      ))}
    </div>
  );
}

function LeavesEffect() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {Array.from({ length: 25 }).map((_, i) => (
        <div 
          key={i} 
          className="absolute bg-yellow-600/30 animate-snow"
          style={{
            left: `${Math.random() * 100}%`,
            width: `${Math.random() * 12 + 6}px`,
            height: `${Math.random() * 8 + 4}px`,
            animationDuration: `${Math.random() * 12 + 4}s`,
            animationDelay: `${Math.random() * -12}s`,
            borderRadius: '50% 0 50% 0' // leaf shape
          }}
        ></div>
      ))}
    </div>
  );
}

function FlagEffect() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Flag Red base color with shifting shadows for wavy folds */}
      <div 
        className="absolute inset-0 bg-[#da251d]" 
        style={{
          backgroundImage: 'linear-gradient(105deg, rgba(0,0,0,0.2) 0%, rgba(255,255,255,0.12) 20%, rgba(0,0,0,0.3) 40%, rgba(255,255,255,0.15) 60%, rgba(0,0,0,0.3) 80%, rgba(255,255,255,0.08) 100%)',
          backgroundSize: '200% 200%',
          animation: 'flag-shadow 8s ease-in-out infinite'
        }}
      />
      {/* Wavy lines layers to add depth of flowing silk */}
      <div className="absolute inset-0 opacity-15 mix-blend-overlay animate-pulse" style={{ animationDuration: '4s' }}>
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 100 Q 250 50, 500 100 T 1000 100 T 1500 100 L 1500 1000 L 0 1000 Z" fill="rgba(255,255,255,0.2)" />
        </svg>
      </div>

      {/* Flag Center Waving Star */}
      <div className="fixed inset-0 flex flex-col items-center justify-center pointer-events-none z-0 opacity-80">
        <div className="animate-[flag-weave_6s_ease-in-out_infinite] transform-gpu">
          <svg viewBox="0 0 100 100" className="w-[85vw] h-[85vw] max-w-[420px] max-h-[420px] text-yellow-400 drop-shadow-[0_0_90px_rgba(250,204,21,0.75)]" fill="currentColor">
            <polygon points="50,0 62.5,35 97.5,35 68.75,56.25 81.25,91.25 50,70 18.75,91.25 31.25,56.25 2.5,35 37.5,35" />
          </svg>
        </div>
      </div>
    </div>
  )
}

function RainEffect() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 opacity-50">
      {Array.from({ length: 40 }).map((_, i) => (
        <div 
          key={i} 
          className="absolute bg-white/70 rounded-full animate-rain"
          style={{
            left: `${Math.random() * 100}%`,
            width: '2px',
            height: `${Math.random() * 40 + 10}px`,
            animationDuration: `${Math.random() * 1 + 0.5}s`,
            animationDelay: `${Math.random() * -2}s`,
          }}
        ></div>
      ))}
    </div>
  );
}

// ---- DEMO PLAYER PAGE ----
function StreetLightEffect() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
       <div className="absolute top-0 inset-x-0 h-[60vh] bg-gradient-to-b from-yellow-500/20 via-yellow-500/5 to-transparent mix-blend-overlay animate-flicker"></div>
       <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-yellow-400/10 blur-[100px] rounded-full animate-flicker" style={{ animationDelay: '0.2s' }}></div>
       <div className="absolute top-[-5%] right-[-10%] w-[50%] h-[50%] bg-orange-500/10 blur-[120px] rounded-full animate-flicker" style={{ animationDelay: '0.5s' }}></div>
    </div>
  );
}

function MysteriousEffect() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Background stardust */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 mix-blend-overlay animate-flicker"></div>
      
      {/* Moon */}
      <div className="absolute top-[10%] right-[10%] w-[15vw] h-[15vw] min-w-[100px] min-h-[100px] bg-[#fcf5c7] rounded-full shadow-[0_0_120px_rgba(252,245,199,0.5),inset_0_0_40px_rgba(218,165,32,0.8)] opacity-90 mix-blend-screen animate-[pulse_4s_ease-in-out_infinite]">
         {/* Moon craters */}
         <div className="absolute top-[20%] left-[30%] w-[15%] h-[15%] bg-black/10 rounded-full blur-[2px]"></div>
         <div className="absolute top-[50%] left-[20%] w-[25%] h-[20%] bg-black/10 rounded-full blur-[3px]"></div>
         <div className="absolute top-[40%] right-[20%] w-[20%] h-[25%] bg-black/10 rounded-full blur-[2px]"></div>
      </div>
      
      {/* Gold glow around moon */}
      <div className="absolute top-[-5%] right-[0%] w-[40vw] h-[40vw] min-w-[200px] min-h-[200px] bg-[#d4af37]/20 blur-[100px] rounded-full mix-blend-screen animate-flicker" style={{ animationDuration: '4s' }}></div>
      
      {/* Light smoke */}
      <div className="absolute bottom-0 inset-x-0 h-[50vh] bg-gradient-to-t from-gray-900 via-gray-900/60 to-transparent blur-xl"></div>
      
      {/* Rain effect */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzIiBoZWlnaHQ9IjUwIj48cmVjdCB3aWR0aD0iMSIgaGVpZ2h0PSI1MCIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjA1KSIvPjwvc3ZnPg==')] animate-rain" style={{ animationDuration: '0.6s' }}></div>
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1IiBoZWlnaHQ9IjgwIj48cmVjdCB4PSIyIiB3aWR0aD0iMSIgaGVpZ2h0PSI3MCIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjA3KSIvPjwvc3ZnPg==')] animate-rain" style={{ animationDuration: '0.8s', animationDelay: '0.2s' }}></div>
    </div>
  );
}

function RetroNotesEffect() {
  const notes = ['🎵', '🎶', '♩', '♪', '♫', '♬'];
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 opacity-40">
      {Array.from({ length: 25 }).map((_, i) => (
        <div 
          key={i} 
          className="absolute text-xl sm:text-2xl animate-snow drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] text-[#a16207]"
          style={{
            left: `${Math.random() * 100}%`,
            animationDuration: `${Math.random() * 10 + 6}s`,
            animationDelay: `${Math.random() * -12}s`
          }}
        >
          {notes[i % notes.length]}
        </div>
      ))}
    </div>
  );
}

function SunsetSunEffect() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Sunset gold sunset glow */}
      <div className="absolute top-[30%] left-1/2 -translate-x-1/2 w-[35vw] h-[35vw] min-w-[250px] min-h-[250px] rounded-full bg-gradient-to-t from-[#f97316] to-[#eab308] opacity-70 blur-[20px] shadow-[0_0_120px_rgba(249,115,22,0.8),0_0_240px_rgba(234,179,8,0.4)] animate-[pulse_5s_ease-in-out_infinite]"></div>
      
      {/* Foggy warm layer */}
      <div className="absolute bottom-0 inset-x-0 h-[45vh] bg-gradient-to-t from-[#7c2d12]/30 via-[#7c2d12]/10 to-transparent blur-lg"></div>
    </div>
  );
}

function SunsetLeavesEffect() {
  const colors = ['bg-orange-500/40', 'bg-amber-500/50', 'bg-yellow-500/40', 'bg-red-500/30', 'bg-rose-500/30'];
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {Array.from({ length: 30 }).map((_, i) => (
        <div 
          key={i} 
          className={`absolute ${colors[i % colors.length]} animate-snow`}
          style={{
            left: `${Math.random() * 100}%`,
            width: `${Math.random() * 14 + 10}px`,
            height: `${Math.random() * 9 + 5}px`,
            animationDuration: `${Math.random() * 11 + 5}s`,
            animationDelay: `${Math.random() * -12}s`,
            borderRadius: '60% 10% 60% 10%',
            transform: `rotate(${Math.random() * 360}deg)`
          }}
        ></div>
      ))}
    </div>
  );
}

function OceanWavesEffect() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Wave layered background */}
      <div className="absolute bottom-0 inset-x-0 h-[120px] bg-gradient-to-t from-sky-450 via-sky-350 to-transparent opacity-30 animate-[pulse_6s_ease-in-out_infinite]"></div>
      {/* Ambient sky/sea radial lighting */}
      <div className="absolute top-[40%] left-1/4 w-[50vw] h-[50vw] bg-sky-500/10 blur-[130px] rounded-full"></div>
      <div className="absolute bottom-[10%] right-1/4 w-[40vw] h-[40vw] bg-cyan-700/10 blur-[100px] rounded-full animate-pulse" style={{ animationDuration: '8s' }}></div>
      
      {/* Waves animations dập dồn at the bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-24 overflow-hidden opacity-25">
        <svg className="absolute bottom-0 w-[200%] h-full translate-x-0 animate-[wave_10s_linear_infinite]" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M0,60 C150,100 350,20 500,60 C650,100 850,20 1000,60 C1150,100 1350,20 1500,60 L1500,120 L0,120 Z" fill="#0ea5e9" />
        </svg>
        <svg className="absolute bottom-0 w-[200%] h-full translate-x-0 animate-[wave_15s_linear_infinite]" style={{ animationDirection: 'reverse', opacity: 0.7 }} viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M0,50 C180,90 280,10 480,50 C680,90 780,10 980,50 C1180,90 1280,10 1480,50 L1480,120 L0,120 Z" fill="#38bdf8" />
        </svg>
      </div>
    </div>
  );
}

function OceanNightSkyEffect() {
  const clouds = [
    { top: '10%', scale: 1.0, duration: '40s', delay: '-5s' },
    { top: '22%', scale: 0.7, duration: '60s', delay: '-25s' },
    { top: '5%', scale: 0.4, duration: '85s', delay: '-45s' },
    { top: '35%', scale: 1.2, duration: '45s', delay: '-15s' },
    { top: '18%', scale: 0.6, duration: '70s', delay: '-30s' },
    { top: '48%', scale: 0.9, duration: '50s', delay: '-10s' },
  ];
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Crescent Moon */}
      <div 
        className="absolute top-12 right-12 md:top-16 md:right-16 text-5xl md:text-6xl drop-shadow-[0_0_25px_rgba(253,224,71,0.55)] select-none z-10 animate-pulse" 
        style={{ animationDuration: '4s' }}
      >
        🌙
      </div>
      {/* Drifting Clouds */}
      {clouds.map((c, i) => (
        <div
          key={i}
          className="absolute text-5xl sm:text-7xl pointer-events-none select-none text-white/12"
          style={{
            top: c.top,
            animation: `drift ${c.duration} linear infinite`,
            animationDelay: c.delay,
            transform: `scale(${c.scale})`,
          }}
        >
          ☁️
        </div>
      ))}
    </div>
  );
}

function EightBitGameEffect() {
  const elements = ['🎮', '👾', '👾', '⭐', '🍒', '🍄', '⚡', '🦖', '🎈', '💖'];
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 opacity-55">
      {/* Scanline pattern for CRT/arcade experience */}
      <div className="absolute inset-0 bg-[#000]/10 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,_rgba(0,0,0,0.15)_50%)] bg-[size:100%_4px]" />
      <div className="absolute top-[20%] left-1/4 w-[50vw] h-[50vw] bg-pink-500/10 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-[20%] right-1/4 w-[40vw] h-[40vw] bg-emerald-500/10 blur-[100px] rounded-full animate-pulse" style={{ animationDuration: '6s' }}></div>
      
      {Array.from({ length: 28 }).map((_, i) => (
        <div 
          key={i} 
          className="absolute text-xl sm:text-3xl animate-snow drop-shadow-[0_3px_6px_rgba(236,72,153,0.6)] font-mono select-none"
          style={{
            left: `${Math.random() * 100}%`,
            animationDuration: `${Math.random() * 8 + 5}s`,
            animationDelay: `${Math.random() * -12}s`
          }}
        >
          {elements[i % elements.length]}
        </div>
      ))}
    </div>
  );
}

function DemoPlayer() {
  const { lang } = useContext(LanguageContext);
  const t = translations[lang] || translations['vi'];
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isAdmin = searchParams.get('admin') === '1' || localStorage.getItem('adminToken') === 'MatKhauDay123';
  const [demo, setDemo] = useState<DemoSong | null>(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');

  useEffect(() => {
    fetch(`/api/demos/${id}${isAdmin ? '?admin=1' : ''}`)
      .then(res => res.json())
      .then(data => {
        setDemo(data);
        if (!data.requiresPassword || isAdmin) setUnlocked(true);
        setLoading(false);
      });
  }, [id, isAdmin]);

  useEffect(() => {
    if (unlocked && window.innerWidth < 768) {
      const timer = setTimeout(() => {
        window.scrollTo({ top: 300, behavior: 'smooth' });
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [unlocked]);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`/api/demos/${id}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
    const data = await res.json();
    if (data.success) {
      setDemo(data.demo);
      setUnlocked(true);
      setError('');
    } else {
      setError(data.error || t.wPass);
    }
  };

  useEffect(() => {
     if (demo) {
        const titleSuffix = demo.singer || demo.author || demo.composer || 'Unknown';
        const pageTitle = demo.isReleased 
          ? `${demo.title} - ${titleSuffix}`
          : `${demo.title} - ${titleSuffix} ( demo )`;
        document.title = pageTitle;
        
        let metaTitle = document.querySelector('meta[property="og:title"]');
        if (!metaTitle) {
          metaTitle = document.createElement('meta');
          metaTitle.setAttribute('property', 'og:title');
          document.head.appendChild(metaTitle);
        }
        metaTitle.setAttribute('content', pageTitle);

        if (demo.ogImageUrl) {
          let metaImage = document.querySelector('meta[property="og:image"]');
          if (!metaImage) {
            metaImage = document.createElement('meta');
            metaImage.setAttribute('property', 'og:image');
            document.head.appendChild(metaImage);
          }
          metaImage.setAttribute('content', window.location.origin + demo.ogImageUrl);
        }
     }
  }, [demo]);

  if (loading) return <div className="min-h-screen bg-black text-white flex items-center justify-center">{t.load}</div>;
  if (!demo) return <div className="min-h-screen bg-black text-white flex items-center justify-center">Không tìm thấy demo</div>;

  // Templates
  const templateType = demo.template || '1';
  const isLight = templateType === '1' || templateType === '4' || templateType === '6' || templateType === '7';
  const displayCoverUrl = demo.coverUrl || demo.globalCoverUrl || '';
  const pageBgUrl = demo.backgroundUrl || displayCoverUrl;
  let themeClasses = "";
  let accentClass = "";

  if (templateType === '1') {
    themeClasses = "bg-gradient-to-br from-amber-100 via-orange-50 to-yellow-100 text-orange-950";
    accentClass = "bg-orange-500 text-white";
  } else if (templateType === '2') {
    themeClasses = "text-white animate-club-bg";
    accentClass = "bg-fuchsia-600 text-white shadow-[0_0_20px_rgba(192,38,211,0.5)]";
  } else if (templateType === '3') {
    themeClasses = "bg-slate-900 text-slate-300 bg-[linear-gradient(to_bottom,_var(--tw-gradient-stops))] from-slate-900 to-slate-950";
    accentClass = "bg-slate-700 text-white";
  } else if (templateType === '4') {
    themeClasses = "bg-emerald-50 text-emerald-900 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]";
    accentClass = "bg-emerald-600 text-emerald-50 shadow-lg shadow-emerald-200";
  } else if (templateType === '5') {
    themeClasses = "bg-red-500 text-white bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-rose-400 to-red-600";
    accentClass = "bg-white text-red-500";
  } else if (templateType === '6') {
    themeClasses = "bg-pink-50 text-pink-900 bg-[radial-gradient(circle_at_top_left,_var(--tw-gradient-stops))] from-fuchsia-100 to-pink-50";
    accentClass = "bg-pink-500 text-white shadow-lg shadow-pink-200";
  } else if (templateType === '7') {
    themeClasses = "bg-[#faf9f6] text-stone-800 bg-notebook-light";
    accentClass = "bg-stone-800 text-[#faf9f6]";
  } else if (templateType === '8') {
    themeClasses = "bg-red-600 text-yellow-50 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-red-600 via-red-500 to-red-700 [text-shadow:0_2px_4px_rgba(153,27,27,0.8)]";
    accentClass = "bg-yellow-400 text-red-900 font-bold shadow-[0_0_15px_rgba(250,204,21,0.5)]";
  } else if (templateType === '9') {
    themeClasses = "bg-sky-100 text-sky-900 drop-shadow-sm bg-[linear-gradient(to_bottom,_var(--tw-gradient-stops))] from-sky-400 via-sky-200 to-white";
    accentClass = "bg-white/80 backdrop-blur text-sky-700 shadow-xl shadow-sky-200/50 outline outline-2 outline-white";
  } else if (templateType === '10') {
    themeClasses = "bg-neutral-900/80 bg-[url('/hiphop-bg.png')] bg-cover bg-center bg-fixed text-white bg-blend-multiply";
    accentClass = "bg-yellow-400 text-black font-black uppercase shadow-[4px_4px_0_rgba(0,0,0,1)] tracking-wide transform hover:scale-105 hover:-rotate-2 transition-transform";
  } else if (templateType === '11') {
    themeClasses = "bg-black text-amber-100 font-serif";
    accentClass = "bg-[#d4af37] text-black font-bold uppercase shadow-[0_0_20px_rgba(212,175,55,0.4)]";
  } else if (templateType === '12') {
    themeClasses = "bg-gradient-to-br from-[#3E2723] via-[#1A0C06] to-[#0A0402] text-[#EFEBE9] font-serif";
    accentClass = "bg-[#8D6E63] text-[#EFEBE9] hover:bg-[#A1887F] font-bold uppercase tracking-wider rounded-lg shadow-[0_0_15px_rgba(141,110,99,0.3)]";
  } else if (templateType === '13') {
    themeClasses = "bg-gradient-to-b from-[#1E1B4B] via-[#4C1D95] via-[#9D174D] via-[#E11D48] to-[#FBBF24] text-[#FFFBEB] font-sans";
    accentClass = "bg-[#f43f5e] hover:bg-[#e11d48] text-[#FFFBEB] shadow-[0_0_20px_rgba(244,63,94,0.6)] font-bold uppercase rounded-xl";
  } else if (templateType === '14') {
    themeClasses = "bg-gradient-to-b from-[#0B2545] via-[#134074] via-[#001D3D] to-[#003566] text-white font-sans";
    accentClass = "bg-[#003566] hover:bg-[#001D3D] text-sky-200 border border-sky-400/30 shadow-[0_0_25px_rgba(14,165,233,0.4)] font-bold uppercase rounded-xl";
  } else if (templateType === '15') {
    themeClasses = "bg-[#090615] text-emerald-400 font-mono tracking-tight";
    accentClass = "bg-[#ec4899] hover:bg-[#db2777] text-white border-2 border-[#10b981] shadow-[4px_4px_0_rgba(16,185,129,0.7)] font-extrabold uppercase rounded-none tracking-widest";
  }

  if (!unlocked) {
    return (
      <div className={`min-h-screen px-4 py-12 flex flex-col items-center justify-center ${themeClasses} transition-colors duration-1000 relative overflow-hidden`}>
        <motion.div 
          initial={{ scaleY: 1 }} 
          animate={{ scaleY: 0 }} 
          exit={{ scaleY: 1 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }} 
          className="fixed inset-0 z-[9999] bg-black origin-bottom pointer-events-none" 
        />
        {templateType === '1' && <ButterflyEffect />}
        {templateType === '2' && <ElectricEffect />}
        {templateType === '3' && <SnowEffect />}
        {templateType === '4' && <NoteEffect />}
        {templateType === '5' && <><CuteEffect /><CandyEffect /></>}
        {templateType === '6' && <><BlossomEffect /><EightBitEffect /></>}
        {templateType === '7' && <LeavesEffect />}
        {templateType === '8' && <FlagEffect />}
        {templateType === '9' && <RainEffect />}
        {templateType === '10' && <><StreetLightEffect /><ChainEffect /></>}
        {templateType === '11' && <MysteriousEffect />}
        {templateType === '12' && <RetroNotesEffect />}
        {templateType === '13' && <><SunsetSunEffect /><SunsetLeavesEffect /></>}
        {templateType === '14' && <><OceanWavesEffect /><OceanNightSkyEffect /></>}
        {templateType === '15' && <EightBitGameEffect />}
        
        {pageBgUrl && (
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-20 blur-md scale-105"
            style={{ backgroundImage: `url(${pageBgUrl})` }}
          ></div>
        )}

        <Link to="/" className={`fixed top-6 left-6 opacity-60 hover:opacity-100 flex items-center gap-2 z-20 transition-opacity font-medium ${isLight ? 'text-stone-900' : 'text-white'}`}>
          <ArrowLeft className="w-5 h-5" /> {t.back}
        </Link>

        <div className={`relative z-10 w-full max-w-md ${isLight ? 'bg-white/40' : 'bg-black/40'} backdrop-blur-xl border ${isLight ? 'border-white/40' : 'border-white/10'} p-8 rounded-[2rem] shadow-2xl`}>
          {displayCoverUrl ? (
            <div className="w-32 h-32 mx-auto mb-6 rounded-full overflow-hidden border-4 border-white/20 shadow-xl relative animate-[spin_8s_linear_infinite]">
              <img src={displayCoverUrl} crossOrigin="anonymous" className="w-full h-full object-cover" alt="Cover" />
              <div className="absolute inset-0 flex items-center justify-center">
                 <div className={`w-6 h-6 rounded-full ${isLight ? 'bg-white/80' : 'bg-black/60'} border border-white/30 backdrop-blur-sm shadow-inner`}></div>
              </div>
            </div>
          ) : (
            <div className={`w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center ${isLight ? 'bg-black/10 text-stone-600' : 'bg-white/10 text-stone-300'}`}>
              <Lock className="w-8 h-8 opacity-50" />
            </div>
          )}
          
          <h2 className={`text-2xl font-black text-center mb-1 drop-shadow-sm`}>{demo.title}</h2>
          {(demo.composer || demo.singer || demo.author) && (
            <p className="text-sm font-medium text-center mb-6 opacity-80">
               {formatText(demo.singer || demo.author)}
               {demo.composer && <span className="block text-xs mt-1 opacity-70">Sáng tác: {formatText(demo.composer)}</span>}
            </p>
          )}
          
          <p className="text-center mb-6 text-sm font-semibold opacity-70">{t.pPrompt2}</p>
          
          <form onSubmit={handleUnlock} className="space-y-4">
            <input 
              type="password" 
              placeholder="***" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              className={`w-full ${isLight ? 'bg-white/60 focus:bg-white text-stone-900 placeholder:text-stone-400' : 'bg-black/40 focus:bg-black/60 text-white placeholder:text-stone-500'} border-none px-4 py-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-white/50 transition-all text-center tracking-widest font-mono text-lg shadow-inner`}
              autoFocus
            />
            {error && <p className="text-red-500 text-sm text-center font-bold drop-shadow-sm">{error}</p>}
            <button type="submit" className={`w-full ${isLight ? 'bg-stone-900 text-white hover:bg-stone-800' : 'bg-white text-black hover:bg-stone-200'} font-bold py-3.5 rounded-xl transition-colors shadow-lg active:scale-95`}>
              {t.unlock}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen px-4 py-8 ${themeClasses} transition-colors duration-1000 relative`}>
      <motion.div 
        initial={{ scaleY: 1 }} 
        animate={{ scaleY: 0 }} 
        exit={{ scaleY: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }} 
        className="fixed inset-0 z-[9999] bg-black origin-bottom pointer-events-none" 
      />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.3 }}
        className="absolute inset-0 pointer-events-none z-0" 
      />
      {templateType === '1' && <ButterflyEffect />}
      {templateType === '2' && <ElectricEffect />}
      {templateType === '3' && <SnowEffect />}
      {templateType === '4' && <NoteEffect />}
      {templateType === '5' && <><CuteEffect /><CandyEffect /></>}
      {templateType === '6' && <><BlossomEffect /><EightBitEffect /></>}
      {templateType === '7' && <LeavesEffect />}
      {templateType === '8' && <FlagEffect />}
      {templateType === '9' && <RainEffect />}
      {templateType === '10' && <><StreetLightEffect /><ChainEffect /></>}
      {templateType === '11' && <MysteriousEffect />}
      {templateType === '12' && <RetroNotesEffect />}
      {templateType === '13' && <><SunsetSunEffect /><SunsetLeavesEffect /></>}
      {templateType === '14' && <><OceanWavesEffect /><OceanNightSkyEffect /></>}
      {templateType === '15' && <EightBitGameEffect />}
      
      {pageBgUrl && (
        <div 
          className="fixed inset-0 bg-cover bg-center opacity-20 blur-md scale-105 pointer-events-none z-0"
          style={{ backgroundImage: `url(${pageBgUrl})` }}
        ></div>
      )}

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.3 }}
        className={`fixed top-0 inset-x-0 h-16 bg-gradient-to-b ${isLight ? 'from-[#faf9f6]/50' : 'from-black/40'} to-transparent pointer-events-none z-40`}
      />

      <div className="fixed top-6 left-6 flex items-center gap-3 z-50">
        <Link to="/" className="opacity-60 hover:opacity-100 flex items-center gap-2 transition-opacity font-medium drop-shadow-md">
          <ArrowLeft className="w-5 h-5" /> {t.back}
        </Link>
        <button
          onClick={() => {
            let url = window.location.origin + '/demo/' + (demo.slug || demo.id);
            if (url.includes('xn--ti-jia.com')) {
              url = url.replace(/xn--ti-jia\.com/gi, 'tài.com');
            }
            navigator.clipboard.writeText(url);
            setToast('Đã copy link!');
            setTimeout(() => setToast(''), 3000);
          }}
          className="opacity-60 hover:opacity-100 p-2 rounded-full bg-black/10 hover:bg-black/20 flex items-center justify-center transition-all drop-shadow-md cursor-pointer text-current"
          title="Chia sẻ link"
        >
          <Share2 className="w-4.5 h-4.5" />
        </button>
      </div>

      {isAdmin && demo && (
        <div id="admin-controls-ui" className="fixed top-6 right-6 flex items-center gap-2 z-50">
          <Link to={`/admin/edit/${demo.id}`} className="opacity-80 hover:opacity-100 flex items-center gap-2 transition-opacity font-medium bg-black/40 px-4 py-2 rounded-full backdrop-blur-md border border-white/20 text-white shadow-xl">
            <Edit3 className="w-4 h-4" /> {t.edit}
          </Link>
        </div>
      )}

      <div 
        className="max-w-5xl mx-auto w-full flex flex-col md:flex-row gap-0 md:gap-8 items-center md:items-start pt-16 relative z-10"
      >
        {/* Left: Player */}
        <div className="flex-1 w-full max-w-md block md:flex text-center md:text-left flex-col items-center md:sticky md:top-24 self-start">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="w-full flex flex-col items-center"
          >
            {templateType === '12' ? (
              /* WOODEN TURNTABLE CASE WITH REVOLVING VINYL AND DYNAMIC TONEARM */
              <div id="retro-turntable" className="relative w-full max-w-[280px] md:max-w-[340px] aspect-square p-6 md:p-8 bg-gradient-to-br from-[#4e342e] to-[#2d1a15] rounded-3xl border-8 border-[#3e2723] shadow-[inset_0_4px_10px_rgba(0,0,0,0.6),0_15px_30px_rgba(0,0,0,0.8)] flex items-center justify-center mb-4">
                {/* Pivot brass accent on the wooden frame */}
                <div className="absolute top-4 right-4 w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-amber-700 border border-amber-900 shadow-md z-20 flex items-center justify-center">
                  <div className="w-5 h-5 rounded-full bg-neutral-800" />
                </div>
                
                {/* Dynamic Tonearm */}
                <motion.div 
                  initial={{ rotate: -55 }}
                  animate={{ rotate: -15 }}
                  transition={{ type: 'spring', stiffness: 45, damping: 15, delay: 1 }}
                  className="absolute top-2 right-2 w-28 h-44 z-30 pointer-events-none origin-[80%_15.6%]"
                >
                  <svg width="112" height="176" viewBox="0 0 100 160" fill="none" className="w-full h-full drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)]">
                    {/* Base pivot center using concentric circles for solid Safari/iOS support */}
                    <circle cx="80" cy="25" r="14" fill="#b0bec5" stroke="#1a0c06" strokeWidth="1.5" />
                    <circle cx="80" cy="25" r="8" fill="#455a64" />
                    <circle cx="80" cy="25" r="4" fill="#111" />
                    
                    {/* Metallic arm pole (silver stainless-steel rod) curves to the cartridge */}
                    {/* Using dual layered solid-stroke paths for a perfect 3D cylindrical metal look visible on iOS Safari */}
                    <path d="M 80 25 Q 75 80 50 110 L 25 135" stroke="#b0bec5" strokeWidth="5.5" strokeLinecap="round" />
                    <path d="M 80 25 Q 75 80 50 110 L 25 135" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" opacity="0.8" />
                    
                    {/* Cartridge headshell */}
                    <g transform="translate(15, 126) rotate(35)">
                      <rect x="0" y="0" width="12" height="20" rx="2" fill="#222" stroke="#d4af37" strokeWidth="1" />
                      <rect x="2" y="2" width="8" height="6" fill="#8D6E63" />
                      <circle cx="6" cy="15" r="2" fill="#d4af37" />
                    </g>
                  </svg>
                </motion.div>

                {/* THE ROTATING VINYL DISC */}
                <div className="w-[190px] h-[190px] sm:w-[224px] sm:h-[224px] md:w-[260px] md:h-[260px] aspect-square relative rounded-full shadow-[0_12px_35px_rgba(0,0,0,0.7)] animate-[spin_12s_linear_infinite] flex items-center justify-center border-4 border-stone-800 bg-[#0c0c0c] overflow-hidden flex-shrink-0 z-10">
                  {/* Artwork label center */}
                  {displayCoverUrl ? (
                    <img 
                      src={displayCoverUrl} 
                      crossOrigin="anonymous" 
                      alt="Cover" 
                      className="w-full h-full rounded-full object-cover aspect-square z-10" 
                    />
                  ) : (
                    <div className="w-full h-full bg-stone-900 rounded-full flex items-center justify-center z-10 text-stone-600 aspect-square">
                      <Music className="w-8 h-8" />
                    </div>
                  )}

                  {/* Glossy vinyl light shine overlay */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-black/25 via-transparent to-white/15 rounded-full z-[15] pointer-events-none"></div>
                  
                  {/* Spindle hole & metallic center rim to keep visual charm */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-[#0c0c0c]/90 border border-stone-700 rounded-full z-20 shadow-lg flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-[#d4af37] rounded-full"></div>
                  </div>
                </div>
              </div>
            ) : (
              /* ALL OTHER TEMPLATES */
              <div className={`w-full max-w-[260px] md:max-w-[320px] aspect-square overflow-hidden mb-4 relative transition-all duration-1000 mt-2 md:mt-0 ${
                templateType === '1' ? 'shadow-glow-1 animate-[bounce_6s_infinite] rounded-3xl border-4' :
                templateType === '2' ? 'shadow-glow-2 scale-105 rounded-3xl border-4' :
                templateType === '3' ? 'shadow-2xl animate-sway rounded-lg border-[12px] opacity-90' :
                templateType === '4' ? 'shadow-[0_20px_45px_rgba(16,185,129,0.25)] rounded-[2rem] border-[6px] border-emerald-500 hover:scale-105 hover:rotate-1 transition-transform duration-500 bg-emerald-50' : 
                templateType === '5' ? 'shadow-xl rounded-full border-4 animate-[bounce_2s_infinite] shadow-red-900/50' : 
                templateType === '6' ? 'shadow-[12px_12px_0_rgba(244,114,182,0.3)] rounded-l-sm rounded-r-3xl border-l-[20px] border-l-pink-400 border-pink-200 rotate-2 hover:rotate-0 transition-transform bg-white' :
                templateType === '7' ? 'shadow-[8px_8px_0px_rgba(0,0,0,0.8)] rounded-xl border-4 border-stone-800 rotate-2 hover:rotate-0 transition-transform' : 
                templateType === '8' ? 'shadow-[0_0_40px_rgba(250,204,21,0.6)] rounded-full border-4 border-yellow-400' :
                templateType === '9' ? 'shadow-xl shadow-sky-300 rounded-[2rem] border-4 border-white/80 animate-[bounce_4s_infinite]' : 
                templateType === '10' ? 'shadow-[8px_8px_0_rgba(234,179,8,1)] border-[4px] border-black rounded-sm skew-x-[-2deg] scale-[1.02] bg-zinc-900' : 
                templateType === '11' ? 'shadow-[0_0_30px_rgba(212,175,55,0.2)] rounded-2xl border-2 border-stone-800' :
                templateType === '13' ? 'shadow-[0_0_40px_rgba(244,63,94,0.3)] bg-black/40 border border-[#f43f5e]/20 rounded-[2.5rem] hover:scale-105 transition-transform duration-500' : 
                templateType === '14' ? 'shadow-[0_0_50px_rgba(14,165,233,0.35)] bg-gradient-to-b from-[#134074] to-[#0B2545] border-4 border-sky-400/50 rounded-[2rem] hover:scale-102 transition-transform duration-500' : 
                templateType === '15' ? 'border-[6px] border-[#ec4899] rounded-none shadow-[6px_6px_0_#10b981] bg-black hover:scale-105 transition-transform duration-300' : 'shadow-2xl rounded-3xl border-4'
              }`}>
                {templateType === '9' && (
                  <>
                    <div className="absolute -top-4 -left-4 text-4xl animate-float-shape z-10 drop-shadow-md">☁️</div>
                    <div className="absolute -bottom-2 -right-4 text-3xl animate-float-shape z-10 drop-shadow-md" style={{animationDelay: '1s'}}>☁️</div>
                  </>
                )}
                {displayCoverUrl ? (
                  <img 
                    src={displayCoverUrl} 
                    crossOrigin="anonymous" 
                    alt="Cover" 
                    className={`w-full h-full object-cover ${templateType === '2' ? 'animate-zoom-fast' : 'animate-zoom-gentle'}`}
                  />
                ) : (
                  <div className="w-full h-full bg-black/30 flex flex-col justify-center items-center">
                    <Music className="w-24 h-24 opacity-20" />
                  </div>
                )}
                <div className={`absolute inset-0 ${templateType === '6' ? 'bg-gradient-to-r from-black/20 to-transparent w-8' : ''}`}></div>
                <div className={`absolute inset-0 bg-gradient-to-t from-black/60 to-transparent ${templateType === '4' ? 'rounded-[1.7rem]' : (templateType === '5' || templateType === '8' ? 'rounded-full' : '')} ${templateType === '6' ? 'opacity-30' : ''}`}></div>
              </div>
            )}
          <h1 className="text-xl md:text-2xl font-black text-center mb-1 drop-shadow-sm flex items-center justify-center">
            <span className="relative inline-block pr-10">
              {formatText(demo.title)}
              {demo.isReleased ? (
               <div className="absolute -top-3 -right-6 origin-bottom-left rotate-[15deg] bg-emerald-600 text-[10px] font-black text-white px-2 py-0.5 rounded shadow-[0_0_15px_rgba(5,150,105,0.8)] tracking-widest border border-emerald-400/50 select-none animate-released-wiggle">
                 {t.lReleasedMark || 'RELEASED'}
               </div>
              ) : (
               <div className="absolute -top-3 -right-2 origin-bottom-left rotate-[15deg] bg-rose-600 text-[10px] font-black text-white px-1.5 py-0.5 rounded shadow-[0_0_15px_rgba(225,29,72,0.8)] animate-[pulse_2s_ease-in-out_infinite] tracking-widest border border-white/20 select-none">
                 {t.lDemoMark || 'DEMO'}
               </div>
              )}
            </span>
          </h1>
          {(demo.singer || demo.author) && <p className="text-lg md:text-xl font-medium text-center mb-0 opacity-90">{formatText(demo.singer || demo.author)}</p>}
          {demo.composer && <p className="text-xs md:text-sm font-medium text-center mb-1 md:mb-6 opacity-60">{t.sAuth} {formatText(demo.composer)}</p>}
          {!demo.singer && !demo.author && !demo.composer && <div className="mb-0 md:mb-6"></div>}
          </motion.div>
          
          <div 
            className={`fixed md:relative bottom-4 md:bottom-auto w-[calc(100%-2rem)] md:w-full rounded-[24px] shadow-[0_20px_40px_rgba(0,0,0,0.3)] border ${isLight ? 'border-black/10' : 'border-white/20'} z-50 overflow-hidden mx-auto inset-x-0 md:inset-x-auto animate-fade-in`}
          >
            {/* Background with blur and mask */}
            <div 
              className="absolute inset-0 backdrop-blur-xl"
              style={{ maskImage: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.8) 25%, black 100%)', WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.8) 25%, black 100%)' }}
            >
              <div className={`absolute inset-0 bg-gradient-to-t ${(templateType === '2' || templateType === '5' || templateType === '8') ? 'from-black/70 via-black/30' : (isLight ? 'from-white/90 via-white/50' : 'from-black/90 via-black/50')} to-transparent`}></div>
              {displayCoverUrl && (
                <div 
                  className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-overlay saturate-150"
                  style={{ backgroundImage: `url(${displayCoverUrl})` }}
                ></div>
              )}
            </div>
            <div className="relative z-10 px-4 pt-2 pb-3 md:px-5 md:pt-3 md:pb-4">
               <CustomAudioPlayer src={demo.audioUrl} template={templateType} />
            </div>
          </div>
        </div>

        {/* Right: Lyrics */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="flex-1 w-full pb-32 md:pb-0 mt-8 md:mt-0"
        >
          <h3 className="text-sm font-bold uppercase tracking-widest opacity-50 mb-4 ml-4 md:mt-0 mt-0">{t.lyric}</h3>
          <div className="pr-4">
            {demo.lyrics ? (
              <pre className={`whitespace-pre-wrap font-sans text-lg/relaxed sm:text-xl/loose font-semibold opacity-100 pb-20 pl-4 border-l ${isLight ? 'border-black/20 text-black/90' : 'border-white/20 text-white/95'} drop-shadow-md`}>
                {demo.lyrics}
              </pre>
            ) : (
              <div className="flex items-center justify-center opacity-30 italic py-20">
                {t.nLyric}
              </div>
            )}
          </div>
        </motion.div>
      </div>
      {toast && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-neutral-900/90 backdrop-blur-md text-white border border-white/20 px-5 py-3 rounded-2xl shadow-2xl z-[100] flex items-center gap-2 font-mono text-xs animate-bounce">
           <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
           {toast}
        </div>
      )}
    </div>
  );
}

// ---- ADMIN DASHBOARD ----
function AdminDashboard() {
  const [data, setData] = useState<AppData | null>(null);
  const [activeTab, setActiveTab] = useState<'demos'|'profile'>('demos');
  const [toast, setToast] = useState('');
  const [slideshowImages, setSlideshowImages] = useState<string[]>([]);
  const [homeCoverProgress, setHomeCoverProgress] = useState(0);
  const [faviconProgress, setFaviconProgress] = useState(0);
  const [ogImageProgress, setOgImageProgress] = useState(0);
  const [slideProgress, setSlideProgress] = useState(0);
  const [draggingSlideIdx, setDraggingSlideIdx] = useState<number | null>(null);
  
  const [homeCoverUrlPreview, setHomeCoverUrlPreview] = useState('');
  const [faviconUrlPreview, setFaviconUrlPreview] = useState('');
  const [ogImageUrlPreview, setOgImageUrlPreview] = useState('');
  
  const navigate = useNavigate();

  const loadData = () => fetch('/api/admin/data').then(res => res.json()).then(resData => {
    setData(resData);
    if (resData.slideshowImages) {
      setSlideshowImages(resData.slideshowImages);
    }
    if (resData.homeCoverUrl) setHomeCoverUrlPreview(resData.homeCoverUrl);
    if (resData.faviconUrl) setFaviconUrlPreview(resData.faviconUrl);
    if (resData.ogImageUrl) setOgImageUrlPreview(resData.ogImageUrl);
  });

  useEffect(() => { loadData(); }, []);

  const uploadWithProgress = (file: File, setProgress: (p: number) => void): Promise<string> => {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append('file', file);
      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/upload', true);
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          setProgress(Math.round((e.loaded / e.total) * 100));
        }
      };
      xhr.onload = () => {
        if (xhr.status === 200) {
          setProgress(100);
          const res = JSON.parse(xhr.responseText);
          resolve(res.url);
        } else reject(new Error('Upload failed'));
      };
      xhr.onerror = () => reject(new Error('Network error'));
      xhr.send(formData);
    });
  };

  const handleShare = (slugOrId: string) => {
    let url = window.location.origin + '/demo/' + slugOrId;
    if (url.includes('xn--ti-jia.com')) {
      url = url.replace(/xn--ti-jia\.com/gi, 'tài.com');
    }
    navigator.clipboard.writeText(url);
    setToast('Đã copy link!');
    setTimeout(() => setToast(''), 3000);
  };

  const handleDelete = async (id: string) => {
    if(!confirm('Bạn có chắc muốn xóa demo này?')) return;
    await fetch(`/api/demos/${id}/delete`, { method: 'POST' });
    loadData();
  };

  const handleProfileSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const payload: any = Object.fromEntries(formData);

    await fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pageTitle: payload.pageTitle,
        artistName: payload.artistName,
        artistBio: payload.artistBio,
        homeCoverUrl: payload.homeCoverUrl,
        faviconUrl: payload.faviconUrl,
        ogImageUrl: payload.ogImageUrl,
        youtubePlaylistUrl: payload.youtubePlaylistUrl,
        spotifyUrl: payload.spotifyUrl,
        globalPassword: payload.globalPassword,
        slideshowImages: slideshowImages
      }),
    });
    
    setToast('Đã lưu thông tin thành công!');
    setTimeout(() => setToast(''), 3000);
  };

  if (!data) return <div className="min-h-screen bg-stone-100 flex items-center justify-center text-stone-500">Đang tải AdminCP...</div>;

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900 font-sans relative">
      {toast && (
        <div className="fixed bottom-6 right-6 bg-emerald-500 text-white px-6 py-3 rounded-xl shadow-xl font-bold z-50 animate-[bounce_1s_ease-in-out]">
          {toast}
        </div>
      )}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 font-bold text-lg">
            <div className="w-8 h-8 bg-stone-900 text-white rounded flex items-center justify-center">A</div>
            Admin
          </div>
          <Link to="/" className="text-sm font-medium text-stone-500 hover:text-stone-900 flex items-center gap-1">
            Trang Chủ <ArrowLeft className="w-4 h-4 rotate-180" />
          </Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col md:flex-row gap-8">
        <aside className="w-full md:w-64 shrink-0 space-y-1">
          <button onClick={() => setActiveTab('demos')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === 'demos' ? 'bg-stone-900 text-white' : 'hover:bg-stone-200 text-stone-600'}`}>
            <Disc3 className="w-5 h-5" /> Quản lý
          </button>
          <button onClick={() => setActiveTab('profile')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${activeTab === 'profile' ? 'bg-stone-900 text-white' : 'hover:bg-stone-200 text-stone-600'}`}>
            <Settings className="w-5 h-5" /> Hồ sơ & Playlist
          </button>
        </aside>

        <main className="flex-1 bg-white rounded-3xl border border-stone-200 shadow-sm p-8">
          {activeTab === 'demos' && (
            <div>
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold">Danh sách</h2>
                <Link to="/admin/new" className="bg-stone-900 text-white p-2.5 rounded-lg flex items-center justify-center hover:bg-stone-800 transition-colors shadow-sm" title="Tạo mới">
                  <Plus className="w-5 h-5" />
                </Link>
              </div>
              
              <div className="overflow-x-auto">
                {data.demos.length === 0 ? (
                  <div className="py-12 text-center text-stone-500 italic border border-stone-200 rounded-xl bg-stone-50">Chưa có demo nào. Hãy tạo mới!</div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {data.demos.map((demo, index) => (
                      <div key={demo.id} className="border-b border-stone-100 last:border-0 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-stone-50 transition-colors px-2">
                        <div className="flex flex-col gap-1.5 flex-1 break-all">
                          <Link to={`/demo/${demo.slug || demo.id}?admin=1`} className="hover:text-blue-600 flex items-center gap-2 text-base font-bold text-stone-800">
                            <span className="text-stone-400 font-medium text-sm w-5">{index + 1}.</span> {demo.title}
                          </Link>
                          <div className="flex items-center flex-wrap gap-2 text-xs pl-7">
                            <span className={`px-2 py-0.5 rounded font-semibold ${demo.status === 'public' ? 'bg-green-100 text-green-700' : 'bg-stone-200 text-stone-600'}`}>
                              {demo.status === 'public' ? 'Công khai' : 'Ẩn'}
                            </span>
                            <span className="bg-stone-100 text-stone-600 px-2 py-0.5 rounded font-medium border border-stone-200">
                              {demo.template === '1' ? 'Vui vẻ' : 
                               demo.template === '2' ? 'Sôi động' : 
                               demo.template === '3' ? 'Buồn' : 
                               demo.template === '4' ? 'Thư giãn' : 
                               demo.template === '5' ? 'Đáng yêu' : 
                               demo.template === '6' ? 'Hạnh phúc' : 
                               demo.template === '7' ? 'Học đường' : 
                               demo.template === '8' ? 'Tổ quốc' : 
                               demo.template === '9' ? 'Bầu trời xanh' : 
                               demo.template === '10' ? 'Hip Hop' : 
                               demo.template === '11' ? 'Kỳ bí' : 
                               demo.template === '12' ? 'Cổ điển' : 
                               demo.template === '13' ? 'Hoàng hôn' : 
                               demo.template === '14' ? 'Đại dương' : 
                               demo.template === '15' ? 'Retro 8-Bit' : 'Mặc định'}
                            </span>
                            {demo.password && (
                              <span className="bg-stone-100 px-2 py-0.5 rounded font-medium border border-stone-200 flex items-center gap-1 text-stone-800">
                                <Lock className="w-3 h-3 text-stone-500" /> <span className="font-mono">{demo.password}</span>
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button onClick={() => handleShare(demo.slug || demo.id)} className="text-stone-500 hover:bg-stone-200 p-2 rounded transition-colors" title="Chia sẻ Link">
                             <Globe className="w-4 h-4" />
                          </button>
                          <Link to={`/admin/edit/${demo.id}`} className="text-blue-600 hover:bg-blue-50 p-2 rounded transition-colors" title="Chỉnh sửa">
                             <Edit3 className="w-4 h-4" />
                          </Link>
                          <button onClick={() => handleDelete(demo.id)} className="text-red-500 hover:bg-red-50 p-2 rounded transition-colors" title="Xóa">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="max-w-2xl">
              <h2 className="text-2xl font-bold mb-8">Thông tin hồ sơ</h2>
              <form onSubmit={handleProfileSave} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-2">Tiêu đề Website</label>
                  <input name="pageTitle" defaultValue={data.pageTitle} placeholder="Để trống sẽ dùng mặc định: Thiên Đường Demo của [Tên nghệ sĩ]" className="w-full border border-stone-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-stone-900" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-2">Tên nghệ sĩ</label>
                  <input name="artistName" defaultValue={data.artistName} className="w-full border border-stone-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-stone-900" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-2">Giới thiệu ngắn</label>
                  <input name="artistBio" defaultValue={data.artistBio} className="w-full border border-stone-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-stone-900" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-2">Ảnh bìa trang chủ</label>
                  <div className="flex flex-wrap gap-4 items-center">
                    {homeCoverUrlPreview && <img src={homeCoverUrlPreview} className="w-16 h-16 rounded-xl object-cover border border-stone-200 shadow-sm" />}
                    <button type="button" className={`w-16 h-16 rounded-xl flex items-center justify-center relative overflow-hidden transition-colors border shadow-sm ${homeCoverProgress === 100 ? 'border-emerald-300 bg-emerald-50 text-emerald-600' : 'border-stone-300 bg-stone-50 text-stone-500 hover:bg-stone-100'}`} onClick={() => document.getElementById('homeCoverUpload')?.click()}>
                        {homeCoverProgress > 0 && homeCoverProgress < 100 && <div className="absolute left-0 bottom-0 right-0 bg-stone-200 transition-all duration-300" style={{ height: `${homeCoverProgress}%` }}></div>}
                        <span className="relative z-10 font-bold text-[10px] flex flex-col items-center gap-1"><Upload className="w-5 h-5"/> {homeCoverProgress > 0 && homeCoverProgress < 100 ? `${homeCoverProgress}%` : ''}</span>
                    </button>
                    {homeCoverUrlPreview && <button type="button" onClick={() => { setHomeCoverUrlPreview(''); setHomeCoverProgress(0); (document.getElementById('homeCoverUpload') as HTMLInputElement).value = ''; }} className="w-10 h-10 bg-red-100 text-red-700 rounded-full flex items-center justify-center hover:bg-red-200 transition-colors"><X className="w-5 h-5"/></button>}
                    <input type="hidden" name="homeCoverUrl" value={homeCoverUrlPreview} />
                    <input type="file" id="homeCoverUpload" className="hidden" accept="image/*" onChange={async (e) => {
                      if (!e.target.files?.[0]) return;
                      try {
                        const url = await uploadWithProgress(e.target.files[0], setHomeCoverProgress);
                        setHomeCoverUrlPreview(url);
                      } catch (err) {
                        alert('Lỗi upload');
                        setHomeCoverProgress(0);
                      }
                    }} />
                  </div>
                  <p className="text-xs text-stone-500 mt-2">Dùng để tạo hiệu ứng nền cho trang chủ, nên dùng ảnh ngang chất lượng cao.</p>
                </div>
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-2">Ảnh Slideshow Trang chủ (Tự động thay đổi, kéo thả để sắp xếp, bấm xóa để gỡ ảnh)</label>
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-wrap gap-3">
                       {slideshowImages.map((src, i) => (
                          <div 
                             key={src + i} 
                             draggable
                             onDragStart={() => setDraggingSlideIdx(i)}
                             onDragEnter={(e) => {
                               e.preventDefault();
                               if (draggingSlideIdx === null || draggingSlideIdx === i) return;
                               const newImages = [...slideshowImages];
                               const item = newImages.splice(draggingSlideIdx, 1)[0];
                               newImages.splice(i, 0, item);
                               setDraggingSlideIdx(i);
                               setSlideshowImages(newImages);
                             }}
                             onDragOver={(e) => e.preventDefault()}
                             onDragEnd={() => setDraggingSlideIdx(null)}
                             className={`relative w-24 h-24 bg-stone-200 rounded-xl overflow-hidden border border-stone-300 group cursor-move ${draggingSlideIdx === i ? 'opacity-50' : 'opacity-100'}`}
                          >
                             <img src={src} className="w-full h-full object-cover pointer-events-none" />
                             <button type="button" onClick={() => setSlideshowImages(prev => prev.filter((_, idx) => idx !== i))} className="absolute inset-0 bg-red-600/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity font-bold text-sm">Xóa</button>
                          </div>
                       ))}
                       <button type="button" className="w-24 h-24 rounded-xl border-2 border-dashed border-stone-300 text-stone-400 hover:border-stone-500 hover:text-stone-600 flex flex-col items-center justify-center gap-1 transition-colors relative overflow-hidden" onClick={() => document.getElementById('slideUpload')?.click()}>
                          {slideProgress > 0 && slideProgress < 100 && <div className="absolute top-0 left-0 bottom-0 bg-stone-300 pointer-events-none" style={{ width: `${slideProgress}%` }}></div>}
                          <div className="text-2xl relative z-10">+</div>
                          <div className="text-xs font-semibold relative z-10 px-1 text-center">{slideProgress > 0 && slideProgress < 100 ? `${slideProgress}%` : 'Thêm ảnh'}</div>
                       </button>
                    </div>
                    <input type="file" id="slideUpload" className="hidden" accept="image/*" multiple onChange={async (e) => {
                      if (!e.target.files?.length) return;
                      const newUploads = [];
                      for (let i = 0; i < e.target.files.length; i++) {
                         try {
                           const url = await uploadWithProgress(e.target.files[i], setSlideProgress);
                           newUploads.push(url);
                         } catch (err) {
                           console.error(err);
                         }
                      }
                      if (newUploads.length) setSlideshowImages(prev => [...prev, ...newUploads]);
                      setSlideProgress(0);
                      e.target.value = '';
                    }} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-2">Favicon (Icon tab trình duyệt)</label>
                  <div className="flex flex-wrap gap-4 items-center">
                    {faviconUrlPreview && <img src={faviconUrlPreview} className="w-16 h-16 rounded-xl object-contain border border-stone-200 shadow-sm" />}
                    <button type="button" className={`w-16 h-16 rounded-xl flex items-center justify-center relative overflow-hidden transition-colors border shadow-sm ${faviconProgress === 100 ? 'border-emerald-300 bg-emerald-50 text-emerald-600' : 'border-stone-300 bg-stone-50 text-stone-500 hover:bg-stone-100'}`} onClick={() => document.getElementById('faviconUpload')?.click()}>
                        {faviconProgress > 0 && faviconProgress < 100 && <div className="absolute left-0 bottom-0 right-0 bg-stone-200 transition-all duration-300" style={{ height: `${faviconProgress}%` }}></div>}
                        <span className="relative z-10 font-bold text-[10px] flex flex-col items-center gap-1"><Upload className="w-5 h-5"/> {faviconProgress > 0 && faviconProgress < 100 ? `${faviconProgress}%` : ''}</span>
                    </button>
                    {faviconUrlPreview && <button type="button" onClick={() => { setFaviconUrlPreview(''); setFaviconProgress(0); (document.getElementById('faviconUpload') as HTMLInputElement).value = ''; }} className="w-10 h-10 bg-red-100 text-red-700 rounded-full flex items-center justify-center hover:bg-red-200 transition-colors"><X className="w-5 h-5"/></button>}
                    <input type="hidden" name="faviconUrl" value={faviconUrlPreview} />
                    <input type="file" id="faviconUpload" className="hidden" accept="image/*" onChange={async (e) => {
                      if (!e.target.files?.[0]) return;
                      try {
                        const url = await uploadWithProgress(e.target.files[0], setFaviconProgress);
                        setFaviconUrlPreview(url);
                      } catch (err) {
                        alert('Lỗi upload');
                        setFaviconProgress(0);
                      }
                    }} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-2">Thumbnail Website (Ảnh khi share link)</label>
                  <div className="flex flex-wrap gap-4 items-center">
                    {ogImageUrlPreview && <img src={ogImageUrlPreview} className="w-24 h-16 rounded-xl object-cover border border-stone-200 shadow-sm" />}
                    <button type="button" className={`w-16 h-16 rounded-xl flex items-center justify-center relative overflow-hidden transition-colors border shadow-sm ${ogImageProgress === 100 ? 'border-emerald-300 bg-emerald-50 text-emerald-600' : 'border-stone-300 bg-stone-50 text-stone-500 hover:bg-stone-100'}`} onClick={() => document.getElementById('ogImageUpload')?.click()}>
                        {ogImageProgress > 0 && ogImageProgress < 100 && <div className="absolute left-0 bottom-0 right-0 bg-stone-200 transition-all duration-300" style={{ height: `${ogImageProgress}%` }}></div>}
                        <span className="relative z-10 font-bold text-[10px] flex flex-col items-center gap-1"><Upload className="w-5 h-5"/> {ogImageProgress > 0 && ogImageProgress < 100 ? `${ogImageProgress}%` : ''}</span>
                    </button>
                    {ogImageUrlPreview && <button type="button" onClick={() => { setOgImageUrlPreview(''); setOgImageProgress(0); (document.getElementById('ogImageUpload') as HTMLInputElement).value = ''; }} className="w-10 h-10 bg-red-100 text-red-700 rounded-full flex items-center justify-center hover:bg-red-200 transition-colors"><X className="w-5 h-5"/></button>}
                    <input type="hidden" name="ogImageUrl" value={ogImageUrlPreview} />
                    <input type="file" id="ogImageUpload" className="hidden" accept="image/*" onChange={async (e) => {
                      if (!e.target.files?.[0]) return;
                      try {
                        const url = await uploadWithProgress(e.target.files[0], setOgImageProgress);
                        setOgImageUrlPreview(url);
                      } catch (err) {
                        alert('Lỗi upload');
                        setOgImageProgress(0);
                      }
                    }} />
                  </div>
                  <p className="text-xs text-stone-500 mt-2">Ảnh dùng làm thumbnail khi share link web lên Facebook, Zalo, Twitter. Thường là ảnh chụp màn hình giao diện PC.</p>
                </div>
                <hr className="border-stone-200" />
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-2">Link Playlist YouTube (Nhạc đã phát hành)</label>
                  <input name="youtubePlaylistUrl" defaultValue={data.youtubePlaylistUrl} className="w-full border border-stone-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-stone-900" placeholder="https://youtube.com/playlist?list=..." />
                  <p className="text-sm text-stone-500 mt-2">Sẽ tự động hiển thị 4 bài hát mới nhất từ playlist này.</p>
                </div>
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-2">Link Profile Spotify</label>
                  <input name="spotifyUrl" defaultValue={data.spotifyUrl} className="w-full border border-stone-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-stone-900" placeholder="https://open.spotify.com/artist/..." />
                </div>
                <hr className="border-stone-200" />
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-2">Mật khẩu chung cho các Demo</label>
                  <input name="globalPassword" defaultValue={data.globalPassword} className="w-full border border-stone-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-stone-900 font-mono" placeholder="Để trống nếu không muốn dùng mật khẩu chung" />
                  <p className="text-sm text-stone-500 mt-2">Tất cả các link ở trang chủ nếu chưa đặt mật khẩu riêng thì sẽ được bảo vệ bởi mật khẩu chung này.</p>
                </div>
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-2">URL Gốc cho Tài nguyên (Tùy chọn)</label>
                  <input name="globalBaseUrl" defaultValue={data.globalBaseUrl} className="w-full border border-stone-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-stone-900 font-mono" placeholder="Ví dụ: https://files.yourdomain.com" />
                  <p className="text-sm text-stone-500 mt-2">Dùng để đồng bộ nếu host file ở server khác. Nếu link nhạc/ảnh là đường dẫn tương đối (bắt đầu bằng /), hệ thống sẽ thêm URL Gốc này vào trước (nếu có).</p>
                </div>
                <div className="flex items-center gap-4 border-t border-stone-200 pt-6 mt-2">
                    <button type="submit" className="bg-stone-900 text-white px-6 py-3 rounded-xl font-medium hover:bg-stone-800 transition-colors">Lưu thay đổi</button>
                </div>
              </form>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

// ---- ADMIN CREATE DEMO ----
function AdminCreateDemo() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [isSlugEdited, setIsSlugEdited] = useState(false);

  const [audioUploadProgress, setAudioUploadProgress] = useState(0);
  const [uploadedAudioUrl, setUploadedAudioUrl] = useState('');
  const [coverUploadProgress, setCoverUploadProgress] = useState(0);
  const [uploadedCoverUrl, setUploadedCoverUrl] = useState('');
  const [bgUploadProgress, setBgUploadProgress] = useState(0);
  const [uploadedBgUrl, setUploadedBgUrl] = useState('');

  const generateSlug = (text: string) => {
    return text.toString()
      .normalize('NFD') // split an accented letter in the base letter and the accent
      .replace(/[\u0300-\u036f]/g, '') // remove all previously split accents
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9 ]/g, '') // remove all chars not letters, numbers and spaces
      .replace(/\s+/g, '-');
  };

  useEffect(() => {
    if (!isSlugEdited) {
      setSlug(generateSlug(title));
    }
  }, [title, isSlugEdited]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'audio' | 'cover' | 'background') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 30 * 1024 * 1024) { // 30MB limit check client-side
        alert('File quá nặng. Vui lòng chọn file dưới 30MB (Khuyên dùng MP3).');
        e.target.value = '';
        return;
    }

    const formData = new FormData();
    formData.append('file', file);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/upload', true);

    xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
            let percent = Math.round((event.loaded / event.total) * 100);
            if (percent === 100) percent = 99; // Giữ 99% cho đến khi xử lý xong
            if (type === 'audio') setAudioUploadProgress(percent);
            else if (type === 'cover') setCoverUploadProgress(percent);
            else setBgUploadProgress(percent);
        }
    };

    xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
            const res = JSON.parse(xhr.responseText);
            if (type === 'audio') {
                setUploadedAudioUrl(res.url);
                setAudioUploadProgress(100);
            } else if (type === 'cover') {
                setUploadedCoverUrl(res.url);
                setCoverUploadProgress(100);
            } else {
                setUploadedBgUrl(res.url);
                setBgUploadProgress(100);
            }
        } else {
            alert(xhr.status === 413 ? 'Hệ thống báo lỗi file quá lớn (Tối đa 30MB). Vui lòng dùng MP3.' : 'Lỗi tải file. Vui lòng thử lại.');
            if (type === 'audio') setAudioUploadProgress(0);
            else if (type === 'cover') setCoverUploadProgress(0);
            else setBgUploadProgress(0);
        }
    };
    
    xhr.onerror = () => {
        alert('Lỗi kết nối. Có thể mạng yếu hoặc file quá khổng lồ.');
        if (type === 'audio') setAudioUploadProgress(0);
        else if (type === 'cover') setCoverUploadProgress(0);
        else setBgUploadProgress(0);
    };

    xhr.send(formData);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!uploadedAudioUrl) return alert("Vui lòng tải lên file nhạc!");
    if (audioUploadProgress > 0 && audioUploadProgress < 100) return alert("Vui lòng đợi file nhạc tải lên xong!");
    if (coverUploadProgress > 0 && coverUploadProgress < 100) return alert("Vui lòng đợi ảnh bìa tải lên xong!");
    if (bgUploadProgress > 0 && bgUploadProgress < 100) return alert("Vui lòng đợi ảnh nền tải lên xong!");

    setLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.delete('audio'); // remove raw files from submit
    formData.delete('cover');
    formData.delete('background');
    
    formData.set('audioUrl', uploadedAudioUrl);
    formData.set('coverUrl', uploadedCoverUrl);
    formData.set('backgroundUrl', uploadedBgUrl);
    
    if (!formData.get('slug')) {
        formData.set('slug', slug);
    }
    
    try {
        const res = await fetch('/api/demos', {
            method: 'POST',
            body: formData
        });
        if (res.ok) {
            alert('Đăng demo thành công!');
            navigate('/admin');
        } else alert('Lỗi đăng bài!');
    } catch (err) {
        alert('Lỗi mạng!');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900 font-sans py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Link to="/admin" className="inline-flex items-center gap-2 text-stone-500 hover:text-stone-900 font-medium mb-8 transition-colors">
          <ArrowLeft className="w-5 h-5" /> Trở về Dashboard
        </Link>
        
        <div className="bg-white p-8 rounded-3xl border border-stone-200 shadow-xl shadow-stone-200/50">
          <h1 className="text-3xl font-bold mb-8">Demo mới</h1>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-stone-700 mb-2">Tên bài hát *</label>
              <input name="title" required value={title} onChange={e => setTitle(e.target.value)} placeholder="Nhập tên bài hát..." className="w-full border border-stone-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-stone-900 transition-shadow" />
            </div>

            <div>
              <label className="block text-sm font-bold text-stone-700 mb-2">Phần mở rộng (Link bài hát)</label>
              <div className="flex items-center gap-2 border border-stone-300 rounded-xl px-4 py-3 bg-white focus-within:border-stone-900 focus-within:ring-2 focus-within:ring-stone-900 transition-shadow">
                <span className="text-stone-400 font-mono text-sm opacity-60 hidden sm:inline">/</span>
                <input name="slug" value={slug} onChange={e => {setSlug(e.target.value); setIsSlugEdited(true);}} placeholder="ten-bai-hat..." className="w-full focus:outline-none bg-transparent" />
              </div>
              <p className="text-xs text-stone-500 mt-2">Sẽ tự động tạo dựa trên tên bài hát nếu bỏ trống.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-2">Sáng tác</label>
                <input name="composer" placeholder="Sáng tác (A.C Xuân Tài)" className="w-full border border-stone-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-stone-900 transition-shadow" />
              </div>
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-2">Ca sĩ thể hiện</label>
                <input name="singer" placeholder="Ca sĩ (A.C Xuân Tài)" className="w-full border border-stone-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-stone-900 transition-shadow" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div>
                <label className="block text-sm font-bold text-stone-700 mb-2">File Nhạc (Audio) *</label>
                <div className="flex flex-wrap gap-4 items-center">
                  {(uploadedAudioUrl || audioUploadProgress === 100) && <div className="w-16 h-16 rounded-xl bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-500 shadow-sm"><FileAudio className="w-8 h-8"/></div>}
                  <button type="button" className={`w-16 h-16 rounded-xl flex items-center justify-center relative overflow-hidden transition-colors border shadow-sm ${audioUploadProgress === 100 ? 'border-emerald-300 bg-emerald-50 text-emerald-600' : 'border-stone-300 bg-stone-50 text-stone-500 hover:bg-stone-100'}`} onClick={() => document.getElementById('audioCreateUpload')?.click()}>
                      {audioUploadProgress > 0 && audioUploadProgress < 100 && <div className="absolute left-0 bottom-0 right-0 bg-stone-200 transition-all duration-300" style={{ height: `${audioUploadProgress}%` }}></div>}
                      <span className="relative z-10 font-bold text-[10px] flex flex-col items-center gap-1"><Upload className="w-5 h-5"/> {audioUploadProgress > 0 && audioUploadProgress < 100 ? `${audioUploadProgress}%` : ''}</span>
                  </button>
                  {(uploadedAudioUrl || audioUploadProgress === 100) && <button type="button" onClick={() => { setUploadedAudioUrl(''); setAudioUploadProgress(0); (document.getElementById('audioCreateUpload') as HTMLInputElement).value = ''; }} className="w-10 h-10 bg-red-100 text-red-700 rounded-full flex items-center justify-center hover:bg-red-200 transition-colors"><X className="w-5 h-5"/></button>}
                  <input type="file" id="audioCreateUpload" name="audio" accept="audio/mp3,audio/wav,audio/*" required={!uploadedAudioUrl} onChange={e => handleFileUpload(e, 'audio')} className="hidden" />
                </div>
              </div>

               <div>
                <label className="block text-sm font-bold text-stone-700 mb-2">Ảnh Bìa</label>
                <div className="flex flex-wrap gap-4 items-center">
                  {uploadedCoverUrl && <img src={uploadedCoverUrl} className="w-16 h-16 rounded-xl object-cover border border-stone-200 shadow-sm" />}
                  <button type="button" className={`w-16 h-16 rounded-xl flex items-center justify-center relative overflow-hidden transition-colors border shadow-sm ${coverUploadProgress === 100 ? 'border-emerald-300 bg-emerald-50 text-emerald-600' : 'border-stone-300 bg-stone-50 text-stone-500 hover:bg-stone-100'}`} onClick={() => document.getElementById('coverCreateUpload')?.click()}>
                      {coverUploadProgress > 0 && coverUploadProgress < 100 && <div className="absolute left-0 bottom-0 right-0 bg-stone-200 transition-all duration-300" style={{ height: `${coverUploadProgress}%` }}></div>}
                      <span className="relative z-10 font-bold text-[10px] flex flex-col items-center gap-1"><Upload className="w-5 h-5"/> {coverUploadProgress > 0 && coverUploadProgress < 100 ? `${coverUploadProgress}%` : ''}</span>
                  </button>
                  {uploadedCoverUrl && <button type="button" onClick={() => { setUploadedCoverUrl(''); setCoverUploadProgress(0); (document.getElementById('coverCreateUpload') as HTMLInputElement).value = ''; }} className="w-10 h-10 bg-red-100 text-red-700 rounded-full flex items-center justify-center hover:bg-red-200 transition-colors"><X className="w-5 h-5"/></button>}
                  <input type="hidden" name="coverUrl" value={uploadedCoverUrl} />
                  <input type="file" id="coverCreateUpload" name="cover" accept="image/*" onChange={e => handleFileUpload(e, 'cover')} className="hidden" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div>
                <label className="block text-sm font-bold text-stone-700 mb-2">Ảnh Nền</label>
                <div className="flex flex-wrap gap-4 items-center">
                  {uploadedBgUrl && <img src={uploadedBgUrl} className="w-16 h-16 rounded-xl object-cover border border-stone-200 shadow-sm" />}
                  <button type="button" className={`w-16 h-16 rounded-xl flex items-center justify-center relative overflow-hidden transition-colors border shadow-sm ${bgUploadProgress === 100 ? 'border-emerald-300 bg-emerald-50 text-emerald-600' : 'border-stone-300 bg-stone-50 text-stone-500 hover:bg-stone-100'}`} onClick={() => document.getElementById('bgCreateUpload')?.click()}>
                      {bgUploadProgress > 0 && bgUploadProgress < 100 && <div className="absolute left-0 bottom-0 right-0 bg-stone-200 transition-all duration-300" style={{ height: `${bgUploadProgress}%` }}></div>}
                      <span className="relative z-10 font-bold text-[10px] flex flex-col items-center gap-1"><Upload className="w-5 h-5"/> {bgUploadProgress > 0 && bgUploadProgress < 100 ? `${bgUploadProgress}%` : ''}</span>
                  </button>
                  {uploadedBgUrl && <button type="button" onClick={() => { setUploadedBgUrl(''); setBgUploadProgress(0); (document.getElementById('bgCreateUpload') as HTMLInputElement).value = ''; }} className="w-10 h-10 bg-red-100 text-red-700 rounded-full flex items-center justify-center hover:bg-red-200 transition-colors"><X className="w-5 h-5"/></button>}
                  <input type="hidden" name="backgroundUrl" value={uploadedBgUrl} />
                  <input type="file" id="bgCreateUpload" name="background" accept="image/*" onChange={e => handleFileUpload(e, 'background')} className="hidden" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-stone-700 mb-2">Lời bài hát</label>
              <textarea name="lyrics" rows={6} placeholder="Nhập lời bài hát (nếu có)..." className="w-full border border-stone-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-stone-900 transition-shadow leading-relaxed"></textarea>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-stone-100">
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-2">Trạng thái</label>
                <select name="status" className="w-full border border-stone-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-stone-900 bg-white">
                  <option value="public">Công khai</option>
                  <option value="hidden">Ẩn</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-stone-700 mb-2">Template Giao Diện</label>
                <select name="template" className="w-full border border-stone-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-stone-900 bg-white">
                  <option value="1">Vui vẻ (Ấm áp)</option>
                  <option value="2">Căng Cực (Sôi động)</option>
                  <option value="3">Buồn (Sâu lắng)</option>
                  <option value="4">Thư giãn (Nhẹ nhàng)</option>
                  <option value="5">Đáng yêu (Đỏ, Nhảy múa)</option>
                  <option value="6">Hạnh Phúc (Hồng, Hoa rơi)</option>
                  <option value="7">Học Đường (Trắng, Lá vàng rơi)</option>
                  <option value="8">Tổ Quốc (Đỏ, Cờ phấp phới)</option>
                  <option value="9">Bầu trời xanh (Mây trắng)</option>
                  <option value="10">Hip Hop (Đường phố)</option>
                  <option value="11">Kỳ bí (Đen vàng, Trăng khói mưa)</option>
                  <option value="12">Cổ điển (Nâu, retro đĩa than quay)</option>
                  <option value="13">Hoàng hôn (Cam đỏ trời chiều, lá rụng)</option>
                  <option value="14">Đại Dương (Sóng biển dập dồn, vỏ sò rơi)</option>
                  <option value="15">Retro 8-Bit (Game Nhật Bản, tay cầm rơi)</option>
                </select>
              </div>

               <div>
                <label className="block text-sm font-bold text-stone-700 mb-2">Mật khẩu (tùy chọn)</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 w-5 h-5 text-stone-400" />
                  <input name="password" placeholder="Bỏ trống nếu không cần" className="w-full border border-stone-300 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-stone-900 transition-shadow" />
                </div>
              </div>
              
               <div>
                <label className="block text-sm font-bold text-stone-700 mb-2">Trạng thái bài hát</label>
                <label className="flex items-center gap-3 cursor-pointer mt-3">
                  <div className="relative">
                    <input type="checkbox" name="isReleased" value="true" className="w-6 h-6 rounded border-stone-300 text-emerald-600 focus:ring-emerald-500 transition-all cursor-pointer" />
                  </div>
                  <span className="font-medium text-stone-900 border border-stone-300 px-3 py-1 rounded-lg">Đã phát hành</span>
                </label>
              </div>
            </div>

            <button disabled={loading} type="submit" className="w-full bg-stone-900 text-white text-lg font-bold py-4 rounded-xl hover:bg-stone-800 transition-colors disabled:opacity-80 flex flex-col justify-center items-center gap-1 mt-8">
              {loading ? 'Đang xuất bản...' : 'Xuất Bản Demo'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ---- ADMIN EDIT DEMO ----
function AdminEditDemo() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [demo, setDemo] = useState<DemoSong | null>(null);

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [isSlugEdited, setIsSlugEdited] = useState(false);
  
  const [audioUploadProgress, setAudioUploadProgress] = useState(0);
  const [uploadedAudioUrl, setUploadedAudioUrl] = useState('');
  const [coverUploadProgress, setCoverUploadProgress] = useState(0);
  const [uploadedCoverUrl, setUploadedCoverUrl] = useState('');
  const [bgUploadProgress, setBgUploadProgress] = useState(0);
  const [uploadedBgUrl, setUploadedBgUrl] = useState('');

  useEffect(() => {
    fetch('/api/admin/data')
      .then(res => res.json())
      .then(data => {
        const found = data.demos.find((d: any) => d.id === id);
        if (found) {
          setDemo(found);
          setTitle(found.title || '');
          setSlug(found.slug || '');
          setIsSlugEdited(!!found.slug);
          setUploadedCoverUrl(found.coverUrl || '');
          setUploadedBgUrl(found.backgroundUrl || '');
        }
      });
  }, [id]);

  const generateSlug = (text: string) => {
    return text.toString()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9 ]/g, '')
      .replace(/\s+/g, '-');
  };

  useEffect(() => {
    if (!isSlugEdited && !demo) {
      setSlug(generateSlug(title));
    }
  }, [title, isSlugEdited, demo]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'audio' | 'cover' | 'background') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 30 * 1024 * 1024) { // 30MB limit check client-side
        alert('File quá nặng. Vui lòng chọn file dưới 30MB (Khuyên dùng MP3).');
        e.target.value = '';
        return;
    }

    const formData = new FormData();
    formData.append('file', file);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/upload', true);

    xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
            let percent = Math.round((event.loaded / event.total) * 100);
            if (percent === 100) percent = 99; // Giữ 99% cho đến khi xử lý xong
            if (type === 'audio') setAudioUploadProgress(percent);
            else if (type === 'cover') setCoverUploadProgress(percent);
            else setBgUploadProgress(percent);
        }
    };

    xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
            const res = JSON.parse(xhr.responseText);
            if (type === 'audio') {
                setUploadedAudioUrl(res.url);
                setAudioUploadProgress(100);
            } else if (type === 'cover') {
                setUploadedCoverUrl(res.url);
                setCoverUploadProgress(100);
            } else {
                setUploadedBgUrl(res.url);
                setBgUploadProgress(100);
            }
        } else {
            alert(xhr.status === 413 ? 'Hệ thống báo lỗi file quá lớn (Tối đa 30MB). Vui lòng dùng MP3.' : 'Lỗi tải file. Vui lòng thử lại.');
            if (type === 'audio') setAudioUploadProgress(0);
            else if (type === 'cover') setCoverUploadProgress(0);
            else setBgUploadProgress(0);
        }
    };
    
    xhr.onerror = () => {
        alert('Lỗi kết nối. Có thể mạng yếu hoặc file quá khổng lồ.');
        if (type === 'audio') setAudioUploadProgress(0);
        else if (type === 'cover') setCoverUploadProgress(0);
        else setBgUploadProgress(0);
    };

    xhr.send(formData);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (audioUploadProgress > 0 && audioUploadProgress < 100) {
        return alert("Vui lòng đợi file nhạc tải lên xong!");
    }
    if (coverUploadProgress > 0 && coverUploadProgress < 100) {
        return alert("Vui lòng đợi ảnh bìa tải lên xong!");
    }
    if (bgUploadProgress > 0 && bgUploadProgress < 100) {
        return alert("Vui lòng đợi ảnh nền tải lên xong!");
    }
    
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.delete('audio'); // not sending file binary in this request
    formData.delete('cover');
    formData.delete('background');
    
    if (uploadedAudioUrl) formData.set('audioUrl', uploadedAudioUrl);
    formData.set('coverUrl', uploadedCoverUrl);
    formData.set('backgroundUrl', uploadedBgUrl);

    if (!formData.get('slug')) {
        formData.set('slug', slug);
    }
    
    try {
        const res = await fetch(`/api/demos/${id}/update`, {
            method: 'POST',
            body: formData
        });
        if (res.ok) {
            alert('Cập nhật thành công!');
            navigate('/admin');
        } else alert('Lỗi cập nhật. Thử tải lại trang và làm lại!');
    } catch(err) {
        alert('Lỗi mạng!');
    }
    setLoading(false);
  };

  if (!demo) return <div className="min-h-screen bg-stone-100 flex items-center justify-center">Đang tải...</div>;

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900 font-sans py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Link to="/admin" className="inline-flex items-center gap-2 text-stone-500 hover:text-stone-900 font-medium mb-8 transition-colors">
          <ArrowLeft className="w-5 h-5" /> Trở về Dashboard
        </Link>
        
        <div className="bg-white p-8 rounded-3xl border border-stone-200 shadow-xl shadow-stone-200/50">
          <h1 className="text-3xl font-bold mb-8">Chỉnh Sửa Demo</h1>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-stone-700 mb-2">Tên bài hát *</label>
              <input name="title" required value={title} onChange={e => setTitle(e.target.value)} placeholder="Nhập tên bài hát..." className="w-full border border-stone-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-stone-900 transition-shadow" />
            </div>

            <div>
              <label className="block text-sm font-bold text-stone-700 mb-2">Phần mở rộng (Link bài hát)</label>
              <div className="flex items-center gap-2 border border-stone-300 rounded-xl px-4 py-3 bg-white focus-within:border-stone-900 focus-within:ring-2 focus-within:ring-stone-900 transition-shadow">
                <span className="text-stone-400 font-mono text-sm opacity-60 hidden sm:inline">/</span>
                <input name="slug" value={slug} onChange={e => {setSlug(e.target.value); setIsSlugEdited(true);}} placeholder="ten-bai-hat..." className="w-full focus:outline-none bg-transparent" />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-2">Sáng tác</label>
                <input name="composer" defaultValue={demo.composer} placeholder="Sáng tác (A.C Xuân Tài)" className="w-full border border-stone-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-stone-900 transition-shadow" />
              </div>
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-2">Ca sĩ thể hiện</label>
                <input name="singer" defaultValue={demo.singer} placeholder="Ca sĩ (A.C Xuân Tài)" className="w-full border border-stone-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-stone-900 transition-shadow" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
               <div>
                <label className="block text-sm font-bold text-stone-700 mb-2">File Nhạc Mới (Nếu muốn thay đổi)</label>
                <div className="flex flex-wrap gap-4 items-center">
                  {(uploadedAudioUrl || audioUploadProgress === 100) && <div className="w-16 h-16 rounded-xl bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-500 shadow-sm"><FileAudio className="w-8 h-8"/></div>}
                  <button type="button" className={`w-16 h-16 rounded-xl flex items-center justify-center relative overflow-hidden transition-colors border shadow-sm ${audioUploadProgress === 100 ? 'border-emerald-300 bg-emerald-50 text-emerald-600' : 'border-stone-300 bg-stone-50 text-stone-500 hover:bg-stone-100'}`} onClick={() => document.getElementById('audioEditUpload')?.click()}>
                      {audioUploadProgress > 0 && audioUploadProgress < 100 && <div className="absolute left-0 bottom-0 right-0 bg-stone-200 transition-all duration-300" style={{ height: `${audioUploadProgress}%` }}></div>}
                      <span className="relative z-10 font-bold text-[10px] flex flex-col items-center gap-1"><Upload className="w-5 h-5"/> {audioUploadProgress > 0 && audioUploadProgress < 100 ? `${audioUploadProgress}%` : ''}</span>
                  </button>
                  {(uploadedAudioUrl || audioUploadProgress === 100) && <button type="button" onClick={() => { setUploadedAudioUrl(''); setAudioUploadProgress(0); (document.getElementById('audioEditUpload') as HTMLInputElement).value = ''; }} className="w-10 h-10 bg-red-100 text-red-700 rounded-full flex items-center justify-center hover:bg-red-200 transition-colors"><X className="w-5 h-5"/></button>}
                  <input type="file" id="audioEditUpload" name="audio" accept="audio/mp3,audio/wav,audio/*" onChange={e => handleFileUpload(e, 'audio')} className="hidden" />
                </div>
              </div>

               <div>
                <label className="block text-sm font-bold text-stone-700 mb-2">Ảnh Bìa Mới (Tùy chọn)</label>
                <div className="flex flex-wrap gap-4 items-center">
                  {uploadedCoverUrl && <img src={uploadedCoverUrl} className="w-16 h-16 rounded-xl object-cover border border-stone-200 shadow-sm" />}
                  <button type="button" className={`w-16 h-16 rounded-xl flex items-center justify-center relative overflow-hidden transition-colors border shadow-sm ${coverUploadProgress === 100 ? 'border-emerald-300 bg-emerald-50 text-emerald-600' : 'border-stone-300 bg-stone-50 text-stone-500 hover:bg-stone-100'}`} onClick={() => document.getElementById('coverEditUpload')?.click()}>
                      {coverUploadProgress > 0 && coverUploadProgress < 100 && <div className="absolute left-0 bottom-0 right-0 bg-stone-200 transition-all duration-300" style={{ height: `${coverUploadProgress}%` }}></div>}
                      <span className="relative z-10 font-bold text-[10px] flex flex-col items-center gap-1"><Upload className="w-5 h-5"/> {coverUploadProgress > 0 && coverUploadProgress < 100 ? `${coverUploadProgress}%` : ''}</span>
                  </button>
                  {uploadedCoverUrl && <button type="button" onClick={() => { setUploadedCoverUrl(''); setCoverUploadProgress(0); (document.getElementById('coverEditUpload') as HTMLInputElement).value = ''; }} className="w-10 h-10 bg-red-100 text-red-700 rounded-full flex items-center justify-center hover:bg-red-200 transition-colors"><X className="w-5 h-5"/></button>}
                  <input type="hidden" name="coverUrl" value={uploadedCoverUrl} />
                  <input type="file" id="coverEditUpload" name="cover" accept="image/*" onChange={e => handleFileUpload(e, 'cover')} className="hidden" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
               <div>
                <label className="block text-sm font-bold text-stone-700 mb-2">Ảnh Nền Mới (Tùy chọn)</label>
                <div className="flex flex-wrap gap-4 items-center">
                  {uploadedBgUrl && <img src={uploadedBgUrl} className="w-16 h-16 rounded-xl object-cover border border-stone-200 shadow-sm" />}
                  <button type="button" className={`w-16 h-16 rounded-xl flex items-center justify-center relative overflow-hidden transition-colors border shadow-sm ${bgUploadProgress === 100 ? 'border-emerald-300 bg-emerald-50 text-emerald-600' : 'border-stone-300 bg-stone-50 text-stone-500 hover:bg-stone-100'}`} onClick={() => document.getElementById('bgEditUpload')?.click()}>
                      {bgUploadProgress > 0 && bgUploadProgress < 100 && <div className="absolute left-0 bottom-0 right-0 bg-stone-200 transition-all duration-300" style={{ height: `${bgUploadProgress}%` }}></div>}
                      <span className="relative z-10 font-bold text-[10px] flex flex-col items-center gap-1"><Upload className="w-5 h-5"/> {bgUploadProgress > 0 && bgUploadProgress < 100 ? `${bgUploadProgress}%` : ''}</span>
                  </button>
                  {uploadedBgUrl && <button type="button" onClick={() => { setUploadedBgUrl(''); setBgUploadProgress(0); (document.getElementById('bgEditUpload') as HTMLInputElement).value = ''; }} className="w-10 h-10 bg-red-100 text-red-700 rounded-full flex items-center justify-center hover:bg-red-200 transition-colors"><X className="w-5 h-5"/></button>}
                  <input type="hidden" name="backgroundUrl" value={uploadedBgUrl} />
                  <input type="file" id="bgEditUpload" name="background" accept="image/*" onChange={e => handleFileUpload(e, 'background')} className="hidden" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-stone-700 mb-2">Lời bài hát</label>
              <textarea name="lyrics" rows={6} defaultValue={demo.lyrics} placeholder="Nhập lời bài hát (nếu có)..." className="w-full border border-stone-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-stone-900 transition-shadow leading-relaxed"></textarea>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-stone-100">
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-2">Trạng thái</label>
                <select name="status" defaultValue={demo.status} className="w-full border border-stone-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-stone-900 bg-white">
                  <option value="public">Công khai</option>
                  <option value="hidden">Ẩn</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-stone-700 mb-2">Template Giao Diện</label>
                <select name="template" defaultValue={demo.template} className="w-full border border-stone-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-stone-900 bg-white">
                  <option value="1">Vui vẻ (Ấm áp)</option>
                  <option value="2">Căng Cực (Sôi động)</option>
                  <option value="3">Buồn (Sâu lắng)</option>
                  <option value="4">Thư giãn (Nhẹ nhàng)</option>
                  <option value="5">Đáng yêu (Đỏ, Nhảy múa)</option>
                  <option value="6">Hạnh Phúc (Hồng, Hoa rơi)</option>
                  <option value="7">Học Đường (Trắng, Lá vàng rơi)</option>
                  <option value="8">Tổ Quốc (Đỏ, Cờ phấp phới)</option>
                  <option value="9">Bầu trời xanh (Mây trắng)</option>
                  <option value="10">Hip Hop (Đường phố)</option>
                  <option value="11">Kỳ bí (Đen vàng, Trăng khói mưa)</option>
                  <option value="12">Cổ điển (Nâu, retro đĩa than quay)</option>
                  <option value="13">Hoàng hôn (Cam đỏ trời chiều, lá rụng)</option>
                  <option value="14">Đại Dương (Sóng biển dập dồn, vỏ sò rơi)</option>
                  <option value="15">Retro 8-Bit (Game Nhật Bản, tay cầm rơi)</option>
                </select>
              </div>

               <div>
                <label className="block text-sm font-bold text-stone-700 mb-2">Mật khẩu (tùy chọn)</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 w-5 h-5 text-stone-400" />
                  <input name="password" defaultValue={demo.passwordValue || demo.password as any} placeholder="Bỏ trống nếu không cần" className="w-full border border-stone-300 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-stone-900 transition-shadow" />
                </div>
              </div>
              
               <div>
                <label className="block text-sm font-bold text-stone-700 mb-2">Trạng thái bài hát</label>
                <label className="flex items-center gap-3 cursor-pointer mt-3">
                  <div className="relative">
                    <input type="checkbox" name="isReleased" value="true" defaultChecked={demo.isReleased} className="w-6 h-6 rounded border-stone-300 text-emerald-600 focus:ring-emerald-500 transition-all cursor-pointer" />
                  </div>
                  <span className="font-medium text-stone-900 border border-stone-300 px-3 py-1 rounded-lg">Đã phát hành</span>
                </label>
              </div>
            </div>

            <button disabled={loading} type="submit" className="w-full bg-stone-900 text-white text-lg font-bold py-4 rounded-xl hover:bg-stone-800 transition-colors disabled:opacity-80 flex flex-col justify-center items-center gap-1 mt-8">
              {loading ? 'Đang lưu...' : 'Lưu Thay Đổi'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
