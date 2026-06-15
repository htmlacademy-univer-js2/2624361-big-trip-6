import AbstractStatefulView from '../framework/view/abstract-stateful-view.js';
import {humanizeFormDate} from '../utils/date.js';
import flatpickr from 'flatpickr';
import 'flatpickr/dist/flatpickr.min.css';
import he from 'he';
import {getOffersByType} from '../model/points-model.js';

const DESTINATION_TYPES = ['taxi', 'bus', 'train', 'ship', 'drive', 'flight', 'check-in', 'sightseeing', 'restaurant'];

const createTypeSelectorsTemplate = (activeType, id, isDisabled) =>
  DESTINATION_TYPES.map((type) => {
    const isCurrent = type === activeType ? 'checked' : '';
    const status = isDisabled ? 'disabled' : '';
    return `
      <div class="event__type-item">
        <input id="event-type-${type}-${id}" class="event__type-input  visually-hidden" type="radio" name="event-type" value="${type}" ${isCurrent} ${status}>
        <label class="event__type-label  event__type-label--${type}" for="event-type-${type}-${id} ${status}">${type.charAt(0).toUpperCase() + type.slice(1)}</label>
      </div>
    `;
  }).join('');

const createAvailableOffersTemplate = (availableOffers, chosenOffers, isDisabled) => {
  if (!availableOffers || availableOffers.length === 0) {
    return '';
  }

  const items = availableOffers.map((offer) => {
    const isChecked = chosenOffers.includes(offer.id) ? 'checked' : '';
    const status = isDisabled ? 'disabled' : '';
    return `
      <div class="event__offer-selector">
        <input class="event__offer-checkbox  visually-hidden" id="event-offer-${offer.id}" type="checkbox" name="event-offer-${offer.id}" data-offer-id="${offer.id}" ${isChecked} ${status}>
        <label class="event__offer-label" for="event-offer-${offer.id}">
          <span class="event__offer-title">${offer.title}</span>
          &plus;&euro;&nbsp;
          <span class="event__offer-price">${offer.price}</span>
        </label>
      </div>
    `;
  }).join('');

  return `
    <section class="event__section  event__section--offers">
      <h3 class="event__section-title  event__section-title--offers">Offers</h3>
      <div class="event__available-offers">
        ${items}
      </div>
    </section>
  `;
};

const createPicturesTemplate = (pictures) => {
  if (!pictures || pictures.length === 0) {
    return '';
  }
  return `
    <div class="event__photos-container">
      <div class="event__photos-tape">
        ${pictures.map((img) => `<img class="event__photo" src="${img.src}" alt="${img.description}">`).join('')}
      </div>
    </div>
  `;
};

const createDestinationTemplate = (destination) => {
  if (!destination || (!destination.description && (!destination.pictures || destination.pictures.length === 0))) {
    return '';
  }
  return `
    <section class="event__section  event__section--destination">
      <h3 class="event__section-title  event__section-title--destination">Destination</h3>
      <p class="event__destination-description">${destination.description}</p>
      ${createPicturesTemplate(destination.pictures)}
    </section>
  `;
};

