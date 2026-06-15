import AbstractView from '../framework/view/abstract-view.js';
import {FilterType} from '../const.js';

const FilterMessages = {
  [FilterType.EVERYTHING]: 'Click New Event to create your first point',
  [FilterType.FUTURE]: 'There are no future events now',
  [FilterType.PRESENT]: 'There are no present events now',
  [FilterType.PAST]: 'There are no past events now',
};

const createPlaceholderTemplate = (filterType) => {
  const message = FilterMessages[filterType];
  return `<p class="trip-events__msg">${message}</p>`;
};

export default class NoPointView extends AbstractView {
  #activeFilter = null;

  constructor({filterType}) {
    super();
    this.#activeFilter = filterType;
  }

  get template() {
    return createPlaceholderTemplate(this.#activeFilter);
  }
}
