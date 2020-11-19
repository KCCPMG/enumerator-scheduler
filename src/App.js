import React, {useState} from 'react';
import './App.css';
import './stylesheets/bootstrap.css'
import {Navbar, Container, Row, Col} from 'react-bootstrap'

const TIMES = [
  '8:00 AM', '8:15 AM', '8:30 AM', '8:45 AM',
  '9:00 AM', '9:15 AM', '9:30 AM', '9:45 AM',
  '10:00 AM', '10:15 AM', '10:30 AM', '10:45 AM',
  '11:00 AM', '11:15 AM', '11:30 AM', '11:45 AM',
  '12:00 PM', '12:15 PM', '12:30 PM', '12:45 PM',
  '1:00 PM', '1:15 PM', '1:30 PM', '1:45 PM',
  '2:00 PM', '2:15 PM', '2:30 PM', '2:45 PM',
  '3:00 PM', '3:15 PM', '3:30 PM', '3:45 PM',
  '4:00 PM', '4:15 PM', '4:30 PM', '4:45 PM',
  '5:00 PM', '5:15 PM', '5:30 PM', '5:45 PM',
  '6:00 PM', '6:15 PM', '6:30 PM', '6:45 PM',
  '7:00 PM', '7:15 PM', '7:30 PM', '7:45 PM',
  '8:00 PM', '8:15 PM', '8:30 PM', '8:45 PM',
  '9:00 PM'
]

const AVAILABILITY = "availability"
const ASSIGNED_SHIFTS = "assignedShifts"
const CLAIMED_SHIFTS = "claimedShifts"

const START_TIME = "startTime"
const END_TIME = "endTime"

function formatDateForTimeInput(date) {
  if (date===null) return "";
  if (!(date instanceof Date)) {
    console.log(date);
  }
  let hours = date.getHours();
  let minutes = date.getMinutes();
  let ampm = "AM"

  if (hours===12) ampm = "PM";

  if (hours > 12) {
    hours = hours-12;
    ampm = "PM";
  }

  if (minutes < 10) {
    minutes = `0${minutes}`
  }

  return `${hours}:${minutes} ${ampm}`;
}

function padZeroes(number, digits) {
  let numStr = String(number);

  while (numStr.length < digits) {
    numStr = "0" + numStr;
  }
  return numStr;
}

function formatDateForDateInput(date) {
  date = new Date(date.getTime() - date.getTimezoneOffset() * 60 * 1000);
  let year = padZeroes(date.getUTCFullYear(), 4);
  let month = padZeroes(date.getUTCMonth()+1, 2);
  let day = padZeroes(date.getUTCDate(), 2);

  return `${year}-${month}-${day}`;
}