const createEditFormTemplate = (state, allDestinations, allOffers) => {
  const {id, type, basePrice, dateFrom, dateTo, destination, offers, isDisabled, isSaving, isDeleting} = state;
  const isNew = !id;

  const currentDestination = allDestinations.find((item) => item.id === destination);
  const typeOffers = getOffersByType(allOffers, type)?.offers || [];

  const typeList = createTypeSelectorsTemplate(type, id || 'new', isDisabled);
  const offersList = createAvailableOffersTemplate(typeOffers, offers, isDisabled);
  const destinationBlock = createDestinationTemplate(currentDestination);

  const cityName = currentDestination ? he.encode(currentDestination.name) : '';
  const priceValue = basePrice !== null && basePrice !== undefined ? basePrice : '';

  const saveText = isSaving ? 'Saving...' : 'Save';
  let cancelText = 'Cancel';
  if (!isNew) {
    cancelText = isDeleting ? 'Deleting...' : 'Delete';
  }

  const rollupButton = isNew ? '' : `
    <button class="event__rollup-btn" type="button" ${isDisabled ? 'disabled' : ''}>
      <span class="visually-hidden">Open event</span>
    </button>
  `;

  const cityOptions = allDestinations.map((item) => `<option value="${he.encode(item.name)}"></option>`).join('');

  return `
    <li class="trip-events__item">
      <form class="event event--edit" action="#" method="post">
        <header class="event__header">
          <div class="event__type-wrapper">
            <label class="event__type  event__type-btn" for="event-type-toggle-${id || 'new'}">
              <span class="visually-hidden">Choose event type</span>
              <img class="event__type-icon" width="17" height="17" src="img/icons/${type}.png" alt="Event type icon">
            </label>
            <input class="event__type-toggle  visually-hidden" id="event-type-toggle-${id || 'new'}" type="checkbox" ${isDisabled ? 'disabled' : ''}>

            <div class="event__type-list">
              <fieldset class="event__type-group">
                <legend class="visually-hidden">Event type</legend>
                ${typeList}
              </fieldset>
            </div>
          </div>

          <div class="event__field-group  event__field-group--destination">
            <label class="event__label  event__type-output" for="event-destination-${id || 'new'}">
              ${type}
            </label>
            <input class="event__input  event__input--destination" id="event-destination-${id || 'new'}" type="text" name="event-destination" value="${cityName}" list="destination-list-${id || 'new'}" autocomplete="off" required ${isDisabled ? 'disabled' : ''}>
            <datacontrol id="destination-list-${id || 'new'}">
              <datalist id="destination-list-${id || 'new'}">
                ${cityOptions}
              </datalist>
            </datacontrol>
          </div>

          <div class="event__field-group  event__field-group--time">
            <label class="visually-hidden" for="event-start-time-${id || 'new'}">From</label>
            <input class="event__input  event__input--time" id="event-start-time-${id || 'new'}" type="text" name="event-start-time" value="${humanizeFormDate(dateFrom)}" ${isDisabled ? 'disabled' : ''}>
            &mdash;
            <label class="visually-hidden" for="event-end-time-${id || 'new'}">To</label>
            <input class="event__input  event__input--time" id="event-end-time-${id || 'new'}" type="text" name="event-end-time" value="${humanizeFormDate(dateTo)}" ${isDisabled ? 'disabled' : ''}>
          </div>

          <div class="event__field-group  event__field-group--price">
            <label class="event__label" for="event-price-${id || 'new'}">
              <span class="visually-hidden">Price</span>
              &euro;
            </label>
            <input class="event__input  event__input--price" id="event-price-${id || 'new'}" type="text" inputmode="numeric" pattern="\\d*" name="event-price" value="${priceValue}" required ${isDisabled ? 'disabled' : ''}>
          </div>

          <button class="event__save-btn  btn  btn--blue" type="submit" ${isDisabled ? 'disabled' : ''}>${saveText}</button>
          <button class="event__reset-btn" type="reset" ${isDisabled ? 'disabled' : ''}>${cancelText}</button>
          ${rollupButton}
        </header>
        <section class="event__details">
          ${offersList}
          ${destinationBlock}
        </section>
      </form>
    </li>
  `;
};

export default class EventEditView extends AbstractStatefulView {
  #destinations = null;
  #offers = null;
  #handleSubmit = null;
  #handleRollup = null;
  #handleDelete = null;
  #startPicker = null;
  #endPicker = null;

  constructor({point, destinations, offers, onFormSubmit, onRollupClick, onDeleteClick}) {
    super();
    this.#destinations = destinations;
    this.#offers = offers;
    this.#handleSubmit = onFormSubmit;
    this.#handleRollup = onRollupClick;
    this.#handleDelete = onDeleteClick;

    this._setState(EventEditView.parsePointToState(point));
    this._restoreHandlers();
  }

