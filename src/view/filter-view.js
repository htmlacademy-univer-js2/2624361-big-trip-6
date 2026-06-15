import AbstractView from '../framework/view/abstract-view.js';

const createFilterRowTemplate = (filterItem, activeFilter) => {
  const {type, name, count} = filterItem;
  const isChecked = type === activeFilter ? 'checked' : '';
  const isDisabled = count === 0 ? 'disabled' : '';

  return `
    <div class="trip-filters__filter">
      <input id="filter-${name}" class="trip-filters__filter-input  visually-hidden" type="radio" name="trip-filter" value="${type}" ${isChecked} ${isDisabled}>
      <label class="trip-filters__filter-label" for="filter-${name}">${name}</label>
    </div>
  `;
};

const createFiltersTemplate = (items, activeFilter) => {
  const markup = items.map((row) => createFilterRowTemplate(row, activeFilter)).join('');

  return `
    <form class="trip-filters" action="#" method="get">
      ${markup}
      <button class="visually-hidden" type="submit">Accept filter</button>
    </form>
  `;
};

export default class FilterView extends AbstractView {
  #items = null;
  #activeType = null;
  #onFilterChange = null;

  constructor({filters, currentFilterType, onFilterTypeChange}) {
    super();
    this.#items = filters;
    this.#activeType = currentFilterType;
    this.#onFilterChange = onFilterTypeChange;

    this.element.addEventListener('change', this.#changeHandler);
  }

  get template() {
    return createFiltersTemplate(this.#items, this.#activeType);
  }

  #changeHandler = (evt) => {
    evt.preventDefault();
    this.#onFilterChange(evt.target.value);
  };
}