class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      currentDate: new Date(),
      nextId: 1,
      enumerators: [],
      currentAvailabilityIntervals: [],
      currentAssignedShiftIntervals: [],
      currentClaimedShiftIntervals: [],
      currentAvailabilityWindows: [],
      currentAssignedShiftWindows: [],
      currentClaimedShiftWindows: []
    }
  }



  updateState = (stateObj) => {
    console.log(stateObj);
    let {
      currentAssignedShiftIntervals, currentAssignedShiftWindows, currentAvailabilityIntervals, currentAvailabilityWindows, currentClaimedShiftIntervals, 
      currentClaimedShiftWindows, currentDate,
      enumerators,
      nextId,
    } = stateObj;
    let types = [AVAILABILITY, ASSIGNED_SHIFTS, CLAIMED_SHIFTS];



    // test
    [currentAssignedShiftIntervals, currentAssignedShiftWindows, currentAvailabilityIntervals, currentAvailabilityWindows, currentClaimedShiftIntervals, currentClaimedShiftWindows, currentDate, enumerators].forEach(el => {
      if (el===undefined) console.log({el}); //this won't work right, whatever
    });

    // assume that changes are all within stateObj.currentDate
    [currentAssignedShiftIntervals, currentAssignedShiftWindows, currentAvailabilityIntervals, currentAvailabilityWindows, currentClaimedShiftIntervals, currentClaimedShiftWindows].forEach(el => el = []);

    // set validity to true for all blocks
    for (let e of enumerators) {
      for (let type of types) {
        for (let block of e[type]) {
          block.valid=true;
        }
      }
    }

    // clear all time intervals and blocks

    
    // check overlap validity
    for (let type of types) {
      for (let e of enumerators) {
        for (let i in e[type]) {
          let j = Number(i) + 1;
          while (j < e[type].length) {
            let firstBlock = e[type][i];
            let secondBlock = e[type][j];
            if (
              // firstBlock starts in secondBlock
              (firstBlock.startTime >= secondBlock.startTime && firstBlock.startTime <= secondBlock.endTime) || 
              // firstBlock ends in secondBlock or eclipses it
              (firstBlock.startTime <= secondBlock.startTime && firstBlock.endTime >= secondBlock.startTime) 
              // double check this test later, this is a modification to the original
            ) {
              firstBlock.valid = false;
              secondBlock.valid = false;
            }
            j++;
          }
        }
      }
    }
    


    // check order validity
    for (let type of types) {
      for (let e of enumerators) {
        for (let block of e[type]) {
          if (block.valid === true) {
            if (block.startTime >= block.endTime) block.valid = false;
          }
        }
      }
    }


    // update time intervals
    // let intervals = [currentAssignedShiftIntervals, currentAvailabilityIntervals, currentClaimedShiftIntervals];

    currentAvailabilityIntervals = [];
    currentAssignedShiftIntervals = [];
    currentClaimedShiftIntervals = [];

    for (let e of enumerators) {
      let curAvailTimes = [];
      let availWorking = e[AVAILABILITY].filter(b => b.valid === true && formatDateForDateInput(b.startTime) === formatDateForDateInput(currentDate));
      availWorking.forEach(block => curAvailTimes.push(block.startTime, block.endTime));
      Array.from(new Set(curAvailTimes)).forEach(t => currentAvailabilityIntervals.push(t));

      let curAssignedTimes = [];
      let assignedWorking = e[ASSIGNED_SHIFTS].filter(b => b.valid === true && formatDateForDateInput(b.startTime) === formatDateForDateInput(currentDate));
      assignedWorking.forEach(block => curAssignedTimes.push(block.startTime, block.endTime));
      Array.from(new Set(curAssignedTimes)).forEach(t => currentAssignedShiftIntervals.push(t));

      let curClaimedTimes = [];
      let claimedWorking = e[CLAIMED_SHIFTS].filter(b => b.valid === true && formatDateForDateInput(b.startTime) === formatDateForDateInput(currentDate));
      claimedWorking.forEach(block => curClaimedTimes.push(block.startTime, block.endTime));
      Array.from(new Set(curClaimedTimes)).forEach(t => currentClaimedShiftIntervals.push(t));
    }

    currentAvailabilityIntervals = Array.from(new Set(
      currentAvailabilityIntervals.sort((a,b) => a-b).map(el => el.valueOf())
    )).map(el => new Date(el));

    currentAssignedShiftIntervals = Array.from(new Set(
      currentAssignedShiftIntervals.sort((a,b) => a-b).map(el => el.valueOf())
    )).map(el => new Date(el));

    currentClaimedShiftIntervals = Array.from(new Set(
      currentClaimedShiftIntervals.sort((a,b) => a-b).map(el => el.valueOf())
    )).map(el => new Date(el));



    // update windows
    // Testing this, when working update other windows
    // console.log(currentAvailabilityIntervals);
    currentAvailabilityWindows = [];
    for (let i in currentAvailabilityIntervals) {
      if (i < currentAvailabilityIntervals.length-1) {
        let start = currentAvailabilityIntervals[i];
        let end = currentAvailabilityIntervals[Number(i)+1];

        let window = {
          start,
          end
        }

        let priority = 0;
        console.log(priority);

        for (let e of enumerators) {
          for (let block of e[AVAILABILITY]) {
            if (block.startTime <= start && block.endTime >= end) {
              priority += e.priority;
            }
          }
        }
        window.priority = priority
        currentAvailabilityWindows.push(window);
      }
    }

    currentAssignedShiftWindows = [];
    for (let i in currentAssignedShiftIntervals) {
      if (i < currentAssignedShiftIntervals.length-1) {
        let start = currentAssignedShiftIntervals[i];
        let end = currentAssignedShiftIntervals[Number(i)+1];

        let window = {
          start,
          end
        }

        let priority = 0;

        for (let e of enumerators) {
          for (let block of e[ASSIGNED_SHIFTS]) {
            if (block.startTime <= start && block.endTime >= end) {
              priority += e.priority;
            }
          }
        }
        window.priority = priority
        currentAssignedShiftWindows.push(window);
      }
    }

    currentClaimedShiftWindows = [];
    for (let i in currentClaimedShiftIntervals) {
      if (i < currentClaimedShiftIntervals.length-1) {
        let start = currentClaimedShiftIntervals[i];
        let end = currentClaimedShiftIntervals[Number(i)+1];

        let window = {
          start,
          end
        }

        let priority = 0;

        for (let e of enumerators) {
          for (let block of e[CLAIMED_SHIFTS]) {
            if (block.startTime <= start && block.endTime >= end) {
              priority += e.priority;
            }
          }
        }
        window.priority = priority
        currentClaimedShiftWindows.push(window);
      }
    }


    stateObj = {
      currentAssignedShiftIntervals, 
      currentAssignedShiftWindows, 
      currentAvailabilityIntervals, 
      currentAvailabilityWindows, 
      currentClaimedShiftIntervals, 
      currentClaimedShiftWindows, 
      currentDate, 
      enumerators,
      nextId
    }
    console.log(stateObj);

    // for (let windows of windowTypes) {
    //   for (let window of windows) {
    //     window.start = formatDateForTimeInput(window.start);
    //     window.end = formatDateForTimeInput(window.end);
    //   }
    // }

    // set state
    this.setState(stateObj);

  }

















  updateCurrentTimeIntervals = (type, cb) => {
    let currentDateFormatted = formatDateForDateInput(this.state.currentDate);

    let currentTimeIntervals = {}; // object to update state with
    currentTimeIntervals[type] = []; // array in object

    let stateObj = JSON.parse(JSON.stringify(this.state));
    this.preserveDateFormat(stateObj);

    console.log(stateObj);

    let enumerators = this.state.enumerators;

    console.log("updateCurrentTimeIntervals", type);
    for (let enumerator of enumerators) {
      let times = enumerator[type];
      for (let time of times) {
        console.log(time.startTime, time.endTime, time.valid);
        if (formatDateForDateInput(time.startTime)===currentDateFormatted && time.valid) {
          currentTimeIntervals[type].push(time.startTime);
        }
        if (formatDateForDateInput(time.endTime)===currentDateFormatted && time.valid) {
          currentTimeIntervals[type].push(time.endTime);
        }
      }
    }

    currentTimeIntervals[type] = this.sortedTimes(currentTimeIntervals[type])

    let currentWindows = [];
    console.log(currentTimeIntervals[type])

    for (let i in currentTimeIntervals[type]) {
      if (i>0) {
        let window = {priority: 0};
        window.start = currentTimeIntervals[type][i-1];
        window.end = currentTimeIntervals[type][i];
        console.log(window.start, window.end);
        for (let enumerator of enumerators) {
          for (let block of enumerator[type]) {
            if (block.startTime<=window.start && block.endTime>=window.end) {
              console.log(enumerator.priority);
              window.priority = window.priority + enumerator.priority;
            }
          }
        }
        console.log(window);
        currentWindows.push(window);
      }
    }

    console.log(currentWindows);

    // Update state timeIntervals with working copy 
    switch (type){
      case AVAILABILITY:
        stateObj.currentAvailabilityIntervals = currentTimeIntervals[type]
        stateObj.currentAvailabilityWindows = currentWindows;
        break;
      case ASSIGNED_SHIFTS:
        stateObj.currentAssignedShiftIntervals = currentTimeIntervals[type];
        stateObj.currentAssignedShiftWindows = currentWindows;
        break;
      case CLAIMED_SHIFTS:
        stateObj.currentClaimedShiftIntervals = currentTimeIntervals[type];
        stateObj.currentClaimedShiftWindows = currentWindows;
        break;
    }

    this.setState(stateObj, cb);
  }

  sortedTimes = (dates) => {
    // declare outarray
    let sorted = [];

    // sort times
    sorted = dates.sort((a,b) => a-b);

    // format times
    sorted = sorted.map(date => date.getTime());

    // remove duplicates
    function uniqueSorted(arr) {
      let arrOut = arr;
      for (let i in arr) {
        if (i>0) {
          if (arr[i] == arr[i-1]) {
            arrOut.splice(i, 1);
            arrOut = uniqueSorted(arrOut);
          }
        }
      }
      return arrOut;
    }

    sorted = uniqueSorted(sorted);

    // Put back into dates
    return sorted.map(milliseconds => new Date(milliseconds))
  }

  preserveDateFormat = (stateObj) => {
    // mutates object - DON'T USE ON STATE ITSELF
    if (stateObj.currentDate) {
      stateObj.currentDate = new Date(stateObj.currentDate)
    }

    stateObj.currentAvailabilityIntervals = stateObj.currentAvailabilityIntervals.map(ds => {
      return new Date(ds);
    })
    stateObj.currentAssignedShiftIntervals = stateObj.currentAssignedShiftIntervals.map(ds => new Date(ds));
    stateObj.currentClaimedShiftIntervals = stateObj.currentClaimedShiftIntervals.map(ds => new Date(ds));

    if (stateObj.currentAvailabilityWindows) {
      for (let window of stateObj.currentAvailabilityWindows) {
        window.start = new Date(window.start);
        window.end = new Date(window.end);
      }
    }
    if (stateObj.currentAssignedShiftWindows) {
      for (let window of stateObj.currentAssignedShiftWindows) {
        window.start = new Date(window.start);
        window.end = new Date(window.end);
      }
    }
    if (stateObj.currentClaimedShiftWindows) {
      for (let window of stateObj.currentClaimedShiftWindows) {
        window.start = new Date(window.start);
        window.end = new Date(window.end);
      }
    }

    let enumerators = stateObj.enumerators;
    for (let e of enumerators) {
      let {availability, assignedShifts, claimedShifts} = e;
      for (let avail of availability) {
        if (avail.startTime) avail.startTime = new Date(avail.startTime);
        if (avail.endTime) avail.endTime = new Date(avail.endTime);
      }
      for (let as of assignedShifts) {
        if (as.startTime) as.startTime = new Date(as.startTime);
        if (as.endTime) as.endTime = new Date(as.endTime);
      }
      for (let cs of claimedShifts) {
        if (cs.startTime) cs.startTime = new Date(cs.startTime);
        if (cs.endTime) cs.endTime = new Date(cs.endTime);
      }
    }
    return;
  }

  changeDate = (e) => {
    let stateObj = JSON.parse(JSON.stringify(this.state));
    this.preserveDateFormat(stateObj);
    let dateValue = new Date(e.target.value);
    
    stateObj.currentDate = new Date(dateValue.getTime() + dateValue.getTimezoneOffset()*60*1000)

    this.updateState(stateObj);

    // this.setState({
    //   currentDate: new Date(dateValue.getTime() + dateValue.getTimezoneOffset()*60*1000)
    // }, ()=>{
    //   this.updateCurrentTimeIntervals(AVAILABILITY, ()=>{
    //     this.updateCurrentTimeIntervals(ASSIGNED_SHIFTS, ()=>{
    //       this.updateCurrentTimeIntervals(CLAIMED_SHIFTS);
    //     });
    //   });
    // })
  }

  addEnumerator = () => {
    let stateObj = JSON.parse(JSON.stringify(this.state));
    this.preserveDateFormat(stateObj);
    console.log("before assignment", {stateObj});

    let enumerators = stateObj.enumerators;
    let newEnumerator = {
      id: stateObj.nextId,
      name: '',
      priority: 1,
      availability: [],
      assignedShifts: [],
      claimedShifts: []
    }
    stateObj.nextId++;
    console.log("after assignment", {stateObj});
    enumerators.push(newEnumerator);
    // this.setState({
    //   nextId: this.state.nextId + 1,
    //   enumerators
    // })
    console.log(stateObj);
    this.updateState(stateObj);
  }

  deleteEnumerator = (id) => {
    let stateObj = JSON.parse(JSON.stringify(this.state));
    this.preserveDateFormat(stateObj);
    stateObj.enumerators = stateObj.enumerators.filter((enumerator) => {
      if (enumerator.id===id) return false;
      else return true;
    })
    // this.setState(stateObj, ()=>{
    //   this.updateCurrentTimeIntervals(AVAILABILITY);
    //   this.updateCurrentTimeIntervals(ASSIGNED_SHIFTS);
    //   this.updateCurrentTimeIntervals(CLAIMED_SHIFTS);
    // });

    this.updateState(stateObj);
  }

  adjustPriority = (id, increase) => {
    let stateObj = JSON.parse(JSON.stringify(this.state));
    this.preserveDateFormat(stateObj);
    
    let foundEnum = stateObj.enumerators.find(enumerator => enumerator.id===id);

    let adjustment = increase ? 1 : -1;

    foundEnum.priority = foundEnum.priority + adjustment;

    // this.setState(stateObj, ()=>{
    //   this.updateCurrentTimeIntervals(AVAILABILITY, ()=>{
    //     this.updateCurrentTimeIntervals(ASSIGNED_SHIFTS,  ()=>{
    //       this.updateCurrentTimeIntervals(CLAIMED_SHIFTS);
    //     });
    //   });
    // });


    // this.setState(stateObj, ()=> {
    //   this.checkValidity(AVAILABILITY, ()=>{
    //     this.updateCurrentTimeIntervals(AVAILABILITY, ()=>{
    //       this.checkValidity(ASSIGNED_SHIFTS, ()=>{
    //         this.updateCurrentTimeIntervals(ASSIGNED_SHIFTS, ()=>{
    //           this.checkValidity(CLAIMED_SHIFTS, ()=>{this.updateCurrentTimeIntervals(CLAIMED_SHIFTS)})
    //         })
    //       })
    //     })
    //   })
    // });
    this.updateState(stateObj);
  }

  changeEnumeratorName = (id, newName) => {
    let stateObj = JSON.parse(JSON.stringify(this.state));
    this.preserveDateFormat(stateObj);
    let foundEnum = stateObj.enumerators.find(enumerator => enumerator.id===id);
    foundEnum.name = newName;
    console.log({stateObj, id, newName})
    this.setState(stateObj)
  }

  addAvailability = (id) => {
    let stateObj = JSON.parse(JSON.stringify(this.state));
    this.preserveDateFormat(stateObj);
    let foundEnum = stateObj.enumerators.find(enumerator => enumerator.id===id);
    let availIds = foundEnum.availability.map(avail => avail.id);
    if (availIds.length===0) availIds=[-1]
    let nextId = Math.max(...availIds)+1;
    console.log(foundEnum, availIds, nextId);
    foundEnum.availability.push({
      id: nextId,
      startTime: this.state.currentDate,
      endTime: this.state.currentDate
    })
    // this.setState(stateObj);
    this.updateState(stateObj);
  }

  addTime = (id, type) => {
    let stateObj = JSON.parse(JSON.stringify(this.state));
    this.preserveDateFormat(stateObj);
    let foundEnum = stateObj.enumerators.find(enumerator => enumerator.id===id);
    let availIds = foundEnum[type].map(block => block.id);
    if (availIds.length===0) availIds=[-1]
    let nextId = Math.max(...availIds)+1;

    let startTime = new Date(this.state.currentDate)
    startTime.setHours(8)
    startTime.setMinutes(0)
    startTime.setSeconds(0)
    startTime.setMilliseconds(0);

    let endTime = new Date(this.state.currentDate)
    endTime.setHours(8)
    endTime.setMinutes(0)
    endTime.setSeconds(0)
    endTime.setMilliseconds(0); 

    foundEnum[type].push({
      id: nextId,
      startTime,
      endTime,
      valid: false
    })
    // this.setState(stateObj, ()=> {
    //   this.updateCurrentTimeIntervals(type, ()=>{
    //     this.checkValidity(type)
    //   });
    // });


    // this.setState(stateObj, ()=> {
    //   this.checkValidity(type, ()=>{this.updateCurrentTimeIntervals(type)})
    // })
    this.updateState(stateObj);
  }

  deleteTime = (type, enumId, blockId) => {

    let stateObj = JSON.parse(JSON.stringify(this.state));
    this.preserveDateFormat(stateObj);
    let enumerators = stateObj.enumerators;

    let foundEnumerator = enumerators.find((enumerator) => enumerator.id===enumId);

    // foundEnumerator[type].forEach(block => {
    //   console.log(block.id, blockId, block.id===blockId)
    // })

    // console.log(foundEnumerator[type].filter(block => {
    //   if (block.id === blockId) return false;
    //   else return true;
    // }))

    foundEnumerator[type] = foundEnumerator[type].filter(block => {
      if (block.id === blockId) return false;
      else return true;
    })

    // console.log(foundEnumerator[type])
    // console.log(enumerators);
    
    // this.setState({enumerators}, ()=>{
    //   this.updateCurrentTimeIntervals(type, ()=>{
    //     this.checkValidity(type)
    //   });
    // });
    // this.setState(stateObj, ()=> {
    //   this.checkValidity(type, ()=>{this.updateCurrentTimeIntervals(type)})
    // })

    this.updateState(stateObj);
  }


  // deleteAvailability = (enumId, availId) => {
  //   let enumerators = JSON.parse(JSON.stringify(this.state.enumerators))
  //   let foundEnumerator = enumerators.find((enumerator) => enumerator.id===enumId)

  //   foundEnumerator.availability = foundEnumerator.availability.filter((avail) => {
  //     if (avail.id === availId) return false;
  //     else return true;
  //   })

  //   this.preserveDateFormat({enumerators});

  //   this.setState({
  //     enumerators: enumerators
  //   }, this.checkValidity)
  // }


  checkValidity = (type, cb) => {
    let stateObj = JSON.parse(JSON.stringify(this.state));
    this.preserveDateFormat(stateObj);
    if (type) {
      this.determineOverlapValidity(stateObj, type);
      this.determineOrderValidity(stateObj, type);
    } else {
      this.determineOverlapValidity(stateObj, AVAILABILITY);
      this.determineOverlapValidity(stateObj, ASSIGNED_SHIFTS);
      this.determineOverlapValidity(stateObj, CLAIMED_SHIFTS);
      this.determineOrderValidity(stateObj, AVAILABILITY);
      this.determineOrderValidity(stateObj, ASSIGNED_SHIFTS);
      this.determineOrderValidity(stateObj, CLAIMED_SHIFTS);
    }
    this.setState(stateObj, cb);
  }


  determineOverlapValidity = (stateObj, type) => {

    // reset all blocks' validity to true
    for (let enumerator of stateObj.enumerators) {
      for (let block of enumerator[type]) { 
        block.valid = true;
      }
    }

    // mutates stateObj, don't use on state directly
    for (let enumerator of stateObj.enumerators) {
      for (let block of enumerator[type]) {
        for (let secondBlock of enumerator[type]) {
          if (block.id === secondBlock.id) continue;
          else {
            if (
              // starts in other block
              (block.startTime >= secondBlock.startTime && block.startTime <= secondBlock.endTime) || 
              // ends in other block
              (block.endTime >= secondBlock.startTime && block.endTime <= secondBlock.endTime) || 
              // eclipses other block
              (block.startTime <= secondBlock.startTime && block.endTime >= secondBlock.endTime)
            ) {
              block.valid = false;
              secondBlock.valid = false;
            }
          }
        }
      }
    }
  }


  determineOrderValidity = (stateObj, type) => {
    // only set false
    for (let enumerator of stateObj.enumerators) {
      for (let block of enumerator[type]) {
        if (block.valid) {
          if (block.startTime >= block.endTime) block.valid = false;
        }
      }
    }
  }


  modifyTime = (type, startOrEnd, enumId, blockId, newValue) => {
    console.log({
      type, startOrEnd, enumId, blockId, newValue
    })
    let stateObj = JSON.parse(JSON.stringify(this.state));
    this.preserveDateFormat(stateObj);

    let foundEnum = stateObj.enumerators.find(enumerator => enumerator.id===enumId);
    let timeBlock = foundEnum[type].find((t) => t.id===blockId);

    timeBlock[startOrEnd] = new Date(stateObj.currentDate);

    let ampmModifier;
    newValue.match("AM") ? ampmModifier = 0 : ampmModifier = 12;

    let hours = Number(newValue.slice(0, newValue.indexOf(":")));

    if (hours === 12) {
      hours = 0;
    }

    hours = hours + ampmModifier;

    let minutes = Number(newValue.slice(newValue.indexOf(":")+1, newValue.indexOf(" ")));

    timeBlock[startOrEnd].setHours(hours, minutes, 0, 0);

    // determine validity due to order
    // if (timeBlock.startTime >= timeBlock.endTime) timeBlock.valid = false;
    // else timeBlock.valid = true;

    // determine validity due to overlap

    // determine validity due to order of start and end time
    // if (timeBlock.startTime >= timeBlock.endTime) timeBlock.valid=false;

    // this.setState(stateObj, ()=> {
    //   this.updateCurrentTimeIntervals(type, this.checkValidity);
    // });

    // this.setState(stateObj, ()=>{
    //   this.checkValidity(null, ()=>{
    //     this.updateCurrentTimeIntervals(type);
    //   })
    // })
    this.updateState(stateObj);
  
  }


  render() {
    let enumKey=0;
    let enumRows = this.state.enumerators.map((e) => {
      enumKey++;
      return (
        <Enumerator 
          key={`enumerator-${enumKey}`}
          enumerator={e} 
          currentDate={this.state.currentDate}

          adjustPriority={this.adjustPriority}

          deleteEnumerator={this.deleteEnumerator}
          changeEnumeratorName={this.changeEnumeratorName}

          // addAvailability={this.addAvailability}
          // deleteAvailability={this.deleteAvailability}
          deleteTime={this.deleteTime}
          modifyTime={this.modifyTime}
          addTime={this.addTime}
        />
      )
    })
    let availKey=0;
    let availabilityRows = this.state.currentAvailabilityWindows?.length > 0 ? this.state.currentAvailabilityWindows?.map(win => {
      availKey++;
      return(
        <Row key={`availability-row-${availKey}`}>
          <Col>
            {formatDateForTimeInput(new Date(win.start))} - {formatDateForTimeInput(new Date(win.end))}
          </Col>
          <Col>
            {win.priority}
          </Col>
        </Row>
      )
    }) : [
      <Row key="availability-row-1">
        <Col>
          — - —
        </Col>
        <Col>
          —
        </Col>
      </Row>
    ]
    let assignedKey = 0;
    let assignedShiftRows = this.state.currentAssignedShiftWindows?.length > 0 ? this.state.currentAssignedShiftWindows?.map(win => {
      console.log(win);
      assignedKey++;
      return(
        <Row key={`assigned-row-${assignedKey}`}>
          <Col>
            {formatDateForTimeInput(win.start)} - {formatDateForTimeInput(win.end)}
          </Col>
          <Col>
            {win.priority}
          </Col>
        </Row>
      )
    }) : [
      <Row key={`assigned-row-${assignedKey}`}>
        <Col>
          — - —
        </Col>
        <Col>
          —
        </Col>
      </Row>
    ]

    return (
      <div className="App">
        <Navbar className="nav">
          <div className="mx-auto">
            Enumerator Time Viewer    
          </div>
        </Navbar>
        <Container fluid className="enumerator-master-container">
          <datalist id="times">
            <option value="9:00 AM" />
            <option value="9:15 AM" />
            <option value="9:30 AM" />
            <option value="9:45 AM" />
            <option value="10:00 AM" />
            <option value="10:15 AM" />
            <option value="10:30 AM" />
            <option value="10:45 AM" />
            <option value="11:00 AM" />
            <option value="11:15 AM" />
            <option value="11:30 AM" />
            <option value="11:45 AM" />
            <option value="12:00 PM" />
            <option value="12:15 PM" />
            <option value="12:30 PM" />
            <option value="12:45 PM" />
            <option value="1:00 PM" />
            <option value="1:15 PM" />
            <option value="1:30 PM" />
            <option value="1:45 PM" />
            <option value="2:00 PM" />
            <option value="2:15 PM" />
            <option value="2:30 PM" />
            <option value="2:45 PM" />
            <option value="3:00 PM" />
            <option value="3:15 PM" />
            <option value="3:30 PM" />
            <option value="3:45 PM" />
            <option value="4:00 PM" />
            <option value="4:15 PM" />
            <option value="4:30 PM" />
            <option value="4:45 PM" />
            <option value="5:00 PM" />
            <option value="5:15 PM" />
            <option value="5:30 PM" />
            <option value="5:45 PM" />
            <option value="6:00 PM" />
            <option value="6:15 PM" />
            <option value="6:30 PM" />
            <option value="6:45 PM" />
            <option value="6:00 PM" />
            <option value="7:15 PM" />
            <option value="7:30 PM" />
            <option value="7:45 PM" />
            <option value="7:00 PM" />
            <option value="8:15 PM" />
            <option value="8:30 PM" />
            <option value="8:45 PM" />
            <option value="9:00 PM" />
          </datalist>
          <Row className="justify-content-center p-2">
            <h5>
              Select Date:
            </h5>
          </Row>
          <Row className="justify-content-center p-2">
            <input 
              type="date" 
              value={formatDateForDateInput(this.state.currentDate)} 
              onChange={this.changeDate} 
            />
          </Row>
          <Row className="justify-content-center p-4">
            <button onClick={this.addEnumerator}>
              Add Enumerator
            </button>
          </Row>
          {enumRows}
          <Container className="optimizer text-center">
            <Row>
              <Col sm={6}>
                <Row className="optimizer-header justify-content-center">
                  <h4>Availability</h4>
                </Row>
                <Row>
                  <Col>
                    <h5>Time</h5>
                  </Col>
                  <Col>
                    <h5>Priority</h5>
                  </Col>
                </Row>
                {availabilityRows}
              </Col>
              <Col sm={6}>
                <Row className="justify-content-center">
                  <h4 className="optimizer-header">Assigned Shifts</h4>
                </Row>
                <Row>
                  <Col>
                    <h5>Time</h5>
                  </Col>
                  <Col>
                    <h5>Priority</h5>
                  </Col>
                </Row>
                {assignedShiftRows}
              </Col>
            </Row>
            <Row>
              <Col>
                {<PriorityBlocks currentWindows={this.state.currentAvailabilityWindows}/>}
              </Col>
              <Col>
                {<PriorityBlocks currentWindows={this.state.currentAssignedShiftWindows}/>}
              </Col>
            </Row>
            
            
          </Container>
          <Container className="experiment-zone">
            <PriorityBlocksAlt currentWindows={this.state.currentAvailabilityWindows}/>
            <ColorDisplay />
          </Container>
        </Container>
      </div>
    );
  }
  
}

