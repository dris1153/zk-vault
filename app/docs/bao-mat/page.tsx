import type { Metadata } from "next";
import {
  DiagramFrame,
  Flow,
  FlowNode,
  Arrow,
  Branch,
  Legend,
} from "@/components/docs/doc-diagram";
import {
  DocSection,
  H3,
  P,
  InlineCode,
  Callout,
  Bullets,
} from "@/components/docs/doc-ui";

export const metadata: Metadata = { title: "Bảo mật · ZKVault" };

export default function SecurityPage() {
  return (
    <DocSection id="bao-mat" title="Bảo mật">
      <H3>Mã hóa kiểu phong bì (envelope)</H3>
      <P>
        Một khóa dữ liệu ngẫu nhiên 256-bit (<InlineCode>DEK</InlineCode>) mã hóa
        mọi mục bằng AES-256-GCM. DEK được bọc lại bởi hai khóa khác nhau: một dẫn
        từ master password (qua Argon2id), một dẫn từ recovery key 24 từ. Đổi master
        chỉ cần bọc lại DEK, không phải mã hóa lại toàn bộ dữ liệu.
      </P>

      <DiagramFrame caption="authSecret (mật khẩu đăng nhập Supabase) dẫn từ master + email, tách biệt hoàn toàn với KEK.">
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
          <InlineCode>AES-256-GCM</InlineCode> mã hóa từng mục; auth tag tự động từ
          chối nếu dữ liệu bị sửa hoặc sai khóa.
        </li>
        <li>
          Recovery key theo chuẩn <InlineCode>BIP39</InlineCode> (24 từ tiếng Anh).
        </li>
      </Bullets>

      <H3>Định danh: email làm salt</H3>
      <P>
        Mật khẩu đăng nhập Supabase được dẫn từ master + email:{" "}
        <InlineCode>authSecret = Argon2id(master, salt = SHA-256(email))</InlineCode>
        . Nhờ vậy tính được ngay mà không cần đọc cơ sở dữ liệu trước. Email{" "}
        <strong>không phải biến môi trường</strong>: bạn nhập ở lần đăng nhập đầu,
        app nhớ trong localStorage và điền sẵn lần sau.
      </P>

      <DiagramFrame caption="DEK chỉ tồn tại trong RAM của trình duyệt khi vault đang mở.">
        <Flow>
          <FlowNode tone="plain">Master password + email</FlowNode>
          <Arrow label="Argon2id (salt = SHA-256(email))" />
          <FlowNode tone="key">authSecret &rarr; đăng nhập Supabase</FlowNode>
          <Arrow label="tải vault_config (ciphertext)" />
          <FlowNode tone="key">KEK_master &rarr; unwrap DEK</FlowNode>
          <Arrow label="tải + giải mã trong RAM" />
          <FlowNode tone="plain">Danh sách mục đã giải mã</FlowNode>
        </Flow>
      </DiagramFrame>

      <Callout title="Vì sao salt lấy từ email?">
        Nếu salt đăng nhập nằm trong cấu hình thì có nghịch lý con-gà-quả-trứng:
        phải đăng nhập mới đọc được cấu hình, nhưng phải có salt mới đăng nhập được.
        Lấy salt từ email (công khai, chỉ dùng làm salt) phá vỡ vòng lặp đó. Bảo mật
        không đổi vì khóa thật sự bảo vệ dữ liệu là KEK với salt ngẫu nhiên trong DB.
      </Callout>

      <H3>Ranh giới với máy chủ</H3>
      <Bullets>
        <li>
          <strong>Chỉ ciphertext:</strong> Supabase nhận về dữ liệu đã mã hóa; hai
          cột công khai duy nhất là <InlineCode>type</InlineCode> và{" "}
          <InlineCode>favorite</InlineCode> (để đếm + lọc).
        </li>
        <li>
          <strong>RLS nghiêm ngặt:</strong> mọi dòng gắn{" "}
          <InlineCode>auth.uid() = user_id</InlineCode>; lộ anon key cũng chỉ đọc
          được ciphertext.
        </li>
        <li>
          <strong>Không plaintext qua server:</strong> app chỉ gọi Supabase từ
          trình duyệt; CI guard chặn import lớp crypto/vault vào ngữ cảnh server.
        </li>
      </Bullets>

      <H3>Mô hình đe dọa (thành thật)</H3>
      <Callout tone="warn" title="Lộ master password = lộ toàn bộ">
        Master dẫn ra CẢ authSecret (đăng nhập) lẫn KEK_master (mở khóa DEK), nên ai
        có master + email (email gần như công khai) là vào được hết. Sinh trắc và
        2FA chỉ là tiện ích, KHÔNG phải lớp bảo vệ thứ hai cho vault. Recovery key là
        một gốc tin cậy thứ hai (lộ master HOẶC recovery key đều dẫn tới toàn bộ).
      </Callout>
      <Bullets>
        <li>
          <strong>Trong tầm (đã giảm thiểu):</strong> lộ DB Supabase, nghe lén
          đường truyền, người trong Supabase, lộ anon key - tất cả chỉ thấy
          ciphertext.
        </li>
        <li>
          <strong>Ngoài tầm:</strong> thiết bị dính keylogger/malware; chuỗi cung
          ứng web (mã độc phục vụ từ host - giảm thiểu bằng pin deps, tự host, PWA
          ghim code); mất cả master và recovery key.
        </li>
      </Bullets>
    </DocSection>
  );
}
