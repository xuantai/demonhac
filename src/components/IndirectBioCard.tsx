import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Disc, Music, Apple, Youtube, Play, Share2, X, ExternalLink, ArrowLeft, Check, Edit3 } from 'lucide-react';
import { Link } from 'react-router-dom';

interface IndirectBioCardProps {
  demo: {
    id: string;
    slug?: string;
    title: string;
    coverUrl?: string;
    composer?: string;
    singer?: string;
    linkZing?: string;
    linkSpotify?: string;
    linkApple?: string;
    linkYoutubeMusic?: string;
    linkYoutube?: string;
  };
  onClose?: () => void;
  isStandalone?: boolean;
}

const SpotifyIcon = ({className}: {className?: string}) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.84.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.84.241 1.2zM20.16 9.6C15.84 7.08 9.12 6.9 5.28 8.04c-.6.18-1.2-.18-1.38-.72-.18-.6.18-1.2.72-1.38 4.38-1.26 11.76-1.08 16.68 1.86.54.3.72 1.02.42 1.56-.3.54-1.02.72-1.56.42z"/>
  </svg>
);

const AppleMusicIcon = ({className}: {className?: string}) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.994 6.124a9.23 9.23 0 00-.24-2.19c-.317-1.31-1.062-2.31-2.18-3.043a5.022 5.022 0 00-1.877-.726 10.496 10.496 0 00-1.564-.15c-.04-.003-.083-.01-.124-.013H5.986c-.152.01-.303.017-.455.026-.747.043-1.49.123-2.193.4-1.336.53-2.3 1.452-2.865 2.78-.192.448-.292.925-.363 1.408-.056.392-.088.785-.1 1.18 0 .032-.007.062-.01.093v12.223c.01.14.017.283.027.424.05.815.154 1.624.497 2.373.65 1.42 1.738 2.353 3.234 2.801.42.127.856.187 1.293.228.555.053 1.11.06 1.667.06h11.03a12.5 12.5 0 001.57-.1c.822-.106 1.596-.35 2.295-.81a5.046 5.046 0 001.88-2.207c.186-.42.293-.87.37-1.324.113-.675.138-1.358.137-2.04-.002-3.8 0-7.595-.003-11.393zm-6.423 3.99v5.712c0 .417-.058.827-.244 1.206-.29.59-.76.962-1.388 1.14-.35.1-.706.157-1.07.173-.95.045-1.773-.6-1.943-1.536a1.88 1.88 0 011.038-2.022c.323-.16.67-.25 1.018-.324.378-.082.758-.153 1.134-.24.274-.063.457-.23.51-.516a.904.904 0 00.02-.193c0-1.815 0-3.63-.002-5.443a.725.725 0 00-.026-.185c-.04-.15-.15-.243-.304-.234-.16.01-.318.035-.475.066-.76.15-1.52.303-2.28.456l-2.325.47-1.374.278c-.016.003-.032.01-.048.013-.277.077-.377.203-.39.49-.002.042 0 .086 0 .13-.002 2.602 0 5.204-.003 7.805 0 .42-.047.836-.215 1.227-.278.64-.77 1.04-1.434 1.233-.35.1-.71.16-1.075.172-.96.036-1.755-.6-1.92-1.544-.14-.812.23-1.685 1.154-2.075.357-.15.73-.232 1.108-.31.287-.06.575-.116.86-.177.383-.083.583-.323.6-.714v-.15c0-2.96 0-5.922.002-8.882 0-.123.013-.25.042-.37.07-.285.273-.448.546-.518.255-.066.515-.112.774-.165.733-.15 1.466-.296 2.2-.444l2.27-.46c.67-.134 1.34-.27 2.01-.403.22-.043.442-.088.663-.106.31-.025.523.17.554.482.008.073.012.148.012.223.002 1.91.002 3.822 0 5.732z"/>
  </svg>
);