function Enumerator(props) {

  let currentDate = props.currentDate;

  let { id, name, priority, availability, assignedShifts, claimedShifts } = props.enumerator;


  // let options = (matchTime) => TIMES.map(time => {
  //   return <option key={time} value={time} />
  // })

  let currentYear = currentDate.getUTCFullYear();
  let currentMonth = currentDate.getUTCMonth();
  let currentDay = currentDate.getUTCDate();
  

  availability = availability.filter((block) => {
    let startDateFormatted = formatDateForDateInput(block.startTime);
    let endDateFormatted = formatDateForDateInput(block.endTime);
    let currentDateFormatted = formatDateForDateInput(currentDate);

    if (startDateFormatted === endDateFormatted && endDateFormatted === currentDateFormatted) {
      return true;
    } else return false;
  });

  assignedShifts = assignedShifts.filter((block) => {
    let startDateFormatted = formatDateForDateInput(block.startTime);
    let endDateFormatted = formatDateForDateInput(block.endTime);
    let currentDateFormatted = formatDateForDateInput(currentDate);

    if (startDateFormatted === endDateFormatted && endDateFormatted === currentDateFormatted) {
      return true;
    } else return false;
  });


  claimedShifts = claimedShifts.filter((block) => {
    let startDateFormatted = formatDateForDateInput(block.startTime);
    let endDateFormatted = formatDateForDateInput(block.endTime);
    let currentDateFormatted = formatDateForDateInput(currentDate);

    if (startDateFormatted === endDateFormatted && endDateFormatted === currentDateFormatted) {
      return true;
    } else return false;
  })

  let renderedClaimedShifts = claimedShifts.map(block => <Block type={CLAIMED_SHIFTS} block={block} modifyTime={props.modifyTime} deleteTime={props.deleteTime} id={id}/>)

  let renderedAssignedShifts = assignedShifts.map(block => <Block type={ASSIGNED_SHIFTS} block={block} modifyTime={props.modifyTime} deleteTime={props.deleteTime} id={id}/>)

  let renderedAvailability = availability.map(block => <Block type={AVAILABILITY} block={block} modifyTime={props.modifyTime} deleteTime={props.deleteTime} id={id}/>)
  
  return (
    <Container className="enumerator-container" key={id} >
      <Row className="enumerator-row enumerator-name-row p-1">
        <input 
          value={name}
          className="enumerator-name"
          placeholder="Enumerator Name"
          onChange={(e) => {
            props.changeEnumeratorName(id, e.target.value)
          }}
        />
        <Col>
          <span style={{"marginRight": "10px"}}>
            Priority:
          </span>
          <span 
            className="adjust-priority adjust-priority-down"
            onClick={()=>{props.adjustPriority(id, false)}}
          >
            &#9660;
          </span>
            {priority}
          <span 
            className="adjust-priority adjust-priority-up"
            onClick={()=>{props.adjustPriority(id, true)}}
          >
            &#9650;
          </span>
        </Col>
        <Col>
          <span 
            className="delete-enumerator-icon"
            onClick={(e)=>{props.deleteEnumerator(id)}}
          >
            &times;
          </span>
        </Col>
      </Row>
      <Row>
        <EnumeratorCol 
          blocks={availability} 
          header="Availability" 
          type={AVAILABILITY} 
          addTime={props.addTime} 
          modifyTime={props.modifyTime} 
          deleteTime={props.deleteTime} 
          enumeratorId={id}
        />
        {/* <Col className="enumerator-col enumerator-availability-col" sm={6} md={4}>
          <Row className="justify-content-center">
            <h6>
              Availability
            </h6>
          </Row>
          <Row className="justify-content-center">
            {renderedAvailability}
          </Row>
          <Row className="justify-content-center">
            <button onClick={() => {
              console.log(id);
              props.addTime(id, AVAILABILITY);
            }}>
              Add Availability
            </button>
          </Row>
        </Col> */}
        <EnumeratorCol 
          blocks={assignedShifts} 
          header="Assigned Shifts" 
          type={ASSIGNED_SHIFTS} 
          addTime={props.addTime} 
          modifyTime={props.modifyTime} 
          deleteTime={props.deleteTime} 
          enumeratorId={id}
        />
        {/* <Col className="enumerator-col enumerator-assigned-shift-col" sm={6} md={4}>
          <Row className="justify-content-center">
            <h6>
              Assigned Shifts
            </h6>
          </Row>
          <Row className="justify-content-center">
            {renderedAssignedShifts}
          </Row>
          <Row className="justify-content-center">
            <button onClick={()=>{
              props.addTime(id, ASSIGNED_SHIFTS);
            }}>
              Add Assigned Shift
            </button>
          </Row>
        </Col> */}
        <EnumeratorCol 
          blocks={claimedShifts} 
          header="Claimed Shifts" 
          type={CLAIMED_SHIFTS} 
          addTime={props.addTime} 
          modifyTime={props.modifyTime} 
          deleteTime={props.deleteTime} 
          enumeratorId={id}
        />
        {/* <Col className="enumerator-col enumerator-claimed-time-col" sm={6} md={4}>
          <Row className="justify-content-center">
            <h6>
              Claimed Shifts
            </h6>
          </Row>
          <Row className="justify-content-center">
            {renderedClaimedShifts}
          </Row>
          <Row className="justify-content-center">
            <button onClick={()=>{
              props.addTime(id, CLAIMED_SHIFTS)
            }}>
              Add Claimed Shift
            </button>
          </Row>
        </Col> */}
      </Row>  
    </Container>
  )
}

