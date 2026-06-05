import { DiagramFrame, Flow, FlowNode, Arrow } from "../doc-diagram";
import { DocSection, H3, P, InlineCode, Callout, Bullets } from "../doc-ui";

export function StorageFlow() {
  return (
    <DocSection id="luong" title="Luồng lưu trữ & mở khóa">
      <H3>Khi bạn lưu một mục</H3>
      <P>
        Dữ liệu được mã hóa ngay tại trình duyệt bằng DEK trước khi gửi đi.
        Supabase chỉ nhận về ciphertext, kèm hai trường công khai duy nhất là{" "}
        <InlineCode>type</InlineCode> và <InlineCode>favorite</InlineCode> (để đếm
        và lọc theo nhóm mà không cần giải mã).
      </P>

      <DiagramFrame caption="Không có plaintext nào đi qua máy chủ Next.js.">
        <Flow>
          <FlowNode tone="plain">Bạn nhập form (title, password, ...)</FlowNode>
          <Arrow label="encryptJSON(DEK) trong trình duyệt" />
          <FlowNode tone="cipher">&#123; iv, ciphertext &#125;</FlowNode>
          <Arrow label="INSERT (RLS)" />
          <FlowNode tone="cipher">
            Supabase vault_items: type, favorite, encrypted_data, iv
          </FlowNode>
        </Flow>
      </DiagramFrame>

      <H3>Khi bạn mở khóa</H3>
      <P>
        Mật khẩu đăng nhập Supabase được dẫn từ <em>master + email</em> nên tính
        được ngay mà không cần đọc cơ sở dữ liệu trước. Sau khi đăng nhập, ứng
        dụng tải cấu hình (vẫn là ciphertext), dẫn ra KEK và mở khóa DEK.
      </P>

      <DiagramFrame caption="DEK chỉ tồn tại trong RAM của trình duyệt khi vault đang mở.">
        <Flow>
          <FlowNode tone="plain">Master password + email</FlowNode>
          <Arrow label="Argon2id (salt = SHA-256(email))" />
          <FlowNode tone="key">authSecret</FlowNode>
          <Arrow label="đăng nhập Supabase" />
          <FlowNode tone="cipher">Tải vault_config (ciphertext)</FlowNode>
          <Arrow label="Argon2id(salt_master) &rarr; mở khóa" />
          <FlowNode tone="key">KEK_master &rarr; unwrap DEK</FlowNode>
          <Arrow label="tải + giải mã trong RAM" />
          <FlowNode tone="plain">Danh sách mục đã giải mã</FlowNode>
        </Flow>
      </DiagramFrame>

      <Callout title="Vì sao salt lấy từ email?">
        Nếu salt đăng nhập nằm trong cấu hình thì có nghịch lý &quot;con gà - quả
        trứng&quot;: phải đăng nhập mới đọc được cấu hình, nhưng phải có salt
        trong cấu hình mới đăng nhập được. Lấy salt từ email (công khai, chỉ dùng
        làm salt) phá vỡ vòng lặp đó. Bảo mật không đổi vì khóa thật sự bảo vệ dữ
        liệu là KEK với salt ngẫu nhiên trong DB.
      </Callout>

      <H3>Các lớp bảo vệ khác</H3>
      <Bullets>
        <li>
          <strong>RLS nghiêm ngặt:</strong> mọi dòng gắn{" "}
          <InlineCode>auth.uid() = user_id</InlineCode>; lộ anon key cũng chỉ đọc
          được ciphertext.
        </li>
        <li>
          <strong>Tự khóa:</strong> xóa DEK khỏi RAM sau thời gian rảnh hoặc khi
          chuyển tab (tùy chỉnh trong Settings).
        </li>
        <li>
          <strong>Tìm kiếm trong bộ nhớ:</strong> giải mã một lần khi mở khóa rồi
          tìm fuzzy ngay tại client, không lộ gì cho máy chủ.
        </li>
        <li>
          <strong>Tự xóa clipboard:</strong> sau khi copy, clipboard được xóa sau
          10-30 giây (tùy chỉnh), kèm đồng hồ đếm ngược.
        </li>
      </Bullets>
    </DocSection>
  );
}
