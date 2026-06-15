import {render, replace, remove, RenderPosition} from '../framework/render.js';
import he from 'he';
import TripInfoView from '../view/trip-info-view.js';
import {sortPointByDay} from '../utils/sort.js';
import {getOffersByType} from '../model/points-model.js';

const DISPLAY_LIMIT = 3;
const INITIAL_POSITION = 0;
const OFFSET_VAL = 1;
const PATH_JOINER = ' &mdash; ';
const PATH_ELLIPSIS = ' &mdash; ... &mdash; ';

export default class TripInfoPresenter {
  #container = null;
  #model = null;
  #viewComponent = null;

  constructor({tripInfoContainer, pointsModel}) {
    this.#container = tripInfoContainer;
    this.#model = pointsModel;

    this.#model.addObserver(this.#onDataChange);
  }

  init() {
    const list = this.#model.points;
    const pointsDestinations = this.#model.destinations;
    const pointsOffers = this.#model.offers;

    if (list.length === 0 || pointsDestinations.length === 0 || pointsOffers.length === 0) {
      remove(this.#viewComponent);
      this.#viewComponent = null;
      return;
    }

    const orderedPoints = [...list].sort(sortPointByDay);

    const fullRoute = this.#buildRoute(orderedPoints, pointsDestinations);
    const rangeDates = this.#buildDates(orderedPoints);
    const finalPrice = this.#buildPrice(orderedPoints, pointsOffers);

    const oldComponent = this.#viewComponent;

    this.#viewComponent = new TripInfoView({route: fullRoute, dates: rangeDates, price: finalPrice});

    if (oldComponent === null) {
      render(this.#viewComponent, this.#container, RenderPosition.AFTERBEGIN);
      return;
    }

    replace(this.#viewComponent, oldComponent);
    remove(oldComponent);
  }

  #onDataChange = () => {
    this.init();
  };

  #buildRoute(points, destinations) {
    const titles = points.map((point) => {
      const match = destinations.find((item) => item.id === point.destination);
      return match ? he.encode(match.name) : '';
    });

    if (titles.length <= DISPLAY_LIMIT) {
      return titles.join(PATH_JOINER);
    }

    return `${titles[INITIAL_POSITION]}${PATH_ELLIPSIS}${titles[titles.length - OFFSET_VAL]}`;
  }

  #buildDates(points) {
    const start = points[0].dateFrom;
    const end = points[points.length - 1].dateTo;

    const formattedStart = new Date(start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const formattedEnd = new Date(end).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    return `${formattedStart}&nbsp;&mdash;&nbsp;${formattedEnd}`;
  }

  #buildPrice(points, allOffers) {
    let cost = 0;

    points.forEach((point) => {
      cost += point.basePrice;

      const group = getOffersByType(allOffers, point.type);
      if (group) {
        point.offers.forEach((id) => {
          const matchedOffer = group.offers.find((offer) => offer.id === id);
          if (matchedOffer) {
            cost += matchedOffer.price;
          }
        });
      }
    });

    return cost;
  }
}
