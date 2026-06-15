import AbstractStatefulView from '../framework/view/abstract-stateful-view.js';
import {humanizeFormDate} from '../utils/date.js';
import flatpickr from 'flatpickr';
import 'flatpickr/dist/flatpickr.min.css';
import he from 'he';
import {getOffersByType} from '../model/points-model.js';

const WAYPOINT_TYPES = ['taxi', 'bus', 'train', 'ship', 'drive', 'flight', 'check-in', 'sightseeing', 'restaurant'];

function createEventTypesTemplate(activeType, pointId, isBlocked) {
  return WAYPOINT_TYPES.map((type) => {
    const isSelected = type === activeType ? 'checked' : '';
    const blockAttr = isBlocked ? 'disabled' : '';
    return `
      <div class="event__type-item">
        <input id="event-type-${type}-${pointId}" class="event__type-input  visually-hidden" type="radio" name="event-type" value="${type}" ${isSelected} ${blockAttr}>
        <label class="event__type-label  event__type-label--${type}" for="event-type-${type}-${pointId}">${type.charAt(0).toUpperCase() + type.slice(1)}</label>
      </div>
    `;
  }).join('');
}

function createOffersTemplate(availableOffers, chosenOffers, isBlocked) {
  if (!availableOffers || availableOffers.length === 0) {
    return '';
  }

  const blockAttr = isBlocked ? 'disabled' : '';
  let content = '';

  for (const item of availableOffers) {
    const isChecked = chosenOffers.includes(item.id) ? 'checked' : '';
    content += `
      <div class="event__offer-selector">
        <input class="event__offer-checkbox  visually-hidden" id="event-offer-${item.id}" type="checkbox" name="event-offer-${item.id}" data-offer-id="${item.id}" ${isChecked} ${blockAttr}>
        <label class="event__offer-label" for="event-offer-${item.id}">
          <span class="event__offer-title">${he.encode(item.title)}</span>
          &plus;&euro;&nbsp;
          <span class="event__offer-price">${he.encode(String(item.price))}</span>
        </label>
      </div>`;
  }

  return `
    <section class="event__section  event__section--offers">
      <h3 class="event__section-title  event__section-title--offers">Offers</h3>
      <div class="event__available-offers">
        ${content}
      </div>
    </section>
  `;
}

function createDestinationTemplate(targetDestination) {
  if (!targetDestination || (!targetDestination.description && (!targetDestination.pictures || targetDestination.pictures.length === 0))) {
    return '';
  }

  const textNode = targetDestination.description ? `<p class="event__destination-description">${he.encode(targetDestination.description)}</p>` : '';

  let galleryNode = '';
  if (targetDestination.pictures && targetDestination.pictures.length > 0) {
    const images = targetDestination.pictures.map((img) => `<img class="event__photo" src="${he.encode(img.src)}" alt="${he.encode(img.description)}">`).join('');
    galleryNode = `
      <div class="event__photos-container">
        <div class="event__photos-tape">
          ${images}
        </div>
      </div>
    `;
  }

  return `
    <section class="event__section  event__section--destination">
      <h3 class="event__section-title  event__section-title--destination">Destination</h3>
      ${textNode}
      ${galleryNode}
    </section>
  `;
}

