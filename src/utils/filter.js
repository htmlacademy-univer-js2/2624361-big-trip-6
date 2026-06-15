import dayjs from 'dayjs';
import {FilterType} from '../const.js';

const filter = {
  [FilterType.EVERYTHING]: (points) => points,

  [FilterType.FUTURE]: (points) => points.filter((point) =>
    dayjs(point.dateFrom).isAfter(dayjs())
  ),

  [FilterType.PRESENT]: (points) => points.filter((point) => {
    const now = dayjs();
    const start = dayjs(point.dateFrom);
    const end = dayjs(point.dateTo);

    return (start.isBefore(now) || start.isSame(now)) &&
           (end.isAfter(now) || end.isSame(now));
  }),

  [FilterType.PAST]: (points) => points.filter((point) =>
    dayjs(point.dateTo).isBefore(dayjs())
  ),
};

export {filter};
