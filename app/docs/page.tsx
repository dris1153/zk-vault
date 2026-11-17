import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { DocSection, H3, P, Callout, Bullets } from "@/components/docs/doc-ui";

export const metadata: Metadata = {
  title: "Tài liệu · ZKVault",
  description:
    "Cách dùng ZKVault, tính năng, bảo mật zero-knowledge và hướng dẫn triển khai.",
};

const INDEX = [
  {
    href: "/docs/bat-dau",
    title: "Bắt đầu",
    desc: "Tạo vault, lưu recovery key, mở khóa và cài app trong vài phút.",
  },
  {
    href: "/docs/tinh-nang",
    title: "Hướng dẫn dùng",
    desc: "Cách dùng từng phần: thêm mục, 2FA + quét QR, sinh trắc, kiểm tra mật khẩu, tags, settings.",
  },
  {
    href: "/docs/khoi-phuc",
    title: "Khôi phục & FAQ",
    desc: "Export backup, khôi phục bằng recovery key, đổi master, câu hỏi thường gặp.",
  },
  {
    href: "/docs/bao-mat",
    title: "Bảo mật & kiến trúc",
    desc: "Cho nhà phát triển: mã hóa phong bì, Argon2id, định danh, RLS, mô hình đe dọa.",
  },
];

export default function DocsOverview() {
  return (
    <DocSection id="tong-quan" title="Tổng quan">
      <P>
        ZKVault là kho lưu trữ thông tin nhạy cảm cho cá nhân: mật khẩu đăng nhập,
        private key ví, seed phrase, SSH key, ghi chú bảo mật, API key, thông tin
        database. Toàn bộ việc mã hóa và giải mã diễn ra{" "}
        <strong>ngay trong trình duyệt</strong> của bạn. Máy chủ chỉ lưu dữ liệu đã
        mã hóa và không bao giờ thấy nội dung gốc.
      </P>

      <H3>Tính năng nổi bật</H3>
      <Bullets>
        <li>
          <strong>Zero-knowledge:</strong> master password không bao giờ rời máy;
          server chỉ giữ ciphertext.
        </li>
        <li>
          <strong>7 loại mục:</strong> Đăng nhập (Login), Mã 2FA (Authenticator), Ví crypto, SSH Key, Database (kèm engine picker có logo), Ghi chú bảo mật, và API Key.
        </li>
        <li>
          <strong>Màn hình Mã 2FA tức thì:</strong> mở vault là thấy ngay danh sách mã TOTP kiểu Google Authenticator, chạm để copy, báo trước mã sắp đổi ở 5 giây cuối, hỗ trợ import hàng loạt từ Google Authenticator.
        </li>
        <li>
          <strong>Mở khóa sinh trắc:</strong> vân tay / Face / Windows Hello (tùy
          chọn, master luôn là dự phòng).
        </li>
        <li>
          <strong>Kiểm tra bảo mật:</strong> dò mật khẩu trùng / yếu / cũ, kèm kiểm
          tra rò rỉ HIBP (tùy chọn).
        </li>
        <li>
          <strong>Tags + lọc nhiều tag, tìm kiếm tức thì, tự khóa, tự xóa
          clipboard,</strong>{" "}
          và <strong>cài như app (PWA)</strong> chạy được offline.
        </li>
      </Bullets>

      <Callout title="Không có nút Quên mật khẩu">
        Đây là cái giá của bảo mật tối đa. Mất master password thì chỉ khôi phục
        được bằng recovery key (24 từ) + file backup. Mất cả hai thì dữ liệu mất
        vĩnh viễn, không ai (kể cả bạn) lấy lại được.
      </Callout>

      <H3>Đọc tiếp</H3>
      <div className="my-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {INDEX.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="group flex flex-col rounded-xl bg-surface p-4 shadow-card transition hover:bg-inset/40"
          >
            <div className="mb-1 flex items-center gap-1.5 font-semibold text-ink">
              {c.title}
              <ArrowRight
                size={15}
                className="text-muted transition group-hover:translate-x-0.5 group-hover:text-ink"
              />
            </div>
            <div className="text-[13px] leading-relaxed text-muted">
              {c.desc}
            </div>
          </Link>
        ))}
      </div>
    </DocSection>
  );
}
