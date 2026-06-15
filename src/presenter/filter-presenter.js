import {render, replace, remove} from '../framework/render.js';
import FilterView from '../view/filter-view.js';
import {filter} from '../utils/filter.js';
import {FilterType, UpdateType} from '../const.js';

export default class FilterPresenter {
  #container = null;
  #filtersData = null;
  #pointsData = null;
  #viewComponent = null;

  constructor({filterContainer, filterModel, pointsModel}) {
    this.#container = filterContainer;
    this.#filtersData = filterModel;
    this.#pointsData = pointsModel;

    this.#pointsData.addObserver(this.#onModelUpdate);
    this.#filtersData.addObserver(this.#onModelUpdate);
  }

  get filters() {
    const list = this.#pointsData.points;

    return Object.values(FilterType).map((key) => ({
      type: key,
      name: key,
      count: filter[key](list).length,
    }));
  }

  init() {
    const list = this.filters;
    const oldComponent = this.#viewComponent;

    this.#viewComponent = new FilterView({
      filters: list,
      currentFilterType: this.#filtersData.filter,
      onFilterTypeChange: this.#onFilterChange
    });

    if (oldComponent === null) {
      render(this.#viewComponent, this.#container);
      return;
    }

    replace(this.#viewComponent, oldComponent);
    remove(oldComponent);
  }

  #onModelUpdate = () => {
    this.init();
  };

  #onFilterChange = (filterType) => {
    if (this.#filtersData.filter !== filterType) {
      this.#filtersData.setFilter(UpdateType.MAJOR, filterType);
    }
  };
}