  get template() {
    return createEditFormTemplate(this._state, this.#destinations, this.#offers);
  }

  removeElement() {
    super.removeElement();

    if (this.#startPicker) {
      this.#startPicker.destroy();
      this.#startPicker = null;
    }
    if (this.#endPicker) {
      this.#endPicker.destroy();
      this.#endPicker = null;
    }
  }

  reset(point) {
    this.updateElement(EventEditView.parsePointToState(point));
  }

  _restoreHandlers() {
    const form = this.element.querySelector('form');
    form.addEventListener('submit', this.#submitHandler);
    form.addEventListener('reset', this.#deleteHandler);

    const rollupBtn = this.element.querySelector('.event__rollup-btn');
    if (rollupBtn) {
      rollupBtn.addEventListener('click', this.#rollupHandler);
    }

    this.element.querySelector('.event__type-group').addEventListener('change', this.#typeToggleHandler);
    this.element.querySelector('.event__input--destination').addEventListener('change', this.#destinationToggleHandler);
    this.element.querySelector('.event__input--price').addEventListener('input', this.#priceInputHandler);

    const offersContainer = this.element.querySelector('.event__available-offers');
    if (offersContainer) {
      offersContainer.addEventListener('change', this.#offerChangeHandler);
    }

    this.#initPickers();
  }

  #initPickers() {
    const startField = this.element.querySelector('[name="event-start-time"]');
    const endField = this.element.querySelector('[name="event-end-time"]');

    this.#startPicker = flatpickr(startField, {
      dateFormat: 'd/m/y H:i',
      enableTime: true,
      defaultDate: this._state.dateFrom || '',
      time24hr: true,
      onChange: (dates) => {
        const selected = dates[0] ? dates[0].toISOString() : '';
        this._setState({dateFrom: selected});
        this.#endPicker.set('minDate', dates[0] || '');
        this.#validateForm();
      },
    });

    this.#endPicker = flatpickr(endField, {
      dateFormat: 'd/m/y H:i',
      enableTime: true,
      defaultDate: this._state.dateTo || '',
      minDate: this._state.dateFrom || '',
      time24hr: true,
      onChange: (dates) => {
        const selected = dates[0] ? dates[0].toISOString() : '';
        this._setState({dateTo: selected});
        this.#startPicker.set('maxDate', dates[0] || '');
        this.#validateForm();
      },
    });
  }

  #typeToggleHandler = (evt) => {
    evt.preventDefault();
    this.updateElement({
      type: evt.target.value,
      offers: [],
    });
  };

  #destinationToggleHandler = (evt) => {
    evt.preventDefault();
    const match = this.#destinations.find((item) => item.name === evt.target.value);

    this.updateElement({
      destination: match ? match.id : '',
    });
  };

  #offerChangeHandler = (evt) => {
    evt.preventDefault();
    const checkbox = evt.target.closest('.event__offer-checkbox');
    if (!checkbox) {
      return;
    }

    const currentId = checkbox.dataset.offerId;
    const activeOffers = new Set(this._state.offers);

    if (checkbox.checked) {
      activeOffers.add(currentId);
    } else {
      activeOffers.delete(currentId);
    }

    this._setState({
      offers: Array.from(activeOffers),
    });
  };

  #priceInputHandler = (evt) => {
    evt.preventDefault();
    evt.target.value = evt.target.value.replace(/\D/g, '');
    this._setState({
      basePrice: parseInt(evt.target.value, 10) || 0,
    });
    this.#validateForm();
  };

  #validateForm() {
    const button = this.element.querySelector('.event__save-btn');
    const isValid = this._state.dateFrom && this._state.dateTo && this._state.destination && this._state.basePrice !== '';
    button.disabled = !isValid;
  }

  #submitHandler = (evt) => {
    evt.preventDefault();
    this.#handleSubmit(EventEditView.parseStateToPoint(this._state));
  };

  #rollupHandler = (evt) => {
    evt.preventDefault();
    this.#handleRollup();
  };

  #deleteHandler = (evt) => {
    evt.preventDefault();
    this.#handleDelete(EventEditView.parseStateToPoint(this._state));
  };

  static parsePointToState(point) {
    const isNew = !point.id;
    return {
      ...point,
      dateFrom: isNew ? '' : (point.dateFrom || ''),
      dateTo: isNew ? '' : (point.dateTo || ''),
      basePrice: isNew ? 0 : (point.basePrice || 0),
      offers: point.offers || [],
      isDisabled: false,
      isSaving: false,
      isDeleting: false,
    };
  }

  static parseStateToPoint(state) {
    const point = {...state};

    delete point.isDisabled;
    delete point.isSaving;
    delete point.isDeleting;

    return point;
  }
}
