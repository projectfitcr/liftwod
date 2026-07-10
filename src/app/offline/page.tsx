import { Wordmark } from "@/components/shell/Wordmark";

/** Service-worker fallback. Precached at install and shown with no network
 *  and no session context — so both languages are printed outright rather
 *  than going through the i18n provider. */
export default function OfflinePage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <Wordmark className="text-3xl" />
      <p className="text-lg font-semibold">ไม่มีการเชื่อมต่ออินเทอร์เน็ต</p>
      <p className="text-sm text-ink-secondary">
        ตารางคลาสและ WOD ที่เปิดล่าสุดยังดูได้จากแท็บด้านล่าง
        การจองและบันทึกผลต้องรอสัญญาณกลับมาก่อน
      </p>
      <hr className="w-16 border-hairline" />
      <p className="text-lg font-semibold">You&apos;re offline</p>
      <p className="text-sm text-ink-secondary">
        Your last-seen schedule and WOD are still available from the tabs.
        Booking and score logging need a connection.
      </p>
    </div>
  );
}