// function renderBlocks(showWarning, hideWarning, type, blockSection, modifyTime, deleteTime, id) {

//   let rendered = blockSection.map((block) => {
//     // console.log(block);
//     let startOptions = TIMES.map(time => {
//       let selected = false;
//       if (formatDateForTimeInput(block.startTime) == time) {
//         selected = true;
//       }
//       return <option key={time} value={time} selected={selected}>{time}</option>
//     })

//     let endOptions = TIMES.map(time => {
//       let selected = false;
//       if (formatDateForTimeInput(block.endTime) == time) {
//         selected = true;
//       }
//       return <option key={time} value={time} selected={selected}>{time}</option>
//     })

//     // console.log(block.startTime, block.endTime, block.valid);

//     var [warning, setWarning] = useState(false);

//     // OVERRIDE
//     showWarning = (e) => {
//       if (!block.valid) setWarning(true);
//       if (warning) console.log(warning);
//     }

//     hideWarning = (e) => {
//       setWarning(false);
//     }


//     return (
//       <Row 
//         key={block.id} 
//         className="rendered-time-block d-flex"
//         onMouseEnter={(e)=>{showWarning(e)}}
//         // onMouseLeave={hideWarning}
//       >
//         <select
//           list="times"
//           key={`availability-${block.id}-start`}
//           className={`time-input m-2 ${block.valid ? "" : "time-input-invalid"}`}
//           onChange={(e) => {
//             modifyTime(type, START_TIME, id, block.id, e.target.value)
//           }}
//         >
//           {startOptions}
//         </select>
//           to
//         <select
//           list="times"
//           key={`availability-${block.id}-end`}
//           className={`time-input m-2 ${block.valid ? "" : "time-input-invalid"}`}
//           onChange={(e)=>{
//             modifyTime(type, END_TIME, id, block.id, e.target.value)
//           }}
//         >
//           {endOptions}
//         </select>
//         <button
//           className="close m-1"
//           onClick={()=>{deleteTime(type, id, block.id)}}
//         >
//           &times;
//         </button>
//         {warning ? (
//           <Col className="warning">
//             Make sure that the end time is later than the start time, and that this time window does not overlap any other windows.
//           </Col>
//         ) : ""}
//       </Row>
//     )
//   })

