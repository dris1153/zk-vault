import {
  DiagramFrame,
  Flow,
  FlowNode,
  Arrow,
  Branch,
  Legend,
} from "../doc-diagram";
import { DocSection, H3, P, InlineCode, Callout, Bullets } from "../doc-ui";

export function Overview() {
  return (
    <DocSection id="tong-quan" title="Tổng quan & Bảo mật">
      <P>
        Vault là kho lưu trữ thông tin nhạy cảm cho cá nhân: mật khẩu đăng nhập,
        private key ví, seed phrase, SSH key, ghi chú bảo mật, API key. Toàn bộ
        việc mã hóa và giải mã diễn ra <strong>ngay trong trình duyệt</strong> của
        bạn. Máy chủ (Supabase) chỉ lưu dữ liệu đã mã hóa và không bao giờ thấy
        nội dung gốc.
      </P>

      <H3>Zero-knowledge nghĩa là gì?</H3>
      <P>
        Master password của bạn không bao giờ rời khỏi trình duyệt. Kẻ tấn công
        chiếm được cơ sở dữ liệu Supabase cũng chỉ lấy được các khối ký tự vô
        nghĩa (ciphertext). Đây chính là mô hình mà Bitwarden và 1Password dùng.
      </P>

      <H3>Mã hóa kiểu &quot;phong bì&quot; (envelope)</H3>
      <P>
        Một khóa dữ liệu ngẫu nhiên 256-bit (gọi là <InlineCode>DEK</InlineCode>)
        mã hóa mọi mục bằng AES-256-GCM. DEK được &quot;bọc&quot; lại bởi hai khóa
        khác nhau: một khóa dẫn từ master password (qua Argon2id), và một khóa dẫn
        từ recovery key 24 từ. Đổi master password chỉ cần bọc lại DEK, không phải
        mã hóa lại toàn bộ dữ liệu.
      </P>

      <DiagramFrame caption="authSecret (mật khẩu đăng nhập Supabase) cũng dẫn từ master + email, tách biệt hoàn toàn với KEK.">
        <Flow>
          <Branch>
            <FlowNode tone="plain">Master password</FlowNode>
            <FlowNode tone="plain">Recovery key (24 từ)</FlowNode>
          </Branch>
          <Arrow label="Argon2id (KDF)" />
          <Branch>
            <FlowNode tone="key">KEK_master</FlowNode>
            <FlowNode tone="key">KEK_recovery</FlowNode>
          </Branch>
          <Arrow label="bọc (wrap) DEK" />
          <FlowNode tone="key">DEK - khóa dữ liệu 256-bit (chỉ ở RAM)</FlowNode>
          <Arrow label="AES-256-GCM, mỗi mục 1 IV ngẫu nhiên" />
          <FlowNode tone="cipher">
            Ciphertext &#123; iv, ct &#125; &rarr; lưu lên Supabase
          </FlowNode>
        </Flow>
        <Legend />
      </DiagramFrame>

      <H3>Thuật toán</H3>
      <Bullets>
        <li>
          <InlineCode>Argon2id</InlineCode> (64 MiB, 3 vòng) biến mật khẩu thành
          khóa, chống brute-force mạnh.
        </li>
        <li>
          <InlineCode>AES-256-GCM</InlineCode> mã hóa từng mục; thẻ xác thực (auth
          tag) tự động từ chối nếu dữ liệu bị sửa hoặc sai khóa.
        </li>
        <li>
          Recovery key dùng chuẩn <InlineCode>BIP39</InlineCode> (24 từ tiếng
          Anh).
        </li>
      </Bullets>

      <Callout tone="warn" title="Không có nút &quot;Quên mật khẩu&quot;">
        Đây là cái giá của bảo mật tối đa. Mất master password thì chỉ khôi phục
        được bằng recovery key + file backup. Mất cả hai thì dữ liệu mất vĩnh
        viễn, không ai (kể cả bạn) lấy lại được.
      </Callout>
    </DocSection>
  );
}
