import { useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarDays, MapPin, Send, ChevronDown, Upload, X } from "lucide-react";
import ScratchCard from "./ScratchCard";
import Gramophone from "../Gramophone";
import { useCountdown } from "@/hooks/useCountdown";
import { supabase } from "@/lib/supabase";
import template6Data from "@/data/template6-data.json";

type WishMessage = {
  name: string;
  message: string;
  uploadedPhotos: { photos: string[] } | null;
  timestamp: number;
};

const getSavedWish = (): WishMessage | null => {
  if (typeof window === "undefined") return null;

  try {
    const savedWish = localStorage.getItem("template6SavedWish");
    return savedWish ? JSON.parse(savedWish) : null;
  } catch {
    return null;
  }
};

const assets = {
  door: template6Data.hero.doorImage,
  doorVideo: template6Data.hero.doorVideo,
  column: template6Data.reveal.columnImage,
  wreath: template6Data.venue.wreathImage,
  villaName: template6Data.venue.nameImage,
  villa: template6Data.venue.illustrationImage,
  menu: template6Data.timeline.frameImage,
  dress: template6Data.dressCode.illustrationImage,
  gift: template6Data.gifts.iconImage,
  rings: template6Data.rsvp.ringsImage,
};

const Reveal = ({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 28 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-80px" }}
    transition={{ duration: 0.75, delay, ease: "easeOut" }}
    className={className}
  >
    {children}
  </motion.div>
);

const SectionTitle = ({ eyebrow, title }: { eyebrow?: string; title: string }) => (
  <Reveal className="text-center mb-10">
    {eyebrow && <p className="font-med-body text-xs tracking-[0.24em] uppercase text-w6-blue/70 mb-4">{eyebrow}</p>}
    <h2 className="font-med-display text-5xl md:text-7xl leading-none text-w6-blue">{title}</h2>
  </Reveal>
);

const WishPagePreview = ({ previewWish }: { previewWish: WishMessage }) => {
  const photos = previewWish.uploadedPhotos?.photos || [];
  const isMsgAr = /[\u0600-\u06FF]/.test(previewWish.message || "");
  const isNameAr = /[\u0600-\u06FF]/.test(previewWish.name || "");
  const rotations = ['rotate-[2deg]', '-rotate-[2deg]', 'rotate-[1deg]', '-rotate-[1deg]'];

  const renderPhotos = () => {
    if (photos.length === 0) return null;
    const count = Math.min(photos.length, 4);
    const polaroid = (photo: string, pIdx: number, size: string) => (
      <div key={pIdx} className={`p-1.5 bg-white shadow-md border border-zinc-100 ${size} ${rotations[pIdx]} flex-shrink-0`}>
        <img src={photo} alt="" className="w-full h-full object-cover opacity-90" style={{ filter: 'sepia(20%)' }} />
      </div>
    );

    if (count === 1) return (
      <div className="mt-5 flex justify-center md:mt-0 md:flex-shrink-0">
        {polaroid(photos[0], 0, 'w-28 h-28 md:w-32 md:h-32')}
      </div>
    );

    if (count === 2) return (
      <div className="mt-5 flex justify-center gap-3 md:mt-0 md:flex-shrink-0 md:flex-col md:gap-2">
        {photos.slice(0, 2).map((p, i) => polaroid(p, i, 'w-24 h-24 md:w-20 md:h-20'))}
      </div>
    );

    if (count === 3) return (
      <div className="mt-5 flex justify-center gap-2 md:mt-0 md:flex-shrink-0 md:flex-col md:gap-2">
        {photos.slice(0, 3).map((p, i) => polaroid(p, i, 'w-[72px] h-[72px] md:w-[68px] md:h-[68px]'))}
      </div>
    );

    return (
      <div className="mt-5 grid grid-cols-2 gap-2 justify-items-center md:mt-0 md:flex-shrink-0">
        {photos.slice(0, 4).map((p, i) => polaroid(p, i, 'w-[72px] h-[72px] md:w-16 md:h-16'))}
      </div>
    );
  };

  return (
    <div
      className="relative mx-auto w-full overflow-hidden bg-gradient-to-br from-[#FDFBF7] to-zinc-100 shadow-[0_8px_40px_rgba(0,0,0,0.13)] md:max-w-lg"
      style={{ borderRadius: '2px 8px 8px 2px' }}
    >
      {/* Spine shadow */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-6 bg-gradient-to-r from-black/[0.07] to-transparent" />

      <div className="relative p-7 pt-9 md:p-10 md:pt-12">
        {/* Message area */}
        <div className="relative px-4 md:px-6">
          <span className={`absolute ${isMsgAr ? '-right-1' : '-left-1'} -top-5 font-serif text-5xl text-rose-900/10 md:text-6xl`}>&ldquo;</span>

          <div
            className={`relative z-10 ${photos.length > 0 ? 'flex flex-col md:flex-row md:items-start md:gap-5' : ''}`}
            dir={isMsgAr ? 'rtl' : 'ltr'}
          >
            <p
              className={`flex-1 mt-1 whitespace-pre-wrap break-words text-zinc-800 ${isMsgAr ? '' : 'font-serif italic'} ${
                (previewWish.message?.length || 0) > 300
                  ? 'text-sm leading-snug'
                  : (previewWish.message?.length || 0) > 120
                  ? 'text-base leading-snug'
                  : 'text-lg leading-relaxed'
              }`}
            >
              {previewWish.message}
            </p>

            {renderPhotos()}
          </div>

          {/* Author line */}
          <div
            className={`mt-5 flex items-center gap-3 border-t border-rose-900/10 pt-4 ${
              isMsgAr ? 'flex-row-reverse justify-end' : 'justify-end'
            }`}
          >
            <div className="h-[1px] w-8 bg-rose-900/30" />
            <div className={`flex flex-col ${isMsgAr ? 'items-start' : 'items-end'}`}>
              <p
                dir={isNameAr ? 'rtl' : 'ltr'}
                className={`text-xs font-medium uppercase tracking-wider text-rose-950 ${isNameAr ? 'text-sm' : 'font-serif'}`}
              >
                {previewWish.name}
              </p>
              {previewWish.timestamp && (
                <p className="font-serif text-[10px] italic uppercase tracking-widest text-zinc-400">
                  {new Date(previewWish.timestamp).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Page number */}
        <div className="mt-6 text-center font-serif text-sm text-zinc-400">
          &mdash; 1 &mdash;
        </div>
      </div>
    </div>
  );
};

const Template6Page = () => {
  const [videoStarted, setVideoStarted] = useState(false);
  const [doorOpened, setDoorOpened] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [startMusic, setStartMusic] = useState(false);
  const [lang, setLang] = useState<'en' | 'ar'>('en');
  const videoRef = useRef<HTMLVideoElement>(null);

  const countdown = useCountdown(template6Data.hero.countdownDate);
  const [initialSavedWish] = useState(getSavedWish);
  const [previewTimestamp] = useState(() => Date.now());

  // Wishes form state
  const [wishSubmitted, setWishSubmitted] = useState(() => Boolean(initialSavedWish));
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>(() => initialSavedWish?.uploadedPhotos?.photos || []);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [wishForm, setWishForm] = useState(() => ({
    name: initialSavedWish?.name === "Anonymous" ? "" : initialSavedWish?.name || "",
    message: initialSavedWish?.message === "Write your wish for us" ? "" : initialSavedWish?.message || "",
  }));
  const [savedWishId, setSavedWishId] = useState<number | null>(() => initialSavedWish?.timestamp || null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showInstapay, setShowInstapay] = useState(false);

  const t = (en: string, ar: string) => lang === 'ar' ? ar : en;

  const venueGallery = useMemo(
    () => Array.from({ length: 13 }, (_, idx) => `/assets/mediterranean/images/${idx + 1}.jpeg`),
    [],
  );

  const storyImages = useMemo(
    () => [
      '/assets/mediterranean/images/our%20story/1.jpeg',
      '/assets/mediterranean/images/our%20story/2.png',
      '/assets/mediterranean/images/our%20story/3.jpeg',
      '/assets/mediterranean/images/our%20story/4.jpeg',
    ],
    [],
  );

  const storySections = template6Data.story.sections as Array<{
    title: string;
    titleAr: string;
    alt: string;
    altAr: string;
  }>;

  const handleTapToOpen = () => {
    // Start video on first tap
    if (!videoStarted) {
      setVideoStarted(true);
      videoRef.current?.play().catch(() => undefined);
    }
    // Start music
    setStartMusic(true);
    // Open door and show content
    setDoorOpened(true);
    setTimeout(() => {
      setShowContent(true);
    }, 1000);
  };

  const handleVideoEnd = () => {
    setDoorOpened(true);
    setTimeout(() => {
      setShowContent(true);
    }, 1000);
  };

  const scrollToReveal = () => {
    window.scrollTo({ top: window.innerHeight, behavior: "smooth" });
  };

  // Handle wish submission
  const uploadPhotosToSupabase = async () => {
    const photoUrls: string[] = [];

    for (const file of uploadedFiles) {
      const safeName = file.name.replace(/[^a-zA-Z0-9_.-]/g, "_");
      const filePath = `guest-wishes/${Date.now()}-${safeName}`;
      const { error: uploadError } = await supabase.storage.from("wish-images").upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });
      if (uploadError) {
        throw uploadError;
      }

      const { data: publicUrlData } = supabase.storage.from("wish-images").getPublicUrl(filePath);
      if (!publicUrlData?.publicUrl) {
        throw new Error("Unable to generate public URL for uploaded image.");
      }

      photoUrls.push(publicUrlData.publicUrl);
    }

    return photoUrls;
  };

  const handleWishSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);

    if (!wishForm.message.trim() && uploadedFiles.length === 0) {
      setSaveError(t('Please write a wish or upload a photo.', 'اكتب أمنية أو ضيف صورة.'));
      return;
    }

    setIsSaving(true);

    try {
      const photoUrls = uploadedFiles.length > 0 ? await uploadPhotosToSupabase() : [];
      const timestamp = savedWishId || Date.now();
      const newMsg: WishMessage = {
        name: wishForm.name || "Anonymous",
        message: wishForm.message || "Write your wish for us",
        uploadedPhotos: photoUrls.length > 0 ? { photos: photoUrls } : null,
        timestamp,
      };

      const { error: insertError } = await supabase.from("wish_messages").insert([{ 
        name: newMsg.name,
        message: newMsg.message,
        photo_urls: photoUrls,
      }]);

      if (insertError) {
        throw insertError;
      }

      const stored = JSON.parse(localStorage.getItem("guestMessages") || "[]") as WishMessage[];
      const existingIndex = stored.findIndex((msg) => msg.timestamp === timestamp);
      const updatedMessages = existingIndex >= 0
        ? stored.map((msg, index) => index === existingIndex ? newMsg : msg)
        : [...stored, newMsg];

      localStorage.setItem("guestMessages", JSON.stringify(updatedMessages));
      localStorage.setItem("template6SavedWish", JSON.stringify(newMsg));
      setSavedWishId(timestamp);
      setWishSubmitted(true);
      window.dispatchEvent(new Event("guestMessagesUpdated"));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      setSaveError(message);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle photo upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const maxCount = Math.max(0, 4 - uploadedPhotos.length);
      const filesToProcess = Array.from(files).slice(0, maxCount);

      setUploadedFiles((prev) => [...prev, ...filesToProcess].slice(0, 4));

      const newPhotos: string[] = [];
      let processedCount = 0;

      filesToProcess.forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          newPhotos.push(reader.result as string);
          processedCount++;

          if (processedCount === filesToProcess.length) {
            setUploadedPhotos((prev) => {
              const combined = [...prev, ...newPhotos];
              return combined.slice(0, 4);
            });
          }
        };
        reader.readAsDataURL(file);
      });
    }
    e.target.value = "";
  };

  const removeUploadedPhoto = (index: number) => {
    setUploadedPhotos((prev) => prev.filter((_, i) => i !== index));
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const floatAnimation = {
    animate: { y: [0, -10, 0] },
    transition: { duration: 3, repeat: Infinity, ease: "easeInOut" as const }
  };

  const previewWish = useMemo(() => ({
    name: wishForm.name || "Anonymous",
    message: wishForm.message || "Write your wish for us",
    uploadedPhotos: uploadedPhotos.length > 0 ? { photos: uploadedPhotos } : null,
    timestamp: savedWishId || previewTimestamp,
  }), [wishForm.name, wishForm.message, uploadedPhotos, savedWishId, previewTimestamp]);

  return (
    <main className="min-h-screen bg-w6-paper text-w6-blue font-med-body overflow-x-hidden">
      {/* Language switcher */}
      <div className="fixed top-4 right-4 z-50 flex gap-1 rounded-full border border-w6-blue/20 bg-w6-paper/95 p-1 backdrop-blur">
        <button 
          onClick={() => setLang('en')}
          className={`rounded-full px-3 py-1.5 text-xs font-medium ${lang === 'en' ? 'bg-w6-blue text-w6-white' : 'text-w6-blue'}`}
        >
          EN
        </button>
        <button 
          onClick={() => setLang('ar')}
          className={`rounded-full px-3 py-1.5 text-xs font-medium ${lang === 'ar' ? 'bg-w6-blue text-w6-white' : 'text-w6-blue'}`}
        >
          عربي
        </button>
      </div>

      {/* Gramophone Music Player */}
      <Gramophone song={template6Data.song} position="bottom-right" autoPlay={startMusic} />

      {/* Hero Section with Video Background */}
      <section className="relative h-screen w-full overflow-hidden bg-w6-blue">
        {/* Video Background */}
        <video 
          ref={videoRef}
          src={assets.doorVideo}
          className="absolute inset-0 h-full w-full object-cover"
          playsInline
          muted
          preload="auto"
          onEnded={handleVideoEnd}
          style={{ opacity: 1, transition: "opacity 1s ease-in-out" }}
        />

        {/* Initial Play Overlay - Changed to Tap to Open */}
        <AnimatePresence>
          {!doorOpened && (
            <motion.div
              onClick={handleTapToOpen}
              className="absolute inset-0 z-10 flex cursor-pointer flex-col items-center justify-end bg-w6-blue/40 pb-16"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1 }}
            >
              <motion.p
                className="rounded-full bg-black/30 px-5 py-3 text-center text-base font-black uppercase tracking-[0.28em] text-white shadow-[0_20px_50px_rgba(0,0,0,0.35)]"
                animate={{ opacity: [0.65, 1, 0.65] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {t('Tap to Open', 'خبط علي الباب')}
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Door Opening Overlay - Visible until user taps */}
        <AnimatePresence>
          {videoStarted && !doorOpened && (
            <motion.img
              src={assets.door}
              alt="Mediterranean villa door"
              className="absolute inset-0 z-5 h-full w-full object-cover"
              initial={{ opacity: 1 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2, ease: "easeInOut" }}
            />
          )}
        </AnimatePresence>

        {/* Hero Content Overlay - Appears after door opens */}
        <AnimatePresence>
          {doorOpened && (
            <motion.div
              className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[linear-gradient(180deg,rgba(11,41,83,0.72),rgba(11,41,83,0.48)_42%,rgba(11,41,83,0.78))] backdrop-blur-[1px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.5, delay: 0.5 }}
            >
              <motion.div
                className="relative px-8 text-center"
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 1, delay: 1 }}
              >
                <motion.p
                  className="font-med-body mb-4 text-xs font-bold uppercase tracking-[0.25em] text-white drop-shadow-[0_3px_12px_rgba(0,0,0,0.95)]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.5 }}
                >
                  {t(template6Data.reveal.title, template6Data.reveal.titleAr)}
                </motion.p>
                <motion.h1
                  className="font-med-display mb-6 text-6xl leading-none text-white drop-shadow-[0_8px_28px_rgba(0,0,0,0.95)] md:text-8xl lg:text-9xl"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 1.2, delay: 1.2, ease: "easeOut" }}
                >
                  {t(template6Data.hero.coupleNames, template6Data.hero.coupleNamesAr)}
                </motion.h1>
                

                {/* Scroll indicator */}
                <motion.button
                  onClick={scrollToReveal}
                  className="mt-12 inline-flex flex-col items-center gap-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 2.2 }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span className="font-med-body text-xs uppercase tracking-[0.2em] text-white/80">
                    {t('Discover More', 'اعرف أكتر')}
                  </span>
                  <motion.div
                    animate={{ y: [0, 8, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <ChevronDown className="h-6 w-6 text-white/80" />
                  </motion.div>
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Content sections */}
      <AnimatePresence>
        {showContent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
          >
            {/* Reveal section with scratch cards */}
            <section className="min-h-screen flex flex-col items-center justify-center px-6 py-16 bg-w6-paper overflow-hidden">
              <Reveal className="text-center mb-8">
                <motion.img
                  src={assets.column}
                  alt="Greek column"
                  className="mx-auto mb-5 w-20"
                  {...floatAnimation}
                />
                <p className="font-med-body text-xs uppercase tracking-[0.25em] text-w6-blue/70">{t(template6Data.reveal.subtitle, template6Data.reveal.subtitleAr)}</p>
              </Reveal>

              <div className="mt-12 grid grid-cols-3 gap-5 sm:gap-10 w-full max-w-xs sm:max-w-sm">
                {[
                  [template6Data.reveal.day, "Day", "يوم"],
                  [t(template6Data.reveal.month, template6Data.reveal.monthAr), "Month", "شهر"],
                  [template6Data.reveal.year, "Year", "سنة"],
                ].map(([value, labelEn, labelAr], index) => (
                  <Reveal key={labelEn as string} delay={index * 0.12} className="flex flex-col items-center">
                    <ScratchCard width={100} height={100} label={t('Scratch', 'خربش')}>
                      <span className="font-med-display text-2xl text-w6-blue">{value}</span>
                    </ScratchCard>
                    <p className="mt-3 text-[10px] uppercase tracking-[0.2em] text-w6-blue/60">{t(labelEn as string, labelAr as string)}</p>
                  </Reveal>
                ))}
              </div>
            </section>

            {/* Our Story section */}
            <section id="story" className="bg-w6-white px-8 py-16">
              <SectionTitle title={t(template6Data.story.title, template6Data.story.titleAr)} />
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                {storySections.map((section, idx) => (
                  <Reveal key={idx} delay={0.1 + idx * 0.08} className="rounded-[2rem] overflow-hidden bg-w6-paper shadow-[0_20px_50px_rgba(15,23,42,0.08)] flex flex-col">
                    <img
                      src={storyImages[idx]}
                      alt={t(section.alt, section.altAr)}
                      className="w-full h-auto md:h-72 xl:h-80 object-cover"
                    />
                    <div className="p-6 text-center flex-1 flex items-center justify-center">
                      <h3 className="font-med-display text-xl text-w6-blue">{t(section.title, section.titleAr)}</h3>
                    </div>
                  </Reveal>
                ))}
              </div>
            </section>

            {/* Countdown section */}
            <section className="bg-w6-white px-6 py-14 text-center">
              <SectionTitle title={t(template6Data.countdown.title, template6Data.countdown.titleAr)} />
              <div className="mx-auto grid max-w-md grid-cols-4 gap-3 md:gap-6">
                {[
                  [countdown.days, "Days", "يوم"],
                  [countdown.hours, "Hours", "ساعة"],
                  [countdown.minutes, "Min", "دقيقة"],
                  [countdown.seconds, "Sec", "ثانية"],
                ].map(([value, labelEn, labelAr], index) => (
                  <Reveal key={labelEn as string} delay={index * 0.08}>
                    <motion.div 
                      className="grid h-16 place-items-center rounded-lg border border-w6-blue/35 md:h-20"
                      whileHover={{ scale: 1.05 }}
                    >
                      <span className="font-med-display text-3xl text-w6-blue">
                        {String(value).padStart(2, "0")}
                      </span>
                    </motion.div>
                    <span className="mt-2 block text-[10px] uppercase tracking-[0.16em] text-w6-blue/70">{t(labelEn as string, labelAr as string)}</span>
                  </Reveal>
                ))}
              </div>
              <Reveal delay={0.3}>
                <p className="mt-10 text-sm tracking-wide text-w6-blue/75">{t(template6Data.countdown.subtitle, template6Data.countdown.subtitleAr)}</p>
              </Reveal>
            </section>

            {/* Venue section */}
            <section className="bg-w6-white px-8 pb-16 pt-8 text-center">
              <Reveal>
                <p className="text-sm uppercase tracking-[0.18em] text-w6-blue/75">{t(template6Data.venue.title, template6Data.venue.titleAr)}</p>
              </Reveal>
              <Reveal delay={0.1}>
                <motion.img 
                  src={assets.wreath} 
                  alt="Olive wreath" 
                  className="mx-auto my-7 w-28 md:w-36"
                  {...floatAnimation}
                />
              </Reveal>
              {assets.villaName && (
                <Reveal delay={0.2}>
                  <img src={assets.villaName} alt={template6Data.venue.name} className="mx-auto h-16 w-auto md:h-24" />
                </Reveal>
              )}
              <Reveal delay={0.3} className="mt-5">
                <p className="text-xs uppercase tracking-[0.2em]">{t(template6Data.venue.location, template6Data.venue.locationAr)}</p>
                <p className="mt-2 text-sm">{t(template6Data.venue.address, template6Data.venue.addressAr)}</p>
              </Reveal>
              <Reveal delay={0.4} className="mx-auto mt-8 max-w-2xl">
                <img src={assets.villa} alt={template6Data.venue.name} className="w-full" />
              </Reveal>
              <Reveal delay={0.5} className="mt-7">
                <motion.a 
                  href={template6Data.venue.mapsUrl} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="inline-flex items-center gap-2 border-2 border-w6-blue px-6 py-3 text-sm uppercase tracking-[0.12em] hover:bg-w6-blue hover:text-w6-white"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <MapPin className="h-4 w-4" />{t('Open in Google Maps', 'افتحها على خرائط جوجل')}
                </motion.a>
              </Reveal>
              <Reveal delay={0.6} className="mt-10 -mx-8">
                <p className="mb-5 px-8 text-sm uppercase tracking-[0.18em] text-w6-blue/75">{t('Gallery', 'الصور')}</p>
                <style>{`
                  @keyframes gallery-marquee {
                    0%   { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                  }
                  .gallery-marquee-track {
                    display: flex;
                    width: max-content;
                    animation: gallery-marquee 25s linear infinite;
                    will-change: transform;
                  }
                `}</style>
                <div className="overflow-hidden py-2">
                  <div className="gallery-marquee-track flex">
                    {[...venueGallery, ...venueGallery].map((src, idx) => (
                      <div
                        key={idx}
                        className="flex-shrink-0 w-56 md:w-72 aspect-[3/4] overflow-hidden rounded-xl mr-4"
                      >
                        <img
                          src={src}
                          alt={t(
                            `Venue photo ${(idx % venueGallery.length) + 1}`,
                            `صورة المكان ${(idx % venueGallery.length) + 1}`
                          )}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </Reveal>
            </section>

            {/* Timeline section */}
            <section className="px-4 py-14">
              <SectionTitle eyebrow={t(template6Data.timeline.eyebrow, template6Data.timeline.eyebrowAr)} title={t(template6Data.timeline.title, template6Data.timeline.titleAr)} />
              <Reveal className="relative mx-auto max-w-xl">
                <img src={assets.menu} alt="Mediterranean schedule frame" className="w-full" />
                <div className="absolute inset-0 -mt-4 flex flex-col items-center justify-center px-[15%] text-center">
                  {template6Data.timeline.events.map((event, idx) => (
                    <Reveal key={event.title} delay={idx * 0.1}>
                      <div className="mb-2 md:mb-3">
                        {(event.time || event.timeAr) && <p className="text-[10px] uppercase tracking-[0.18em] md:text-sm">{t(event.time, event.timeAr)}</p>}
                        <h3 className="font-med-display text-2xl leading-tight md:text-4xl">{t(event.title, event.titleAr)}</h3>
                        {t(event.title, event.titleAr) !== t("Party to follow", "الحفل") && (
                          <span className="mx-auto mt-2 block h-1.5 w-1.5 rounded-full bg-w6-blue" />
                        )}
                      </div>
                    </Reveal>
                  ))}
                </div>
              </Reveal>
            </section>

            {/* Dress code section */}
            <section className="bg-w6-white px-8 py-14 text-center">
              <SectionTitle title={t(template6Data.dressCode.title, template6Data.dressCode.titleAr)} />
              <Reveal>
                <motion.img 
                  src={assets.dress} 
                  alt="Dress code illustration" 
                  className="mx-auto mb-8 w-72 max-w-full"
                  {...floatAnimation}
                />
              </Reveal>
              <Reveal delay={0.15} className="mx-auto max-w-xl">
                <p className="leading-relaxed">{t(template6Data.dressCode.description, template6Data.dressCode.descriptionAr)}</p>
                <p className="mt-7 font-med-display text-4xl">{t(template6Data.dressCode.attire, template6Data.dressCode.attireAr)}</p>
                <p className="mt-5 text-base md:text-lg">{t(template6Data.dressCode.note, template6Data.dressCode.noteAr)}</p>
              </Reveal>
            </section>

            {/* Gifts section */}
            <section className="px-8 py-14 text-center">
              <SectionTitle eyebrow={template6Data.gifts.eyebrow} title={template6Data.gifts.title} />
              <Reveal>
                <motion.img 
                  src={assets.gift} 
                  alt="Gift icon" 
                  className="mx-auto -mt-4 mb-7 h-28 w-28 object-contain"
                  {...floatAnimation}
                />
              </Reveal>
              <Reveal delay={0.1} className="mx-auto max-w-xl">
                <p className="leading-relaxed">{template6Data.gifts.description}</p>
              </Reveal>
              <Reveal delay={0.2}>
                <motion.div
                  className="mt-10 inline-flex flex-col items-center gap-3 border-2 border-w6-blue px-10 py-7"
                  whileHover={{ scale: 1.05 }}
                >
                  <img 
                    src="/assets/mediterranean/images/instapay.png" 
                    alt="Instapay" 
                    className="h-14 w-auto object-contain mix-blend-multiply" 
                  />
                  <p className="text-[10px] uppercase tracking-[0.18em] text-w6-blue/60">InstaPay</p>
                  <button
                    type="button"
                    onClick={() => setShowInstapay((prev) => !prev)}
                    className="font-mono text-sm text-w6-blue underline-offset-4 hover:text-w6-blue/80 focus:outline-none"
                  >
                    {showInstapay ? template6Data.gifts.instapay : 'Show number'}
                  </button>
                </motion.div>
              </Reveal>
            </section>

            {/* Wishes section */}
            <section id="wishes" className="px-6 py-20 md:py-28 bg-w6-white/50">
              <div className="mx-auto max-w-6xl">
                <SectionTitle title={t('Leave us a wish', 'اتمنالنا')} />

                <div className="mt-2 grid gap-12 md:grid-cols-2 md:gap-16 md:items-start">

                  {/* ── Left column: form or thank-you ── */}
                  <Reveal delay={0.1}>
                    <div className="flex items-center gap-3 mb-8">
                      <motion.img
                        src={assets.rings}
                        alt="Wedding rings"
                        className="w-14 flex-shrink-0"
                        {...floatAnimation}
                      />
                      <div>
                        <p className="font-med-display text-2xl text-w6-blue leading-tight">
                          {t('Share your love with us', 'شاركونا فرحتكم')}
                        </p>
                        <p className="text-xs text-w6-blue/55 tracking-wide mt-1">
                          {t('Your words will be part of our story forever', 'كلامكم هيفضل جزء من حكايتنا للأبد')}
                        </p>
                      </div>
                    </div>

                    {wishSubmitted ? (
                      <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-3xl border border-w6-blue/10 bg-w6-white p-8 shadow-sm"
                      >
                        <div className="text-center">
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                            className="w-16 h-16 rounded-full bg-w6-blue/10 flex items-center justify-center mx-auto mb-5"
                          >
                            <Send className="text-w6-blue" size={28} />
                          </motion.div>
                          <h3 className="font-med-display text-4xl text-w6-blue mb-3">
                            {t('Thank You!', 'شكراً ليك!')}
                          </h3>
                          <p className="text-w6-blue/60 text-sm leading-relaxed">
                            {t('Your wish has been saved with love', 'اتحفظت أمنيتك بحب')}
                          </p>
                        </div>

                        {/* Preview visible on mobile only (desktop shows in right column) */}
                        <div className="mt-8 md:hidden">
                          <p className="mb-3 text-center text-xs font-medium uppercase tracking-widest text-w6-blue/50">
                            {t('Your wish will look like that in our wish book', 'أمنيتك هتبان كده في كتاب الأمنيات')}
                          </p>
                          <WishPagePreview previewWish={previewWish} />
                        </div>

                        <button
                          type="button"
                          onClick={() => setWishSubmitted(false)}
                          className="mt-6 w-full rounded-2xl border border-w6-blue/20 bg-w6-paper px-4 py-3.5 text-xs font-semibold uppercase tracking-widest text-w6-blue transition-colors hover:bg-w6-blue/5"
                        >
                          {t('Edit your wish', 'عدّل أمنيتك')}
                        </button>
                      </motion.div>
                    ) : (
                      <motion.form
                        className="space-y-4 rounded-3xl border border-w6-blue/10 bg-w6-white p-6 shadow-sm md:p-8"
                        onSubmit={handleWishSubmit}
                      >
                        {/* Name */}
                        <div>
                          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.16em] text-w6-blue/50">
                            {t('Your name', 'اسمك')}
                          </label>
                          <motion.input
                            className="h-12 w-full rounded-2xl border border-w6-blue/15 bg-w6-paper px-4 text-w6-blue placeholder:text-w6-blue/35 focus:outline-none"
                            placeholder={t('Your name', 'اسمك إيه؟')}
                            value={wishForm.name}
                            onChange={(e) => setWishForm({ ...wishForm, name: e.target.value })}
                            whileFocus={{ borderColor: "rgba(27, 58, 92, 0.45)" }}
                          />
                        </div>

                        {/* Message */}
                        <div>
                          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.16em] text-w6-blue/50">
                            {t('Your wish', 'أمنيتك')}
                          </label>
                          <motion.textarea
                            className="min-h-36 w-full rounded-2xl border border-w6-blue/15 bg-w6-paper px-4 py-3.5 text-w6-blue placeholder:text-w6-blue/35 focus:outline-none resize-none"
                            placeholder={t('Write your wish for the couple...', 'اتمنالهم حاجة حلوة...')}
                            value={wishForm.message}
                            onChange={(e) => setWishForm({ ...wishForm, message: e.target.value })}
                            whileFocus={{ borderColor: "rgba(27, 58, 92, 0.45)" }}
                          />
                        </div>

                        {/* Photo Upload */}
                        <div>
                          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.16em] text-w6-blue/50">
                            {t('Photos', 'الصور')}
                          </label>
                          {uploadedPhotos.length > 0 ? (
                            <div className="grid grid-cols-4 gap-2">
                              {uploadedPhotos.map((photo, idx) => (
                                <div key={idx} className="relative group aspect-square">
                                  <img src={photo} alt="" className="w-full h-full object-cover rounded-xl" />
                                      <button
                                    type="button"
                                    onClick={() => removeUploadedPhoto(idx)}
                                    className="absolute top-1 right-1 bg-white/90 text-w6-blue rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow"
                                  >
                                    <X size={12} />
                                  </button>
                                </div>
                              ))}
                              {uploadedPhotos.length < 4 && (
                                <label className="aspect-square flex items-center justify-center rounded-xl border border-dashed border-w6-blue/25 cursor-pointer hover:border-w6-blue/50 transition-colors bg-w6-paper">
                                  <Upload className="w-4 h-4 text-w6-blue/40" />
                                  <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} className="hidden" />
                                </label>
                              )}
                            </div>
                          ) : (
                            <label className="flex flex-col items-center justify-center gap-2 py-7 border border-dashed border-w6-blue/20 bg-w6-paper rounded-2xl cursor-pointer hover:border-w6-blue/40 transition-colors">
                              <Upload className="w-5 h-5 text-w6-blue/40" />
                              <span className="text-sm text-w6-blue/50">{t('Upload photos', 'ضيف صور')}</span>
                              <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} className="hidden" />
                            </label>
                          )}
                        </div>

                        {saveError && (
                          <p className="text-sm text-rose-600/90">{saveError}</p>
                        )}
                        <motion.button
                          type="submit"
                          disabled={isSaving}
                          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-w6-blue px-4 py-4 text-sm font-semibold uppercase tracking-widest text-w6-white disabled:cursor-not-allowed disabled:opacity-60"
                          whileHover={{ scale: !isSaving ? 1.02 : 1, backgroundColor: !isSaving ? "rgba(27, 58, 92, 0.88)" : "rgba(55, 78, 102, 0.75)" }}
                          whileTap={{ scale: !isSaving ? 0.98 : 1 }}
                        >
                          <Send className="h-4 w-4" />
                          {isSaving ? t('Saving...', 'يتم الحفظ...') : t('Send your wish', 'ابعت أمنيتك')}
                        </motion.button>

                        {/* Mobile-only preview below form */}
                        {(wishForm.message.trim().length > 0 || uploadedPhotos.length > 0) && (
                          <div className="pt-2 md:hidden">
                            <p className="mb-3 text-center text-xs font-medium uppercase tracking-widest text-w6-blue/50">
                              {t('Your wish will look like this in our wish book', 'أمنيتك هتبان كده في كتاب الأمنيات')}
                            </p>
                            <WishPagePreview previewWish={previewWish} />
                          </div>
                        )}
                      </motion.form>
                    )}
                  </Reveal>

                  {/* ── Right column: live preview (desktop only) ── */}
                  <Reveal delay={0.2} className="hidden md:block md:sticky md:top-10">
                    <p className="mb-4 text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-w6-blue/40">
                      {t('Your wish will look like this in our wish book', 'أمنيتك هتبان كده في كتاب الأمنيات')}
                    </p>
                    <WishPagePreview previewWish={previewWish} />
                  </Reveal>

                </div>
              </div>
            </section>

            {/* Footer section */}
            <section className="bg-w6-white px-6 py-12 text-center">
              <Reveal className="mx-auto max-w-md rounded-[2rem] bg-w6-blue p-5">
                <div className="bg-w6-white px-8 py-12" style={{ clipPath: "polygon(0% 8%,4% 4%,8% 0%,15% 2%,22% 0%,29% 2%,36% 0%,43% 2%,50% 0%,57% 2%,64% 0%,71% 2%,78% 0%,85% 2%,92% 0%,96% 4%,100% 8%,98% 15%,100% 22%,98% 29%,100% 36%,98% 43%,100% 50%,98% 57%,100% 64%,98% 71%,100% 78%,98% 85%,100% 92%,96% 96%,92% 100%,85% 98%,78% 100%,71% 98%,64% 100%,57% 98%,50% 100%,43% 98%,36% 100%,29% 98%,22% 100%,15% 98%,8% 100%,4% 96%,0% 92%,2% 85%,0% 78%,2% 71%,0% 64%,2% 57%,0% 50%,2% 43%,0% 36%,2% 29%,0% 22%,2% 15%)" }}>
                  <h2 className="font-med-display text-4xl">{t(template6Data.footer.thankYou, template6Data.footer.thankYouAr)}</h2>
                  <p className="mt-6 leading-relaxed">{t(template6Data.footer.message, template6Data.footer.messageAr)}</p>
                  <p className="mt-6 font-med-display text-3xl">{t(template6Data.footer.coupleNames, template6Data.footer.coupleNamesAr)}</p>
                  <p className="mt-8 flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest text-w6-blue/45">
                    <CalendarDays className="h-3 w-3" />
                    {t(template6Data.footer.weddingDate, template6Data.footer.weddingDateAr)}
                  </p>
                </div>
              </Reveal>
            </section>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
};

export default Template6Page;
