import type { Metadata } from "next";
import { DiagramFrame, Flow, FlowNode, Arrow } from "@/components/docs/doc-diagram";
import {
  DocSection,
  P,
  InlineCode,
  CodeBlock,
  Callout,
  Steps,
  Step,
} from "@/components/docs/doc-ui";

export const metadata: Metadata = { title: "Triển khai · ZKVault" };

export default function DeployPage() {
  return (
    <DocSection id="trien-khai" title="Triển khai A-Z (Vercel + Supabase)">
      <P>
        Toàn bộ quy trình từ con số 0 đến khi app chạy thật trên Vercel. Cần một tài
        khoản Supabase (miễn phí) và một tài khoản Vercel.
      </P>

      <DiagramFrame caption="Quy trình triển khai.">
        <Flow>
          <FlowNode tone="plain">1. Tạo Supabase project</FlowNode>
          <Arrow />
          <FlowNode tone="plain">2. Điền .env.local (2 biến)</FlowNode>
          <Arrow />
          <FlowNode tone="plain">3. Tắt Confirm email</FlowNode>
          <Arrow />
          <FlowNode tone="plain">4. Chạy migration (bảng + RLS)</FlowNode>
          <Arrow />
          <FlowNode tone="key">5. verify:supabase (kiểm tra)</FlowNode>
          <Arrow />
          <FlowNode tone="plain">6. dev (local) &rarr; 7. deploy Vercel</FlowNode>
        </Flow>
      </DiagramFrame>

      <Steps>
        <Step n={1} title="Tạo Supabase project">
          Vào supabase.com, tạo project mới. Mở{" "}
          <InlineCode>Project Settings &rarr; API</InlineCode>, copy{" "}
          <strong>Project URL</strong> và <strong>anon public key</strong>. Tuyệt
          đối không dùng <InlineCode>service_role</InlineCode> key trong app.
        </Step>

        <Step n={2} title="Điền .env.local (2 biến)">
          Sao chép <InlineCode>.env.local.example</InlineCode> thành{" "}
          <InlineCode>.env.local</InlineCode> rồi điền:
          <CodeBlock>{`NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...

# tùy chọn - cho "npm run db:reset" (chứa mật khẩu DB, giữ bí mật)
SUPABASE_DB_URL=postgresql://postgres.xxxx:MATKHAU@aws-0-region.pooler.supabase.com:5432/postgres`}</CodeBlock>
          Hai biến <InlineCode>NEXT_PUBLIC_*</InlineCode> đều công khai an toàn - bí
          mật của bạn được bảo vệ bởi master password. <strong>Email vault không
          phải biến env</strong> - bạn nhập trên màn hình khóa ở lần tạo/mở khóa đầu,
          app sẽ nhớ và điền sẵn sau đó.
        </Step>

        <Step n={3} title="Tắt xác nhận email">
          Trong Supabase: <InlineCode>Authentication &rarr; Sign In / Providers
          &rarr; Email</InlineCode>, tắt <strong>Confirm email</strong>. App tạo tài
          khoản rồi đăng nhập ngay bằng mật khẩu dẫn ra; nếu bật xác nhận thì phiên
          đầu sẽ bị chặn.
        </Step>

        <Step n={4} title="Tạo schema + migration">
          Mở <InlineCode>SQL Editor</InlineCode>, dán lần lượt{" "}
          <InlineCode>supabase/migrations/0001_init.sql</InlineCode> (bảng + RLS) rồi{" "}
          <InlineCode>0002_add_database_type.sql</InlineCode> (cho loại mục
          database). Hoặc nếu đã đặt <InlineCode>SUPABASE_DB_URL</InlineCode>:
          <CodeBlock>{`npm run db:reset`}</CodeBlock>
          (db:reset áp dụng tất cả migration; chỉ dùng khi vault còn trống vì nó xóa
          sạch dữ liệu cũ.)
        </Step>

        <Step n={5} title="Kiểm tra engine (live)">
          Chạy smoke-test đầu cuối với tài khoản nháp (không đụng vault thật); truyền
          email thật bạn kiểm soát (plus-addressing):
          <CodeBlock>{`npm run verify:supabase ban@gmail.com`}</CodeBlock>
          Phải qua đủ 8 PASS: provision, đăng nhập, RLS, mở khóa, recovery key, mã
          hóa CRUD.
        </Step>

        <Step n={6} title="Chạy local">
          <CodeBlock>{`npm install
npm run dev   # http://localhost:3000`}</CodeBlock>
          Mở trình duyệt, nhập email + tạo vault, lưu kỹ 24 từ recovery.
        </Step>

        <Step n={7} title="Deploy lên Vercel + cài app">
          Đẩy code lên GitHub, vào Vercel <strong>Add New &rarr; Project</strong> rồi
          import repo. Ở Environment Variables thêm 2 biến{" "}
          <InlineCode>NEXT_PUBLIC_SUPABASE_URL</InlineCode> +{" "}
          <InlineCode>NEXT_PUBLIC_SUPABASE_ANON_KEY</InlineCode>. Sau khi có domain
          HTTPS, mở app rồi bấm <strong>Install</strong> (Add to Home Screen) để cài
          như PWA.
        </Step>
      </Steps>

      <Callout tone="warn" title="Đừng commit .env.local">
        File <InlineCode>.env.local</InlineCode> chứa key và đã được gitignore. Chỉ
        commit <InlineCode>.env.local.example</InlineCode>. Đặt biến môi trường thật
        trực tiếp trên Vercel.
      </Callout>
    </DocSection>
  );
}
