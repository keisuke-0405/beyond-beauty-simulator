/*
 * BEYOND BEAUTY TOKYO 2026 出展料金シミュレーター - Home Page
 * Design: Modern Trade Show Dashboard
 * Layout: Left 2/3 = selection area (category cards), Right 1/3 = sticky summary panel
 * Colors: Deep navy bg (#0F1B2D equiv), gold accents, white text
 * Fonts: Playfair Display (headings), Noto Sans JP (body)
 */

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronDown, ChevronUp, Info, X } from "lucide-react";

// ─── Data ────────────────────────────────────────────────────────────────────

const HERO_BG = "https://d2xsxph8kpxj0f.cloudfront.net/91578427/nvFmNv6dsftwwPRpeksQxP/hero-bg-FVUAjWxEYubH2Hq4nArgiK.webp";

type OptionType = "single" | "multi" | "radio";

interface Option {
  id: string;
  label: string;
  price: number;
  note?: string;
  type?: OptionType;
  groupId?: string;
  quantity?: number;
  maxQty?: number;
}

interface Category {
  id: string;
  title: string;
  icon: string;
  options: Option[];
  note?: string;
}

const CATEGORIES: Category[] = [
  {
    id: "booth",
    title: "出展スペース",
    icon: "🏛️",
    note: "1小間 = 9㎡（間口3m×奥行3m）。パッケージ装飾・会期中清掃付き。",
    options: [
      {
        id: "booth_1",
        label: "1小間（パッケージ装飾・会期中清掃付き）",
        price: 580000,
        note: "9㎡（間口3m×奥行3m）",
        type: "radio",
        groupId: "booth_size",
      },
      {
        id: "booth_2",
        label: "2小間（パッケージ装飾・会期中清掃付き）",
        price: 1140000,
        note: "18㎡（間口6m×奥行3m）",
        type: "radio",
        groupId: "booth_size",
      },
      {
        id: "booth_space",
        label: "スペースのみ（壁面パネル含む）",
        price: 480000,
        note: "カーペット・照明器具は別途費用",
        type: "radio",
        groupId: "booth_size",
      },
      {
        id: "booth_startup",
        label: "Start up ブース【創業5年以内の企業限定10社】",
        price: 250000,
        note: "4㎡（間口2m×奥行2m）",
        type: "radio",
        groupId: "booth_size",
      },
    ],
  },
  {
    id: "corner",
    title: "角小間オプション",
    icon: "📐",
    note: "Start up ブースは選択不可。角の数だけ追加。",
    options: [
      {
        id: "corner_1",
        label: "角小間指定",
        price: 30000,
        note: "1角あたり ¥30,000（税別）",
        type: "multi",
        maxQty: 4,
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
    note: "各枠30分。枠が埋まり次第締め切り。最新の空き状況は事務局へ。",
    options: [
      {
        id: "pres_0930_a",
        label: "9月30日（水） 10:20〜10:50",
        price: 100000,
        note: "(a) 100,000円",
        type: "single",
        groupId: "presentation",
      },
      {
        id: "pres_1001_b1",
        label: "10月1日（木） 11:05〜11:35",
        price: 120000,
        note: "(b) 120,000円",
        type: "single",
        groupId: "presentation",
      },
      {
        id: "pres_1001_b2",
        label: "10月1日（木） 11:50〜12:20",
        price: 120000,
        note: "(b) 120,000円",
        type: "single",
        groupId: "presentation",
      },
      {
        id: "pres_1001_b3",
        label: "10月1日（木） 12:35〜13:05",
        price: 120000,
        note: "(b) 120,000円",
        type: "single",
        groupId: "presentation",
      },
      {
        id: "pres_1001_b4",
        label: "10月1日（木） 13:20〜13:50",
        price: 120000,
        note: "(b) 120,000円",
        type: "single",
        groupId: "presentation",
      },
      {
        id: "pres_1001_b5",
        label: "10月1日（木） 14:05〜14:35",
        price: 120000,
        note: "(b) 120,000円",
        type: "single",
        groupId: "presentation",
      },
      {
        id: "pres_1001_b6",
        label: "10月1日（木） 14:50〜15:20",
        price: 120000,
        note: "(b) 120,000円",
        type: "single",
        groupId: "presentation",
      },
      {
        id: "pres_1002_b",
        label: "10月2日（金） 15:35〜16:05",
        price: 120000,
        note: "(b) 120,000円 ※10月2日のみ100,000円",
        type: "single",
        groupId: "presentation",
      },
      {
        id: "pres_1002_a",
        label: "10月2日（金） 16:20〜16:50",
        price: 100000,
        note: "(a) 100,000円",
        type: "single",
        groupId: "presentation",
      },
    ],
  },
  {
    id: "pr",
    title: "PR広告",
    icon: "📣",
    note: "複数選択可能。",
    options: [
      {
        id: "pr_map",
        label: "会場マップ広告",
        price: 150000,
        type: "single",
      },
      {
        id: "pr_mail",
        label: "メルマガ広告",
        price: 100000,
        type: "single",
      },
      {
        id: "pr_banner",
        label: "展示会公式HPバナー掲出（8月中旬〜10月中旬）",
        price: 100000,
        type: "single",
      },
      {
        id: "pr_strap",
        label: "バッジストラップ広告",
        price: 1000000,
        note: "来場者全員のバッジストラップに掲載",
        type: "single",
      },
      {
        id: "pr_badge",
        label: "バッジ広告",
        price: 1000000,
        note: "来場者全員のバッジに掲載",
        type: "single",
      },
      {
        id: "pr_board",
        label: "ボード広告（W848×H1384、両面）",
        price: 100000,
        type: "single",
      },
      {
        id: "pr_video",
        label: "プロモーション動画サービス",
        price: 100000,
        type: "single",
      },
    ],
  },
  {
    id: "other",
    title: "その他",
    icon: "✨",
    options: [
      {
        id: "vip_lounge",
        label: "VIPラウンジ サンプル提供サービス",
        price: 100000,
        type: "single",
      },
    ],
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatYen(amount: number): string {
  return "¥" + amount.toLocaleString("ja-JP");
}

function useCountUp(target: number, duration = 600) {
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
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration]);

  return display;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function OptionRow({
  option,
  selected,
  quantity,
  onToggle,
  onQtyChange,
}: {
  option: Option;
  selected: boolean;
  quantity: number;
  onToggle: () => void;
  onQtyChange?: (qty: number) => void;
}) {
  return (
    <motion.div
      layout
      className={`option-card rounded-lg p-4 cursor-pointer select-none ${selected ? "selected" : ""}`}
      onClick={onToggle}
      whileHover={{ scale: 1.005 }}
      whileTap={{ scale: 0.998 }}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <div
          className={`mt-0.5 w-5 h-5 rounded flex-shrink-0 flex items-center justify-center border transition-all duration-200 ${
            selected
              ? "bg-[oklch(0.75_0.12_70)] border-[oklch(0.75_0.12_70)]"
              : "border-white/20 bg-white/5"
          }`}
        >
          {selected && <Check size={12} strokeWidth={3} className="text-[oklch(0.15_0.03_240)]" />}
        </div>

        {/* Label */}
        <div className="flex-1 min-w-0">
          <p className={`text-sm leading-snug ${selected ? "text-white" : "text-white/80"}`}>
            {option.label}
          </p>
          {option.note && (
            <p className="text-xs text-white/40 mt-0.5">{option.note}</p>
          )}
        </div>

        {/* Price */}
        <div className="text-right flex-shrink-0 ml-2">
          <span
            className={`text-sm font-semibold amount-display ${
              selected ? "text-[oklch(0.88_0.10_70)]" : "text-white/60"
            }`}
          >
            {formatYen(option.price)}
          </span>
          <span className="text-xs text-white/30 ml-0.5">税別</span>
        </div>
      </div>

      {/* Quantity selector for multi-type */}
      {option.type === "multi" && selected && onQtyChange && (
        <div
          className="mt-3 flex items-center gap-3 pl-8"
          onClick={(e) => e.stopPropagation()}
        >
          <span className="text-xs text-white/50">数量:</span>
          <div className="flex items-center gap-2">
            <button
              className="w-7 h-7 rounded bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              onClick={() => onQtyChange(Math.max(1, quantity - 1))}
            >
              −
            </button>
            <span className="text-white font-medium w-6 text-center">{quantity}</span>
            <button
              className="w-7 h-7 rounded bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              onClick={() => onQtyChange(Math.min(option.maxQty ?? 99, quantity + 1))}
            >
              +
            </button>
          </div>
          <span className="text-xs text-[oklch(0.88_0.10_70)]">
            小計: {formatYen(option.price * quantity)}
          </span>
        </div>
      )}
    </motion.div>
  );
}

function CategorySection({
  category,
  selectedIds,
  quantities,
  onToggle,
  onQtyChange,
}: {
  category: Category;
  selectedIds: Set<string>;
  quantities: Record<string, number>;
  onToggle: (optionId: string, groupId?: string) => void;
  onQtyChange: (optionId: string, qty: number) => void;
}) {
  const [open, setOpen] = useState(true);
  const selectedCount = category.options.filter((o) => selectedIds.has(o.id)).length;

  return (
    <div className="rounded-xl overflow-hidden border border-white/8 bg-[oklch(0.22_0.04_240)]">
      {/* Header */}
      <button
        className="w-full flex items-center gap-3 px-5 py-4 hover:bg-white/5 transition-colors"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="text-xl">{category.icon}</span>
        <div className="flex-1 text-left">
          <h3
            className="font-semibold text-white"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            {category.title}
          </h3>
          {category.note && (
            <p className="text-xs text-white/40 mt-0.5 leading-relaxed">{category.note}</p>
          )}
        </div>
        {selectedCount > 0 && (
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-[oklch(0.75_0.12_70)] text-[oklch(0.15_0.03_240)]">
            {selectedCount}件選択中
          </span>
        )}
        {open ? (
          <ChevronUp size={16} className="text-white/40" />
        ) : (
          <ChevronDown size={16} className="text-white/40" />
        )}
      </button>

      {/* Options */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-2">
              {category.options.map((opt) => (
                <OptionRow
                  key={opt.id}
                  option={opt}
                  selected={selectedIds.has(opt.id)}
                  quantity={quantities[opt.id] ?? 1}
                  onToggle={() => onToggle(opt.id, opt.groupId)}
                  onQtyChange={(qty) => onQtyChange(opt.id, qty)}
                />
              ))}
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

  // Compute total
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

  // Selected items list for summary
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

  function handleToggle(optionId: string, groupId?: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(optionId)) {
        next.delete(optionId);
      } else {
        // If radio group, deselect others in the group
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
  }

  function handleQtyChange(optionId: string, qty: number) {
    setQuantities((prev) => ({ ...prev, [optionId]: qty }));
  }

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

  return (
    <div className="min-h-screen bg-[oklch(0.18_0.04_240)]">
      {/* ── Hero Header ── */}
      <header
        className="relative overflow-hidden"
        style={{
          backgroundImage: `url(${HERO_BG})`,
          backgroundSize: "cover",
          backgroundPosition: "center top",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[oklch(0.18_0.04_240/0.6)] via-[oklch(0.18_0.04_240/0.7)] to-[oklch(0.18_0.04_240)]" />
        <div className="relative container py-10 md:py-14">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <p className="text-[oklch(0.88_0.10_70)] text-sm font-medium tracking-widest uppercase mb-2">
                Informa Markets Japan
              </p>
              <h1
                className="text-3xl md:text-4xl font-bold text-white leading-tight"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                BEYOND BEAUTY TOKYO 2026
              </h1>
              <p className="text-white/70 mt-2 text-base">
                出展料金シミュレーター
              </p>
            </div>
            <div className="text-right">
              <div className="inline-flex flex-col items-end gap-1 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl px-5 py-3">
                <span className="text-xs text-white/50">開催期間</span>
                <span className="text-white font-medium text-sm">2026年9月30日（水）〜10月2日（金）</span>
                <span className="text-white/60 text-xs">東京ビッグサイト 西ホール</span>
              </div>
            </div>
          </div>

          {/* Notice */}
          <div className="mt-6 flex items-start gap-2 bg-[oklch(0.75_0.12_70/0.12)] border border-[oklch(0.75_0.12_70/0.3)] rounded-lg px-4 py-3 max-w-2xl">
            <Info size={15} className="text-[oklch(0.88_0.10_70)] mt-0.5 flex-shrink-0" />
            <p className="text-xs text-white/70 leading-relaxed">
              このシミュレーターは参考用です。<strong className="text-white/90">料金はすべて税別表示</strong>です。
              実際の申込は事務局（TEL: 03-5296-1013）へご確認ください。
              <br />
              申込締切：1次 2026年3月31日 / 2次 2026年5月29日
            </p>
          </div>
        </div>
      </header>

      {/* ── Main Layout ── */}
      <main className="container py-8">
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Left: Selection Area */}
          <div className="flex-1 min-w-0 space-y-4">
            <h2 className="text-white/60 text-xs font-medium tracking-widest uppercase mb-4">
              オプションを選択してください
            </h2>
            {CATEGORIES.map((cat) => (
              <CategorySection
                key={cat.id}
                category={cat}
                selectedIds={selectedIds}
                quantities={quantities}
                onToggle={handleToggle}
                onQtyChange={handleQtyChange}
              />
            ))}

            {/* Cancel policy */}
            <div className="rounded-xl border border-white/8 bg-[oklch(0.22_0.04_240)] p-5 mt-6">
              <h3 className="text-white/80 font-semibold text-sm mb-3 flex items-center gap-2">
                <span>📋</span> キャンセル料金規定
              </h3>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-white/40 w-36 flex-shrink-0">〜2026年5月31日</span>
                  <span className="text-sm text-white/70">出展料金 × <strong className="text-[oklch(0.88_0.10_70)]">50%</strong></span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-white/40 w-36 flex-shrink-0">2026年6月1日〜</span>
                  <span className="text-sm text-white/70">出展料金 × <strong className="text-[oklch(0.88_0.10_70)]">100%</strong></span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Sticky Summary */}
          <div className="w-full lg:w-80 xl:w-96 lg:sticky lg:top-6">
            <div className="rounded-xl border border-white/10 bg-[oklch(0.22_0.04_240)] overflow-hidden">
              {/* Summary Header */}
              <div className="px-5 py-4 border-b border-white/8 flex items-center justify-between">
                <h2
                  className="font-semibold text-white text-base"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  料金サマリー
                </h2>
                {selectedIds.size > 0 && (
                  <button
                    className="text-xs text-white/40 hover:text-white/70 transition-colors"
                    onClick={handleReset}
                  >
                    リセット
                  </button>
                )}
              </div>

              {/* Selected Items */}
              <div className="px-5 py-4 min-h-[120px]">
                {selectedItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="text-3xl mb-2 opacity-30">📋</div>
                    <p className="text-white/30 text-sm">左のオプションを選択すると<br />ここに表示されます</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <AnimatePresence>
                      {selectedItems.map((item) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          transition={{ duration: 0.2 }}
                          className="flex items-start gap-2 group"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-white/50 leading-none mb-0.5">{item.categoryTitle}</p>
                            <p className="text-sm text-white/85 leading-snug truncate">{item.label}</p>
                            {item.qty > 1 && (
                              <p className="text-xs text-white/40">× {item.qty}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <span className="text-sm font-medium text-[oklch(0.88_0.10_70)] amount-display">
                              {formatYen(item.subtotal)}
                            </span>
                            <button
                              className="opacity-0 group-hover:opacity-100 transition-opacity text-white/30 hover:text-white/70 ml-1"
                              onClick={() => handleRemove(item.id)}
                            >
                              <X size={12} />
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>

              {/* Total */}
              <div className="border-t border-white/8 px-5 py-4 bg-[oklch(0.20_0.04_240)]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-white/50">合計（税別）</span>
                  <span className="text-lg font-bold text-white amount-display">
                    {formatYen(animatedTotal)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/40">消費税（10%）込</span>
                  <span className="text-sm text-white/60 amount-display">
                    {formatYen(animatedWithTax)}
                  </span>
                </div>

                {/* Big total display */}
                {total > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 rounded-lg bg-gradient-to-br from-[oklch(0.75_0.12_70/0.15)] to-[oklch(0.75_0.12_70/0.05)] border border-[oklch(0.75_0.12_70/0.3)] p-4 text-center"
                  >
                    <p className="text-xs text-[oklch(0.88_0.10_70)] mb-1 tracking-wider uppercase">お支払い合計（税込）</p>
                    <p
                      className="text-3xl font-bold text-[oklch(0.88_0.10_70)] amount-display"
                      style={{ fontFamily: "'Playfair Display', serif" }}
                    >
                      {formatYen(animatedWithTax)}
                    </p>
                    <p className="text-xs text-white/30 mt-1">
                      {selectedIds.size}件のオプション
                    </p>
                  </motion.div>
                )}
              </div>

              {/* Deadline reminder */}
              <div className="px-5 py-3 bg-[oklch(0.19_0.04_240)] border-t border-white/5">
                <p className="text-xs text-white/35 text-center leading-relaxed">
                  1次締切: <span className="text-white/55">2026年3月31日（火）</span>
                  　2次締切: <span className="text-white/55">2026年5月29日（金）</span>
                </p>
              </div>
            </div>

            {/* Contact info */}
            <div className="mt-4 rounded-xl border border-white/8 bg-[oklch(0.22_0.04_240)] px-5 py-4">
              <p className="text-xs text-white/40 mb-2 font-medium">お問い合わせ・申込先</p>
              <p className="text-sm text-white/70 font-medium">BEYOND BEAUTY TOKYO 事務局</p>
              <p className="text-xs text-white/50 mt-1">インフォーマ マーケッツ ジャパン株式会社</p>
              <div className="mt-2 space-y-1">
                <p className="text-xs text-white/50">
                  📞 <a href="tel:0352961013" className="hover:text-[oklch(0.88_0.10_70)] transition-colors">03-5296-1013</a>
                </p>
                <p className="text-xs text-white/50">
                  ✉️ <a href="mailto:Jbeauty-jp@informa.com" className="hover:text-[oklch(0.88_0.10_70)] transition-colors">Jbeauty-jp@informa.com</a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Mobile floating summary */}
      <AnimatePresence>
        {total > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="lg:hidden fixed bottom-0 left-0 right-0 z-50"
          >
            <div className="bg-[oklch(0.20_0.04_240)] border-t border-[oklch(0.75_0.12_70/0.4)] px-5 py-4 flex items-center justify-between shadow-2xl">
              <div>
                <p className="text-xs text-white/40">合計（税別）</p>
                <p className="text-xl font-bold text-[oklch(0.88_0.10_70)] amount-display">
                  {formatYen(animatedTotal)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-white/40">税込</p>
                <p className="text-sm text-white/70 amount-display">{formatYen(animatedWithTax)}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
