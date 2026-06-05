import type { Metadata } from "next";
import Link from "next/link";
import {
  DocSection,
  H3,
  P,
  InlineCode,
  Callout,
  Steps,
  Step,
} from "@/components/docs/doc-ui";

export const metadata: Metadata = { title: "Bắt đầu · ZKVault" };

export default function GettingStartedPage() {
  return (
    <DocSection id="bat-dau" title="Bắt đầu">
      <P>
        Lần đầu dùng chỉ mất vài phút. Làm theo 4 bước dưới đây, đặc biệt đừng bỏ qua
        bước lưu recovery key.
      </P>

      <Steps>
        <Step n={1} title="Tạo vault">
          Ở màn hình khóa, nhập <strong>email</strong> rồi đặt một{" "}
          <strong>master password</strong> đủ mạnh và độc nhất. Master password không
          bao giờ rời khỏi máy bạn và <strong>không thể đặt lại</strong> - hãy chọn
          thứ bạn nhớ được nhưng người khác không đoán ra.
        </Step>

        <Step n={2} title="Lưu kỹ recovery key (24 từ)">
          Sau khi tạo, app hiện <strong>24 từ recovery key</strong>. Đây là cách duy
          nhất để khôi phục nếu quên master. Chép ra giấy hoặc nơi an toàn, rồi tick
          xác nhận đã lưu.
        </Step>

        <Step n={3} title="Mở khóa lần sau">
          Email được nhớ sẵn (hiện dạng nhãn), bạn chỉ cần gõ master để mở. Có thể bật
          <strong> mở khóa sinh trắc</strong> để mở nhanh hơn (xem Hướng dẫn dùng).
          Muốn đổi tài khoản thì bấm <InlineCode>Đăng xuất</InlineCode> để nhập email
          khác.
        </Step>

        <Step n={4} title="Cài như app (PWA)">
          Trên trình duyệt, bấm <strong>Install</strong> (hoặc Add to Home Screen) để
          cài ZKVault như một ứng dụng: mở nhanh, có biểu tượng riêng, và load được
          app shell khi offline (mở khóa vẫn cần mạng).
        </Step>
      </Steps>

      <Callout tone="warn" title="Không có nút Quên mật khẩu">
        Mất master mà không có recovery key + file backup thì dữ liệu mất vĩnh viễn.
        Hãy lưu recovery key ngay từ đầu, và thỉnh thoảng Export một file backup
        (Settings &rarr; Backup).
      </Callout>

      <H3>Tiếp theo</H3>
      <P>
        Xem{" "}
        <Link href="/docs/tinh-nang" className="text-azure-link hover:underline">
          Hướng dẫn dùng
        </Link>{" "}
        để biết cách thêm mục, bật 2FA, mở khóa sinh trắc, kiểm tra mật khẩu và hơn
        thế nữa.
      </P>
    </DocSection>
  );
}
