import type { Metadata } from "next";
import {
  DocSection,
  H3,
  InlineCode,
  Callout,
  Bullets,
} from "@/components/docs/doc-ui";

export const metadata: Metadata = { title: "Hướng dẫn dùng · ZKVault" };

export default function HowToPage() {
  return (
    <DocSection id="huong-dan" title="Hướng dẫn dùng">
      <H3>Màn hình Mã 2FA (mặc định)</H3>
      <Bullets>
        <li>
          Mở khóa vault là vào thẳng tab <strong>Mã 2FA</strong>, hiển thị cả mục{" "}
          <InlineCode>Mã 2FA</InlineCode> độc lập lẫn các mục Đăng nhập có{" "}
          <InlineCode>totp_secret</InlineCode>.
        </li>
        <li>
          <strong>Chạm cả hàng</strong> để copy mã 6 số vào clipboard kèm thanh
          đếm ngược tự xóa.
        </li>
        <li>
          Khi còn &le; 5 giây trước khi đổi mã, vòng đếm và chữ chuyển đỏ kèm dòng{" "}
          <strong>Tiếp theo: xxx xxx</strong> để bạn kịp chuẩn bị.
        </li>
        <li>
          Bấm nút <strong>Ghim</strong> trong menu <InlineCode>⋯</InlineCode> để
          đưa các tài khoản hay dùng lên đầu danh sách.
        </li>
        <li>
          Có thể bật <strong>Ẩn mã 2FA nơi công cộng</strong> trong{" "}
          <InlineCode>Cài đặt &rarr; Bảo mật</InlineCode>: mã sẽ được làm mờ, chạm
          lần 1 để xem, chạm lần 2 để copy.
        </li>
        <li>
          Trên máy tính, gõ phím bất kỳ để tìm ngay, dùng{" "}
          <InlineCode>&uarr;</InlineCode>/<InlineCode>&darr;</InlineCode> chọn
          hàng, <InlineCode>Enter</InlineCode> để copy và{" "}
          <InlineCode>Esc</InlineCode> để xóa tìm kiếm.
        </li>
      </Bullets>

      <H3>Import từ Google Authenticator</H3>
      <Bullets>
        <li>
          Trong Google Authenticator, chọn{" "}
          <InlineCode>Transfer accounts &rarr; Export accounts</InlineCode> để hiện
          mã QR.
        </li>
        <li>
          Tại ZKVault, bấm <InlineCode>Import GA</InlineCode> (hoặc vào{" "}
          <InlineCode>Cài đặt &rarr; Sao lưu &rarr; Import 2FA</InlineCode>), quét
          lần lượt các mã QR (hỗ trợ xuất nhiều QR) hoặc chọn ảnh QR.
        </li>
        <li>
          App tự phát hiện tài khoản trùng secret và bỏ qua các mã HOTP/MD5 không
          hỗ trợ trước khi lưu hàng loạt về vault.
        </li>
      </Bullets>

      <H3>Tab Vault: danh sách &amp; xem chi tiết</H3>
      <Bullets>
        <li>
          Chuyển sang tab <strong>Vault</strong> ở thanh bên (desktop) hoặc thanh
          dưới cùng (mobile) để quản lý cả 7 loại mục: Đăng nhập, Mã 2FA, Ví
          crypto, SSH Key, Database, Ghi chú, API Key.
        </li>
        <li>
          Trên máy tính, rê chuột vào mỗi hàng để bấm copy nhanh{" "}
          <strong>tài khoản</strong>, <strong>mật khẩu/key</strong> hoặc{" "}
          <strong>mã 2FA</strong> mà không cần mở bảng chi tiết. Phím tắt khi
          đang chọn một mục: <InlineCode>c</InlineCode> (copy bí mật chính),{" "}
          <InlineCode>u</InlineCode> (copy tài khoản), <InlineCode>t</InlineCode>{" "}
          (copy mã 2FA).
        </li>
        <li>
          Dùng thanh chip theo loại ở trên và nút <InlineCode>Lọc</InlineCode> để
          lọc theo nền tảng/engine/service, tag (Bất kỳ / Tất cả), Yêu thích, Có
          2FA và thứ tự sắp xếp.
        </li>
      </Bullets>

      <Callout title="Tự xóa clipboard">
        Sau khi copy, clipboard tự xóa sau 10-30 giây (chỉnh trong Cài đặt) kèm
        đếm ngược. Nếu lúc đó bạn đang ở app khác, nó sẽ xóa ngay khi bạn quay
        lại tab.
      </Callout>

      <H3>Mở khóa sinh trắc &amp; tự khóa</H3>
      <Bullets>
        <li>
          Bật trong <InlineCode>Cài đặt &rarr; Bảo mật</InlineCode>. Khi đã đăng
          ký sinh trắc, màn hình khóa sẽ tự gợi ý prompt vân tay / Face / Windows
          Hello ngay khi mở app (hoặc bấm nút sinh trắc nếu trình duyệt yêu cầu
          thao tác chạm).
        </li>
        <li>
          <strong>Khóa khi ẩn tab:</strong> mặc định chờ <strong>1 phút</strong>{" "}
          sau khi bạn chuyển sang app khác để kịp dán mã 2FA (có thể chỉnh thành
          Ngay lập tức, 30 giây, 5 phút hoặc Tắt).
        </li>
      </Bullets>

      <H3>Kiểm tra bảo mật (mật khẩu)</H3>
      <Bullets>
        <li>
          Bấm <InlineCode>Kiểm tra bảo mật</InlineCode> để quét mật khẩu{" "}
          <strong>trùng lặp</strong>, <strong>yếu</strong>, <strong>cũ</strong>,
          và tùy chọn đối chiếu dữ liệu rò rỉ HIBP (mặc định tắt).
        </li>
      </Bullets>
    </DocSection>
  );
}
