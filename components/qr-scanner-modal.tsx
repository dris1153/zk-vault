"use client";

// Live camera QR scanner. Opens a viewfinder, decodes frames with jsQR (lazy)
// until a QR is found (or continuously when scanning multi-QR GA exports).
// Falls back to picking image file(s) when camera is unavailable/denied.

import { useEffect, useRef, useState, type ReactNode } from "react";
import { X, ImageSquare } from "@phosphor-icons/react/dist/ssr";
import { decodeQrFromImage } from "@/lib/ui/qr-decode";
import { Modal, IconButton } from "./ui-kit";

export function QrScannerModal({
  open,
  onClose,
  onResult,
  continuous = false,
  multipleFiles = false,
  title = "Quét mã QR",
  status,
}: {
  open: boolean;
  onClose: () => void;
  onResult: (text: string) => void;
  continuous?: boolean;
  multipleFiles?: boolean;
  title?: string;
  status?: ReactNode;
}) {
  // Modal returns null when closed, so Scanner unmounts -> camera cleanup runs.
  return (
    <Modal open={open} onClose={onClose} width="max-w-sm">
      {open && (
        <Scanner
          onResult={onResult}
          onClose={onClose}
          continuous={continuous}
          multipleFiles={multipleFiles}
          title={title}
          status={status}
        />
      )}
    </Modal>
  );
}

function Scanner({
  onResult,
  onClose,
  continuous,
  multipleFiles,
  title,
  status,
}: {
  onResult: (text: string) => void;
  onClose: () => void;
  continuous: boolean;
  multipleFiles: boolean;
  title: string;
  status?: ReactNode;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;
  const lastTextRef = useRef<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let raf = 0;
    let stopped = false;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    async function start() {
      if (!navigator.mediaDevices?.getUserMedia || !ctx) {
        setError("Trình duyệt không hỗ trợ camera. Hãy chọn ảnh.");
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });
      } catch (e) {
        if (stopped) return;
        setError(cameraError(e));
        return;
      }
      const video = videoRef.current;
      if (stopped || !video) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      video.srcObject = stream;
      await video.play().catch(() => {});

      const { default: jsQR } = await import("jsqr");
      const tick = () => {
        if (stopped) return;
        if (video.readyState >= 2 && video.videoWidth) {
          const w = 640;
          const h = Math.round((video.videoHeight / video.videoWidth) * w);
          canvas.width = w;
          canvas.height = h;
          ctx.drawImage(video, 0, 0, w, h);
          const res = jsQR(ctx.getImageData(0, 0, w, h).data, w, h);
          if (res?.data) {
            const text = res.data.trim();
            if (!continuous) {
              onResultRef.current(text);
              return;
            }
            if (text && text !== lastTextRef.current) {
              lastTextRef.current = text;
              onResultRef.current(text);
            }
          }
        }
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }
    void start();

    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [continuous]);

  async function onFiles(files: FileList) {
    setError(null);
    let foundAny = false;
    for (const file of Array.from(files)) {
      try {
        const text = await decodeQrFromImage(file);
        if (text) {
          foundAny = true;
          onResultRef.current(text.trim());
        }
      } catch {
        // continue checking other images if multiple
      }
    }
    if (!foundAny) {
      setError("Không tìm thấy mã QR trong ảnh.");
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between border-b border-line p-4">
        <h2 className="text-base font-semibold">{title}</h2>
        <IconButton onClick={onClose} aria-label="Đóng">
          <X size={18} />
        </IconButton>
      </div>
      <div className="p-4">
        {error ? (
          <p className="mb-3 text-sm text-danger">{error}</p>
        ) : (
          <div className="relative mb-3 aspect-square overflow-hidden rounded-xl bg-black">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="h-full w-full object-cover"
            />
            <div className="pointer-events-none absolute inset-6 rounded-lg border-2 border-accent/80" />
          </div>
        )}
        {status && <div className="mb-3">{status}</div>}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple={multipleFiles}
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) void onFiles(e.target.files);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex w-full items-center justify-center gap-2 rounded-full border border-line bg-inset px-3 py-2.5 text-sm font-medium text-ink-2 transition hover:bg-line/70 hover:text-ink"
        >
          <ImageSquare size={16} />
          {multipleFiles ? "Chọn ảnh QR (có thể chọn nhiều)" : "Chọn ảnh thay thế"}
        </button>
        {!error && (
          <p className="mt-2 text-center text-xs text-muted">
            Đưa mã QR vào khung. Tự nhận khi rõ nét.
          </p>
        )}
      </div>
    </div>
  );
}

function cameraError(e: unknown): string {
  const name = e instanceof Error ? e.name : "";
  if (name === "NotAllowedError")
    return "Bạn đã từ chối quyền camera. Hãy chọn ảnh.";
  if (name === "NotFoundError") return "Không tìm thấy camera. Hãy chọn ảnh.";
  if (typeof window !== "undefined" && !window.isSecureContext)
    return "Camera cần HTTPS. Hãy chọn ảnh.";
  return "Không mở được camera. Hãy chọn ảnh.";
}
