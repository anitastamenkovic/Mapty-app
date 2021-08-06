'use strict';

// APPLICATION ARCHITECTURE
const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class App {
  #map;
  #mapZoomLevel = 13;
  #mapEvent;
  #workouts = [];

  constructor() {
    // Get user's position
    this._getPosition();

    // Get data from local storage
    this._getLocalStorage();

    // Attach event handlers
    form.addEventListener('submit', this._newWorkout.bind(this));
    inputType.addEventListener('change', this._toggleElevationField);
    containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
  }

  _getPosition() {
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert('Could not get your position');
        }
      );
  }

  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;

    const coords = [latitude, longitude];

    this.#map = L.map('map').setView(coords, this.#mapZoomLevel);

    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    // Handling clicks on map
    this.#map.on('click', this._showForm.bind(this));

    this.#workouts.forEach(work => {
      this._renderWorkoutMarker(work);
    });
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  _hideForm() {
    // Empty inputs
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        '';

    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => (form.style.display = 'grid'), 1000);
  }

  _toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  _newWorkout(e) {
    const validInputs = (...inputs) =>
      inputs.every(inp => Number.isFinite(inp));
    const allPositive = (...inputs) => inputs.every(inp => inp > 0);

    e.preventDefault();

    // Get data from form
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;

    // If workout running, create running object
    if (type === 'running') {
      const cadence = +inputCadence.value;

      // Check if data is valid
      if (
        !validInputs(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
      )
        return alert('Inputs have to be positive numbers!');

      workout = new Running([lat, lng], distance, duration, cadence);
    }

    // If workout cycling, create cycling object
    if (type === 'cycling') {
      const elevation = +inputElevation.value;

      if (
        !validInputs(distance, duration, elevation) ||
        !allPositive(distance, duration)
      )
        return alert('Inputs have to be positive numbers!');

      workout = new Cycling([lat, lng], distance, duration, elevation);
    }

    // Add new object to workout array
    this.#workouts.push(workout);

    // Render workout on map as marker
    this._renderWorkoutMarker(workout);

    // Render workout on list
    this._renderWorkout(workout);

    // Hide form + clear input fields
    this._hideForm();

    // Set local storage to all workouts
    this._setLocalStorage();
  }

  _renderWorkoutMarker(workout) {
    const myIcon = L.icon({
      iconUrl: 'img/icon.png',
      iconSize: [40, 40],
      iconAnchor: [22, 94],
      popupAnchor: [0, -90],
      className: '',
    });

    workout.marker = L.marker(workout.coords, { icon: myIcon })
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.description}`
      )
      .openPopup();
  }

  _renderWorkout(workout) {
    let html = `
      <li class="workout workout--${workout.type}" id="${
      workout.id
    }" data-id="${workout.id}">

        <div class="workout__header">
            <h2 class="workout__title">${workout.description}</h2>
            <div id="${workout.id + '_menu'}" class="workout__menu">
              <img class="menu__icon" src="img/dots-three-horizontal.svg" alt="dots">  
              <ul id="${workout.id + '_menuList'}" class="menu__list hidden">
                <li id="${
                  workout.id + '_delete'
                }" class="menu__item menu__item--delete">
                  <img class="menu__icon--svg" src="img/trash.svg" alt="trash">
                </li>
              </ul>
            </div>
          </div>

        <div class="workout__details">
          <span class="workout__icon">${
            workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
          }</span>
          <span class="workout__value">${workout.distance}</span>
          <span class="workout__unit">km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⏱</span>
          <span class="workout__value">${workout.duration}</span>
          <span class="workout__unit">min</span>
        </div>
    `;

    if (workout.type === 'running')
      html += `
        <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${workout.pace.toFixed(1)}</span>
          <span class="workout__unit">min/km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">🦶🏼</span>
          <span class="workout__value">${workout.cadence}</span>
          <span class="workout__unit">spm</span>
        </div>
      </li>
      `;

    if (workout.type === 'cycling')
      html += `
        <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${workout.speed.toFixed(1)}</span>
          <span class="workout__unit">km/h</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⛰</span>
          <span class="workout__value">${workout.elevationGain}</span>
          <span class="workout__unit">m</span>
        </div>
      </li>
      `;

    form.insertAdjacentHTML('afterend', html);

    // Show menu
    let menu = document.getElementById(workout.id + '_menu');
    menu.addEventListener('click', this._showMenu.bind(this));

    // Delete
    let del = document.getElementById(workout.id + '_delete');
    del.addEventListener('click', this._deleteItem.bind(this));
  }

  _moveToPopup(e) {
    if (!this.#map) return;
    if (this.#workouts.length == 0) return;

    const workoutEl = e.target.closest('.workout');

    if (!workoutEl) return;

    const workout = this.#workouts.find(
      work => work.id === workoutEl.dataset.id
    );

    if (workout == undefined) return;
    this.#map.setView(workout.coords, this.#mapZoomLevel, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
  }

  _setLocalStorage() {
    let storageWorkouts = [];

    for (let i = 0; i < this.#workouts.length; i++) {
      const workout = this.#workouts[i];
      let storageItem = workout.getDataForLocalStorage();
      storageWorkouts.push(storageItem);
    }

    let storageWorkoutsStr = JSON.stringify(storageWorkouts);

    localStorage.setItem('workouts', storageWorkoutsStr);
  }

  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts'));

    if (!data) return;

    const storageWorkouts = [];

    for (let i = 0; i < data.length; i++) {
      const storageItem = data[i];
      if (storageItem.type == 'running') {
        //constructor(coords, distance, duration, cadence)
        let workOut = new Running(
          storageItem.coords,
          storageItem.distance,
          storageItem.duration,
          storageItem.cadence,
          storageItem.id
        );
        storageWorkouts.push(workOut);
      } else {
        let workOut = new Cycling(
          storageItem.coords,
          storageItem.distance,
          storageItem.duration,
          storageItem.elevationGain,
          storageItem.id
        );
        storageWorkouts.push(workOut);
      }
    }

    this.#workouts = storageWorkouts;

    this.#workouts.forEach(work => {
      this._renderWorkout(work);
    });
  }

  _showMenu(e) {
    let idString = e.target.parentElement.id;
    let id = idString.split('_')[0];
    let menuList = document.getElementById(id + '_menuList');

    if (menuList == null) return;
    menuList.classList.toggle('hidden');
  }

  _deleteItem(e) {
    e.preventDefault();

    // Remove from list
    let idString = e.target.parentElement.id;
    console.log('_showMenu', idString);
    let id = idString.split('_')[0];
    const uiItem = document.getElementById(id);
    uiItem.parentElement.removeChild(uiItem);

    // Remove from local storage
    this.#workouts.forEach((work, i) => {
      if (work.id === id) {
        this.#workouts.splice(i, 1);
        this.#map.removeLayer(work.marker);
      }
    });

    // Set local storage
    this._setLocalStorage();
  }
}

const app = new App();
