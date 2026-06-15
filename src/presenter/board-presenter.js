import {render, remove, RenderPosition} from '../framework/render.js';
import UiBlocker from '../framework/ui-blocker/ui-blocker.js';
import SortView, {SortType} from '../view/sort-view.js';
import EventListView from '../view/event-list-view.js';
import NoPointView from '../view/no-point-view.js';
import LoadingView from '../view/loading-view.js';
import ErrorView from '../view/error-view.js';
import PointPresenter from './point-presenter.js';
import NewPointPresenter from './new-point-presenter.js';
import {sortPointByPrice, sortPointByTime, sortPointByDay} from '../utils/sort.js';
import {filter} from '../utils/filter.js';
import {UserAction, UpdateType, FilterType} from '../const.js';

const WaitingTime = {
  MIN: 350,
  MAX: 1000,
};

export default class BoardPresenter {
  #container = null;
  #pointsData = null;
  #filterData = null;

  #listComponent = new EventListView();
  #loaderComponent = new LoadingView();
  #sortComponent = null;
  #emptyComponent = null;

  #cachedPresenters = new Map();
  #creatorPresenter = null;
  #activeSort = SortType.DAY;
  #isDataLoading = true;
  #screenBlocker = new UiBlocker({
    lowerLimit: WaitingTime.MIN,
    upperLimit: WaitingTime.MAX
  });

  constructor({boardContainer, pointsModel, filterModel, onNewPointDestroy}) {
    this.#container = boardContainer;
    this.#pointsData = pointsModel;
    this.#filterData = filterModel;

    this.#creatorPresenter = new NewPointPresenter({
      pointListContainer: this.#listComponent.element,
      onDataChange: this.#onViewAction,
      onDestroy: () => {
        if (onNewPointDestroy) {
          onNewPointDestroy();
        }
        if (this.points.length === 0) {
          this.#showEmptyMessage();
        }
      }
    });

    this.#pointsData.addObserver(this.#onModelEvent);
    this.#filterData.addObserver(this.#onModelEvent);
  }

  get points() {
    const activeFilter = this.#filterData.filter;
    const allPoints = this.#pointsData.points;
    const matches = filter[activeFilter](allPoints);

    switch (this.#activeSort) {
      case SortType.TIME:
        return matches.sort(sortPointByTime);
      case SortType.PRICE:
        return matches.sort(sortPointByPrice);
      case SortType.DAY:
      default:
        return matches.sort(sortPointByDay);
    }
  }

  init() {
    this.#drawBoard();
  }

  createPoint() {
    this.#activeSort = SortType.DAY;
    this.#filterData.setFilter(UpdateType.MAJOR, FilterType.EVERYTHING);

    if (this.#emptyComponent) {
      remove(this.#emptyComponent);
      this.#emptyComponent = null;
    }

    this.#creatorPresenter.init(this.#pointsData.destinations, this.#pointsData.offers);
  }

  #onModeChange = () => {
    this.#creatorPresenter.destroy();
    this.#cachedPresenters.forEach((item) => item.resetView());
  };

  #onViewAction = async (actionType, updateType, update) => {
    this.#screenBlocker.block();

    switch (actionType) {
      case UserAction.UPDATE_POINT:
        this.#cachedPresenters.get(update.id).setSaving();
        try {
          await this.#pointsData.updatePoint(updateType, update);
        } catch (err) {
          this.#cachedPresenters.get(update.id).setAborting();
        }
        break;
      case UserAction.ADD_POINT:
        this.#creatorPresenter.setSaving();
        try {
          await this.#pointsData.addPoint(updateType, update);
        } catch (err) {
          this.#creatorPresenter.setAborting();
        }
        break;
      case UserAction.DELETE_POINT:
        this.#cachedPresenters.get(update.id).setDeleting();
        try {
          await this.#pointsData.deletePoint(updateType, update);
        } catch (err) {
          this.#cachedPresenters.get(update.id).setAborting();
        }
        break;
    }

    this.#screenBlocker.unblock();
  };

  #onModelEvent = (updateType, payload) => {
    switch (updateType) {
      case UpdateType.PATCH:
        this.#cachedPresenters.get(payload.id).init(payload, this.#pointsData.destinations, this.#pointsData.offers);
        break;
      case UpdateType.MINOR:
        this.#resetBoard();
        this.#drawBoard();
        break;
      case UpdateType.MAJOR:
        this.#resetBoard({resetSortType: true});
        this.#drawBoard();
        break;
      case UpdateType.INIT:
        this.#isDataLoading = false;
        remove(this.#loaderComponent);

        if (payload && payload.isError) {
          render(new ErrorView(), this.#container, RenderPosition.AFTERBEGIN);
          return;
        }

        this.#drawBoard();
        break;
    }
  };

  #onSortChange = (sortType) => {
    if (this.#activeSort === sortType) {
      return;
    }

    this.#activeSort = sortType;
    this.#resetBoard();
    this.#drawBoard();
  };

  #showSort() {
    this.#sortComponent = new SortView({
      currentSortType: this.#activeSort,
      onSortTypeChange: this.#onSortChange
    });
    render(this.#sortComponent, this.#container, RenderPosition.AFTERBEGIN);
  }

  #showLoader() {
    render(this.#loaderComponent, this.#container, RenderPosition.AFTERBEGIN);
  }

  #showPoint(point) {
    const presenter = new PointPresenter({
      pointListContainer: this.#listComponent.element,
      onDataChange: this.#onViewAction,
      onModeChange: this.#onModeChange
    });

    presenter.init(point, this.#pointsData.destinations, this.#pointsData.offers);
    this.#cachedPresenters.set(point.id, presenter);
  }

  #showPoints(points) {
    points.forEach((item) => this.#showPoint(item));
  }

  #showEmptyMessage() {
    this.#emptyComponent = new NoPointView({
      filterType: this.#filterData.filter
    });
    render(this.#emptyComponent, this.#container, RenderPosition.AFTERBEGIN);
  }

  #resetBoard({resetSortType = false} = {}) {
    this.#creatorPresenter.destroy();
    this.#cachedPresenters.forEach((item) => item.destroy());
    this.#cachedPresenters.clear();

    remove(this.#sortComponent);
    remove(this.#loaderComponent);

    if (this.#emptyComponent) {
      remove(this.#emptyComponent);
    }

    if (resetSortType) {
      this.#activeSort = SortType.DAY;
    }
  }

  #drawBoard() {
    render(this.#listComponent, this.#container);

    if (this.#isDataLoading) {
      this.#showLoader();
      return;
    }

    const currentPoints = this.points;
    if (currentPoints.length === 0) {
      this.#showEmptyMessage();
      return;
    }

    this.#showSort();
    this.#showPoints(currentPoints);
  }
}
