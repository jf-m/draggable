import Draggable from '../Draggable';
import {SwappableStartEvent, SwappableSwapEvent, SwappableSwappedEvent, SwappableStopEvent} from './SwappableEvent';

const onDragStart = Symbol('onDragStart');
const onDragOver = Symbol('onDragOver');
const onDragOut = Symbol('onDragOut');
const onDragStop = Symbol('onDragStop');

/**
 * Returns an announcement message when the Draggable element is swapped with another draggable element
 * @param {SwappableSwappedEvent} swappableEvent
 * @return {String}
 */
function onSwappableSwappedDefaultAnnouncement({dragEvent, swappedElement}) {
  const sourceText = dragEvent.source.textContent.trim() || dragEvent.source.id || 'swappable element';
  const overText = swappedElement.textContent.trim() || swappedElement.id || 'swappable element';

  return `Swapped ${sourceText} with ${overText}`;
}

/**
 * @const {Object} defaultAnnouncements
 * @const {Function} defaultAnnouncements['swappabled:swapped']
 */
const defaultAnnouncements = {
  'swappabled:swapped': onSwappableSwappedDefaultAnnouncement,
};


export const defaultSwappableOptions = {
  immediateSwap: true
};

/**
 * Swappable is built on top of Draggable and allows swapping of draggable elements.
 * Order is irrelevant to Swappable.
 * @class Swappable
 * @module Swappable
 * @extends Draggable
 */
export default class Swappable extends Draggable {
  /**
   * Swappable constructor.
   * @constructs Swappable
   * @param {HTMLElement[]|NodeList|HTMLElement} containers - Swappable containers
   * @param {Object} options - Options for Swappable
   */
  constructor(containers = [], options = {}) {
    super(containers, {
      ...defaultSwappableOptions,
      ...options,
      announcements: {
        ...defaultAnnouncements,
        ...(options.announcements || {}),
      },
    });

    /**
     * Last draggable element that was dragged over
     * @property lastOver
     * @type {HTMLElement}
     */
    this.lastOver = null;
    /**
     * Last draggable element Container that was dragged over
     * @property lastOverContainer
     * @type {HTMLElement}
     */
    this.lastOverContainer = null;

    this[onDragStart] = this[onDragStart].bind(this);
    this[onDragOver] = this[onDragOver].bind(this);
    this[onDragOut] = this[onDragOut].bind(this);
    this[onDragStop] = this[onDragStop].bind(this);

    this.on('drag:start', this[onDragStart])
      .on('drag:over', this[onDragOver])
      .on('drag:out', this[onDragOut])
      .on('drag:stop', this[onDragStop]);

  }

  /**
   * Destroys Swappable instance.
   */
  destroy() {
    super.destroy();
    this.off('drag:start', this._onDragStart)
      .off('drag:over', this._onDragOver)
      .off('drag:out', this._onDragOut)
      .off('drag:stop', this._onDragStop);
  }

  /**
   * Drag start handler
   * @private
   * @param {DragStartEvent} event - Drag start event
   */
  [onDragStart](event) {
    const swappableStartEvent = new SwappableStartEvent({
      dragEvent: event,
    });

    this.trigger(swappableStartEvent);
    event.source.style.opacity = 0;

    if (swappableStartEvent.canceled()) {
      event.cancel();
    }
  }

  /**
   * Drag over handler
   * @private
   * @param {DragOverEvent} event - Drag over event
   */
  [onDragOver](event) {
    this.lastOver = event.over;
    this.lastOverContainer = event.overContainer;
  }

  /**
   * Drag out handler
   * @private
   * @param {DragOutEvent} event - Drag over event
   */
  [onDragOut](event) {
    this.lastOver = null;
    this.lastOverContainer = null;
  }

  /**
   * Drag stop handler
   * @private
   * @param {DragStopEvent} event - Drag stop event
   */
  [onDragStop](event) {
    const swappableSwapEvent = new SwappableSwapEvent({
      dragEvent: event,
      over: this.lastOver,
      overContainer: this.lastOverContainer
    });

    this.trigger(swappableSwapEvent);

    if (swappableSwapEvent.canceled()) {
      return;
    }

    event.source.style.display = null;
    if (this.lastOver != null) {
     // swap(event.source, this.lastOver);
    }
    let swappableStopEvent = new SwappableSwappedEvent({
      dragEvent: event,
      swappedElement: this.lastOver
    });

    this.trigger(swappableStopEvent);

    swappableStopEvent = new SwappableStopEvent({
      dragEvent: event
    });

    this.trigger(swappableStopEvent);
    this.lastOver = null;
    this.lastOverContainer = null;
  }
}

function withTempElement(callback) {
  const tmpElement = document.createElement('div');
  callback(tmpElement);
  tmpElement.parentNode.removeChild(tmpElement);
}

function swap(source, over) {
  const overParent = over.parentNode;
  const sourceParent = source.parentNode;

  withTempElement((tmpElement) => {
    sourceParent.insertBefore(tmpElement, source);
    overParent.insertBefore(source, over);
    sourceParent.insertBefore(over, tmpElement);
  });
}
