import {remove, render, RenderPosition} from '../framework/render.js';
import EventEditView from '../view/event-edit-view.js';
import {UserAction, UpdateType, BLANK_POINT} from '../const.js';
import {isEscapeKey} from '../utils/utils.js';

export default class NewPointPresenter {
  #targetContainer = null;
  #onDataUpdate = null;
  #onClose = null;
  #editFormComponent = null;

  constructor({pointListContainer, onDataChange, onDestroy}) {
    this.#targetContainer = pointListContainer;
    this.#onDataUpdate = onDataChange;
    this.#onClose = onDestroy;
  }

  init(destinations, offers) {
    if (this.#editFormComponent !== null) {
      return;
    }

    this.#editFormComponent = new EventEditView({
      point: BLANK_POINT,
      destinations: destinations,
      offers: offers,
      onFormSubmit: this.#onFormSubmit,
      onDeleteClick: this.#onCancelClick,
      onRollupClick: this.#onCancelClick
    });

    render(this.#editFormComponent, this.#targetContainer, RenderPosition.AFTERBEGIN);

    document.addEventListener('keydown', this.#onDocumentKeyDown);
  }

  destroy() {
    if (this.#editFormComponent === null) {
      return;
    }

    this.#onClose();
    remove(this.#editFormComponent);
    this.#editFormComponent = null;

    document.removeEventListener('keydown', this.#onDocumentKeyDown);
  }

  setSaving() {
    this.#editFormComponent.updateElement({
      isDisabled: true,
      isSaving: true,
    });
  }

  setAborting() {
    const reenableForm = () => {
      this.#editFormComponent.updateElement({
        isDisabled: false,
        isSaving: false,
        isDeleting: false,
      });
    };

    this.#editFormComponent.shake(reenableForm);
  }

  #onFormSubmit = (point) => {
    this.#onDataUpdate(
      UserAction.ADD_POINT,
      UpdateType.MINOR,
      point
    );
  };

  #onCancelClick = () => {
    this.destroy();
  };

  #onDocumentKeyDown = (evt) => {
    if (isEscapeKey(evt)) {
      evt.preventDefault();
      this.destroy();
    }
  };
}