//   return rendered;
// }

// function Warning() {
//   return (
//     <div>
//       Make sure that the end time is later than the start time, and that this time window does not overlap any other windows.
//     </div>
//   )
// }


function Block(props) {
  let {type, block, modifyTime, deleteTime, id} = props;
  let startOptions = TIMES.map(time => {
    let selected = false;
    if (formatDateForTimeInput(block.startTime) == time) {
      selected = true;
    }
    return <option key={time} value={time} selected={selected}>{time}</option>
  })

  let endOptions = TIMES.map(time => {
    let selected = false;
    if (formatDateForTimeInput(block.endTime) == time) {
      selected = true;
    }
    return <option key={time} value={time} selected={selected}>{time}</option>
  })

  const [warning, setWarning] = useState(false);

  return (
    <Container key={block.id} 
      className="rendered-time-block"
      onMouseEnter={(e)=>{if(!block.valid) setWarning(true);}}
      onMouseLeave={(e)=>{setWarning(false);}}
    >
      <Row className="time-block-row justify-content-center">
        <select
          as="Col"
          list="times"
          key={`availability-${block.id}-start`}
          className={`time-input m-2 ${block.valid ? "" : "time-input-invalid"}`}
          onChange={(e) => {
            modifyTime(type, START_TIME, id, block.id, e.target.value)
          }}
        >
          {startOptions}
        </select>
        <div className="time-block-to-div">
          to
        </div>
        <select
          as="Col"
          list="times"
          key={`availability-${block.id}-end`}
          className={`time-input m-2 ${block.valid ? "" : "time-input-invalid"}`}
          onChange={(e)=>{
            modifyTime(type, END_TIME, id, block.id, e.target.value)
          }}
        >
          {endOptions}
        </select>
        <button
          as="Col"
          className="close m-1"
          onClick={()=>{deleteTime(type, id, block.id)}}
        >
          &times;
        </button>
      </Row>
      {/* {warning ? (
        <Row className="warning xs-12">
          <span className="warning-span">
            Make sure that the end time is later than the start time, and that this time window does not overlap any other windows.
          </span>
        </Row>) : ""
      } */}
    </Container>
  )
}