const YoutubeMusicIcon = ({className}: {className?: string}) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0A12 12 0 1 0 24 12 12.013 12.013 0 0 0 12 0zm-2.4 17.5V6.5L16.6 12z"/>
  </svg>
);

const YoutubeIcon = ({className}: {className?: string}) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z" />
    <path fill="white" d="M9.545 15.568V8.432L15.818 12z" />
  </svg>
);

const ZingIcon = ({ className }: { className?: string }) => (
  <motion.div 
    animate={{ rotate: 360 }}
    transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
    className={`overflow-hidden rounded-full flex items-center justify-center ${className}`}
  >
    <img 
      className="w-full h-full object-cover scale-[1.7]" 
      src="https://yt3.googleusercontent.com/ytc/AIdro_kfPqO-m9zcBxusjVAWHXrEVzNn2zFiauJ5D9VKmCBNO8g=s900-c-k-c0x00ffffff-no-rj" 
      alt="Zing MP3"
      referrerPolicy="no-referrer"
    />
  </motion.div>
);

export function IndirectBioCard({ demo, onClose, isStandalone = false }: IndirectBioCardProps) {
  const [copied, setCopied] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    setIsAdmin(!!localStorage.getItem('adminToken'));
  }, []);

  const shareUrl = `${window.location.origin}/song/${demo.slug || demo.id}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const links = [
    {
      id: 'spotify',
      name: 'Spotify',
      url: demo.linkSpotify,
      icon: (
        <motion.div animate={{ scale: [1, 1.15, 1], filter: ['drop-shadow(0px 0px 0px rgba(29, 185, 84, 0))', 'drop-shadow(0px 0px 12px rgba(29, 185, 84, 0.8))', 'drop-shadow(0px 0px 0px rgba(29, 185, 84, 0))'] }} transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}>
          <SpotifyIcon className="w-6 h-6 text-[#1DB954]" />
        </motion.div>
      ),
      color: 'bg-[#1DB954]/10 hover:bg-[#1DB954]/20 border border-[#1DB954]/30 text-emerald-300',
      description: 'Nghe nhạc chất lượng cao trên Spotify',
    },
    {
      id: 'apple',
      name: 'Apple Music',
      url: demo.linkApple,
      icon: (
        <motion.div animate={{ scale: [1, 1.15, 1], filter: ['drop-shadow(0px 0px 0px rgba(252, 60, 68, 0))', 'drop-shadow(0px 0px 12px rgba(252, 60, 68, 0.8))', 'drop-shadow(0px 0px 0px rgba(252, 60, 68, 0))'] }} transition={{ repeat: Infinity, duration: 2, ease: "easeInOut", delay: 0.5 }}>
          <AppleMusicIcon className="w-6 h-6" />
        </motion.div>
      ),
      color: 'bg-[#fc3c44]/10 hover:bg-[#fc3c44]/20 border border-[#fc3c44]/30 text-rose-300',
      description: 'Stream chính thức trên Apple Music',
    },
    {
      id: 'zing',
      name: 'Zing MP3',
      url: demo.linkZing,
      icon: (
        <motion.div animate={{ filter: ['drop-shadow(0px 0px 0px rgba(141, 68, 173, 0))', 'drop-shadow(0px 0px 12px rgba(141, 68, 173, 0.8))', 'drop-shadow(0px 0px 0px rgba(141, 68, 173, 0))'] }} transition={{ repeat: Infinity, duration: 2, ease: "easeInOut", delay: 1 }}>
          <ZingIcon className="w-6 h-6" />
        </motion.div>
      ),
      color: 'bg-[#8d44ad]/10 hover:bg-[#8d44ad]/20 border border-[#8d44ad]/30 text-purple-300',
      description: 'Nghe nhạc trực tuyến tại Zing MP3',
    },
    {
      id: 'ytmusic',
      name: 'YouTube Music',
      url: demo.linkYoutubeMusic,
      icon: (
        <motion.div animate={{ scale: [1, 1.15, 1], filter: ['drop-shadow(0px 0px 0px rgba(255, 0, 0, 0))', 'drop-shadow(0px 0px 12px rgba(255, 0, 0, 0.8))', 'drop-shadow(0px 0px 0px rgba(255, 0, 0, 0))'] }} transition={{ repeat: Infinity, duration: 2, ease: "easeInOut", delay: 1.5 }}>
          <YoutubeMusicIcon className="w-6 h-6" />
        </motion.div>
      ),
      color: 'bg-[#FF0000]/10 hover:bg-[#FF0000]/20 border border-[#FF0000]/30 text-[#FF0000]',
      description: 'Nghe miễn phí trên YouTube Music',
    },
    {
      id: 'ytmv',
      name: 'YouTube MV',
      url: demo.linkYoutube,
      icon: (
        <motion.div animate={{ scale: [1, 1.15, 1], filter: ['drop-shadow(0px 0px 0px rgba(255, 0, 0, 0))', 'drop-shadow(0px 0px 12px rgba(255, 0, 0, 0.8))', 'drop-shadow(0px 0px 0px rgba(255, 0, 0, 0))'] }} transition={{ repeat: Infinity, duration: 2, ease: "easeInOut", delay: 2 }}>
          <YoutubeIcon className="w-6 h-6" />
        </motion.div>
      ),
      color: 'bg-[#FF0000]/10 hover:bg-[#FF0000]/20 border border-[#FF0000]/30 text-[#FF0000]',
      description: 'Xem MV chính thức trên YouTube',
    },
  ].filter(l => !!l.url);

  const defaultImage = 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80';
  const [bgImage, setBgImage] = useState(demo.coverUrl || defaultImage);

  useEffect(() => {
    if (demo.coverUrl) {
      setBgImage(demo.coverUrl);
    }
  }, [demo.coverUrl]);

  // Background cover element
  const containerVariants = {

    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { duration: 0.4, staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 15 } }
  };

  const content = (
    <div className="relative min-h-[100dvh] text-white flex flex-col items-center justify-center p-4 sm:p-8 select-none overflow-x-hidden">
      {/* Blurred Album Artwork Background */}
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center filter blur-3xl opacity-60 scale-110 pointer-events-none transition-all duration-1000 saturate-200"
        style={{ backgroundImage: `url("${bgImage}")` }}
      />

      {/* Floating Header Actions */}
      <div className="absolute top-6 left-6 right-6 flex items-center justify-between z-30">
        {onClose ? (
          <button 
            type="button"
            onClick={onClose}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/40 hover:bg-black/60 border border-white/10 text-white/90 hover:text-white transition-all text-sm font-semibold backdrop-blur-xl cursor-pointer hover:scale-105 active:scale-95"
          >
            <ArrowLeft className="w-4.5 h-4.5" /> Trở về
          </button>
        ) : isStandalone ? (
          <Link 
            to="/"
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/40 hover:bg-black/60 border border-white/10 text-white/90 hover:text-white transition-all text-sm font-semibold backdrop-blur-xl hover:scale-105 active:scale-95"
          >
            <ArrowLeft className="w-4.5 h-4.5" /> Trang chủ
          </Link>
        ) : <div />}

        <button 
          onClick={handleCopyLink}
          className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-black/40 hover:bg-black/60 border border-white/10 text-white/90 hover:text-white transition-all text-sm font-semibold backdrop-blur-xl hover:scale-105 active:scale-95 cursor-pointer"
          title="Chia sẻ liên kết"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-400 animate-bounce" /> : <Share2 className="w-4 h-4 text-rose-400" />}
          <span className="hidden sm:inline">{copied ? 'Đã sao chép' : 'Chia sẻ'}</span>
        </button>
      </div>

      {/* Card Body Container */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 w-full max-w-[420px] bg-stone-950/60 backdrop-blur-3xl border border-white/10 rounded-[40px] p-8 shadow-2xl flex flex-col items-center mt-12 sm:mt-0"
      >
        {/* Cover Art Accent */}
        <motion.div 
          variants={itemVariants}
          className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-3xl overflow-hidden border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-10 select-none flex-shrink-0"
        >
          <motion.img 
            src={bgImage} 
            onError={() => setBgImage(defaultImage)}
            className="w-full h-full object-cover pointer-events-none" 
            alt={demo.title}
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
            whileHover={{ scale: 1.1 }}
          />
        </motion.div>

        {/* Info */}
        <motion.div 
          variants={itemVariants}
          className="relative z-10 text-center mt-8 w-full"
        >
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight leading-snug text-white drop-shadow-lg px-2">
            {demo.title}
          </h1>
          <p className="text-[16px] font-bold text-rose-400 mt-3 flex items-center justify-center gap-2 drop-shadow-md">
            {demo.singer || 'A.C Xuân Tài'}
          </p>
          {demo.composer && demo.composer !== (demo.singer || 'A.C Xuân Tài') && (
            <p className="text-[12px] text-white/80 mt-2 tracking-widest font-mono uppercase drop-shadow-md">
               Sáng tác: {demo.composer}
            </p>
          )}
        </motion.div>

        {/* Playlist/Streaming Service Options */}
        <motion.div 
          variants={itemVariants}
          className="mt-10 w-full space-y-3"
        >
          {links.length > 0 ? (
            links.map((link) => (
              <motion.a 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center justify-between p-4 rounded-3xl ${link.color} transition-all shadow-lg group font-medium cursor-pointer overflow-hidden relative`}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out" />
                <div className="flex items-center gap-4 w-full min-w-0 relative z-10">
                  <div className="p-3 rounded-[18px] bg-black/40 group-hover:bg-black/60 transition-colors shadow-inner drop-shadow-md flex items-center justify-center">
                    {link.icon}
                  </div>
                  <div className="flex flex-col text-left min-w-0">
                    <span className="text-base font-bold tracking-tight">{link.name}</span>
                    <span className="text-[11px] text-white/50 leading-snug truncate mt-0.5">{link.description}</span>
                  </div>
                </div>
                <div className="p-2 lg:p-2.5 bg-black/20 group-hover:bg-black/40 rounded-full transition-colors shrink-0 relative z-10">
                  <ExternalLink className="w-4 h-4 opacity-70 group-hover:opacity-100 transition-opacity" />
                </div>
              </motion.a>
            ))
          ) : (
            <div className="text-center py-8 text-neutral-400 border border-white/5 bg-black/20 rounded-3xl backdrop-blur-sm">
              Bài hát chưa cập nhật link trực tuyến nào.
            </div>
          )}
        </motion.div>
      </motion.div>
      
      {/* Admin Edit Button */}
      {isAdmin && (
        <motion.div
           initial={{ opacity: 0, scale: 0.8 }}
           animate={{ opacity: 1, scale: 1 }}
           className="fixed bottom-6 right-6 z-50"
        >
           <Link 
             to={`/admin/edit/${demo.id}`}
             className="flex items-center justify-center p-3 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white/70 hover:text-white transition-all shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.3)] backdrop-blur-md"
             title="Chỉnh sửa bài hát (Admin)"
           >
             <Edit3 className="w-5 h-5" />
           </Link>
        </motion.div>
      )}
    </div>
  );

  if (onClose) {
    // Rendered inside modal/overlay context on top of homepage
    return (
      <div className="fixed inset-0 z-[1000] overflow-y-auto bg-black/60 backdrop-blur-md flex items-center justify-center animate-[fade-in_0.3s_ease-out]">
        <div className="w-full min-h-screen">
          {content}
        </div>
      </div>
    );
  }

  // Standalone page
  return content;
}
