import { UTCDate } from "@date-fns/utc";
import { format } from "date-fns";

// Format in UTC so server-rendered and client-hydrated markup always match,
// regardless of the runtime timezone.
export function formatDate(iso: string): string {
  if (!iso) return "";
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) return "";
  return format(new UTCDate(ms), "MMM d, yyyy");
}
