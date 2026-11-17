"use client";

import { X, ShieldCheck, CircleNotch } from "@phosphor-icons/react/dist/ssr";
import type { HealthReport, HealthEntry } from "@/lib/vault/password-health";
import { TYPE_ICON } from "@/lib/ui/icons";
import { Modal, IconButton } from "./ui-kit";

type Tone = "danger" | "warn" | "muted";

export function SecurityCheckModal({
  open,
  onClose,
  report,
  loading,
  onOpenItem,
}: {
  open: boolean;
  onClose: () => void;
  report: HealthReport | null;
  loading: boolean;
  onOpenItem: (id: string) => void;
}) {
  const reusedItems = report ? report.reused.flat() : [];
  const healthy = report != null && report.totalIssues === 0;

  return (
    <Modal open={open} onClose={onClose} width="max-w-xl">
      <div className="flex items-center justify-between border-b border-line p-5">
        <h2 className="text-base font-semibold">Kiểm tra bảo mật</h2>
        <IconButton onClick={onClose} aria-label="Đóng">
          <X size={18} />
        </IconButton>
      </div>

      <div className="max-h-[70dvh] overflow-y-auto p-5">
        {report && (
          <div className="mb-5 flex items-center gap-4">
            <span className="font-mono text-3xl font-semibold text-ink tabular-nums">
              {report.score}
            </span>
            <div className="text-xs text-muted">
              <div>Điểm an toàn (trên 100)</div>
              <div>
                {report.totalIssues} mục cần chú ý
                {loading ? " · đang quét..." : ""}
              </div>
            </div>
          </div>
        )}

        {loading && !report && (
          <div className="flex items-center gap-2 text-sm text-muted">
            <CircleNotch size={16} className="animate-spin" /> Đang phân tích...
          </div>
        )}

        {healthy && (
          <div className="flex flex-col items-center gap-2 py-10 text-center text-muted">
            <ShieldCheck size={40} className="text-success" />
            <p className="font-medium text-ink">Vault của bạn khỏe mạnh</p>
            <p className="text-sm">
              Không phát hiện mật khẩu yếu, trùng lặp hay lộ.
            </p>
          </div>
        )}

        {report && (
          <div className="flex flex-col gap-5">
            <Section
              title="Trùng lặp"
              tone="warn"
              note="Dùng chung một mật khẩu ở nhiều mục."
              entries={reusedItems}
              onOpenItem={onOpenItem}
            />
            <Section
              title="Yếu"
              tone="danger"
              note="Mật khẩu dễ đoán."
              entries={report.weak}
              onOpenItem={onOpenItem}
            />
            <Section
              title="Rò rỉ"
              tone="danger"
              note="Xuất hiện trong dữ liệu rò rỉ công khai (HIBP)."
              entries={report.breached}
              onOpenItem={onOpenItem}
            />
            <Section
              title="Cũ"
              tone="muted"
              note="Chưa cập nhật quá 1 năm."
              entries={report.old}
              onOpenItem={onOpenItem}
            />
          </div>
        )}
      </div>
    </Modal>
  );
}

function Section({
  title,
  tone,
  note,
  entries,
  onOpenItem,
}: {
  title: string;
  tone: Tone;
  note: string;
  entries: HealthEntry[];
  onOpenItem: (id: string) => void;
}) {
  if (entries.length === 0) return null;
  const dot = {
    danger: "bg-danger",
    warn: "bg-accent",
    muted: "bg-faint",
  }[tone];
  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${dot}`} />
        <span className="text-sm font-medium text-ink">{title}</span>
        <span className="text-xs text-muted">· {entries.length}</span>
      </div>
      <p className="mb-2 text-xs text-muted">{note}</p>
      <div className="flex flex-col gap-1.5">
        {entries.map((e, i) => {
          const Icon = TYPE_ICON[e.type];
          return (
            <button
              key={`${e.id}-${i}`}
              type="button"
              onClick={() => onOpenItem(e.id)}
              className="flex items-center gap-2.5 rounded-xl border border-line bg-surface px-3 py-2.5 text-left shadow-row transition hover:bg-inset"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-inset text-ink">
                <Icon size={15} />
              </span>
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-ink">
                  {e.title}
                </div>
                {e.username && (
                  <div className="truncate text-xs text-muted">
                    {e.username}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
