/*
 * BEYOND BEAUTY TOKYO 2026 出展料金シミュレーター - Home Page
 * Design: Shiseido Red — Japanese Luxury Beauty
 * Layout: Left 2/3 = selection area, Right 1/3 = sticky summary
 * Colors: Deep charcoal bg, Shiseido Red (#C8102E) accents, ivory text
 * Fonts: Playfair Display (headings), Noto Sans JP (body)
 *
 * Booth image preview: clicking a booth option reveals an elegant modal/lightbox
 * with the booth diagram image, specs, and included items.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronDown, ChevronUp, Info, X, Minus, Plus, ZoomIn } from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────

const HERO_BG = "https://d2xsxph8kpxj0f.cloudfront.net/91578427/nvFmNv6dsftwwPRpeksQxP/hero-red-hw6DdkpeYAjQrn8iYmXD9h.webp";

const IMG_1KOMA = "https://d2xsxph8kpxj0f.cloudfront.net/91578427/nvFmNv6dsftwwPRpeksQxP/1koma-new_4dbc4b76.png";
const IMG_2KOMA = "https://d2xsxph8kpxj0f.cloudfront.net/91578427/nvFmNv6dsftwwPRpeksQxP/2koma-new_47936a0e.png";
const IMG_STARTUP = "https://d2xsxph8kpxj0f.cloudfront.net/91578427/nvFmNv6dsftwwPRpeksQxP/startup-booth_e98e635a.jpg";

const RED = "oklch(0.48 0.22 20)";
const RED_LIGHT = "oklch(0.60 0.20 20)";
const RED_MUTED = "oklch(0.48 0.22 20 / 0.15)";
const IVORY = "oklch(0.97 0.008 60)";
const IVORY_MUTED = "oklch(0.75 0.008 60)";
const IVORY_FAINT = "oklch(0.45 0.005 60)";
const CARD_BG = "oklch(0.17 0.015 20)";

// ─── Booth preview data ───────────────────────────────────────────────────────

interface BoothPreview {
  image: string;
  title: string;
  size: string;
  specs: string[];
  included: string[];
  bgLight?: boolean; // true = image is light, use dark overlay
}

const BOOTH_PREVIEWS: Record<string, BoothPreview> = {
  booth_1: {
    image: IMG_1KOMA,
    title: "1小間",
    size: "9㎡（間口3m × 奥行3m × 高さ2.7m）",
    specs: ["パッケージ装飾付き", "会期中清掃付き"],
    included: [
      "バラペット（社名板）",
      "スポットライト 4灯",
      "カーペット",
      "コンセント 1kw/2口 × 1か所",
      "1kw 電気工事費・使用料",
    ],
    bgLight: true,
  },
  booth_2: {
    image: IMG_2KOMA,
    title: "2小間",
    size: "18㎡（間口6m × 奥行3m × 高さ2.7m）",
    specs: ["パッケージ装飾付き", "会期中清掃付き"],
    included: [
      "バラペット（社名板）",
      "スポットライト 8灯",
      "カーペット",
      "コンセント 1kw/2口 × 1か所",
      "1kw 電気工事費・使用料",
    ],
    bgLight: true,
  },
  booth_startup: {
    image: IMG_STARTUP,
    title: "Start up ブース",
    size: "4㎡（間口2m × 奥行2m）",
    specs: ["創業5年以内の企業限定 10社", "角小間選択不可"],
    included: [
      "社名板",
      "スポットライト 2灯",
      "カーペット（赤）",
      "パッケージ装飾",
    ],
    bgLight: false,
  },
};

// ─── Data ─────────────────────────────────────────────────────────────────────

interface Option {
  id: string;
  label: string;
  price: number;
  note?: string;
  type: "radio" | "single" | "qty";
  groupId?: string;
  maxQty?: number;
  cornerLinked?: boolean;
  previewId?: string; // key into BOOTH_PREVIEWS
}

interface Category {
  id: string;
  title: string;
  icon: string;
  note?: string;
  options: Option[];
}

const CATEGORIES: Category[] = [
  {
    id: "booth",
    title: "出展スペース",
    icon: "🏛",
    note: "1小間 = 9㎡（間口3m×奥行3m）。パッケージ装飾・会期中清掃付き。",
    options: [
      {
        id: "booth_1",
        label: "1小間（パッケージ装飾・会期中清掃付き）",
        price: 580000,
        note: "9㎡（間口3m×奥行3m）",
        type: "radio",
        groupId: "booth_size",
        previewId: "booth_1",
      },
      {
        id: "booth_2",
        label: "2小間（パッケージ装飾・会期中清掃付き）",
        price: 1140000,
        note: "18㎡（間口6m×奥行3m）",
        type: "radio",
        groupId: "booth_size",
        previewId: "booth_2",
      },
      {
        id: "booth_space",
        label: "スペースのみ（壁面パネル含む）",
        price: 480000,
        note: "1小間あたり ¥480,000。カーペット・照明器具は別途費用。",
        type: "qty",
        maxQty: 10,
      },
      {
        id: "booth_startup",
        label: "Start up ブース【創業5年以内の企業限定10社】",
        price: 250000,
        note: "4㎡（間口2m×奥行2m）※角小間選択不可",
        type: "radio",
        groupId: "booth_size",
        previewId: "booth_startup",
      },
    ],
  },
  {
    id: "corner",
    title: "角小間オプション",
    icon: "📐",
    note: "出展スペースの小間数に応じて最大数が変わります。1〜2小間→最大1角、4小間→最大2角。Start up ブースは選択不可。",
    options: [
      {
        id: "corner_1",
        label: "角小間指定",
        price: 30000,
        note: "1角あたり ¥30,000（税別）",
        type: "qty",
        maxQty: 4,
        cornerLinked: true,
      },
    ],
  },
  {
    id: "leadgrab",
    title: "Lead Grab（来場者バッジ読み取り）",
    icon: "📱",
    note: "来場者のバッジをスキャンして見込み客情報を取得するシステム。",
    options: [
      {
        id: "leadgrab_3",
        label: "Lead Grab 3アカウント",
        price: 60000,
        note: "追加アカウントは事務局へ要問合せ",
        type: "single",
      },
    ],
  },
  {
    id: "presentation",
    title: "会場内プレゼンテーション",
    icon: "🎤",
    note: "各枠30分。枠が埋まり次第締め切り。",
    options: [
      { id: "pres_0930_a", label: "9月30日（水） 10:20〜10:50", price: 100000, note: "(a) 100,000円", type: "single" },
      { id: "pres_1001_b1", label: "10月1日（木） 11:05〜11:35", price: 120000, note: "(b) 120,000円", type: "single" },
      { id: "pres_1001_b2", label: "10月1日（木） 11:50〜12:20", price: 120000, note: "(b) 120,000円", type: "single" },
      { id: "pres_1001_b3", label: "10月1日（木） 12:35〜13:05", price: 120000, note: "(b) 120,000円", type: "single" },
      { id: "pres_1001_b4", label: "10月1日（木） 13:20〜13:50", price: 120000, note: "(b) 120,000円", type: "single" },
      { id: "pres_1001_b5", label: "10月1日（木） 14:05〜14:35", price: 120000, note: "(b) 120,000円", type: "single" },
      { id: "pres_1001_b6", label: "10月1日（木） 14:50〜15:20", price: 120000, note: "(b) 120,000円", type: "single" },
      { id: "pres_1002_b", label: "10月2日（金） 15:35〜16:05", price: 120000, note: "(b) 120,000円", type: "single" },
      { id: "pres_1002_a", label: "10月2日（金） 16:20〜16:50", price: 100000, note: "(a) 100,000円", type: "single" },
    ],
  },
  {
    id: "pr",
    title: "PR広告",
    icon: "📣",
    note: "複数選択可能。",
    options: [
      { id: "pr_map", label: "会場マップ広告", price: 150000, type: "single" },
      { id: "pr_mail", label: "メルマガ広告", price: 100000, type: "single" },
      { id: "pr_banner", label: "展示会公式HPバナー掲出（8月中旬〜10月中旬）", price: 100000, type: "single" },
      { id: "pr_strap", label: "バッジストラップ広告", price: 1000000, note: "来場者全員のバッジストラップに掲載", type: "single" },
      { id: "pr_badge", label: "バッジ広告", price: 1000000, note: "来場者全員のバッジに掲載", type: "single" },
      { id: "pr_board", label: "ボード広告（W848×H1384、両面）", price: 100000, type: "single" },
      { id: "pr_video", label: "プロモーション動画サービス", price: 100000, type: "single" },
    ],
  },
  {
    id: "other",
    title: "その他",
    icon: "✨",
    options: [
      { id: "vip_lounge", label: "VIPラウンジ サンプル提供サービス", price: 100000, type: "single" },
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatYen(amount: number): string {
  return "¥" + amount.toLocaleString("ja-JP");
}

function getBoothCount(selectedIds: Set<string>, quantities: Record<string, number>): number {
  if (selectedIds.has("booth_1")) return 1;
  if (selectedIds.has("booth_2")) return 2;
  if (selectedIds.has("booth_startup")) return 0;
  if (selectedIds.has("booth_space")) return quantities["booth_space"] ?? 1;
  return 0;
}

function getMaxCorners(boothCount: number): number {
  if (boothCount <= 0) return 0;
  if (boothCount <= 2) return 1;
  return Math.floor(boothCount / 2);
}

function useCountUp(target: number, duration = 500) {
  const [display, setDisplay] = useState(target);
  const prevRef = useRef(target);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const start = prevRef.current;
    const diff = target - start;
    if (diff === 0) return;
    const startTime = performance.now();
    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + diff * eased));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        prevRef.current = target;
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration]);

  return display;
}

// ─── Booth Preview Modal ──────────────────────────────────────────────────────

function BoothModal({
  preview,
  onClose,
}: {
  preview: BoothPreview;
  onClose: () => void;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: "oklch(0 0 0 / 0.85)", backdropFilter: "blur(8px)" }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ type: "spring", damping: 24, stiffness: 300 }}
          className="relative w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl"
          style={{ background: "oklch(0.15 0.015 20)", border: `1px solid ${RED}40` }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
            style={{ background: "oklch(0 0 0 / 0.5)", color: IVORY }}
            onMouseEnter={(e) => (e.currentTarget.style.background = RED)}
            onMouseLeave={(e) => (e.currentTarget.style.background = "oklch(0 0 0 / 0.5)")}
            onClick={onClose}
          >
            <X size={14} />
          </button>

          {/* Image area */}
          <div
            className="relative flex items-center justify-center"
            style={{
              background: preview.bgLight
                ? "oklch(0.96 0 0)"
                : "oklch(0.12 0.01 20)",
              minHeight: "280px",
            }}
          >
            <img
              src={preview.image}
              alt={preview.title}
              className="max-h-72 w-auto object-contain"
              style={{ maxWidth: "100%" }}
            />
            {/* Subtle red gradient at bottom */}
            <div
              className="absolute bottom-0 left-0 right-0 h-16"
              style={{
                background: `linear-gradient(to top, oklch(0.15 0.015 20), transparent)`,
              }}
            />
          </div>

          {/* Info area */}
          <div className="px-6 py-5">
            {/* Title + size */}
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <div className="red-line w-8 mb-2" />
                <h2
                  className="text-xl font-bold"
                  style={{ fontFamily: "'Playfair Display', serif", color: IVORY }}
                >
                  {preview.title}
                </h2>
                <p className="text-sm mt-0.5" style={{ color: IVORY_MUTED }}>{preview.size}</p>
              </div>
              <div className="flex flex-wrap gap-1.5 justify-end">
                {preview.specs.map((s) => (
                  <span
                    key={s}
                    className="text-xs px-2.5 py-1 rounded-full"
                    style={{ background: RED_MUTED, color: RED_LIGHT, border: `1px solid ${RED}40` }}
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>

            {/* Included items */}
            <div
              className="rounded-xl p-4"
              style={{ background: "oklch(0.12 0.01 20)", border: "1px solid oklch(1 0 0 / 8%)" }}
            >
              <p className="text-xs font-semibold tracking-wider uppercase mb-3" style={{ color: IVORY_FAINT }}>
                セット内容
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {preview.included.map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <div
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ background: RED }}
                    />
                    <span className="text-sm" style={{ color: IVORY_MUTED }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─── QtyControl ──────────────────────────────────────────────────────────────

function QtyControl({
  value,
  min = 1,
  max = 99,
  onChange,
  disabled = false,
}: {
  value: number;
  min?: number;
  max?: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  return (
    <div
      className="flex items-center gap-0 rounded overflow-hidden border"
      style={{ borderColor: disabled ? "oklch(1 0 0 / 10%)" : `${RED}60` }}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        disabled={disabled || value <= min}
        className="w-7 h-7 flex items-center justify-center transition-colors disabled:opacity-30"
        style={{ background: disabled ? "oklch(1 0 0 / 5%)" : RED_MUTED, color: IVORY }}
        onClick={() => onChange(Math.max(min, value - 1))}
      >
        <Minus size={11} />
      </button>
      <span
        className="w-8 text-center text-sm font-semibold"
        style={{ color: disabled ? IVORY_FAINT : IVORY }}
      >
        {value}
      </span>
      <button
        disabled={disabled || value >= max}
        className="w-7 h-7 flex items-center justify-center transition-colors disabled:opacity-30"
        style={{ background: disabled ? "oklch(1 0 0 / 5%)" : RED_MUTED, color: IVORY }}
        onClick={() => onChange(Math.min(max, value + 1))}
      >
        <Plus size={11} />
      </button>
    </div>
  );
}

// ─── OptionRow ────────────────────────────────────────────────────────────────

function OptionRow({
  option,
  selected,
  quantity,
  maxQty,
  onToggle,
  onQtyChange,
  onPreviewClick,
  disabled = false,
}: {
  option: Option;
  selected: boolean;
  quantity: number;
  maxQty?: number;
  onToggle: () => void;
  onQtyChange: (qty: number) => void;
  onPreviewClick?: () => void;
  disabled?: boolean;
}) {
  const effectiveMax = maxQty ?? option.maxQty ?? 99;
  const isQty = option.type === "qty";
  const hasPreview = !!option.previewId;

  return (
    <motion.div
      layout
      className={`option-card rounded-lg p-4 ${disabled ? "opacity-40 pointer-events-none" : "cursor-pointer"} ${selected ? "selected" : ""}`}
      onClick={disabled ? undefined : onToggle}
      whileHover={disabled ? {} : { scale: 1.003 }}
      whileTap={disabled ? {} : { scale: 0.998 }}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <div
          className="mt-0.5 w-5 h-5 rounded-sm flex-shrink-0 flex items-center justify-center border transition-all duration-200"
          style={
            selected
              ? { background: RED, borderColor: RED }
              : { background: "oklch(1 0 0 / 5%)", borderColor: "oklch(1 0 0 / 18%)" }
          }
        >
          {selected && <Check size={11} strokeWidth={3} style={{ color: IVORY }} />}
        </div>

        {/* Label */}
        <div className="flex-1 min-w-0">
          <p className="text-sm leading-snug" style={{ color: selected ? IVORY : IVORY_MUTED }}>
            {option.label}
          </p>
          {option.note && (
            <p className="text-xs mt-0.5" style={{ color: IVORY_FAINT }}>{option.note}</p>
          )}
        </div>

        {/* Preview button + Price */}
        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
          {hasPreview && (
            <button
              className="flex items-center gap-1 px-2 py-1 rounded text-xs transition-all"
              style={{
                background: selected ? `${RED}20` : "oklch(1 0 0 / 6%)",
                color: selected ? RED_LIGHT : IVORY_FAINT,
                border: `1px solid ${selected ? RED + "50" : "oklch(1 0 0 / 12%)"}`,
              }}
              onClick={(e) => {
                e.stopPropagation();
                onPreviewClick?.();
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = `${RED}25`;
                e.currentTarget.style.color = RED_LIGHT;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = selected ? `${RED}20` : "oklch(1 0 0 / 6%)";
                e.currentTarget.style.color = selected ? RED_LIGHT : IVORY_FAINT;
              }}
            >
              <ZoomIn size={10} />
              <span>詳細</span>
            </button>
          )}
          <div className="text-right">
            <span
              className="text-sm font-semibold amount-display"
              style={{ color: selected ? RED_LIGHT : IVORY_FAINT }}
            >
              {formatYen(option.price)}
            </span>
            <span className="text-xs ml-0.5" style={{ color: IVORY_FAINT }}>税別</span>
          </div>
        </div>
      </div>

      {/* Quantity row */}
      {isQty && selected && (
        <div
          className="mt-3 flex items-center gap-3 pl-8"
          onClick={(e) => e.stopPropagation()}
        >
          <span className="text-xs" style={{ color: IVORY_FAINT }}>数量:</span>
          <QtyControl
            value={quantity}
            min={1}
            max={effectiveMax}
            onChange={onQtyChange}
          />
          <span className="text-xs font-medium amount-display" style={{ color: RED_LIGHT }}>
            小計: {formatYen(option.price * quantity)}
          </span>
          {option.cornerLinked && (
            <span className="text-xs" style={{ color: IVORY_FAINT }}>
              （最大 {effectiveMax}角）
            </span>
          )}
        </div>
      )}
    </motion.div>
  );
}

// ─── Booth Visual Showcase (inline, shown in booth category) ──────────────────

function BoothShowcase({ onPreview }: { onPreview: (previewId: string) => void }) {
  const booths = [
    { id: "booth_1", label: "1小間", size: "9㎡", img: IMG_1KOMA, light: true },
    { id: "booth_2", label: "2小間", size: "18㎡", img: IMG_2KOMA, light: true },
    { id: "booth_startup", label: "Start up", size: "4㎡", img: IMG_STARTUP, light: false },
  ];

  return (
    <div className="grid grid-cols-3 gap-2 mb-3">
      {booths.map((b) => (
        <motion.button
          key={b.id}
          className="relative rounded-lg overflow-hidden group text-left"
          style={{
            border: "1px solid oklch(1 0 0 / 10%)",
            background: b.light ? "oklch(0.93 0 0)" : "oklch(0.12 0.01 20)",
          }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onPreview(b.id)}
        >
          {/* Image */}
          <div className="h-20 flex items-center justify-center p-2">
            <img
              src={b.img}
              alt={b.label}
              className="h-full w-full object-contain"
            />
          </div>

          {/* Hover overlay */}
          <div
            className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            style={{ background: "oklch(0 0 0 / 0.55)" }}
          >
            <div className="flex flex-col items-center gap-1">
              <ZoomIn size={18} style={{ color: IVORY }} />
              <span className="text-xs font-medium" style={{ color: IVORY }}>詳細を見る</span>
            </div>
          </div>

          {/* Label bar */}
          <div
            className="px-2 py-1.5"
            style={{ borderTop: "1px solid oklch(1 0 0 / 10%)", background: CARD_BG }}
          >
            <p className="text-xs font-semibold" style={{ color: IVORY_MUTED }}>{b.label}</p>
            <p className="text-xs" style={{ color: IVORY_FAINT }}>{b.size}</p>
          </div>
        </motion.button>
      ))}
    </div>
  );
}

// ─── CategorySection ──────────────────────────────────────────────────────────

function CategorySection({
  category,
  selectedIds,
  quantities,
  cornerMax,
  onToggle,
  onQtyChange,
  onPreviewClick,
}: {
  category: Category;
  selectedIds: Set<string>;
  quantities: Record<string, number>;
  cornerMax: number;
  onToggle: (optionId: string, groupId?: string) => void;
  onQtyChange: (optionId: string, qty: number) => void;
  onPreviewClick: (previewId: string) => void;
}) {
  const [open, setOpen] = useState(true);
  const selectedCount = category.options.filter((o) => selectedIds.has(o.id)).length;

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ border: "1px solid oklch(1 0 0 / 8%)", background: CARD_BG }}
    >
      {/* Header */}
      <button
        className="w-full flex items-center gap-3 px-5 py-4 transition-colors"
        style={{ background: "transparent" }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "oklch(1 0 0 / 3%)")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="text-lg">{category.icon}</span>
        <div className="flex-1 text-left">
          <h3
            className="font-semibold text-base"
            style={{ fontFamily: "'Playfair Display', serif", color: IVORY }}
          >
            {category.title}
          </h3>
          {category.note && (
            <p className="text-xs mt-0.5 leading-relaxed" style={{ color: IVORY_FAINT }}>
              {category.note}
            </p>
          )}
        </div>
        {selectedCount > 0 && (
          <span
            className="px-2.5 py-0.5 rounded-full text-xs font-medium"
            style={{ background: RED, color: IVORY }}
          >
            {selectedCount}件
          </span>
        )}
        {open ? (
          <ChevronUp size={15} style={{ color: IVORY_FAINT }} />
        ) : (
          <ChevronDown size={15} style={{ color: IVORY_FAINT }} />
        )}
      </button>

      {/* Options */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-2">
              {/* Booth showcase thumbnails for the booth category */}
              {category.id === "booth" && (
                <BoothShowcase onPreview={onPreviewClick} />
              )}

              {category.options.map((opt) => {
                const isCorner = opt.cornerLinked;
                const isStartupSelected = selectedIds.has("booth_startup");
                const disabled = isCorner && (cornerMax === 0 || isStartupSelected);
                const effectiveMax = isCorner ? cornerMax : (opt.maxQty ?? 99);

                return (
                  <OptionRow
                    key={opt.id}
                    option={opt}
                    selected={selectedIds.has(opt.id)}
                    quantity={quantities[opt.id] ?? 1}
                    maxQty={effectiveMax}
                    onToggle={() => onToggle(opt.id, opt.groupId)}
                    onQtyChange={(qty) => onQtyChange(opt.id, qty)}
                    onPreviewClick={opt.previewId ? () => onPreviewClick(opt.previewId!) : undefined}
                    disabled={disabled}
                  />
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Home() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [activePreview, setActivePreview] = useState<string | null>(null);

  const boothCount = getBoothCount(selectedIds, quantities);
  const cornerMax = getMaxCorners(boothCount);

  useEffect(() => {
    if (!selectedIds.has("corner_1")) return;
    const currentCorners = quantities["corner_1"] ?? 1;
    if (cornerMax === 0) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete("corner_1");
        return next;
      });
    } else if (currentCorners > cornerMax) {
      setQuantities((prev) => ({ ...prev, corner_1: cornerMax }));
    }
  }, [cornerMax, selectedIds, quantities]);

  const total = Array.from(selectedIds).reduce((sum, id) => {
    for (const cat of CATEGORIES) {
      const opt = cat.options.find((o) => o.id === id);
      if (opt) {
        const qty = quantities[id] ?? 1;
        return sum + opt.price * qty;
      }
    }
    return sum;
  }, 0);

  const totalWithTax = Math.round(total * 1.1);
  const animatedTotal = useCountUp(total);
  const animatedWithTax = useCountUp(totalWithTax);

  const selectedItems = Array.from(selectedIds).map((id) => {
    for (const cat of CATEGORIES) {
      const opt = cat.options.find((o) => o.id === id);
      if (opt) {
        const qty = quantities[id] ?? 1;
        return { ...opt, qty, subtotal: opt.price * qty, categoryTitle: cat.title };
      }
    }
    return null;
  }).filter(Boolean) as Array<Option & { qty: number; subtotal: number; categoryTitle: string }>;

  const handleToggle = useCallback((optionId: string, groupId?: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(optionId)) {
        next.delete(optionId);
      } else {
        if (groupId) {
          for (const cat of CATEGORIES) {
            for (const opt of cat.options) {
              if (opt.groupId === groupId && opt.id !== optionId) {
                next.delete(opt.id);
              }
            }
          }
        }
        next.add(optionId);
      }
      return next;
    });
  }, []);

  const handleQtyChange = useCallback((optionId: string, qty: number) => {
    setQuantities((prev) => ({ ...prev, [optionId]: qty }));
  }, []);

  function handleRemove(optionId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(optionId);
      return next;
    });
  }

  function handleReset() {
    setSelectedIds(new Set());
    setQuantities({});
  }

  const activePreviewData = activePreview ? BOOTH_PREVIEWS[activePreview] : null;

  return (
    <div className="min-h-screen" style={{ background: "oklch(0.13 0.01 20)" }}>

      {/* ── Hero Header ── */}
      <header
        className="relative overflow-hidden"
        style={{
          backgroundImage: `url(${HERO_BG})`,
          backgroundSize: "cover",
          backgroundPosition: "center 30%",
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, oklch(0.13 0.01 20 / 0.55) 0%, oklch(0.13 0.01 20 / 0.75) 60%, oklch(0.13 0.01 20) 100%)",
          }}
        />

        <div className="relative container py-12 md:py-16">
          <div className="flex items-start justify-between flex-wrap gap-6">
            <div>
              <div className="red-line w-12 mb-3" />
              <p
                className="text-xs font-medium tracking-[0.2em] uppercase mb-2"
                style={{ color: RED_LIGHT }}
              >
                Informa Markets Japan
              </p>
              <h1
                className="text-3xl md:text-5xl font-bold leading-tight"
                style={{ fontFamily: "'Playfair Display', serif", color: IVORY }}
              >
                BEYOND BEAUTY
                <br />
                <span style={{ color: RED_LIGHT }}>TOKYO 2026</span>
              </h1>
              <p className="mt-2 text-base" style={{ color: IVORY_MUTED }}>
                出展料金シミュレーター
              </p>
            </div>

            <div
              className="rounded-xl px-5 py-4 backdrop-blur-sm"
              style={{
                background: "oklch(0.13 0.01 20 / 0.7)",
                border: `1px solid ${RED}40`,
              }}
            >
              <p className="text-xs mb-1" style={{ color: IVORY_FAINT }}>開催期間</p>
              <p className="font-semibold text-sm" style={{ color: IVORY }}>
                2026年9月30日（水）〜10月2日（金）
              </p>
              <p className="text-xs mt-1" style={{ color: IVORY_FAINT }}>
                東京ビッグサイト 西ホール
              </p>
              <div className="red-line mt-3" />
              <p className="text-xs mt-2" style={{ color: IVORY_FAINT }}>
                1次締切: <span style={{ color: IVORY_MUTED }}>2026年3月31日</span>
                　2次締切: <span style={{ color: IVORY_MUTED }}>2026年5月29日</span>
              </p>
            </div>
          </div>

          <div
            className="mt-6 flex items-start gap-2.5 rounded-lg px-4 py-3 max-w-2xl"
            style={{
              background: `${RED}12`,
              border: `1px solid ${RED}35`,
            }}
          >
            <Info size={14} className="flex-shrink-0 mt-0.5" style={{ color: RED_LIGHT }} />
            <p className="text-xs leading-relaxed" style={{ color: IVORY_MUTED }}>
              このシミュレーターは参考用です。<strong style={{ color: IVORY }}>料金はすべて税別表示</strong>です。
              実際の申込は事務局（TEL: 03-5296-1013）へご確認ください。
            </p>
          </div>
        </div>
      </header>

      {/* ── Main Layout ── */}
      <main className="container py-8 pb-24 lg:pb-8">
        <div className="flex flex-col lg:flex-row gap-6 items-start">

          {/* Left: Selection Area */}
          <div className="flex-1 min-w-0 space-y-3">
            <p
              className="text-xs font-medium tracking-widest uppercase mb-4"
              style={{ color: IVORY_FAINT }}
            >
              オプションを選択してください
            </p>

            {CATEGORIES.map((cat) => (
              <CategorySection
                key={cat.id}
                category={cat}
                selectedIds={selectedIds}
                quantities={quantities}
                cornerMax={cornerMax}
                onToggle={handleToggle}
                onQtyChange={handleQtyChange}
                onPreviewClick={setActivePreview}
              />
            ))}

            {boothCount > 0 && !selectedIds.has("booth_startup") && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg px-4 py-3 flex items-start gap-2"
                style={{ background: `${RED}10`, border: `1px solid ${RED}30` }}
              >
                <Info size={13} className="flex-shrink-0 mt-0.5" style={{ color: RED_LIGHT }} />
                <p className="text-xs leading-relaxed" style={{ color: IVORY_MUTED }}>
                  現在の小間数: <strong style={{ color: IVORY }}>{boothCount}小間</strong>
                  　→　角小間の最大数: <strong style={{ color: RED_LIGHT }}>{cornerMax}角</strong>
                </p>
              </motion.div>
            )}

            {/* Cancel policy */}
            <div
              className="rounded-xl p-5 mt-2"
              style={{ border: "1px solid oklch(1 0 0 / 8%)", background: CARD_BG }}
            >
              <h3
                className="font-semibold text-sm mb-3 flex items-center gap-2"
                style={{ color: IVORY_MUTED }}
              >
                <span>📋</span> キャンセル料金規定
              </h3>
              <table className="w-full text-sm">
                <tbody>
                  <tr>
                    <td className="py-1 pr-4 text-xs w-40" style={{ color: IVORY_FAINT }}>〜2026年5月31日</td>
                    <td className="py-1" style={{ color: IVORY_MUTED }}>
                      出展料金 × <strong style={{ color: RED_LIGHT }}>50%</strong>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-1 pr-4 text-xs" style={{ color: IVORY_FAINT }}>2026年6月1日〜</td>
                    <td className="py-1" style={{ color: IVORY_MUTED }}>
                      出展料金 × <strong style={{ color: RED_LIGHT }}>100%</strong>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Right: Sticky Summary Panel */}
          <div className="w-full lg:w-80 xl:w-96 lg:sticky lg:top-6">
            <div
              className="rounded-xl overflow-hidden"
              style={{ border: "1px solid oklch(1 0 0 / 10%)", background: CARD_BG }}
            >
              <div
                className="px-5 py-4 flex items-center justify-between"
                style={{ borderBottom: "1px solid oklch(1 0 0 / 8%)" }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-1 h-5 rounded-full" style={{ background: RED }} />
                  <h2
                    className="font-semibold text-base"
                    style={{ fontFamily: "'Playfair Display', serif", color: IVORY }}
                  >
                    料金サマリー
                  </h2>
                </div>
                {selectedIds.size > 0 && (
                  <button
                    className="text-xs transition-colors"
                    style={{ color: IVORY_FAINT }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = IVORY_MUTED)}
                    onMouseLeave={(e) => (e.currentTarget.style.color = IVORY_FAINT)}
                    onClick={handleReset}
                  >
                    リセット
                  </button>
                )}
              </div>

              <div className="px-5 py-4 min-h-[100px]">
                {selectedItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="text-3xl mb-2 opacity-20">📋</div>
                    <p className="text-sm" style={{ color: IVORY_FAINT }}>
                      左のオプションを選択すると
                      <br />ここに表示されます
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <AnimatePresence>
                      {selectedItems.map((item) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          transition={{ duration: 0.18 }}
                          className="flex items-start gap-2 group"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-xs leading-none mb-0.5" style={{ color: IVORY_FAINT }}>
                              {item.categoryTitle}
                            </p>
                            <p className="text-sm leading-snug" style={{ color: IVORY_MUTED }}>
                              {item.label}
                            </p>
                            {item.qty > 1 && (
                              <p className="text-xs" style={{ color: IVORY_FAINT }}>× {item.qty}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <span
                              className="text-sm font-semibold amount-display"
                              style={{ color: RED_LIGHT }}
                            >
                              {formatYen(item.subtotal)}
                            </span>
                            <button
                              className="opacity-0 group-hover:opacity-100 transition-opacity ml-1"
                              style={{ color: IVORY_FAINT }}
                              onClick={() => handleRemove(item.id)}
                            >
                              <X size={11} />
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>

              <div
                className="px-5 py-4"
                style={{ borderTop: "1px solid oklch(1 0 0 / 8%)", background: "oklch(0.15 0.01 20)" }}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm" style={{ color: IVORY_FAINT }}>合計（税別）</span>
                  <span className="text-lg font-bold amount-display" style={{ color: IVORY }}>
                    {formatYen(animatedTotal)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: IVORY_FAINT }}>消費税（10%）込</span>
                  <span className="text-sm amount-display" style={{ color: IVORY_MUTED }}>
                    {formatYen(animatedWithTax)}
                  </span>
                </div>

                {total > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 rounded-lg p-4 text-center"
                    style={{
                      background: `linear-gradient(135deg, ${RED}18, ${RED}08)`,
                      border: `1px solid ${RED}40`,
                    }}
                  >
                    <div className="red-line w-8 mx-auto mb-2" />
                    <p
                      className="text-xs tracking-wider uppercase mb-1"
                      style={{ color: RED_LIGHT }}
                    >
                      お支払い合計（税込）
                    </p>
                    <p
                      className="text-3xl font-bold amount-display"
                      style={{ fontFamily: "'Playfair Display', serif", color: RED_LIGHT }}
                    >
                      {formatYen(animatedWithTax)}
                    </p>
                    <p className="text-xs mt-1" style={{ color: IVORY_FAINT }}>
                      {selectedIds.size}件のオプション選択中
                    </p>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Contact info */}
            <div
              className="mt-4 rounded-xl px-5 py-4"
              style={{ border: "1px solid oklch(1 0 0 / 8%)", background: CARD_BG }}
            >
              <p className="text-xs mb-2 font-medium" style={{ color: IVORY_FAINT }}>
                お問い合わせ・申込先
              </p>
              <p className="text-sm font-semibold" style={{ color: IVORY_MUTED }}>
                BEYOND BEAUTY TOKYO 事務局
              </p>
              <p className="text-xs mt-0.5" style={{ color: IVORY_FAINT }}>
                インフォーマ マーケッツ ジャパン株式会社
              </p>
              <div className="mt-2 space-y-1">
                <p className="text-xs" style={{ color: IVORY_FAINT }}>
                  📞{" "}
                  <a
                    href="tel:0352961013"
                    className="transition-colors"
                    style={{ color: IVORY_FAINT }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = RED_LIGHT)}
                    onMouseLeave={(e) => (e.currentTarget.style.color = IVORY_FAINT)}
                  >
                    03-5296-1013
                  </a>
                </p>
                <p className="text-xs" style={{ color: IVORY_FAINT }}>
                  ✉️{" "}
                  <a
                    href="mailto:Jbeauty-jp@informa.com"
                    className="transition-colors"
                    style={{ color: IVORY_FAINT }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = RED_LIGHT)}
                    onMouseLeave={(e) => (e.currentTarget.style.color = IVORY_FAINT)}
                  >
                    Jbeauty-jp@informa.com
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ── Mobile floating summary ── */}
      <AnimatePresence>
        {total > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="lg:hidden fixed bottom-0 left-0 right-0 z-40"
          >
            <div
              className="px-5 py-4 flex items-center justify-between shadow-2xl"
              style={{
                background: "oklch(0.15 0.015 20)",
                borderTop: `2px solid ${RED}`,
              }}
            >
              <div>
                <p className="text-xs" style={{ color: IVORY_FAINT }}>合計（税別）</p>
                <p
                  className="text-xl font-bold amount-display"
                  style={{ fontFamily: "'Playfair Display', serif", color: RED_LIGHT }}
                >
                  {formatYen(animatedTotal)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs" style={{ color: IVORY_FAINT }}>税込</p>
                <p className="text-sm amount-display" style={{ color: IVORY_MUTED }}>
                  {formatYen(animatedWithTax)}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Booth Preview Modal ── */}
      {activePreviewData && (
        <BoothModal
          preview={activePreviewData}
          onClose={() => setActivePreview(null)}
        />
      )}
    </div>
  );
}
