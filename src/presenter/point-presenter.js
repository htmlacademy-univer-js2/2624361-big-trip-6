import {render, replace, remove} from '../framework/render.js';
import EventView from '../view/event-view.js';
import EventEditView from '../view/event-edit-view.js';
import {UserAction, UpdateType} from '../const.js';
import {isEscapeKey} from '../utils/utils.js';

const ViewState = {
  NORMAL: 'NORMAL',
  EDIT: 'EDIT',
};

export default class PointPresenter {
  #listContainer = null;
  #changeData = null;
  #changeMode = null;
  #cardComponent = null;
  #formComponent = null;
  #pointData = null;
  #state = ViewState.NORMAL;

  constructor({pointListContainer, onDataChange, onModeChange}) {
    this.#listContainer = pointListContainer;
    this.#changeData = onDataChange;
    this.#changeMode = onModeChange;
  }

  init(point, allDestinations, allOffers) {
    this.#pointData = point;
    const oldCardComponent = this.#cardComponent;
    const oldFormComponent = this.#formComponent;

    const matchedDestination = allDestinations.find((item) => item.id === this.#pointData.destination);

    this.#cardComponent = new EventView({
      point: this.#pointData,
      destination: matchedDestination,
      offers: allOffers,
      onEditClick: this.#onEditModeOpen,
      onFavoriteClick: this.#onFavoriteToggle,
    });

    this.#formComponent = new EventEditView({
      point: this.#pointData,
      destinations: allDestinations,
      offers: allOffers,
      onFormSubmit: this.#onFormSubmit,
      onRollupClick: this.#onEditModeClose,
      onDeleteClick: this.#onDeleteAction,
    });

    if (oldCardComponent === null || oldFormComponent === null) {
      render(this.#cardComponent, this.#listContainer);
      return;
    }

    if (this.#state === ViewState.NORMAL) {
      replace(this.#cardComponent, oldCardComponent);
    }

    if (this.#state === ViewState.EDIT) {
      replace(this.#cardComponent, oldFormComponent);
      this.#state = ViewState.NORMAL;
    }

    remove(oldCardComponent);
    remove(oldFormComponent);
  }

  destroy() {
    remove(this.#cardComponent);
    remove(this.#formComponent);
  }

  resetView() {
    if (this.#state !== ViewState.NORMAL) {
      this.#formComponent.reset(this.#pointData);
      this.#turnFormToCard();
    }
  }

  setSaving() {
    if (this.#state === ViewState.EDIT) {
      this.#formComponent.updateElement({
        isDisabled: true,
        isSaving: true,
      });
    }
  }

  setDeleting() {
    if (this.#state === ViewState.EDIT) {
      this.#formComponent.updateElement({
        isDisabled: true,
        isDeleting: true,
      });
    }
  }

  setAborting() {
    if (this.#state === ViewState.NORMAL) {
      this.#cardComponent.shake();
      return;
    }

    const unlockForm = () => {
      this.#formComponent.updateElement({
        isDisabled: false,
        isSaving: false,
        isDeleting: false,
      });
    };

    this.#formComponent.shake(unlockForm);
  }

  #turnCardToForm() {
    replace(this.#formComponent, this.#cardComponent);
    document.addEventListener('keydown', this.#onEscKeyDown);
    this.#changeMode();
    this.#state = ViewState.EDIT;
  }

  #turnFormToCard() {
    replace(this.#cardComponent, this.#formComponent);
    document.removeEventListener('keydown', this.#onEscKeyDown);
    this.#state = ViewState.NORMAL;
  }

  #onEscKeyDown = (evt) => {
    if (isEscapeKey(evt)) {
      evt.preventDefault();
      this.#formComponent.reset(this.#pointData);
      this.#turnFormToCard();
    }
  };

  #onEditModeOpen = () => {
    this.#turnCardToForm();
  };

  #onFavoriteToggle = () => {
    this.#changeData(
      UserAction.UPDATE_POINT,
      UpdateType.PATCH,
      {...this.#pointData, isFavorite: !this.#pointData.isFavorite}
    );
  };

  #onFormSubmit = (point) => {
    this.#changeData(
      UserAction.UPDATE_POINT,
      UpdateType.MINOR,
      point
    );
  };

  #onDeleteAction = (point) => {
    this.#changeData(
      UserAction.DELETE_POINT,
      UpdateType.MINOR,
      point
    );
  };

  #onEditModeClose = () => {
    this.#formComponent.reset(this.#pointData);
    this.#turnFormToCard();
  };
}