function PriorityBlocks(props) {
  let {currentWindows} = props;

  console.log(props);

  if (currentWindows===undefined || currentWindows.length===0) {
    // console.log("currentWindows no good");
    // console.log(currentWindows);
    return null;
  } else {
    for (let cw of currentWindows){
      // console.log(cw.start, cw.start instanceof Date);
      if (!cw.start instanceof Date) {
        console.log("caught");
        return null;
      }

      // console.log(cw.end, cw.end instanceof Date);
      if (!cw.end instanceof Date) {
        console.log("caught");
        return null;
      }
    }

    // console.log("should be good", currentWindows);

    currentWindows.forEach(cw => {
      cw.start = formatDateForTimeInput(new Date(cw.start));
      cw.end = formatDateForTimeInput(new Date(cw.end));
    })

    // console.log(currentWindows);

    // windows are already sorted by start time
    let minimumTime = currentWindows[0].start;
    let minimumTimeIndex = TIMES.indexOf(minimumTime);
    let maximumTime = currentWindows[currentWindows.length-1].end;
    let maximumTimeIndex = TIMES.indexOf(maximumTime);

    let timeRange = TIMES.slice(minimumTimeIndex, maximumTimeIndex-minimumTimeIndex+1);

    let times = timeRange.map(time => <p style={{margin: 0}}>{time}</p>)

    let maxPriority = Math.max(...currentWindows.map(cw => cw.priority));

    

    let blocks = currentWindows.map(cw => {
      // hsla(179, 100%, range(85-15), 1)
      let light = 85-(cw.priority/(maxPriority)*70);
      // console.log(cw.priority);
      // console.log(maxPriority);
      // console.log(light);
      // console.log(`hsla(179, 100%, ${light}%, 1)`)

      let timeDifference = timeRange.indexOf(cw.end) - timeRange.indexOf(cw.start);

      return <div style={{
        border: "1px solid black",
        color: "black",
        backgroundColor: `hsla(179, 100%, ${light}%, 1)`,
        height: `${timeDifference*23.636}px`
      }}>{cw.priority}</div>
    })

    return (
      <Container>
        <Row>
          <Col>
            {times}
          </Col>
          <Col>
            {blocks}
          </Col>
        </Row>
      </Container>
    )
  }
}


