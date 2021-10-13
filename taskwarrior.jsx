// Originally inspired by Taskwarrior Widget by Kevin Bockelandt:
// https://github.com/KevinBockelandt/TaskwarriorWidget
// Rewritten from scratch using the new React + JSX framework.

'use strict';

export const command = "/opt/local/bin/task +READY -PARENT export";

export const refreshFrequency = 10000;

// Ridiculously high number of days (in ms), used to indicate there is no due date
export const maxDue = 100000 * 60 * 60 * 24 * 1000;

export const className = `
    left: 30px;
    top: 30px;
    font-family: Helvetica Neue;
    font-size: 10pt;
    font-weight: 400;
    background: rgba(0, 0, 0, 0.5);
    border-radius: 7px;
    padding: 5px;
`;

// Configuration
// Note date differences are in ms
const millisecondsInDay = 24 * 60 * 60 * 1000;
const millisecondsInWeek = millisecondsInDay * 7;
const millisecondsInMonth = millisecondsInDay * 30.42; // on average
const millisecondsInYear = millisecondsInDay * 365.25; // appproximately
// Maximum number of entries to display
const maxEntries = 20;
// Indicator for tasks that are started
const startedIndicator = "🟊";

// Colours
const headerColour = Object.freeze({ r: 255, g: 255, b: 255, a: 1 });
// The opacity is determined dynamically for all the following
const overDueColour = Object.freeze({ r: 255, g: 100, b: 100 });
const dueColour = Object.freeze({ r: 255, g: 200, b: 0 });
const normalColour = Object.freeze({ r: 255, g: 255, b: 255 });
const tagsColour = Object.freeze({ r: 50, g: 225, b: 50 });

// Tasks fade out towards the bottom of the table in steps of 1 / maxEntries
const opacities = Object.freeze((() => {
    let values = [];
    for (let i = 0; i < maxEntries; i++) {
        values.push(((i / maxEntries * -1) + 1).toFixed(2));
    }
    return values;
})());

// Reformat and compute task values ready for output
const processTask = (task, index) => {
    // Compute number of days to due date
    if (task.due) {
        let dueDateOffset = maxDue;
        // Taskwarrior date strings aren't quite in ISO 8601 format
        // e.g.: 20191007T110000Z, which should be 2019-10-07T11:00:00Z
        let dateParts = [task.due.slice(0, 4), task.due.slice(4, 6), task.due.slice(6, 8)].join("-");
        let timeParts = [task.due.slice(8, 11), task.due.slice(11, 13), task.due.slice(13)].join(":");
        let dueDate = new Date(dateParts + timeParts);
        let today = new Date();
        // Truncate the offset between the due date and today to the nearest day
        today.setHours(0);
        today.setMinutes(0);
        today.setSeconds(0);
        today.setMilliseconds(0);
        dueDate.setMinutes(0);
        dueDate.setSeconds(0);
        dueDate.setMilliseconds(0);

        let difference = dueDate.getTime() - today.getTime();
        if (Math.abs(difference) > millisecondsInYear) {
            dueDateOffset = Math.floor(difference / millisecondsInYear);
            task.units = dueDateOffset + "y";
        } else if (Math.abs(difference) > millisecondsInMonth) {
            dueDateOffset = Math.floor(difference / millisecondsInMonth);
            task.units = dueDateOffset + "m";
        } else if (Math.abs(difference) > millisecondsInWeek) {
            dueDateOffset = Math.floor(difference / millisecondsInWeek);
            task.units = dueDateOffset + "w";
        } else {
            dueDateOffset = Math.floor(difference / millisecondsInDay);
            task.units = dueDateOffset + "d";
        }
        task.due = difference;
    }

    // If the task has tags, merge them into a single string
    if (task.tags) {
        task.tags = task.tags.map((tag) => { return "+" + tag; }).join(" ");
    }

    // Mark started tasks
    if (task.start) {
        task.start = startedIndicator;
    }

    // don't need to check for 0 here as it'll get set to 0.0 anyway
    task.urgency = task.urgency ? parseFloat(task.urgency).toFixed(2) : 0.0;

    return task;
};

// Colourise the tasks in the output list
const colourTask = (task, index) => {
    // Colour row text according to due date
    if (task.due < 0) {
        task.colour = Object.assign({}, overDueColour);
    }
    else if (task.due == 0) {
        task.colour = Object.assign({}, dueColour);
    }
    else {
        task.colour = Object.assign({}, normalColour);
    }
    task.colour.a = opacities[index];

    return task;
}

const rgbaString = (colour, a) => {
    if (colour.a) {
        return "rgba(" + colour.r + ", " + colour.g + ", " + colour.b + ", " + colour.a + ")";
    }
    else {
        return "rgba(" + colour.r + ", " + colour.g + ", " + colour.b + ", " + a + ")";
    }
};

export const render = ({ output, error }) => {
    // What if error is already set?
    // Will the following give an exception anyway?
    try {
        // Get the JSON object containing all the tasks and process them.
        let taskList = JSON.parse(output).map(processTask);
        // Sort the tasks by due date ascending, then by urgency descending.
        taskList.sort((a, b) => {
            // Adjust for no due date
            // CAUTION: 0 is "falsy" but valid, so needs to be explicitly checked for
            let aDue = (a.due || a.due === 0) ? a.due : maxDue;
            let bDue = (b.due || b.due === 0) ? b.due : maxDue;
            // Need urgency as a fraction. Maximum possible urgency is 60.7
            // with default settings, so let’s assume it’s less than 1000.
            return (aDue - a.urgency/1000) - (bDue - b.urgency/1000);
        });
        // We have to colourise after the sort.
        // Only display the first maxEntries tasks.
        taskList = taskList.slice(0, maxEntries).map(colourTask);

        return (
            <div id="taskwarrior-widget-container">
                <link rel="stylesheet" type="text/css" href="taskwarrior.widget/style.css" />
                <table>
                    <thead>
                        <tr className="header" style={{ color: rgbaString(headerColour) }}>
                            <th className="star">{startedIndicator}</th>
                            <th className="num">ID</th>
                            <th className="num">DUE</th>
                            <th>DESCRIPTION</th>
                            <th>PROJECT</th>
                            <th style={{ color: rgbaString(tagsColour, 1) }}>TAGS</th>
                            <th className="num">URG</th>
                        </tr>
                    </thead>
                    <tbody>
                        {taskList.map((task, index) => {
                            return (
                                <tr style={{ color: rgbaString(task.colour) }} key={index}>
                                    <td className="star">{task.start}</td>
                                    <td className="num">{task.id}</td>
                                    <td className="num">{task.units}</td>
                                    <td>{task.description}</td>
                                    <td>{task.project}</td>
                                    <td style={{ color: rgbaString(tagsColour, task.colour.a) }}>{task.tags}</td>
                                    <td className="num">{task.urgency}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        )
    }
    catch (e) {
        if (!output) {
            return (
                <div id="taskwarrior-widget-container">
                    <p><strong>No tasks found.</strong></p>
                </div>
            )
        }
        else {
            console.error(e)
            return (
                <div id="taskwarrior-widget-container">
                    <p><strong class="error">Error: {e}.</strong></p>
                </div>
            )
        }
    }
};
