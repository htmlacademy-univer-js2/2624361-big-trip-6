import AbstractView from '../framework/view/abstract-view.js';

const getErrorMarkup = () => '<p class="trip-events__msg">Failed to load latest route information</p>';

export default class ErrorView extends AbstractView {
  get template() {
    return getErrorMarkup();
  }
}