function PriorityBlocksAlt(props) {
  console.log(props.currentWindows);
  let maxScore = Math.max(...props.currentWindows.map(cw => cw.priority))
  let minTimeIndex = Math.min(...props.currentWindows.map(cw => TIMES.indexOf(cw.start)));
  let maxTimeIndex = Math.max(...props.currentWindows.map(cw => TIMES.indexOf(cw.end)));
  // props.currentWindows : start, end, priority

  let blocks = props.currentWindows.map(cw => {
    return (
      <div style={{
        height: '45px',
        backgroundColor: `hsla(${179+(cw.priority/maxScore)*181}, 100%, 55%, 1)`,
        width: `${(TIMES.indexOf(cw.end)-TIMES.indexOf(cw.start)) * 100 / (maxTimeIndex-minTimeIndex)}%`
      }}
      ></div>
    )
  })


  return (
    <Row>
      {blocks}
    </Row>
  )
}


function ColorDisplay(props) {
  const BLOCK_COUNT = 15;
  let count = 0;
  let blocks = [];
  while (count < BLOCK_COUNT) {
    let style = {
      width: `${100/BLOCK_COUNT}%`,
      height: '15px',
      backgroundColor: `hsla(${179+(count/BLOCK_COUNT)*181}, 100%, 55%, 1)`
    }

    blocks.push(<div style={style}></div>)
    count++;
  }
  return (
    <Row>
      {blocks}
    </Row>
  )
}


function EnumeratorCol(props) {
  // props: blocks, header, type, addTime, modifyTime, deleteTime, enumeratorId
  let renderedBlocks = props.blocks.map(block => <Block type={props.type} block={block} modifyTime={props.modifyTime} deleteTime={props.deleteTime} id={props.enumeratorId}>
  </Block>)

  console.log(props);
  let warning = null;

  if (!props.blocks.every(block => block.valid)) {
    warning = <Row className="warning xs-12">
      <span className="warning-span">
        Make sure that the end time is later than the start time, and that this time window does not overlap any other windows.
      </span>
    </Row>
  }

  return (
    <Col className="enumerator-col enumeartor-availability-col" sm={6} md={4}>
      <Row className="justify-content-center">
        <h6>
          {props.header}
        </h6>
      </Row>
      <Row className="justify-content-center">
        {renderedBlocks}
      </Row>
      {warning}
      <Row className="justify-content-center">
        <button onClick={() => {
          console.log(props.enumeratorId);
          props.addTime(props.enumeratorId, props.type);
        }}>
          Add {props.header[props.header.length-1] === "s" ? props.header.slice(0, props.header.length-1) : props.header}
        </button>
      </Row>
    </Col>
  )
}

export default App;
