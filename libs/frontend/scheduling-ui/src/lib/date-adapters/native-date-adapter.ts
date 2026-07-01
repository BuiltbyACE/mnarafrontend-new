import { DateAdapter } from 'angular-calendar';

function toDate(date: Date | number): Date {
  return typeof date === 'number' ? new Date(date) : new Date(date.getTime());
}

export class NativeDateAdapter extends DateAdapter {
  addWeeks(date: Date | number, amount: number): Date {
    const d = toDate(date);
    d.setDate(d.getDate() + amount * 7);
    return d;
  }

  addMonths(date: Date | number, amount: number): Date {
    const d = toDate(date);
    d.setMonth(d.getMonth() + amount);
    return d;
  }

  subDays(date: Date | number, amount: number): Date {
    const d = toDate(date);
    d.setDate(d.getDate() - amount);
    return d;
  }

  subWeeks(date: Date | number, amount: number): Date {
    const d = toDate(date);
    d.setDate(d.getDate() - amount * 7);
    return d;
  }

  subMonths(date: Date | number, amount: number): Date {
    const d = toDate(date);
    d.setMonth(d.getMonth() - amount);
    return d;
  }

  getISOWeek(date: Date | number): number {
    const d = toDate(date);
    const dayNum = d.getDay() || 7;
    d.setDate(d.getDate() + 4 - dayNum);
    const y = d.getFullYear();
    const zero = new Date(y, 0, 1);
    return Math.ceil(((d.getTime() - zero.getTime()) / 86400000 + zero.getDay() + 1) / 7);
  }

  setDate(date: Date | number, dayOfMonth: number): Date {
    const d = toDate(date);
    d.setDate(dayOfMonth);
    return d;
  }

  setMonth(date: Date | number, month: number): Date {
    const d = toDate(date);
    d.setMonth(month);
    return d;
  }

  setYear(date: Date | number, year: number): Date {
    const d = toDate(date);
    d.setFullYear(year);
    return d;
  }

  getDate(date: Date | number): number {
    return toDate(date).getDate();
  }

  getMonth(date: Date | number): number {
    return toDate(date).getMonth();
  }

  getYear(date: Date | number): number {
    return toDate(date).getFullYear();
  }

  addDays(date: Date | number, amount: number): Date {
    const d = toDate(date);
    d.setDate(d.getDate() + amount);
    return d;
  }

  addHours(date: Date | number, amount: number): Date {
    const d = toDate(date);
    d.setHours(d.getHours() + amount);
    return d;
  }

  addMinutes(date: Date | number, amount: number): Date {
    const d = toDate(date);
    d.setMinutes(d.getMinutes() + amount);
    return d;
  }

  addSeconds(date: Date | number, amount: number): Date {
    const d = toDate(date);
    d.setSeconds(d.getSeconds() + amount);
    return d;
  }

  differenceInDays(dateLeft: Date | number, dateRight: Date | number): number {
    const dl = toDate(dateLeft);
    const dr = toDate(dateRight);
    const utc1 = Date.UTC(dl.getFullYear(), dl.getMonth(), dl.getDate());
    const utc2 = Date.UTC(dr.getFullYear(), dr.getMonth(), dr.getDate());
    return Math.floor((utc1 - utc2) / 86400000);
  }

  differenceInMinutes(dateLeft: Date | number, dateRight: Date | number): number {
    return Math.floor((toDate(dateLeft).getTime() - toDate(dateRight).getTime()) / 60000);
  }

  differenceInSeconds(dateLeft: Date | number, dateRight: Date | number): number {
    return Math.floor((toDate(dateLeft).getTime() - toDate(dateRight).getTime()) / 1000);
  }

  endOfDay(date: Date | number): Date {
    const d = toDate(date);
    d.setHours(23, 59, 59, 999);
    return d;
  }

  endOfMonth(date: Date | number): Date {
    const d = toDate(date);
    d.setMonth(d.getMonth() + 1, 0);
    d.setHours(23, 59, 59, 999);
    return d;
  }

  endOfWeek(date: Date | number, options?: { weekStartsOn?: number }): Date {
    const d = toDate(date);
    const day = d.getDay();
    const weekStartsOn = options?.weekStartsOn ?? 0;
    const diff = day >= weekStartsOn ? day - weekStartsOn : day + 7 - weekStartsOn;
    const end = 6 - diff;
    d.setDate(d.getDate() + end);
    d.setHours(23, 59, 59, 999);
    return d;
  }

  getDay(date: Date | number): number {
    return toDate(date).getDay();
  }

  isSameDay(dateLeft: Date | number, dateRight: Date | number): boolean {
    const dl = toDate(dateLeft);
    const dr = toDate(dateRight);
    return (
      dl.getFullYear() === dr.getFullYear() &&
      dl.getMonth() === dr.getMonth() &&
      dl.getDate() === dr.getDate()
    );
  }

  isSameMonth(dateLeft: Date | number, dateRight: Date | number): boolean {
    const dl = toDate(dateLeft);
    const dr = toDate(dateRight);
    return dl.getFullYear() === dr.getFullYear() && dl.getMonth() === dr.getMonth();
  }

  isSameSecond(dateLeft: Date | number, dateRight: Date | number): boolean {
    return Math.floor(toDate(dateLeft).getTime() / 1000) === Math.floor(toDate(dateRight).getTime() / 1000);
  }

  max(dates: (Date | number)[]): Date {
    return new Date(Math.max(...dates.map(d => toDate(d).getTime())));
  }

  setHours(date: Date | number, hours: number): Date {
    const d = toDate(date);
    d.setHours(hours);
    return d;
  }

  setMinutes(date: Date | number, minutes: number): Date {
    const d = toDate(date);
    d.setMinutes(minutes);
    return d;
  }

  startOfDay(date: Date | number): Date {
    const d = toDate(date);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  startOfMinute(date: Date | number): Date {
    const d = toDate(date);
    d.setSeconds(0, 0);
    return d;
  }

  startOfMonth(date: Date | number): Date {
    const d = toDate(date);
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  startOfWeek(date: Date | number, options?: { weekStartsOn?: number }): Date {
    const d = toDate(date);
    const day = d.getDay();
    const weekStartsOn = options?.weekStartsOn ?? 0;
    const diff = day >= weekStartsOn ? day - weekStartsOn : day + 7 - weekStartsOn;
    d.setDate(d.getDate() - diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  getHours(date: Date | number): number {
    return toDate(date).getHours();
  }

  getMinutes(date: Date | number): number {
    return toDate(date).getMinutes();
  }

  getTimezoneOffset(date: Date | number): number {
    return toDate(date).getTimezoneOffset();
  }
}
