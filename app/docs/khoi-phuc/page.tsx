import type { Metadata } from "next";
import {
  DocSection,
  H3,
  P,
  InlineCode,
  Callout,
  Steps,
  Step,
} from "@/components/docs/doc-ui";

export const metadata: Metadata = { title: "Khôi phục & FAQ · ZKVault" };

export default function RecoveryPage() {
  return (
    <DocSection id="khoi-phuc" title="Khôi phục & FAQ">
      <H3>Khôi phục khi quên master password</H3>
      <P>
        Mô hình khôi phục dùng <strong>file backup mã hóa</strong>: RLS luôn nghiêm
        ngặt, không có đường đọc dữ liệu từ cloud nếu chưa đăng nhập. File{" "}
        <InlineCode>.vault</InlineCode> tự chứa mọi thứ cần thiết (đều là ciphertext,
        an toàn để lưu ở Drive/USB).
      </P>
      <Steps>
        <Step n={1} title="Export định kỳ khi còn nhớ master">
          Vào <InlineCode>Settings &rarr; Backup &rarr; Export</InlineCode> để tải
          file <InlineCode>.vault</InlineCode>. Nên làm định kỳ.
        </Step>
        <Step n={2} title="Khi lỡ quên master">
          Tạo vault mới (master mới) trên bất kỳ thiết bị nào.
        </Step>
        <Step n={3} title="Import bằng recovery key">
          Vào <InlineCode>Settings &rarr; Backup &rarr; Import</InlineCode>, chọn file{" "}
          <InlineCode>.vault</InlineCode>, tick &quot;dùng recovery key&quot;, nhập
          24 từ. App giải mã các mục từ file rồi mã hóa lại bằng DEK của vault mới.
        </Step>
      </Steps>

      <H3>Đổi master password</H3>
      <P>
        Trong <InlineCode>Settings &rarr; Account</InlineCode>. Thao tác này chỉ bọc
        lại DEK chứ không mã hóa lại các mục, recovery key vẫn còn nguyên hiệu lực,
        nhưng đăng ký sinh trắc trên thiết bị sẽ bị xóa (bật lại nếu muốn).
      </P>

      <H3>Tạo lại recovery key</H3>
      <P>
        Lỡ mất giấy ghi 24 từ? Khi đang mở khóa, vào{" "}
        <InlineCode>Settings &rarr; Account &rarr; Tạo lại recovery key</InlineCode>{" "}
        để sinh bộ 24 từ mới. Recovery key cũ <strong>ngừng hiệu lực ngay</strong>;
        master password không đổi. Lưu kỹ 24 từ mới (chỉ hiện một lần).
      </P>

      <Callout tone="warn" title="Mất cả master lẫn recovery key = mất vĩnh viễn">
        Không có cửa hậu. Hãy in 24 từ recovery ra giấy và cất riêng với file backup.
        Đây là đánh đổi cố ý của zero-knowledge.
      </Callout>

      <H3>Câu hỏi thường gặp</H3>

      <H3>Dùng Gmail thường làm email vault được không?</H3>
      <P>
        Được. Email chỉ là định danh đăng nhập và là salt; không có thư nào được gửi
        (đã tắt Confirm email). Không cần domain riêng. Bạn nhập email ở lần đăng
        nhập đầu, app nhớ trong trình duyệt.
      </P>

      <H3>Có những loại mục nào?</H3>
      <P>
        Sáu loại: Login, Wallet, SSH Key, Secure Note, API Key, và Database (kèm
        engine picker). Seed phrase nằm trong Wallet; cụm từ bảo mật dùng Secure
        Note. Thêm loại mới chủ yếu là việc ở client (loại database cần thêm một dòng
        CHECK constraint - migration 0002).
      </P>

      <H3>Sinh trắc / 2FA có làm vault an toàn hơn không?</H3>
      <P>
        Không phải lớp bảo vệ thêm cho vault - chúng là tiện ích. Mở khóa sinh trắc
        chỉ thay việc gõ master trên một thiết bị; mã 2FA (TOTP) là dữ liệu bạn lưu,
        không phải 2FA bảo vệ vault. Gốc tin cậy vẫn là master + recovery key (xem
        trang Bảo mật).
      </P>

      <H3>Còn gì cần lưu ý về web?</H3>
      <P>
        Một app web tải lại mã nguồn mỗi lần mở. Nếu host hoặc một dependency bị xâm
        nhập, về lý thuyết nó có thể phục vụ mã độc đánh cắp master lúc bạn gõ.
        Zero-knowledge không chống được điều này. Giảm thiểu bằng pin dependency, tự
        host, và cài PWA (ghim mã nguồn vào máy).
      </P>
    </DocSection>
  );
}
