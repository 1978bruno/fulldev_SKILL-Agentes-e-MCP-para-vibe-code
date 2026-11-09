import { cookies } from "next/headers";
import { cache } from "react";
import { resolveTimeZone, TIME_ZONE_COOKIE } from "@/app/utils/time-zone";

// Fuso do cookie, já validado, memorizado por requisição: o layout e a página leem o mesmo.
export const readTimeZone = cache(async (): Promise<string> =>
  resolveTimeZone((await cookies()).get(TIME_ZONE_COOKIE)?.value),
);
