// Originally inspired by Taskwarrior Widget by Kevin Bockelandt:
// https://github.com/KevinBockelandt/TaskwarriorWidget
// Rewritten from scratch using the new React + JSX framework.

export const command = "/opt/local/bin/task +READY export";

export const refreshFrequency = 10000;

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
const secondsInDay = 24 * 60 * 60 * 1000;
// Maximum number of entries to display
const maxEntries = 20;
// Indicator for tasks that are started
const startedIndicator = "🟊";

// Colours
const headerColour = { r: 255, g: 255, b: 255, a: 1 };
// The opacity is determined dynamically for all the following
const overDueColour = { r: 255, g: 200, b: 0 };
const dueColour = { r: 255, g: 100, b: 100 };
const normalColour = { r: 255, g: 255, b: 255 };
const tagsColour = { r: 50, g: 225, b: 50 };

// Tasks fade out towards the bottom of the table in steps of 1 / maxEntries
const opacities = (function () {
    var values = [];
    for (var i = 0; i < maxEntries; i++) {
        values.push(((i / maxEntries * -1) + 1).toFixed(2));
    }
    return values;
})();

// Reformat and compute task values ready for output
const processTask = (function (task, index) {
    var dueDateOffset = 10000; // ridiculously high number to indicate there is no due date

    // Compute number of days to due date
    if (task.due != undefined) {
        // Taskwarrior date strings aren't quite in ISO 8601 format
        // e.g.: 20191007T110000Z, which should be 2019-10-07T11:00:00Z
        var dateParts = [task.due.slice(0, 4), task.due.slice(4, 6), task.due.slice(6, 8)].join("-");
        var timeParts = [task.due.slice(8, 11), task.due.slice(11, 13), task.due.slice(13)].join(":");
        var dueDate = new Date(dateParts + timeParts);
        var today = new Date();
        today.setHours(0);
        today.setMinutes(0);
        // Get the offset in days between the due date and today            
        dueDate.setMinutes(dueDate.getMinutes() - dueDate.getTimezoneOffset());
        dueDateOffset = Math.floor((dueDate.getTime() - today.getTime()) / secondsInDay);
        task.due = dueDateOffset;
    }

    // If the task has tags, merge them into a single string
    if (task.tags != undefined) {
        task.tags = task.tags.map((tag) => { return "+" + tag; }).join(" ");
    }

    // Mark started tasks
    if (task.start != undefined) {
        task.start = startedIndicator;
    }

    // Colour row text according to due date
    if (dueDateOffset < 0) {
        task.colour = Object.assign({}, overDueColour);
    }
    else if (dueDateOffset == 0) {
        task.colour = Object.assign({}, dueColour);
    }
    else {
        task.colour = Object.assign({}, normalColour);
    }
    task.colour.a = opacities[index];

    task.urgency = parseFloat(task.urgency).toFixed(2);

    return task;
});

const rgbaColour = (function (colour, a) {
    if (colour.a != undefined) {
        return "rgba(" + colour.r + ", " + colour.g + ", " + colour.b + ", " + colour.a + ")";
    }
    else {
        return "rgba(" + colour.r + ", " + colour.g + ", " + colour.b + ", " + a + ")";
    }
});

export const render = ({ output, error }) => {
    // Get the JSON object containing all the tasks
    var taskList = JSON.parse(output);
    // Sort the tasks by urgency
    taskList.sort(function (a, b) {
        var aUrgency = (a.urgency != undefined) ? a.urgency : 0; // tasks without urgency (should be none)
        var bUrgency = (b.urgency != undefined) ? b.urgency : 0; // will be put at the end of the list
        return bUrgency - aUrgency;
    });
    // Only process and display the first maxEntries tasks
    taskList = taskList.slice(0, maxEntries).map(processTask);

    return (
        <div>
            <link rel="stylesheet" type="text/css" href="taskwarrior.widget/style.css" />
            <table>
                <thead>
                    <tr className="header" style={{ color: rgbaColour(headerColour) }}>
                        <th className="star">{startedIndicator}</th>
                        <th className="num">ID</th>
                        <th className="num">DUE</th>
                        <th>DESCRIPTION</th>
                        <th>PROJECT</th>
                        <th style={{ color: rgbaColour(tagsColour, 1) }}>TAGS</th>
                        <th className="num">URG</th>
                    </tr>
                </thead>
                <tbody>
                    {taskList.map((task, index) => {
                        return (
                            <tr style={{ color: rgbaColour(task.colour) }} key={index}>
                                <td className="star">{task.start}</td>
                                <td className="num">{task.id}</td>
                                <td className="num">{task.due}</td>
                                <td>{task.description}</td>
                                <td>{task.project}</td>
                                <td style={{ color: rgbaColour(tagsColour, task.colour.a) }}>{task.tags}</td>
                                <td className="num">{task.urgency}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    )
}