function createEventEditTemplate(state, listDestinations, listOffers) {
  const currentId = state.id || 'new';
  const selectedDestination = listDestinations.find((item) => item.id === state.destination);
  const matchedOffers = getOffersByType(listOffers, state.type)?.offers || [];
  const optionsMarkup = listDestinations.map((item) => `<option value="${he.encode(item.name)}"></option>`).join('');

  let cannotSubmit = state.isDisabled || !state.dateFrom || !state.dateTo || !state.destination;
  if (state.basePrice === null || state.basePrice === undefined || state.basePrice === '') {
    cannotSubmit = true;
  }

  let resetBtnCaption = 'Delete';
  if (!state.id) {
    resetBtnCaption = 'Cancel';
  } else if (state.isDeleting) {
    resetBtnCaption = 'Deleting...';
  }

  const fromDateText = state.dateFrom ? humanizeFormDate(state.dateFrom) : '';
  const toDateText = state.dateTo ? humanizeFormDate(state.dateTo) : '';
  const blockAttr = state.isDisabled ? 'disabled' : '';
  const initialPrice = state.basePrice !== null && state.basePrice !== undefined ? state.basePrice : '';

  return (
    `<li class="trip-events__item">
      <form class="event event--edit" action="#" method="post">
        <header class="event__header">
          <div class="event__type-wrapper">
            <label class="event__type  event__type-btn" for="event-type-toggle-${currentId}">
              <span class="visually-hidden">Choose event type</span>
              <img class="event__type-icon" width="17" height="17" src="img/icons/${state.type}.png" alt="Event type icon">
            </label>
            <input class="event__type-toggle  visually-hidden" id="event-type-toggle-${currentId}" type="checkbox" ${blockAttr}>

            <div class="event__type-list">
              <fieldset class="event__type-group">
                <legend class="visually-hidden">Event type</legend>
                ${createEventTypesTemplate(state.type, currentId, state.isDisabled)}
              </fieldset>
            </div>
          </div>

          <div class="event__field-group  event__field-group--destination">
            <label class="event__label  event__type-output" for="event-destination-${currentId}">${state.type}</label>
            <input class="event__input  event__input--destination" id="event-destination-${currentId}" type="text" name="event-destination" value="${selectedDestination ? he.encode(selectedDestination.name) : ''}" list="destination-list-${currentId}" ${blockAttr} autocomplete="off">
            <datalist id="destination-list-${currentId}">
              ${optionsMarkup}
            </datalist>
          </div>

          <div class="event__field-group  event__field-group--time">
            <label class="visually-hidden" for="event-start-time-${currentId}">From</label>
            <input class="event__input  event__input--time" id="event-start-time-${currentId}" type="text" name="event-start-time" value="${fromDateText}" ${blockAttr}>
            &mdash;
            <label class="visually-hidden" for="event-end-time-${currentId}">To</label>
            <input class="event__input  event__input--time" id="event-end-time-${currentId}" type="text" name="event-end-time" value="${toDateText}" ${blockAttr}>
          </div>

          <div class="event__field-group  event__field-group--price">
            <label class="event__label" for="event-price-${currentId}">
              <span class="visually-hidden">Price</span>
              &euro;
            </label>
            <input class="event__input  event__input--price" id="event-price-${currentId}" type="text" name="event-price" value="${initialPrice}" ${blockAttr}>
          </div>

          <button class="event__save-btn  btn  btn--blue" type="submit" ${cannotSubmit ? 'disabled' : ''}>
            ${state.isSaving ? 'Saving...' : 'Save'}
          </button>

          <button class="event__reset-btn" type="reset">
            ${resetBtnCaption}
          </button>

          ${state.id ? '<button class="event__rollup-btn" type="button"><span class="visually-hidden">Open event</span></button>' : ''}
        </header>

        <section class="event__details">
          ${createOffersTemplate(matchedOffers, state.offers, state.isDisabled)}
          ${createDestinationTemplate(selectedDestination)}
        </section>
      </form>
    </li>`
  );
}

export default class EventEditView extends AbstractStatefulView {
  #destinations = null;
  #offers = null;
  #handleFormSubmit = null;
  #handleRollupClick = null;
  #handleDeleteClick = null;

  #datepickerFrom = null;
  #datepickerTo = null;

  constructor({point, destinations, offers, onFormSubmit, onRollupClick, onDeleteClick}) {
    super();
    this._setState(EventEditView.parsePointToState(point));
    this.#destinations = destinations;
    this.#offers = offers;
    this.#handleFormSubmit = onFormSubmit;
    this.#handleRollupClick = onRollupClick;
    this.#handleDeleteClick = onDeleteClick;

    this._restoreHandlers();
  }

