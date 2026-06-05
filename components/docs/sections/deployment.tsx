import { DiagramFrame, Flow, FlowNode, Arrow } from "../doc-diagram";
import {
  DocSection,
  P,
  InlineCode,
  CodeBlock,
  Callout,
  Steps,
  Step,
} from "../doc-ui";

export function Deployment() {
  return (
    <DocSection id="trien-khai" title="Triển khai A-Z (Vercel + Supabase)">
      <P>
        Toàn bộ quy trình từ con số 0 đến khi app chạy thật trên Vercel. Cần một
        tài khoản Supabase (miễn phí) và một tài khoản Vercel.
      </P>

      <DiagramFrame caption="Quy trình triển khai.">
        <Flow>
          <FlowNode tone="plain">1. Tạo Supabase project</FlowNode>
          <Arrow />
          <FlowNode tone="plain">2. Điền .env.local</FlowNode>
          <Arrow />
          <FlowNode tone="plain">3. Tắt Confirm email</FlowNode>
          <Arrow />
          <FlowNode tone="plain">4. Chạy migration (tạo bảng + RLS)</FlowNode>
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

        <Step n={2} title="Điền .env.local">
          Sao chép <InlineCode>.env.local.example</InlineCode> thành{" "}
          <InlineCode>.env.local</InlineCode> rồi điền 3 biến (biến tùy chọn cuối
          chỉ cần cho lệnh <InlineCode>db:reset</InlineCode>):
          <CodeBlock>{`NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
NEXT_PUBLIC_VAULT_EMAIL=ban@gmail.com

# tùy chọn - cho "npm run db:reset" (chứa mật khẩu DB, giữ bí mật)
SUPABASE_DB_URL=postgresql://postgres.xxxx:MATKHAU@aws-0-region.pooler.supabase.com:5432/postgres`}</CodeBlock>
          Cả 3 biến <InlineCode>NEXT_PUBLIC_*</InlineCode> đều công khai an toàn -
          bí mật của bạn được bảo vệ bởi master password, không suy ra được từ
          chúng.
        </Step>

        <Step n={3} title="Tắt xác nhận email">
          Trong Supabase: <InlineCode>Authentication &rarr; Sign In / Providers
          &rarr; Email</InlineCode>, tắt <strong>Confirm email</strong>. App tạo
          tài khoản rồi đăng nhập ngay bằng mật khẩu dẫn ra; nếu bật xác nhận thì
          phiên đầu sẽ bị chặn.
        </Step>

        <Step n={4} title="Tạo schema (bảng + RLS)">
          Cách nhanh: mở <InlineCode>SQL Editor</InlineCode>, dán toàn bộ{" "}
          <InlineCode>supabase/migrations/0001_init.sql</InlineCode> rồi Run. Hoặc
          nếu đã đặt <InlineCode>SUPABASE_DB_URL</InlineCode>:
          <CodeBlock>{`npm run db:reset`}</CodeBlock>
        </Step>

        <Step n={5} title="Kiểm tra engine (live)">
          Chạy smoke-test đầu cuối với tài khoản nháp (không đụng vault thật):
          <CodeBlock>{`npm run verify:supabase`}</CodeBlock>
          Phải qua đủ 8 PASS: provision, đăng nhập, RLS, mở khóa, recovery key,
          mã hóa CRUD.
        </Step>

        <Step n={6} title="Chạy local">
          <CodeBlock>{`npm install
npm run dev   # http://localhost:3000`}</CodeBlock>
          Mở trình duyệt, tạo vault và lưu kỹ 24 từ recovery.
        </Step>

        <Step n={7} title="Deploy lên Vercel">
          Đẩy code lên GitHub. Vào Vercel: <strong>Add New &rarr; Project</strong>{" "}
          rồi import repo. Trong phần Environment Variables, thêm đúng 3 biến{" "}
          <InlineCode>NEXT_PUBLIC_SUPABASE_URL</InlineCode>,{" "}
          <InlineCode>NEXT_PUBLIC_SUPABASE_ANON_KEY</InlineCode>,{" "}
          <InlineCode>NEXT_PUBLIC_VAULT_EMAIL</InlineCode>. Vercel tự nhận Next.js
          và build (<InlineCode>npm run build</InlineCode> đã chạy sẵn CI guard).
        </Step>
      </Steps>

      <Callout tone="warn" title="Đừng commit .env.local">
        File <InlineCode>.env.local</InlineCode> chứa key và đã được gitignore.
        Chỉ commit <InlineCode>.env.local.example</InlineCode>. Đặt biến môi
        trường thật trực tiếp trên Vercel.
      </Callout>
    </DocSection>
  );
}
