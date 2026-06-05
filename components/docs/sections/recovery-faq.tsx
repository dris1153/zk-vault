import {
  DocSection,
  H3,
  P,
  InlineCode,
  Callout,
  Steps,
  Step,
  Bullets,
} from "../doc-ui";

export function RecoveryFaq() {
  return (
    <DocSection id="recovery" title="Khôi phục, FAQ & Lưu ý">
      <H3>Khôi phục khi quên master password</H3>
      <P>
        Mô hình khôi phục dùng <strong>file backup mã hóa</strong> (Option A): RLS
        luôn nghiêm ngặt, không có đường đọc dữ liệu từ cloud nếu chưa đăng nhập.
        File <InlineCode>.vault</InlineCode> tự chứa mọi thứ cần thiết (đều là
        ciphertext, an toàn để lưu ở Drive/USB).
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
          Vào <InlineCode>Settings &rarr; Backup &rarr; Import</InlineCode>, chọn
          file <InlineCode>.vault</InlineCode>, tick &quot;dùng recovery
          key&quot;, nhập 24 từ. App giải mã các mục từ file rồi mã hóa lại bằng
          DEK của vault mới.
        </Step>
      </Steps>

      <H3>Đổi master password</H3>
      <P>
        Trong <InlineCode>Settings &rarr; Account</InlineCode>. Thao tác này chỉ
        bọc lại DEK chứ không mã hóa lại các mục, và recovery key của bạn vẫn còn
        nguyên hiệu lực.
      </P>

      <Callout tone="warn" title="Mất cả master lẫn recovery key = mất vĩnh viễn">
        Không có cửa hậu. Hãy in 24 từ recovery ra giấy và cất riêng với file
        backup. Đây là đánh đổi cố ý của zero-knowledge.
      </Callout>

      <H3>Giới hạn cần biết</H3>
      <P>
        Một app chạy trên web tải lại mã nguồn (gồm cả mã mã hóa) mỗi lần mở. Nếu
        máy chủ hoặc một thư viện phụ thuộc bị xâm nhập, về lý thuyết nó có thể
        phục vụ mã độc đánh cắp master password lúc bạn gõ. Zero-knowledge không
        chống được điều này. Giảm thiểu bằng CSP, ghim phiên bản dependency, và
        tự host.
      </P>

      <H3>Mối đe dọa: trong và ngoài tầm bảo vệ</H3>
      <Bullets>
        <li>
          <strong>Trong tầm (đã giảm thiểu):</strong> lộ cơ sở dữ liệu Supabase,
          nghe lén đường truyền, người trong Supabase, lộ anon key - tất cả chỉ
          thấy ciphertext.
        </li>
        <li>
          <strong>Ngoài tầm:</strong> thiết bị của bạn dính keylogger/malware;
          chuỗi cung ứng web (mã độc phục vụ từ host); mất cả master và recovery
          key.
        </li>
      </Bullets>

      <H3>Câu hỏi thường gặp</H3>
      <H3>Dùng Gmail thường làm email vault được không?</H3>
      <P>
        Được. Email chỉ là định danh đăng nhập và là salt; không có thư nào được
        gửi (đã tắt Confirm email). Không cần domain riêng.
      </P>
      <H3>Vì sao chỉ có 5 loại mục?</H3>
      <P>
        Login, Wallet, SSH key, Secure note, API key - đủ bao phủ nhu cầu nêu ra.
        Seed phrase nằm trong Wallet; cụm từ bảo mật dùng Secure note.
      </P>
      <H3>Sắp có gì tiếp theo?</H3>
      <P>
        v1.5: mở khóa bằng vân tay/Face (WebAuthn) và bộ tạo mã TOTP. v2: CSP dùng
        nonce, kiểm tra độ mạnh mật khẩu offline, đóng gói PWA.
      </P>
    </DocSection>
  );
}