  get template() {
    return createEventEditTemplate(this._state, this.#destinations, this.#offers);
  }

  removeElement() {
    super.removeElement();
    if (this.#datepickerFrom) {
      this.#datepickerFrom.destroy();
      this.#datepickerFrom = null;
    }
    if (this.#datepickerTo) {
      this.#datepickerTo.destroy();
      this.#datepickerTo = null;
    }
  }

  reset(point) {
    this.updateElement(
      EventEditView.parsePointToState(point),
    );
  }

  _restoreHandlers() {
    const mainForm = this.element.querySelector('form');
    const typeGroup = this.element.querySelector('.event__type-group');
    const destInput = this.element.querySelector('.event__input--destination');
    const priceInput = this.element.querySelector('.event__input--price');
    const cancelBtn = this.element.querySelector('.event__reset-btn');
    const offersBlock = this.element.querySelector('.event__available-offers');
    const toggleBtn = this.element.querySelector('.event__rollup-btn');

    mainForm.addEventListener('submit', this.#formSubmitHandler);
    typeGroup.addEventListener('change', this.#typeChangeHandler);
    destInput.addEventListener('change', this.#destinationChangeHandler);
    priceInput.addEventListener('input', this.#priceInputHandler);
    cancelBtn.addEventListener('click', this.#formDeleteClickHandler);

    if (offersBlock) {
      offersBlock.addEventListener('change', this.#offerChangeHandler);
    }

    if (toggleBtn) {
      toggleBtn.addEventListener('click', this.#rollupClickHandler);
    }

    this.#setDatepickers();
  }

  #setDatepickers() {
    if (this.#datepickerFrom) {
      this.#datepickerFrom.destroy();
      this.#datepickerFrom = null;
    }
    if (this.#datepickerTo) {
      this.#datepickerTo.destroy();
      this.#datepickerTo = null;
    }

    const startInput = this.element.querySelector('[name="event-start-time"]');
    const endInput = this.element.querySelector('[name="event-end-time"]');

    if (startInput) {
      const baseOptions = {
        dateFormat: 'd/m/y H:i',
        enableTime: true,
        'time_24hr': true,
        onChange: this.#dateFromChangeHandler,
      };
      if (this._state.dateFrom) {
        baseOptions.defaultDate = this._state.dateFrom;
      }
      this.#datepickerFrom = flatpickr(startInput, baseOptions);
    }

    if (endInput) {
      const baseOptions = {
        dateFormat: 'd/m/y H:i',
        enableTime: true,
        'time_24hr': true,
        minDate: this._state.dateFrom || null,
        onChange: this.#dateToChangeHandler,
      };
      if (this._state.dateTo) {
        baseOptions.defaultDate = this._state.dateTo;
      }
      this.#datepickerTo = flatpickr(endInput, baseOptions);
    }
  }

  #dateFromChangeHandler = ([selectedDate]) => {
    this._setState({
      dateFrom: selectedDate,
    });
    this.#checkSubmitButtonValidity();
  };

  #dateToChangeHandler = ([selectedDate]) => {
    this._setState({
      dateTo: selectedDate,
    });
    this.#checkSubmitButtonValidity();
  };

  #typeChangeHandler = (evt) => {
    evt.preventDefault();
    this.updateElement({
      type: evt.target.value,
      offers: [],
    });
  };

  #destinationChangeHandler = (evt) => {
    evt.preventDefault();
    const foundDestination = this.#destinations.find((item) => item.name === evt.target.value);

    if (!foundDestination) {
      evt.target.value = '';
      this.updateElement({
        destination: ''
      });
      return;
    }

    this.updateElement({
      destination: foundDestination.id,
    });
  };

  #offerChangeHandler = (evt) => {
    if (evt.target.classList.contains('event__offer-checkbox')) {
      const activeCheckboxes = Array.from(this.element.querySelectorAll('.event__offer-checkbox:checked'));
      this._setState({
        offers: activeCheckboxes.map((node) => node.dataset.offerId)
      });
    }
  };

  #priceInputHandler = (evt) => {
    evt.preventDefault();
    evt.target.value = evt.target.value.replace(/\D/g, '');
    this._setState({
      basePrice: parseInt(evt.target.value, 10) || 0,
    });
    this.#checkSubmitButtonValidity();
  };

  #checkSubmitButtonValidity() {
    const commitButton = this.element.querySelector('.event__save-btn');
    let shouldDisable = !this._state.dateFrom || !this._state.dateTo || !this._state.destination;
    if (this._state.basePrice === null || this._state.basePrice === undefined || this._state.basePrice === '') {
      shouldDisable = true;
    }
    commitButton.disabled = shouldDisable;
  }

  #formSubmitHandler = (evt) => {
    evt.preventDefault();
    this.#handleFormSubmit(EventEditView.parseStateToPoint(this._state));
  };

  #rollupClickHandler = (evt) => {
    evt.preventDefault();
    this.#handleRollupClick();
  };

  #formDeleteClickHandler = (evt) => {
    evt.preventDefault();
    this.#handleDeleteClick(EventEditView.parseStateToPoint(this._state));
  };

  static parsePointToState(point) {
    const brandNew = !point.id;
    return Object.assign({}, point, {
      dateFrom: brandNew ? '' : (point.dateFrom || ''),
      dateTo: brandNew ? '' : (point.dateTo || ''),
      basePrice: brandNew ? 0 : (point.basePrice || 0),
      offers: point.offers || [],
      isDisabled: false,
      isSaving: false,
      isDeleting: false,
    });
  }

  static parseStateToPoint(state) {
    const pointData = Object.assign({}, state);
    delete pointData.isDisabled;
    delete pointData.isSaving;
    delete pointData.isDeleting;
    return pointData;
  }
}
