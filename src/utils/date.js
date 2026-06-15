import dayjs from 'dayjs';

const MINUTES_IN_HOUR = 60;
const MINUTES_IN_DAY = 1440;

const humanizePointDate = (date) => dayjs(date).format('MMM DD');

const humanizePointTime = (date) => dayjs(date).format('HH:mm');

const humanizeFormDate = (date) => dayjs(date).format('DD/MM/YY HH:mm');

const getPointDuration = (dateFrom, dateTo) => {
  const timeDiff = dayjs(dateTo).diff(dayjs(dateFrom), 'minute');
  const days = Math.floor(timeDiff / MINUTES_IN_DAY);
  const hours = Math.floor((timeDiff % MINUTES_IN_DAY) / MINUTES_IN_HOUR);
  const minutes = timeDiff % MINUTES_IN_HOUR;

  if (days > 0) {
    return `${days.toString().padStart(2, '0')}D ${hours.toString().padStart(2, '0')}H ${minutes.toString().padStart(2, '0')}M`;
  }
  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}H ${minutes.toString().padStart(2, '0')}M`;
  }
  return `${minutes.toString().padStart(2, '0')}M`;
};

export {humanizePointDate, humanizePointTime, humanizeFormDate, getPointDuration};
