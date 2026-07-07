import { format, parseISO } from "date-fns";

export function formatDate(dateString: string) {
  try {
    return format(parseISO(dateString), "MMM dd, yyyy HH:mm");
  } catch (e) {
    return dateString;
  }
}
