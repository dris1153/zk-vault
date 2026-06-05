import type { Metadata } from "next";
import {
  DocSection,
  H3,
  P,
  InlineCode,
  Callout,
  Bullets,
} from "@/components/docs/doc-ui";

export const metadata: Metadata = { title: "Tính năng · ZKVault" };

export default function FeaturesPage() {
  return (
    <DocSection id="tinh-nang" title="Tính năng">
      <H3>Sáu loại mục</H3>
      <P>
        Mỗi loại có bộ trường riêng; nội dung luôn được mã hóa, chỉ{" "}
        <InlineCode>type</InlineCode> và <InlineCode>favorite</InlineCode> là công
        khai để đếm + lọc.
      </P>
      <Bullets>
        <li>
          <strong>Login:</strong> username, password, nền tảng/URL (có logo), mã 2FA.
        </li>
        <li>
          <strong>Wallet:</strong> network, address, private key, seed phrase,
          derivation path.
        </li>
        <li>
          <strong>SSH Key:</strong> host, username, public/private key, passphrase.
        </li>
        <li>
          <strong>Secure Note:</strong> ghi chú tự do.
        </li>
        <li>
          <strong>API Key:</strong> service, key, secret.
        </li>
        <li>
          <strong>Database (mới):</strong> chọn engine (Supabase, PostgreSQL, MySQL,
          MariaDB, MongoDB, Redis, SQL Server, SQLite) kèm logo, rồi host, port,
          database, username, password.
        </li>
      </Bullets>

      <H3>2FA / TOTP ngay trong vault</H3>
      <P>
        Ở mục Login, dán <strong>secret base32</strong> hoặc link{" "}
        <InlineCode>otpauth://</InlineCode> vào ô mã 2FA; vault tự sinh mã 6 số đổi
        mỗi 30 giây kèm vòng đếm ngược. Không cần app authenticator riêng.
      </P>

      <H3>Quét QR cho 2FA</H3>
      <P>
        Bấm Quét QR để mở camera quét trực tiếp, hoặc chọn/paste ảnh QR. Giải mã
        diễn ra <strong>hoàn toàn trong trình duyệt</strong> (jsQR), ảnh không gửi đi
        đâu. Camera cần HTTPS (localhost hoặc bản deploy); nếu không có camera thì rơi
        về chọn ảnh.
      </P>

      <H3>Mở khóa bằng sinh trắc</H3>
      <P>
        Tùy chọn, theo từng thiết bị, dùng WebAuthn PRF (vân tay / Face / Windows
        Hello). Khóa bọc nằm trong IndexedDB của thiết bị; master password{" "}
        <strong>luôn là phương án dự phòng</strong>. Đổi master sẽ xóa đăng ký sinh
        trắc (phải bật lại). Trình duyệt không hỗ trợ PRF thì tùy chọn này tự ẩn.
      </P>

      <H3>Kiểm tra bảo mật (password health)</H3>
      <P>
        Quét toàn bộ mục Login ngay tại client: mật khẩu <strong>trùng lặp</strong>,{" "}
        <strong>yếu</strong> (chấm điểm bằng zxcvbn, tải lười), và <strong>cũ</strong>
        . Có thể bật kiểm tra <strong>rò rỉ HIBP</strong> (k-anonymity, mặc định TẮT,
        chỉ gửi 5 ký tự đầu của hash). Báo cáo không chứa mật khẩu gốc.
      </P>

      <H3>Tags + lọc nhiều tag</H3>
      <P>
        Gắn tag cho mục và lọc theo nhiều tag cùng lúc, với công tắc{" "}
        <strong>Bất kỳ / Tất cả</strong>. Bộ lọc tag độc lập với bộ lọc loại - cả
        loại đang chọn lẫn các tag đều highlight, nên kết quả rỗng là do giao của hai
        điều kiện (không phải lỗi).
      </P>

      <H3>Tiện ích khác</H3>
      <Bullets>
        <li>
          <strong>Tìm kiếm:</strong> fuzzy ngay trong RAM (Ctrl/Cmd + K), không lộ gì
          cho máy chủ.
        </li>
        <li>
          <strong>Tự khóa:</strong> xóa DEK khỏi RAM sau thời gian rảnh, và/hoặc khi
          chuyển tab (Settings).
        </li>
        <li>
          <strong>Tự xóa clipboard:</strong> sau khi copy, clipboard được xóa sau
          10-30 giây (best-effort). Trình duyệt chỉ xóa được khi tab đang focus, nên
          nếu lúc đó bạn ở app khác, vault sẽ xóa ngay khi bạn quay lại tab.
        </li>
        <li>
          <strong>Favicon (opt-in):</strong> mặc định TẮT vì tải favicon từ bên thứ
          ba sẽ lộ domain bạn lưu; logo nền tảng có sẵn thì không bị ảnh hưởng.
        </li>
      </Bullets>

      <H3>Cài như app (PWA)</H3>
      <P>
        Có thể cài ZKVault như ứng dụng (Add to Home Screen / Install). Service
        worker precache phần tĩnh nên app shell load nhanh và mở được offline (màn
        khóa); có thông báo khi có bản mới. Dữ liệu Supabase{" "}
        <strong>không bao giờ bị cache</strong>.
      </P>
      <Callout title="Offline tới đâu?">
        PWA chỉ cache mã nguồn (giảm rủi ro chuỗi cung ứng + load nhanh). Dữ liệu vẫn
        ở Supabase nên mở khóa cần mạng - offline bạn thấy app shell chứ chưa mở được
        vault.
      </Callout>
    </DocSection>
  );
}
