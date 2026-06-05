import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { DocSection, H3, P, Callout } from "@/components/docs/doc-ui";

export const metadata: Metadata = {
  title: "Tài liệu · ZKVault",
  description:
    "Cách ZKVault lưu trữ zero-knowledge, tính năng, và hướng dẫn triển khai.",
};

const INDEX = [
  {
    href: "/docs/bao-mat",
    title: "Bảo mật",
    desc: "Mã hóa phong bì, Argon2id + AES-256-GCM, định danh email-salt, mô hình đe dọa thành thật.",
  },
  {
    href: "/docs/tinh-nang",
    title: "Tính năng",
    desc: "6 loại mục (gồm database), 2FA + quét QR, mở khóa sinh trắc, kiểm tra mật khẩu, tags, PWA.",
  },
  {
    href: "/docs/trien-khai",
    title: "Triển khai",
    desc: "Dựng Supabase, 2 biến env, migration, kiểm tra, deploy Vercel, cài app PWA.",
  },
  {
    href: "/docs/khoi-phuc",
    title: "Khôi phục & FAQ",
    desc: "Export file backup mã hóa, khôi phục bằng recovery key, đổi master, câu hỏi thường gặp.",
  },
];

export default function DocsOverview() {
  return (
    <DocSection id="tong-quan" title="Tổng quan">
      <P>
        ZKVault là kho lưu trữ thông tin nhạy cảm cho cá nhân: mật khẩu đăng nhập,
        private key ví, seed phrase, SSH key, ghi chú bảo mật, API key, thông tin
        database. Toàn bộ việc mã hóa và giải mã diễn ra{" "}
        <strong>ngay trong trình duyệt</strong> của bạn. Máy chủ (Supabase) chỉ lưu
        dữ liệu đã mã hóa và không bao giờ thấy nội dung gốc.
      </P>

      <H3>Zero-knowledge nghĩa là gì?</H3>
      <P>
        Master password của bạn không bao giờ rời khỏi trình duyệt. Kẻ tấn công
        chiếm được cơ sở dữ liệu Supabase cũng chỉ lấy được các khối ký tự vô nghĩa
        (ciphertext). Đây chính là mô hình mà Bitwarden và 1Password dùng.
      </P>

      <Callout title="Không có nút Quên mật khẩu">
        Đây là cái giá của bảo mật tối đa. Mất master password thì chỉ khôi phục
        được bằng recovery key (24 từ) + file backup. Mất cả hai thì dữ liệu mất
        vĩnh viễn, không ai (kể cả bạn) lấy lại được.
      </Callout>

      <H3>Nội dung tài liệu</H3>
      <div className="my-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {INDEX.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="group flex flex-col rounded-2xl border border-charcoal bg-obsidian p-4 transition hover:border-slate hover:bg-ash"
          >
            <div className="mb-1 flex items-center gap-1.5 font-medium text-snow">
              {c.title}
              <ArrowRight
                size={15}
                className="text-smoke transition group-hover:translate-x-0.5 group-hover:text-azure"
              />
            </div>
            <div className="text-[13px] leading-relaxed text-silver">
              {c.desc}
            </div>
          </Link>
        ))}
      </div>
    </DocSection>
  );
}
