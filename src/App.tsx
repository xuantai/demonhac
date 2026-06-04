import React, { useState, useEffect, useRef, createContext, useContext, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Link, useParams, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Settings, Play, Music, Lock, ArrowLeft, Upload, Disc3, Plus, Trash2, Edit3, Globe } from 'lucide-react';
import { AppData, DemoSong } from './types';
import { motion, AnimatePresence } from 'motion/react';

function formatText(text: string | null | undefined) {
  const parts = text.split(/(A\.C Xuân Tài|AC Xuân Tài)/gi);
  return (
    <>
      {parts.map((part, i) => {
        const lower = part.toLowerCase();
        if (lower === 'a.c xuân tài' || lower === 'ac xuân tài') {
          return (
             <a key={i} href="https://acxuantai.com" target="_blank" rel="noreferrer" className="transition-colors hover:opacity-80">
               {part}
             </a>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}


// Global styles added in index.css

const translations: Record<string, Record<string, string>> = {
  vi: { dDesc: "Website dành cho các demo nhạc mới", btnSpot: "Nghe trên Spotify", lDemos: "Demo Mới Nhất", pReq: "Cần Mật Khẩu", pNow: "Nghe Ngay", nDemo: "Chưa có demo nào.", rMv: "MV Đã Phát Hành", nMv: "Chưa có MV nào.", lMore: "Hiển thị thêm", mList: "người nghe hàng tháng", load: "Đang tải...", back: "Trở về", adm: "AdminCP", edit: "Chỉnh sửa", pPrompt: "Cần mật khẩu", unlock: "Mở khóa", wPass: "Sai mật khẩu", lyric: "Lời bài hát", nLyric: "Chưa cập nhật lời bài hát", sAuth: "Sáng tác:", lang: "Tiếng Việt" },
  en: { dDesc: "New music demos website", btnSpot: "Listen on Spotify", lDemos: "Latest Demos", pReq: "Password", pNow: "Play Now", nDemo: "No demos yet.", rMv: "Released Music Videos", nMv: "No MVs yet.", lMore: "Load more", mList: "monthly listeners", load: "Loading...", back: "Back", adm: "Admin", edit: "Edit", pPrompt: "Password required", unlock: "Unlock", wPass: "Wrong password", lyric: "Lyrics", nLyric: "No lyrics yet", sAuth: "Composer:", lang: "English" },
  ko: { dDesc: "새로운 데모 웹사이트", btnSpot: "Spotify에서 듣기", lDemos: "최신 데모", pReq: "비밀번호", pNow: "지금 듣기", nDemo: "데모 없음", rMv: "발매된 뮤직비디오", nMv: "MV 없음", lMore: "더 보기", mList: "월간 청취자", load: "로딩 중...", back: "뒤로", adm: "관리자", edit: "편집", pPrompt: "비밀번호 필요", unlock: "잠금 해제", wPass: "잘못된 비밀번호", lyric: "가사", nLyric: "가사 없음", sAuth: "작곡가:", lang: "한국어" },
  ja: { dDesc: "新しいデモサイト", btnSpot: "Spotifyで聴く", lDemos: "最新のデモ", pReq: "パスワード", pNow: "今すぐ聴く", nDemo: "デモなし", rMv: "リリースされたMV", nMv: "MVなし", lMore: "もっと見る", mList: "月間リスナー", load: "読み込み中...", back: "戻る", adm: "管理者", edit: "編集", pPrompt: "パスワードが必要", unlock: "ロック解除", wPass: "パスワードが間違っています", lyric: "歌詞", nLyric: "歌詞なし", sAuth: "作曲:", lang: "日本語" },
  th: { dDesc: "เว็บไซต์ตัวอย่างเพลงใหม่", btnSpot: "ฟังบน Spotify", lDemos: "ตัวอย่างล่าสุด", pReq: "รหัสผ่าน", pNow: "ฟังเลย", nDemo: "ไม่มีตัวอย่าง", rMv: "มิวสิควิดีโอ", nMv: "ไม่มี MV", lMore: "โหลดเพิ่ม", mList: "ผู้ฟังรายเดือน", load: "กำลังโหลด...", back: "กลับ", adm: "แอดมิน", edit: "แก้ไข", pPrompt: "ต้องใช้รหัสผ่าน", unlock: "ปลดล็อค", wPass: "รหัสผ่านผิด", lyric: "เนื้อเพลง", nLyric: "ไม่มีเนื้อเพลง", sAuth: "แต่งโดย:", lang: "ไทย" },
  zh: { dDesc: "新音乐演示网站", btnSpot: "在Spotify收听", lDemos: "最新演示", pReq: "需要密码", pNow: "立即收听", nDemo: "暂无演示", rMv: "已发行的视频", nMv: "暂无视频", lMore: "加载更多", mList: "月度听众", load: "载入中...", back: "返回", adm: "管理", edit: "编辑", pPrompt: "需要密码", unlock: "解锁", wPass: "密码错误", lyric: "歌词", nLyric: "暂无歌词", sAuth: "作曲:", lang: "中文" }
};

interface LangContextType {
  lang: string;
  setLang: (l: string) => void;
}
const LanguageContext = createContext<LangContextType>({ lang: 'vi', setLang: () => {} });

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
  const langs = ['vi', 'en', 'ko', 'ja', 'th', 'zh'];
  return (
    <div className="absolute top-6 right-6 z-50 flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full px-3 py-1.5 backdrop-blur-md transition-colors group">
      <Globe className="w-4 h-4 text-white" />
      <select value={lang} onChange={(e) => setLang(e.target.value)} className="bg-transparent text-white font-medium outline-none appearance-none cursor-pointer pr-2">
        {langs.map(l => <option key={l} value={l} className="text-black">{translations[l].lang}</option>)}
      </select>
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
  const [showArtist, setShowArtist] = useState(false);
  const [spotifyLoaded, setSpotifyLoaded] = useState(false);
  const observer = useRef<IntersectionObserver>();

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
        document.title = data.artistName + ' - ' + t.lDemos;
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
      className="min-h-screen bg-neutral-950 text-white font-sans selection:bg-rose-500 selection:text-white relative z-0"
    >
      {data.homeCoverUrl ? (
        <div className="fixed inset-0 z-[-1] pointer-events-none">
          <div className="absolute inset-x-0 top-0 h-[80vh] min-h-[500px] bg-cover" style={{ backgroundImage: `url(${data.homeCoverUrl})`, backgroundPosition: 'center 20%' }}></div>
          <div className="absolute inset-x-0 top-0 h-[80vh] min-h-[500px] bg-gradient-to-b from-transparent via-neutral-950/60 to-neutral-950"></div>
          <div className="absolute inset-x-0 top-0 h-[80vh] min-h-[500px] bg-gradient-to-t from-neutral-950 via-transparent to-transparent"></div>
        </div>
      ) : (
        <div className="fixed inset-0 z-[-1] pointer-events-none opacity-20 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-rose-900 via-neutral-950 to-neutral-950"></div>
      )}
      <LanguageSwitcher />
      {playingVideo && (
        <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4 backdrop-blur-xl" onClick={() => setPlayingVideo(null)}>
          <div className="relative w-full max-w-5xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/20" onClick={e => e.stopPropagation()}>
            <button className="absolute -top-12 right-0 text-white/70 hover:text-white z-10 transition-colors font-bold text-xl drop-shadow-md" onClick={() => setPlayingVideo(null)}>Đóng ✕</button>
            <iframe src={`https://www.youtube.com/embed/${playingVideo}?autoplay=1`} className="w-full h-full border-0" allow="autoplay; encrypted-media" allowFullScreen></iframe>
          </div>
        </div>
      )}

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
                  {data.artistBio || t.dDesc}
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
                  {data.artistBio || t.dDesc}
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
                           <img src={spotifyInfo.image} className="w-16 h-16 rounded-full shadow-lg border border-white/20 object-cover" alt="Spotify" />
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
          <div className="flex items-center gap-3 mb-8 px-4 border-b border-white/10 pb-4">
            <Disc3 className="w-6 h-6 text-rose-500" />
            <h2 className="text-2xl font-bold tracking-tight">{t.lDemos}</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.demos.filter(d => d.status === 'public').map(demo => (
              <Link to={`/demo/${demo.slug || demo.id}`} key={demo.id} className="group relative bg-neutral-900/50 border border-white/5 hover:border-rose-500/50 rounded-2xl p-6 transition-all duration-300 hover:shadow-[0_0_30px_-5px_rgba(244,63,94,0.3)] overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-rose-500/0 to-rose-500/0 group-hover:from-rose-500/10 transition-all duration-500"></div>
                <div className="flex items-start justify-between relative z-10">
                  <div>
                    <h3 className="text-xl font-bold mb-2 group-hover:text-rose-400 transition-colors flex items-center">
                      <span className="relative inline-block">
                        {formatText(demo.title)}
                        <span className="absolute -top-3 -right-8 rotate-[15deg] bg-rose-600 text-[8px] font-black text-white px-1 py-0.5 rounded shadow-[0_0_10px_rgba(225,29,72,0.8)] animate-[pulse_2s_ease-in-out_infinite] tracking-widest border border-white/20 select-none">
                          DEMO
                        </span>
                      </span>
                    </h3>
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-500 mt-3">
                      {demo.password ? (
                        <span className="flex items-center gap-1 text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded-full"><Lock className="w-3 h-3" /> {t.pReq}</span>
                      ) : (
                        <span className="flex items-center gap-1 text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full"><Play className="w-3 h-3" /> {t.pNow}</span>
                      )}
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-rose-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 transition-all duration-300">
                    <Play className="w-5 h-5 ml-1" />
                  </div>
                </div>
              </Link>
            ))}
            {data.demos.filter(d => d.status === 'public').length === 0 && (
              <div className="col-span-full py-12 text-center text-neutral-600 border border-dashed border-white/10 rounded-2xl">
                {t.nDemo}
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
    </motion.div>
  );
}

function CustomAudioPlayer({ src, template }: { src: string, template: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);

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

  return (
    <div className={`flex flex-col w-full gap-2 md:gap-4 ${isLight ? 'text-stone-900 font-extrabold drop-shadow-sm' : 'text-white font-extrabold drop-shadow-md'}`}>
      <audio 
        ref={audioRef} 
        src={src} 
        autoPlay 
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
      />
      
      {/* Wave visualizer */}
      <div className="flex items-end justify-between h-5 md:h-6 w-full mb-0">
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
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 flex items-center justify-center">
       <div className="absolute inset-0 opacity-40 mix-blend-overlay bg-[linear-gradient(45deg,transparent,rgba(255,255,255,0.4),transparent)] animate-[pulse_4s_infinite_linear]" style={{ backgroundSize: '150% 150%' }}></div>
       <div className="fixed inset-0 flex flex-col items-center justify-center pointer-events-none z-0 opacity-60">
         <svg viewBox="0 0 100 100" className="w-[100vw] h-[100vw] max-w-[500px] max-h-[500px] text-yellow-500 drop-shadow-[0_0_80px_rgba(250,204,21,0.6)]" fill="currentColor">
           <polygon points="50,0 61.23,34.55 97.55,34.55 68.16,55.9 79.39,90.45 50,69.1 20.61,90.45 31.84,55.9 2.45,34.55 38.77,34.55" />
         </svg>
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
function DemoPlayer() {
  const { lang } = useContext(LanguageContext);
  const t = translations[lang] || translations['vi'];
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isAdmin = searchParams.get('admin') === '1';
  const [demo, setDemo] = useState<DemoSong | null>(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/demos/${id}`)
      .then(res => res.json())
      .then(data => {
        setDemo(data);
        if (!data.requiresPassword) setUnlocked(true);
        setLoading(false);
        if (data && data.title) {
          const suffix = data.singer || data.author || 'Demo Nhạc Mới';
          document.title = `${data.title} - ${suffix}`;
        }
      });
  }, [id]);

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

  if (loading) return <div className="min-h-screen bg-black text-white flex items-center justify-center">{t.load}</div>;
  if (!demo) return <div className="min-h-screen bg-black text-white flex items-center justify-center">Không tìm thấy demo</div>;

  // Templates
  const templateType = demo.template || '1';
  const isLight = templateType === '1' || templateType === '4' || templateType === '6' || templateType === '7';
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
    themeClasses = "bg-teal-50 text-teal-900 bg-[radial-gradient(circle_at_bottom_right,_var(--tw-gradient-stops))] from-teal-100 to-teal-50";
    accentClass = "bg-teal-600 text-white";
  } else if (templateType === '5') {
    themeClasses = "bg-red-500 text-white bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-rose-400 to-red-600";
    accentClass = "bg-white text-red-500";
  } else if (templateType === '6') {
    themeClasses = "bg-pink-50 text-pink-900 bg-[radial-gradient(circle_at_top_left,_var(--tw-gradient-stops))] from-fuchsia-100 to-pink-50";
    accentClass = "bg-pink-500 text-white shadow-lg shadow-pink-200";
  } else if (templateType === '7') {
    themeClasses = "bg-[#faf9f6] text-stone-800 bg-[url('https://www.transparenttextures.com/patterns/notebook.png')]";
    accentClass = "bg-stone-800 text-[#faf9f6]";
  } else if (templateType === '8') {
    themeClasses = "bg-red-600 text-yellow-50 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-red-600 via-red-500 to-red-700 [text-shadow:0_2px_4px_rgba(153,27,27,0.8)]";
    accentClass = "bg-yellow-400 text-red-900 font-bold shadow-[0_0_15px_rgba(250,204,21,0.5)]";
  } else if (templateType === '9') {
    themeClasses = "bg-sky-200 text-white drop-shadow-md bg-[linear-gradient(135deg,_var(--tw-gradient-stops))] from-sky-300 via-purple-200 to-pink-300";
    accentClass = "bg-white/80 backdrop-blur text-purple-700 shadow-xl shadow-purple-200/50";
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
        {templateType === '3' && <SnowEffect />}
        {templateType === '5' && <CuteEffect />}
        {templateType === '6' && <BlossomEffect />}
        {templateType === '7' && <LeavesEffect />}
        {templateType === '8' && <FlagEffect />}
        {templateType === '9' && <RainEffect />}
        
        {demo.coverUrl && (
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-30 blur-2xl scale-110"
            style={{ backgroundImage: `url(${demo.coverUrl})` }}
          ></div>
        )}

        <Link to="/" className={`fixed top-6 left-6 opacity-60 hover:opacity-100 flex items-center gap-2 z-20 transition-opacity font-medium ${isLight ? 'text-stone-900' : 'text-white'}`}>
          <ArrowLeft className="w-5 h-5" /> {t.back}
        </Link>

        <div className={`relative z-10 w-full max-w-md ${isLight ? 'bg-white/40' : 'bg-black/40'} backdrop-blur-xl border ${isLight ? 'border-white/40' : 'border-white/10'} p-8 rounded-[2rem] shadow-2xl`}>
          {demo.coverUrl ? (
            <div className="w-32 h-32 mx-auto mb-6 rounded-full overflow-hidden border-4 border-white/20 shadow-xl relative animate-[spin_8s_linear_infinite]">
              <img src={demo.coverUrl} className="w-full h-full object-cover" alt="Cover" />
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
          
          <p className="text-center mb-6 text-sm font-semibold opacity-70">Nhập mật khẩu để nghe demo này</p>
          
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
    <div className={`min-h-screen px-4 py-12 flex flex-col ${themeClasses} transition-colors duration-1000 overflow-hidden relative`}>
      <motion.div 
        initial={{ scaleY: 1 }} 
        animate={{ scaleY: 0 }} 
        exit={{ scaleY: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }} 
        className="fixed inset-0 z-[9999] bg-black origin-bottom pointer-events-none" 
      />

      <div className="absolute inset-0 pointer-events-none fade-in-layer opacity-0 animate-[fade_1s_forwards]" />
      {templateType === '3' && <SnowEffect />}
      {templateType === '5' && <CuteEffect />}
      {templateType === '6' && <BlossomEffect />}
      {templateType === '7' && <LeavesEffect />}
      {templateType === '8' && <FlagEffect />}
      {templateType === '9' && <RainEffect />}
      <Link to="/" className="fixed top-6 left-6 opacity-60 hover:opacity-100 flex items-center gap-2 z-10 transition-opacity font-medium">
        <ArrowLeft className="w-5 h-5" /> {t.back}
      </Link>

      {isAdmin && demo && (
        <Link to={`/admin/edit/${demo.id}`} className="fixed top-6 right-6 opacity-60 hover:opacity-100 flex items-center gap-2 z-10 transition-opacity font-medium bg-black/20 px-4 py-2 rounded-full backdrop-blur-md border border-white/10 text-white shadow-xl">
          <Edit3 className="w-4 h-4" /> {t.edit}
        </Link>
      )}
      
      <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col md:flex-row gap-4 md:gap-12 items-center md:items-start pt-6 md:pt-12 relative">
        {/* Left: Player */}
        <div className="flex-1 w-full max-w-sm flex flex-col items-center">
          <div className={`w-full max-w-[280px] aspect-square overflow-hidden mb-4 relative transition-all duration-1000 ${
            templateType === '1' ? 'shadow-glow-1 animate-[bounce_6s_infinite] rounded-3xl border-4' :
            templateType === '2' ? 'shadow-glow-2 scale-105 rounded-3xl border-4' :
            templateType === '3' ? 'shadow-2xl animate-sway rounded-lg border-[12px] opacity-90' :
            templateType === '4' ? 'shadow-2xl rounded-full border-8 animate-[spin_20s_linear_infinite]' : 
            templateType === '5' ? 'shadow-xl rounded-full border-4 animate-[bounce_2s_infinite] shadow-red-900/50' : 
            templateType === '6' ? 'shadow-[12px_12px_0_rgba(244,114,182,0.3)] rounded-l-sm rounded-r-3xl border-l-[20px] border-l-pink-400 border-pink-200 rotate-2 hover:rotate-0 transition-transform bg-white' :
            templateType === '7' ? 'shadow-[8px_8px_0px_rgba(0,0,0,0.8)] rounded-xl border-4 border-stone-800 rotate-2 hover:rotate-0 transition-transform' : 
            templateType === '8' ? 'shadow-[0_0_40px_rgba(250,204,21,0.6)] rounded-full border-4 border-yellow-400' :
            templateType === '9' ? 'shadow-xl shadow-sky-300 rounded-[2rem] border-4 border-white/80 animate-[bounce_4s_infinite]' : 'shadow-2xl rounded-3xl border-4'
          }`}>
            {demo.coverUrl ? (
              <img src={demo.coverUrl} alt="Cover" className={`w-full h-full object-cover ${templateType === '2' ? 'animate-zoom-fast' : 'animate-zoom-gentle'}`} />
            ) : (
              <div className="w-full h-full bg-black/30 flex flex-col justify-center items-center">
                <Music className="w-24 h-24 opacity-20" />
              </div>
            )}
            <div className={`absolute inset-0 ${templateType === '6' ? 'bg-gradient-to-r from-black/20 to-transparent w-8' : ''}`}></div>
            <div className={`absolute inset-0 bg-gradient-to-t from-black/60 to-transparent ${templateType === '4' || templateType === '5' || templateType === '8' ? 'rounded-full' : ''} ${templateType === '6' ? 'opacity-30' : ''}`}></div>
          </div>
          <h1 className="text-3xl font-black text-center mb-1 drop-shadow-sm flex items-center justify-center">
            <span className="relative inline-block">
              {formatText(demo.title)}
               <div className="absolute -top-3 -right-10 origin-bottom-left rotate-[15deg] bg-rose-600 text-[10px] font-black text-white px-1.5 py-0.5 rounded shadow-[0_0_15px_rgba(225,29,72,0.8)] animate-[pulse_2s_ease-in-out_infinite] tracking-widest border border-white/20 select-none">
                 DEMO
               </div>
            </span>
          </h1>
          {(demo.singer || demo.author) && <p className="text-xl font-medium text-center mb-1 opacity-90">{formatText(demo.singer || demo.author)}</p>}
          {demo.composer && <p className="text-sm font-medium text-center mb-4 md:mb-6 opacity-60">{t.sAuth} {formatText(demo.composer)}</p>}
          {!demo.singer && !demo.author && !demo.composer && <div className="mb-4 md:mb-6"></div>}
          
          <div 
            className={`fixed md:relative bottom-4 md:bottom-auto w-[calc(100%-2rem)] md:w-full rounded-[24px] shadow-[0_20px_40px_rgba(0,0,0,0.3)] border ${isLight ? 'border-black/10' : 'border-white/20'} z-50 overflow-hidden mx-auto inset-x-0 md:inset-x-auto backdrop-blur-xl`}
          >
            <div className={`absolute inset-0 ${(templateType === '2' || templateType === '5' || templateType === '8') ? 'bg-black/40' : (isLight ? 'bg-white/50' : 'bg-black/50')}`}></div>
            {demo.coverUrl && (
              <div 
                className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-overlay saturate-150"
                style={{ backgroundImage: `url(${demo.coverUrl})` }}
              ></div>
            )}
            <div className="relative z-10 px-4 py-3 md:p-5">
               <CustomAudioPlayer src={demo.audioUrl} template={templateType} />
            </div>
          </div>
        </div>

        {/* Right: Lyrics */}
        <div className="flex-1 w-full flex flex-col h-[70vh] pb-32 md:pb-0 pt-2 md:pt-0">
          <h3 className="text-sm font-bold uppercase tracking-widest opacity-50 mb-4 ml-4">{t.lyric}</h3>
          <div className="flex-1 overflow-y-auto pr-4 scrollbar-hide">
            {demo.lyrics ? (
              <pre className="whitespace-pre-wrap font-sans text-lg/relaxed sm:text-xl/loose font-medium opacity-80 pb-20 pl-4 border-l border-white/10">
                {demo.lyrics}
              </pre>
            ) : (
              <div className="h-full flex items-center justify-center opacity-30 italic">
                {t.nLyric}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---- ADMIN DASHBOARD ----
function AdminDashboard() {
  const [data, setData] = useState<AppData | null>(null);
  const [activeTab, setActiveTab] = useState<'demos'|'profile'>('demos');
  const [toast, setToast] = useState('');
  const navigate = useNavigate();

  const loadData = () => fetch('/api/admin/data').then(res => res.json()).then(setData);

  useEffect(() => { loadData(); }, []);

  const handleShare = (slugOrId: string) => {
    const url = window.location.origin + '/demo/' + slugOrId;
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
        artistName: payload.artistName,
        artistBio: payload.artistBio,
        homeCoverUrl: payload.homeCoverUrl,
        faviconUrl: payload.faviconUrl,
        ogImageUrl: payload.ogImageUrl,
        youtubePlaylistUrl: payload.youtubePlaylistUrl,
        spotifyUrl: payload.spotifyUrl
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
            <Disc3 className="w-5 h-5" /> Quản lý Demo
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
                <Link to="/admin/new" className="bg-stone-900 text-white px-5 py-2.5 rounded-lg font-medium flex items-center gap-2 hover:bg-stone-800 transition-colors shadow-sm">
                  <Plus className="w-5 h-5" /> Demo mới
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
                               demo.template === '9' ? 'Anime' : 'Mặc định'}
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
                  <label className="block text-sm font-bold text-stone-700 mb-2">Tên nghệ sĩ</label>
                  <input name="artistName" defaultValue={data.artistName} className="w-full border border-stone-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-stone-900" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-2">Giới thiệu ngắn</label>
                  <input name="artistBio" defaultValue={data.artistBio} className="w-full border border-stone-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-stone-900" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-2">Ảnh bìa trang chủ</label>
                  <div className="flex gap-2">
                    <input name="homeCoverUrl" id="homeCoverUrlInput" defaultValue={data.homeCoverUrl} placeholder="Web URL hoặc Upload..." className="flex-1 w-full border border-stone-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-stone-900" />
                    <button type="button" className="px-4 py-3 bg-stone-200 text-stone-700 rounded-xl font-bold hover:bg-stone-300 whitespace-nowrap" onClick={() => document.getElementById('homeCoverUpload')?.click()}>Upload Ảnh</button>
                    <input type="file" id="homeCoverUpload" className="hidden" accept="image/*" onChange={async (e) => {
                      if (!e.target.files?.[0]) return;
                      const formData = new FormData();
                      formData.append('file', e.target.files[0]);
                      try {
                        const res = await fetch('/api/upload', { method: 'POST', body: formData });
                        const json = await res.json();
                        if (json.url) {
                          (document.getElementById('homeCoverUrlInput') as HTMLInputElement).value = json.url;
                        }
                      } catch (err) {
                        alert('Lỗi upload');
                      }
                    }} />
                  </div>
                  <p className="text-xs text-stone-500 mt-2">Dùng để tạo hiệu ứng nền cho trang chủ, nên dùng ảnh ngang chất lượng cao.</p>
                </div>
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-2">Favicon (Icon tab trình duyệt)</label>
                  <div className="flex gap-2">
                    <input name="faviconUrl" id="faviconUrlInput" defaultValue={data.faviconUrl} placeholder="Web URL hoặc Upload..." className="flex-1 w-full border border-stone-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-stone-900" />
                    <button type="button" className="px-4 py-3 bg-stone-200 text-stone-700 rounded-xl font-bold hover:bg-stone-300 whitespace-nowrap" onClick={() => document.getElementById('faviconUpload')?.click()}>Upload Icon</button>
                    <input type="file" id="faviconUpload" className="hidden" accept="image/*" onChange={async (e) => {
                      if (!e.target.files?.[0]) return;
                      const formData = new FormData();
                      formData.append('file', e.target.files[0]);
                      try {
                        const res = await fetch('/api/upload', { method: 'POST', body: formData });
                        const json = await res.json();
                        if (json.url) {
                          (document.getElementById('faviconUrlInput') as HTMLInputElement).value = json.url;
                        }
                      } catch (err) {
                        alert('Lỗi upload');
                      }
                    }} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-2">Thumbnail Website (Ảnh khi share link)</label>
                  <div className="flex gap-2">
                    <input name="ogImageUrl" id="ogImageUrlInput" defaultValue={data.ogImageUrl} placeholder="Web URL hoặc Upload..." className="flex-1 w-full border border-stone-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-stone-900" />
                    <button type="button" className="px-4 py-3 bg-stone-200 text-stone-700 rounded-xl font-bold hover:bg-stone-300 whitespace-nowrap" onClick={() => document.getElementById('ogImageUpload')?.click()}>Upload Thumbnail</button>
                    <input type="file" id="ogImageUpload" className="hidden" accept="image/*" onChange={async (e) => {
                      if (!e.target.files?.[0]) return;
                      const formData = new FormData();
                      formData.append('file', e.target.files[0]);
                      try {
                        const res = await fetch('/api/upload', { method: 'POST', body: formData });
                        const json = await res.json();
                        if (json.url) {
                          (document.getElementById('ogImageUrlInput') as HTMLInputElement).value = json.url;
                        }
                      } catch (err) {
                        alert('Lỗi upload');
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
                <button type="submit" className="bg-stone-900 text-white px-6 py-3 rounded-xl font-medium hover:bg-stone-800 transition-colors">Lưu thay đổi</button>
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'audio' | 'cover') => {
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
            else setCoverUploadProgress(percent);
        }
    };

    xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
            const res = JSON.parse(xhr.responseText);
            if (type === 'audio') {
                setUploadedAudioUrl(res.url);
                setAudioUploadProgress(100);
            } else {
                setUploadedCoverUrl(res.url);
                setCoverUploadProgress(100);
            }
        } else {
            alert(xhr.status === 413 ? 'Hệ thống báo lỗi file quá lớn (Tối đa 30MB). Vui lòng dùng MP3.' : 'Lỗi tải file. Vui lòng thử lại.');
            if (type === 'audio') setAudioUploadProgress(0);
            else setCoverUploadProgress(0);
        }
    };
    
    xhr.onerror = () => {
        alert('Lỗi kết nối. Có thể mạng yếu hoặc file quá khổng lồ.');
        if (type === 'audio') setAudioUploadProgress(0);
        else setCoverUploadProgress(0);
    };

    xhr.send(formData);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!uploadedAudioUrl) return alert("Vui lòng tải lên file nhạc!");
    if (audioUploadProgress > 0 && audioUploadProgress < 100) return alert("Vui lòng đợi file nhạc tải lên xong!");
    if (coverUploadProgress > 0 && coverUploadProgress < 100) return alert("Vui lòng đợi ảnh bìa tải lên xong!");

    setLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.delete('audio'); // remove raw files from submit
    formData.delete('cover');
    
    formData.set('audioUrl', uploadedAudioUrl);
    if (uploadedCoverUrl) formData.set('coverUrl', uploadedCoverUrl);
    
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
                <div className={`border-2 border-dashed ${audioUploadProgress === 100 ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-stone-300 hover:bg-stone-50'} rounded-xl p-6 text-center transition-colors relative cursor-pointer overflow-hidden`}>
                  {audioUploadProgress > 0 && audioUploadProgress < 100 && <div className="absolute top-0 left-0 bottom-0 bg-stone-200 transition-all duration-300" style={{ width: `${audioUploadProgress}%` }}></div>}
                  <input type="file" name="audio" accept="audio/mp3,audio/wav,audio/*" required={!uploadedAudioUrl} onChange={e => handleFileUpload(e, 'audio')} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                  <div className="relative z-0">
                      <Upload className={`w-8 h-8 mx-auto mb-2 ${audioUploadProgress === 100 ? 'text-emerald-500' : 'text-stone-400'}`} />
                      <span className="text-sm font-medium decoration-stone-400 underline underline-offset-2">
                          {audioUploadProgress > 0 && audioUploadProgress < 100 ? `Đang tải lên ${audioUploadProgress}%` : (audioUploadProgress === 100 ? 'Đã tải nhạc lên xong!' : 'Chọn file audio')}
                      </span>
                  </div>
                </div>
              </div>

               <div>
                <label className="block text-sm font-bold text-stone-700 mb-2">Ảnh Bìa (Tùy chọn tải lên hoặc nhập link)</label>
                <div className={`border-2 border-dashed ${coverUploadProgress === 100 ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-stone-300 hover:bg-stone-50'} rounded-xl p-6 text-center transition-colors relative cursor-pointer overflow-hidden`}>
                  {coverUploadProgress > 0 && coverUploadProgress < 100 && <div className="absolute top-0 left-0 bottom-0 bg-stone-200 transition-all duration-300" style={{ width: `${coverUploadProgress}%` }}></div>}
                  <input type="file" name="cover" accept="image/*" onChange={e => handleFileUpload(e, 'cover')} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                   <div className="relative z-0">
                       <Upload className={`w-8 h-8 mx-auto mb-2 ${coverUploadProgress === 100 ? 'text-emerald-500' : 'text-stone-400'}`} />
                       <span className="text-sm font-medium decoration-stone-400 underline underline-offset-2">
                           {coverUploadProgress > 0 && coverUploadProgress < 100 ? `Đang tải ảnh ${coverUploadProgress}%` : (coverUploadProgress === 100 ? 'Đã tải ảnh lên xong!' : 'Tải ảnh bìa lên')}
                       </span>
                   </div>
                </div>
                <input name="coverUrl" type="text" onChange={e => setUploadedCoverUrl(e.target.value)} placeholder="Hoặc nhập link ảnh online..." className="w-full mt-3 border border-stone-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-stone-900 transition-shadow" />
                <p className="text-xs text-stone-500 mt-2">Hỗ trợ link trực tiếp hoặc link Google Drive.</p>
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
                  <option value="1">Mẫu 1: Vui vẻ (Ấm áp)</option>
                  <option value="2">Mẫu 2: Căng Cực (Sôi động)</option>
                  <option value="3">Mẫu 3: Buồn (Sâu lắng)</option>
                  <option value="4">Mẫu 4: Thư giãn (Nhẹ nhàng)</option>
                  <option value="5">Mẫu 5: Đáng yêu (Đỏ, Nhảy múa)</option>
                  <option value="6">Mẫu 6: Hạnh Phúc (Hồng, Hoa rơi)</option>
                  <option value="7">Mẫu 7: Học Đường (Trắng, Lá vàng rơi)</option>
                  <option value="8">Mẫu 8: Tổ Quốc (Đỏ, Cờ phấp phới)</option>
                  <option value="9">Mẫu 9: Anime (Bầu trời, Mưa rơi)</option>
                </select>
              </div>

               <div>
                <label className="block text-sm font-bold text-stone-700 mb-2">Mật khẩu (tùy chọn)</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 w-5 h-5 text-stone-400" />
                  <input name="password" placeholder="Bỏ trống nếu không cần" className="w-full border border-stone-300 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-stone-900 transition-shadow" />
                </div>
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'audio' | 'cover') => {
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
            else setCoverUploadProgress(percent);
        }
    };

    xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
            const res = JSON.parse(xhr.responseText);
            if (type === 'audio') {
                setUploadedAudioUrl(res.url);
                setAudioUploadProgress(100);
            } else {
                setUploadedCoverUrl(res.url);
                setCoverUploadProgress(100);
            }
        } else {
            alert(xhr.status === 413 ? 'Hệ thống báo lỗi file quá lớn (Tối đa 30MB). Vui lòng dùng MP3.' : 'Lỗi tải file. Vui lòng thử lại.');
            if (type === 'audio') setAudioUploadProgress(0);
            else setCoverUploadProgress(0);
        }
    };
    
    xhr.onerror = () => {
        alert('Lỗi kết nối. Có thể mạng yếu hoặc file quá khổng lồ.');
        if (type === 'audio') setAudioUploadProgress(0);
        else setCoverUploadProgress(0);
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
    
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.delete('audio'); // not sending file binary in this request
    formData.delete('cover');
    
    if (uploadedAudioUrl) formData.set('audioUrl', uploadedAudioUrl);
    if (uploadedCoverUrl) formData.set('coverUrl', uploadedCoverUrl);

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
                <label className="block text-sm font-bold text-stone-700 mb-2">File Nhạc (Nếu muốn thay đổi)</label>
                <div className={`border-2 border-dashed ${audioUploadProgress === 100 ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-stone-300 hover:bg-stone-50'} rounded-xl p-6 text-center transition-colors relative cursor-pointer overflow-hidden`}>
                  {audioUploadProgress > 0 && audioUploadProgress < 100 && <div className="absolute top-0 left-0 bottom-0 bg-stone-200 transition-all duration-300" style={{ width: `${audioUploadProgress}%` }}></div>}
                  <input type="file" name="audio" accept="audio/mp3,audio/wav,audio/*" onChange={e => handleFileUpload(e, 'audio')} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                  <div className="relative z-0">
                      <Upload className={`w-8 h-8 mx-auto mb-2 ${audioUploadProgress === 100 ? 'text-emerald-500' : 'text-stone-400'}`} />
                      <span className="text-sm font-medium decoration-stone-400 underline underline-offset-2">
                          {audioUploadProgress > 0 && audioUploadProgress < 100 ? `Đang tải lên ${audioUploadProgress}%` : (audioUploadProgress === 100 ? 'Đã tải nhạc lên xong!' : 'Chọn file audio mới')}
                      </span>
                  </div>
                </div>
              </div>

               <div>
                <label className="block text-sm font-bold text-stone-700 mb-2">Ảnh Bìa (Tùy chọn tải lên bài mới hoặc nhập link)</label>
                <div className={`border-2 border-dashed ${coverUploadProgress === 100 ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-stone-300 hover:bg-stone-50'} rounded-xl p-6 text-center transition-colors relative cursor-pointer overflow-hidden`}>
                  {coverUploadProgress > 0 && coverUploadProgress < 100 && <div className="absolute top-0 left-0 bottom-0 bg-stone-200 transition-all duration-300" style={{ width: `${coverUploadProgress}%` }}></div>}
                  <input type="file" name="cover" accept="image/*" onChange={e => handleFileUpload(e, 'cover')} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                   <div className="relative z-0">
                       <Upload className={`w-8 h-8 mx-auto mb-2 ${coverUploadProgress === 100 ? 'text-emerald-500' : 'text-stone-400'}`} />
                       <span className="text-sm font-medium decoration-stone-400 underline underline-offset-2">
                           {coverUploadProgress > 0 && coverUploadProgress < 100 ? `Đang tải ảnh ${coverUploadProgress}%` : (coverUploadProgress === 100 ? 'Đã tải ảnh lên xong!' : 'Tải ảnh bìa mới lên')}
                       </span>
                   </div>
                </div>
                <input name="coverUrl" type="text" defaultValue={demo.coverUrl} onChange={e => setUploadedCoverUrl(e.target.value)} placeholder="Hoặc nhập link ảnh online..." className="w-full mt-3 border border-stone-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-stone-900 transition-shadow" />
                <p className="text-xs text-stone-500 mt-2">Hỗ trợ link trực tiếp hoặc link Google Drive.</p>
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
                  <option value="1">Mẫu 1: Vui vẻ (Ấm áp)</option>
                  <option value="2">Mẫu 2: Căng Cực (Sôi động)</option>
                  <option value="3">Mẫu 3: Buồn (Sâu lắng)</option>
                  <option value="4">Mẫu 4: Thư giãn (Nhẹ nhàng)</option>
                  <option value="5">Mẫu 5: Đáng yêu (Đỏ, Nhảy múa)</option>
                  <option value="6">Mẫu 6: Hạnh Phúc (Hồng, Hoa rơi)</option>
                  <option value="7">Mẫu 7: Học Đường (Trắng, Lá vàng rơi)</option>
                  <option value="8">Mẫu 8: Tổ Quốc (Đỏ, Cờ phấp phới)</option>
                  <option value="9">Mẫu 9: Anime (Bầu trời, Mưa rơi)</option>
                </select>
              </div>

               <div>
                <label className="block text-sm font-bold text-stone-700 mb-2">Mật khẩu (tùy chọn)</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 w-5 h-5 text-stone-400" />
                  <input name="password" defaultValue={demo.passwordValue || demo.password as any} placeholder="Bỏ trống nếu không cần" className="w-full border border-stone-300 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-stone-900 transition-shadow" />
                </div>
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
