import moment from "moment";

export function formatDateLong(stringDate: string): string {
    const date = moment(stringDate);
    return date.format("YYYY-MM-DD HH:mm:ss");
}
