'use client';

/**
 * The owner's site, in one iframe. Below lg it fills its tab; from lg it sits
 * in a phone frame (390px) or a browser-style desktop frame.
 */
export default function SiteFrame({
  url,
  frame,
  view,
}: {
  url: string;
  frame: 'phone' | 'desktop';
  view: 'owner' | 'public';
}) {
  let host = '';
  try {
    host = new URL(url).host;
  } catch {
    host = '';
  }
  const phone = frame === 'phone';
  const shell = phone
    ? 'w-full h-full lg:w-[390px] lg:max-h-[844px] lg:rounded-[38px] lg:border-[8px] lg:border-[#34322D] lg:shadow-2xl'
    : 'w-full h-full lg:rounded-xl lg:border lg:border-[#DCD5C7] lg:shadow-xl';
  return (
    <div className={`${shell} bg-white flex flex-col overflow-hidden min-h-0`}>
      {phone ? (
        <>
          <div className="hidden lg:flex h-6 bg-[#34322D] w-full shrink-0 items-center justify-center">
            <div className="w-24 h-4 bg-black rounded-full" />
          </div>
          <div className="hidden lg:flex h-7 bg-[#FAF8F5] border-b border-[#E8E2D6] px-3 items-center justify-between text-[11px] text-[#7A7870] shrink-0">
            <span className="truncate" dir="ltr">
              {host}
            </span>
            <span className="text-[10px] text-[#A09D94]">{view === 'owner' ? 'תצוגת בעלים' : 'תצוגת גולשים'}</span>
          </div>
        </>
      ) : (
        <div className="hidden lg:flex h-8 bg-[#EFE9DF] border-b border-[#DCD5C7] px-3 items-center gap-2 shrink-0">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#E06A55]" />
            <div className="w-3 h-3 rounded-full bg-[#E5B54F]" />
            <div className="w-3 h-3 rounded-full bg-[#6BBF72]" />
          </div>
          <div
            className="flex-1 max-w-md mx-auto bg-white rounded-md px-3 py-0.5 text-xs text-[#5B6E58] border border-[#DCD5C7] truncate"
            dir="ltr"
          >
            {url}
          </div>
        </div>
      )}
      <iframe
        src={url}
        title={view === 'owner' ? 'האתר, תצוגת בעלים' : 'האתר, תצוגת גולשים'}
        referrerPolicy="no-referrer"
        className="w-full flex-1 min-h-0 border-0 bg-[#F9F6F0]"
      />
    </div>
  );
}
