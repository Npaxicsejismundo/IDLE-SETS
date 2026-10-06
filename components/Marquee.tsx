import { Fragment } from "react";
import { marqueeWords } from "@/lib/content";

// Each track holds the words twice; two identical tracks scroll -50% for a seamless loop.
const track = [...marqueeWords, ...marqueeWords];

export function Marquee() {
  return (
    <div className="overflow-hidden border-y-2 border-ink bg-orange text-ink">
      <div className="flex w-max animate-marquee py-[18px] motion-reduce:animate-none">
        {[0, 1].map((copy) => (
          <div
            key={copy}
            aria-hidden={copy === 1 ? true : undefined}
            className="flex items-center gap-9 pr-9 font-display text-[40px] leading-none whitespace-nowrap uppercase"
          >
            {track.map((word, i) => (
              <Fragment key={i}>
                <span>{word}</span>
                <span
                  aria-hidden="true"
                  className="size-[18px] flex-none rounded-full bg-ink"
                />
              </Fragment>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
