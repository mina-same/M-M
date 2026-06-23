import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const isArabicText = (text: string) => /[؀-ۿ]/.test(text || "");

interface DbWish {
  id: string;
  name: string;
  message: string;
  photo_urls: string[];
  created_at: string;
}

interface GuestMessage {
  name: string;
  message: string;
  uploadedPhotos: { photos: string[] } | null;
  timestamp: number;
}

interface Book2Props {
  title?: string;
  subtitle?: string;
  image?: string;
  lang?: "en" | "ar";
}

export function Book2({
  title,
  subtitle,
  image = "https://images.unsplash.com/photo-1511895426328-dc8714191300?q=80&w=800&auto=format&fit=crop",
  lang = "en",
}: Book2Props) {
  const t = (en: string, ar: string) => (lang === "ar" ? ar : en);

  const titleText = title || t("Our Guest Book", "كتاب أمنياتنا");
  const subtitleText = subtitle || t("With love from family & friends", "بحب من العيلة والأصحاب");

  const [isHovered, setIsHovered] = useState(false);
  const [currentSheet, setCurrentSheet] = useState(0);
  const [guestMessages, setGuestMessages] = useState<GuestMessage[]>([]);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Fetch wishes from Supabase and subscribe to real-time updates
  useEffect(() => {
    const fetchWishes = async () => {
      const { data, error } = await supabase
        .from("wish_messages")
        .select("*")
        .order("created_at", { ascending: true });

      if (!error && data) {
        const mapped: GuestMessage[] = (data as DbWish[]).map((row) => ({
          name: row.name,
          message: row.message,
          uploadedPhotos: row.photo_urls?.length > 0 ? { photos: row.photo_urls } : null,
          timestamp: new Date(row.created_at).getTime(),
        }));
        setGuestMessages(mapped);
      }
    };

    fetchWishes();

    const channel = supabase
      .channel("book2_wishes")
      .on("postgres_changes", { event: "*", schema: "public", table: "wish_messages" }, fetchWishes)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Also refresh when a new wish is submitted in the same tab
  useEffect(() => {
    const handleUpdate = () => {
      supabase
        .from("wish_messages")
        .select("*")
        .order("created_at", { ascending: true })
        .then(({ data, error }) => {
          if (!error && data) {
            const mapped: GuestMessage[] = (data as DbWish[]).map((row) => ({
              name: row.name,
              message: row.message,
              uploadedPhotos: row.photo_urls?.length > 0 ? { photos: row.photo_urls } : null,
              timestamp: new Date(row.created_at).getTime(),
            }));
            setGuestMessages(mapped);
          }
        });
    };
    window.addEventListener("guestMessagesUpdated", handleUpdate);
    return () => window.removeEventListener("guestMessagesUpdated", handleUpdate);
  }, []);

  const isOpen = isHovered || currentSheet > 0;

  // Smart-pack messages into pages by estimated pixel height
  const renderedMessagePages: GuestMessage[][] = [];
  if (guestMessages.length > 0) {
    let currentPageMsgs: GuestMessage[] = [];
    let currentHeightEstimate = 0;
    const maxPageHeight = 650;

    for (const msg of guestMessages) {
      let msgHeight = 100;
      if (msg.uploadedPhotos?.photos?.length) msgHeight += 110;
      const charCount = msg.message?.length || 0;
      const estimatedLines = Math.max(1, Math.ceil(charCount / 55));
      msgHeight += estimatedLines * 28;

      if (currentHeightEstimate + msgHeight > maxPageHeight && currentPageMsgs.length > 0) {
        renderedMessagePages.push([...currentPageMsgs]);
        currentPageMsgs = [msg];
        currentHeightEstimate = msgHeight;
      } else {
        currentPageMsgs.push(msg);
        currentHeightEstimate += msgHeight;
      }
    }
    if (currentPageMsgs.length > 0) renderedMessagePages.push([...currentPageMsgs]);
  }

  const messagePages = renderedMessagePages.map((msgs, pageIndex) => (
    <div key={`msg-page-${pageIndex}`} className="relative flex h-full flex-col p-12 text-zinc-800 pt-16">
      <div className="mb-8 text-center relative">
        <h4 className="text-3xl font-serif text-rose-950 uppercase tracking-[0.15em] mb-4">
          {t("Stories & Wishes", "الأمنيات")}
        </h4>
        <div className="w-20 h-[2px] bg-rose-900/40 mx-auto" />
        <div className="w-10 h-[1px] bg-rose-900/30 mx-auto mt-1" />
      </div>

      <div className="flex flex-1 flex-col justify-center gap-8">
        {msgs.map((msg, idx) => {
          const isMsgAr = isArabicText(msg.message);
          const isNameAr = isArabicText(msg.name);
          const allPhotos = msg.uploadedPhotos?.photos || [];

          return (
            <div key={idx} className="relative px-6 flex flex-col">
              <span className={`absolute ${isMsgAr ? "-right-2" : "-left-2"} -top-6 text-6xl font-serif text-rose-900/10`}>"</span>

              <div className="flex gap-4 items-start relative z-10 min-h-[60px]">
                <p
                  dir={isMsgAr ? "rtl" : "ltr"}
                  className={`${isMsgAr ? "font-sans" : "font-serif italic"} text-zinc-800 whitespace-pre-wrap flex-1 mt-1 ${
                    (msg.message?.length || 0) > 300
                      ? "text-sm leading-snug"
                      : (msg.message?.length || 0) > 120
                      ? "text-base leading-snug"
                      : "text-lg leading-relaxed"
                  }`}
                >
                  {msg.message || t("Sending our love and best wishes!", "أحبكم!")}
                </p>

                {allPhotos.length > 0 && (
                  <div className="flex-shrink-0 flex gap-2">
                    {allPhotos.length === 1 && (
                      <div className="p-2 bg-white shadow-md border border-zinc-100 w-24 h-24 rotate-3 mt-1">
                        <img src={allPhotos[0]} alt={`From ${msg.name}`} className="w-full h-full object-cover sepia-[20%] opacity-90" />
                      </div>
                    )}
                    {allPhotos.length === 2 && (
                      <div className="flex flex-col gap-2">
                        {allPhotos.slice(0, 2).map((photo, pIdx) => (
                          <div key={pIdx} className="p-1.5 bg-white shadow-md border border-zinc-100 w-20 h-20 rotate-3 mt-1">
                            <img src={photo} alt={`From ${msg.name}`} className="w-full h-full object-cover sepia-[20%] opacity-90" />
                          </div>
                        ))}
                      </div>
                    )}
                    {allPhotos.length === 3 && (
                      <div className="flex flex-col gap-2">
                        {allPhotos.slice(0, 3).map((photo, pIdx) => (
                          <div key={pIdx} className="p-1.5 bg-white shadow-md border border-zinc-100 w-16 h-16 rotate-3 mt-1">
                            <img src={photo} alt={`From ${msg.name}`} className="w-full h-full object-cover sepia-[20%] opacity-90" />
                          </div>
                        ))}
                      </div>
                    )}
                    {allPhotos.length >= 4 && (
                      <div className="grid grid-cols-2 gap-1.5">
                        {allPhotos.slice(0, 4).map((photo, pIdx) => (
                          <div key={pIdx} className="p-1.5 bg-white shadow-md border border-zinc-100 w-16 h-16 rotate-3 mt-1">
                            <img src={photo} alt={`From ${msg.name}`} className="w-full h-full object-cover sepia-[20%] opacity-90" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div
                className={`flex items-center gap-4 border-t border-rose-900/10 ${msgs.length >= 4 ? "pt-2 mt-2" : "pt-4 mt-4"} ${
                  isMsgAr ? "justify-start flex-row-reverse" : "justify-end"
                }`}
              >
                <div className="h-[1px] w-8 bg-rose-900/30" />
                <div className={`flex flex-col ${isMsgAr ? "items-start" : "items-end"}`}>
                  <p
                    dir={isNameAr ? "rtl" : "ltr"}
                    className={`font-medium tracking-wider text-rose-950 uppercase text-xs ${isNameAr ? "font-sans text-sm" : ""}`}
                  >
                    {msg.name}
                  </p>
                  {msg.timestamp && (
                    <p className="text-[10px] tracking-widest text-zinc-400 font-serif italic uppercase">
                      {new Date(msg.timestamp).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="absolute bottom-8 left-0 w-full text-center text-sm font-serif text-zinc-400">
        - {pageIndex + 1} -
      </div>
    </div>
  ));

  const page1 = (
    <div key="page-1" className="flex h-full flex-col p-10 pt-12 items-center justify-center">
      <h3 className="text-4xl font-serif text-center text-zinc-900 mb-4 leading-tight">{titleText}</h3>
      <p className="text-sm text-center text-zinc-500 font-medium mb-8 pb-4 border-b border-zinc-200 w-full">{subtitleText}</p>
      {guestMessages.length === 0 && (
        <p className="text-zinc-400 italic mt-8">{t("More wishes coming soon...", "الأمنيات قريباً...")}</p>
      )}
    </div>
  );

  const pageEnd = (
    <div key="page-end" className="flex h-full flex-col p-10 pt-12 items-center justify-center bg-zinc-50">
      <div className="w-20 h-20 border border-zinc-300 rounded-full flex items-center justify-center mb-4">
        <span className="font-serif italic text-zinc-400">{t("Fin", "نهاية")}</span>
      </div>
    </div>
  );

  const finalBookPages: React.ReactNode[] =
    guestMessages.length > 0 ? [page1, ...messagePages, pageEnd] : [page1, pageEnd];

  if (finalBookPages.length % 2 !== 0) {
    finalBookPages.push(<div key="empty" className="bg-[#FDFBF7] w-full h-full" />);
  }

  const innerSheetsCount = Math.ceil(finalBookPages.length / 2);
  const totalSheets = innerSheetsCount + 1;

  const turnNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentSheet < totalSheets) setCurrentSheet(currentSheet + 1);
  };

  const turnPrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentSheet > 0) setCurrentSheet(currentSheet - 1);
  };

  return (
    <div className="relative flex w-full max-w-[100vw] h-[550px] sm:h-[650px] md:h-[750px] lg:h-[900px] items-center justify-center perspective-[2500px]">
      <motion.div
        className="group relative flex h-[840px] w-[588px] shrink-0 items-center justify-center transition-shadow duration-500 origin-center scale-[0.6] sm:scale-[0.75] md:scale-[0.85] lg:scale-100"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => {
          if (isMobile && currentSheet === 0) {
            turnNext(new MouseEvent("click") as unknown as React.MouseEvent);
          }
        }}
        animate={{
          x: isOpen ? (isMobile ? "10%" : "50%") : "0%",
          z: isOpen ? 80 : 0,
          rotateY: currentSheet > 0 ? -10 : 0,
        }}
        transition={{ type: "spring", stiffness: 60, damping: 20 }}
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Back Cover */}
        <div
          className="absolute inset-0 z-0 bg-white"
          style={{
            borderRadius: "4px 8px 8px 4px",
            boxShadow: isOpen
              ? "15px 25px 35px -10px rgba(0, 0, 0, 0.2)"
              : "0px 15px 25px -5px rgba(0, 0, 0, 0.2)",
          }}
        />

        {/* Inner Sheets */}
        {Array.from({ length: innerSheetsCount }).map((_, sheetIndex) => {
          const globalSheetIndex = sheetIndex + 1;
          const isFlipped = currentSheet > globalSheetIndex;
          const frontPage = finalBookPages[sheetIndex * 2];
          const backPage = finalBookPages[sheetIndex * 2 + 1];
          const displayZ = isFlipped ? globalSheetIndex * 1 : (totalSheets - globalSheetIndex) * 1;

          return (
            <motion.div
              key={`sheet-${globalSheetIndex}`}
              className="absolute inset-0 h-full w-full origin-left cursor-pointer z-10"
              onClick={isFlipped ? turnPrev : turnNext}
              animate={{ rotateY: isFlipped ? -175 : 0, translateZ: displayZ }}
              transition={{ type: "spring", stiffness: 60, damping: 20 }}
              style={{ transformStyle: "preserve-3d" }}
            >
              <div
                className="absolute inset-0 h-full w-full overflow-hidden bg-gradient-to-br from-[#FDFBF7] to-zinc-100 shadow-sm"
                style={{ backfaceVisibility: "hidden", borderRadius: "2px 8px 8px 2px" }}
              >
                <div className="absolute left-0 top-0 w-8 h-full bg-gradient-to-r from-black/5 to-transparent pointer-events-none" />
                {frontPage}
              </div>
              <div
                className="absolute inset-0 h-full w-full overflow-hidden bg-[#FDFBF7] shadow-sm"
                style={{
                  transform: "rotateY(180deg)",
                  backfaceVisibility: "hidden",
                  borderRadius: "8px 2px 2px 8px",
                }}
              >
                <div className="absolute right-0 top-0 w-8 h-full bg-gradient-to-l from-black/5 to-transparent pointer-events-none" />
                {backPage}
              </div>
            </motion.div>
          );
        })}

        {/* Cover */}
        <motion.div
          className="absolute inset-0 z-20 origin-left cursor-pointer pointer-events-auto shadow-2xl"
          onClick={isOpen ? turnPrev : turnNext}
          animate={{
            rotateY: isOpen ? -175 : 0,
            translateZ: isOpen ? 0 : totalSheets * 1.5,
          }}
          transition={{ type: "spring", stiffness: 60, damping: 20 }}
          style={{ transformStyle: "preserve-3d", borderRadius: "4px 6px 6px 4px" }}
        >
          {/* Cover Front */}
          <div
            className="absolute inset-0 overflow-hidden"
            style={{ borderRadius: "4px 6px 6px 4px", backfaceVisibility: "hidden" }}
          >
            <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${image})` }} />
            <div className="absolute left-0 top-0 h-full w-8 bg-gradient-to-r from-black/60 via-black/10 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-tr from-black/40 via-transparent to-transparent pointer-events-none mix-blend-overlay" />
            <div className="absolute inset-0 flex flex-col justify-center items-center p-8 bg-black/40">
              <h2 className="text-white text-6xl font-serif text-center drop-shadow-xl">{titleText}</h2>
            </div>
          </div>

          {/* Cover Back (inside front cover) */}
          <div
            className="absolute inset-0 bg-zinc-800"
            style={{
              transform: "rotateY(180deg)",
              backfaceVisibility: "hidden",
              borderRadius: "6px 4px 4px 6px",
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-l from-black/60 to-transparent opacity-80" />
            <div className="flex flex-col items-center justify-center h-full opacity-30">
              <div className="w-64 h-80 border-2 border-dashed border-zinc-500 rounded-sm" />
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
