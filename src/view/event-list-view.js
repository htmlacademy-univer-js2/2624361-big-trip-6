import AbstractView from '../framework/view/abstract-view.js';

const getContainerMarkup = () => '<ul class="trip-events__list"></ul>';

export default class EventListView extends AbstractView {
  get template() {
    return getContainerMarkup();
  }
}
