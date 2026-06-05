import type { Metadata } from "next";
import { DocShell, type TocItem } from "@/components/docs/doc-shell";
import { Overview } from "@/components/docs/sections/overview";
import { StorageFlow } from "@/components/docs/sections/storage-flow";
import { Deployment } from "@/components/docs/sections/deployment";
import { RecoveryFaq } from "@/components/docs/sections/recovery-faq";

export const metadata: Metadata = {
  title: "Tài liệu · Vault",
  description:
    "Cách Vault lưu trữ zero-knowledge, luồng mã hóa, và hướng dẫn triển khai.",
};

const toc: TocItem[] = [
  { id: "tong-quan", label: "Tổng quan & Bảo mật" },
  { id: "luong", label: "Luồng lưu trữ & mở khóa" },
  { id: "trien-khai", label: "Triển khai A-Z" },
  { id: "recovery", label: "Khôi phục & FAQ" },
];

export default function DocsPage() {
  return (
    <DocShell toc={toc}>
      <Overview />
      <StorageFlow />
      <Deployment />
      <RecoveryFaq />
    </DocShell>
  );
}
