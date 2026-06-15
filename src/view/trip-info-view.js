import AbstractView from '../framework/view/abstract-view.js';

const createSummaryTemplate = ({route, dates, price}) => {
  const displayDates = dates ? dates.replace(/([A-Za-z]+)\s(\d+)/g, '$2 $1').toUpperCase() : '';

  return `
    <section class="trip-main__trip-info  trip-info">
      <div class="trip-info__main">
        <h1 class="trip-info__title">${route}</h1>
        <p class="trip-info__dates">${displayDates}</p>
      </div>
      <p class="trip-info__cost">
        Total: &euro;&nbsp;<span class="trip-info__cost-value">${price}</span>
      </p>
    </section>
  `;
};

export default class TripInfoView extends AbstractView {
  #route = null;
  #dates = null;
  #price = null;

  constructor({route, dates, price}) {
    super();
    this.#route = route;
    this.#dates = dates;
    this.#price = price;
  }

  get template() {
    return createSummaryTemplate({
      route: this.#route,
      dates: this.#dates,
      price: this.#price
    });
  }
}
