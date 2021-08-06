class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);
  clicks = 0;

  constructor(coords, distance, duration) {
    this.coords = coords; // [lat, lng]
    this.distance = distance; // in km
    this.duration = duration; // in min
    this.storageItem = {};
  }

  _setDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }

  click() {
    this.clicks++;
  }

  _getDataForLocalStorage() {
    /*
    { 
      "date":"2021-07-17T19:44:40.847Z",
      "id":"6551080847","clicks":0,
      "coords":[43.32118142926663,21.907424926757816],
      "distance":2,"duration":2,
      "type":"running",
      "cadence":2,
      "pace":1,
      "description":"Running on July 17"}
    */

    this.storageItem = {
      date: this.date,
      id: this.id,
      clicks: this.clicks,
      coords: this.coords,
      distance: this.distance,
      duration: this.duration,
      description: this.description,
    };
  }
}

class Running extends Workout {
  type = 'running';

  constructor(coords, distance, duration, cadence, id = null) {
    super(coords, distance, duration);
    if (id != null) this.id = id;
    this.cadence = cadence;
    this.calcPace();
    this._setDescription();
  }

  getDataForLocalStorage() {
    this._getDataForLocalStorage();
    this.storageItem.type = this.type;
    this.storageItem.cadence = this.cadence;
    this.storageItem.pace = this.pace;
    //let strStorageItem = JSON.stringify ( this.storageItem )
    return this.storageItem;
  }

  calcPace() {
    // min/km
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends Workout {
  type = 'cycling';

  constructor(coords, distance, duration, elevationGain, id = null) {
    super(coords, distance, duration);
    if (id != null) this.id = id;
    this.elevationGain = elevationGain;
    // this.type = 'cycling';
    this.calcSpeed();
    this._setDescription();
  }

  getDataForLocalStorage() {
    this._getDataForLocalStorage();
    this.storageItem.type = this.type;
    this.storageItem.speed = this.speed;
    this.storageItem.elevationGain = this.elevationGain;
    //let strStorageItem = JSON.stringify ( this.storageItem )
    return this.storageItem;
  }

  calcSpeed() {
    // km/h
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}
