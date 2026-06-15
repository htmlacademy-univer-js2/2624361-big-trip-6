import BoardPresenter from './presenter/board-presenter.js';
import FilterPresenter from './presenter/filter-presenter.js';
import TripInfoPresenter from './presenter/trip-info-presenter.js';
import PointsModel from './model/points-model.js';
import FilterModel from './model/filter-model.js';
import PointsApiService from './points-api-service.js';

const AUTHORIZATION = 'Basic er883jdzbdw1234';
const END_POINT = 'https://24.objects.htmlacademy.pro/big-trip';

const headerElement = document.querySelector('.page-header');
const tripMainElement = document.querySelector('.trip-main');
const filtersElement = headerElement.querySelector('.trip-controls__filters');
const eventsElement = document.querySelector('.trip-events');
const newEventButtonElement = document.querySelector('.trip-main__event-add-btn');

const pointsModel = new PointsModel({
  pointsApiService: new PointsApiService(END_POINT, AUTHORIZATION)
});

const filterModel = new FilterModel();

const handleNewPointFormClose = () => {
  newEventButtonElement.disabled = false;
};

const tripInfoPresenter = new TripInfoPresenter({
  tripInfoContainer: tripMainElement,
  pointsModel
});

const boardPresenter = new BoardPresenter({
  boardContainer: eventsElement,
  pointsModel,
  filterModel,
  onNewPointDestroy: handleNewPointFormClose
});

const filterPresenter = new FilterPresenter({
  filterContainer: filtersElement,
  filterModel,
  pointsModel
});

newEventButtonElement.addEventListener('click', (evt) => {
  evt.preventDefault();
  boardPresenter.createPoint();
  newEventButtonElement.disabled = true;
});

tripInfoPresenter.init();
filterPresenter.init();
boardPresenter.init();
pointsModel.init();
