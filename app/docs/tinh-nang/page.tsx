import type { Metadata } from "next";
import {
  DocSection,
  H3,
  P,
  InlineCode,
  Callout,
  Bullets,
} from "@/components/docs/doc-ui";

export const metadata: Metadata = { title: "Hướng dẫn dùng · ZKVault" };

export default function HowToPage() {
  return (
    <DocSection id="huong-dan" title="Hướng dẫn dùng">
      <H3>Thêm, sửa, xóa mục</H3>
      <Bullets>
        <li>
          Bấm <InlineCode>+ Add</InlineCode> ở thanh trên, chọn 1 trong 6 loại
          (Login, Wallet, SSH Key, Secure Note, API Key, Database), điền các trường
          rồi <InlineCode>Save</InlineCode>.
        </li>
        <li>
          Bấm vào một mục để mở bảng chi tiết bên phải: xem, <strong>sửa</strong>,{" "}
          <strong>xóa</strong>, hoặc copy từng trường.
        </li>
        <li>
          Mật khẩu/secret hiện dạng dấu chấm; bấm con mắt để xem, bấm copy để chép.
        </li>
      </Bullets>

      <Callout title="Tự xóa clipboard">
        Sau khi copy, clipboard tự xóa sau 10-30 giây (chỉnh trong Settings) kèm đếm
        ngược. Nếu lúc đó bạn đang ở app khác, nó sẽ xóa ngay khi bạn quay lại tab.
      </Callout>

      <H3>Login + nền tảng</H3>
      <P>
        Ở mục Login, trường nền tảng cho chọn từ danh sách có sẵn (logo + tên) hoặc
        bấm <InlineCode>URL tùy chỉnh</InlineCode> để tự nhập. Logo nền tảng hiện trên
        thẻ và bảng chi tiết.
      </P>

      <H3>Mã 2FA / TOTP</H3>
      <Bullets>
        <li>
          Ở mục Login, dán <strong>secret base32</strong> hoặc link{" "}
          <InlineCode>otpauth://</InlineCode> vào ô <strong>Mã 2FA</strong>.
        </li>
        <li>
          Hoặc bấm <InlineCode>Quét QR</InlineCode> để mở camera quét trực tiếp, hoặc
          chọn ảnh QR.
        </li>
        <li>
          App hiện mã 6 số kèm đếm ngược; bấm copy để dán khi đăng nhập.
        </li>
      </Bullets>

      <H3>Mục Database</H3>
      <P>
        Chọn loại Database, chọn <strong>engine</strong> (Supabase, PostgreSQL, MySQL,
        MariaDB, MongoDB, Redis, SQL Server, SQLite) từ dropdown có logo, rồi điền
        host, port, database, username, password.
      </P>

      <H3>Mở khóa sinh trắc</H3>
      <Bullets>
        <li>
          Mở <InlineCode>Settings &rarr; Bảo mật</InlineCode>, bật{" "}
          <strong>Mở khóa bằng vân tay</strong>, nhập master một lần để xác nhận.
        </li>
        <li>
          Sau đó ở màn khóa sẽ có nút <strong>Mở bằng vân tay / Face</strong>.
        </li>
        <li>
          Đổi master sẽ phải bật lại; master password <strong>luôn là dự phòng</strong>
          . Trình duyệt không hỗ trợ thì tùy chọn này tự ẩn.
        </li>
      </Bullets>

      <H3>Kiểm tra bảo mật (mật khẩu)</H3>
      <Bullets>
        <li>
          Bấm <InlineCode>Kiểm tra bảo mật</InlineCode> ở thanh bên (số trên badge =
          số mục cần chú ý).
        </li>
        <li>
          Bảng liệt kê mật khẩu <strong>trùng lặp</strong>, <strong>yếu</strong>,{" "}
          <strong>cũ</strong>; bấm một mục để mở sửa.
        </li>
        <li>
          Bật <strong>Kiểm tra rò rỉ (HIBP)</strong> trong Settings (mặc định tắt) để
          dò mật khẩu đã lộ.
        </li>
      </Bullets>

      <H3>Tags + lọc</H3>
      <Bullets>
        <li>
          Gắn tag khi tạo/sửa mục (ô <strong>Tags</strong>, ngăn cách bằng dấu phẩy).
        </li>
        <li>
          Ở thanh bên, tick nhiều tag để lọc; dùng công tắc{" "}
          <strong>Bất kỳ / Tất cả</strong> để chọn cách ghép.
        </li>
        <li>
          Bộ lọc loại và tag <strong>độc lập</strong> (cả hai cùng highlight); bấm{" "}
          <InlineCode>Xoá</InlineCode> để bỏ hết tag.
        </li>
      </Bullets>

      <H3>Tìm kiếm</H3>
      <P>
        Bấm <InlineCode>Ctrl/Cmd + K</InlineCode> để nhảy vào ô tìm kiếm. Tìm fuzzy
        ngay trong máy, không gửi gì cho máy chủ.
      </P>

      <H3>Settings</H3>
      <Bullets>
        <li>
          <strong>Tự khóa</strong> sau thời gian rảnh, và/hoặc khi chuyển/ẩn tab.
        </li>
        <li>
          <strong>Thời gian xóa clipboard</strong> sau khi copy.
        </li>
        <li>
          <strong>Favicon</strong> (tùy chọn, mặc định tắt) và{" "}
          <strong>Kiểm tra rò rỉ HIBP</strong> (tùy chọn).
        </li>
        <li>
          <strong>Đổi master password</strong> (Account) và{" "}
          <strong>Backup</strong>: Export/Import file <InlineCode>.vault</InlineCode>.
        </li>
      </Bullets>

      <H3>Cài như app (PWA)</H3>
      <P>
        Bấm Install / Add to Home Screen để cài. App mở nhanh, load app shell offline,
        và hiện thông báo <strong>Có bản cập nhật mới</strong> khi có phiên bản mới
        (bấm Tải lại để cập nhật).
      </P>
    </DocSection>
  );
}
